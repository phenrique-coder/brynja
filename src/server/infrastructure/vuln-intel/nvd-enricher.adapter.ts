import {
  NormalizedAdvisory,
  SeverityLevel,
} from '../../domain/entities/scan.types';
import {
  IVulnerabilityCache,
  IVulnerabilityEnricher,
} from '../../domain/ports/server.ports';

interface NvdCveResponse {
  vulnerabilities?: Array<{
    cve?: {
      id: string;
      metrics?: {
        cvssMetricV31?: Array<{
          cvssData?: {
            baseScore?: number;
            vectorString?: string;
            baseSeverity?: string;
          };
        }>;
        cvssMetricV30?: Array<{
          cvssData?: {
            baseScore?: number;
            vectorString?: string;
            baseSeverity?: string;
          };
        }>;
      };
      weaknesses?: Array<{
        description?: Array<{ value?: string }>;
      }>;
    };
  }>;
}

interface NvdCachedRecord {
  cvssScore: number | null;
  cvssVector: string | null;
  severity: SeverityLevel | null;
  cweIds: string[];
}

const NVD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export class NvdVulnerabilityEnricher implements IVulnerabilityEnricher {
  readonly name = 'NVD NIST 2.0';

  constructor(private readonly cache: IVulnerabilityCache) {}

  async enrich(
    advisories: NormalizedAdvisory[],
  ): Promise<{ advisories: NormalizedAdvisory[]; warnings: string[] }> {
    const warnings: string[] = [];
    const apiKey = process.env.NVD_API_KEY?.trim();

    const uniqueCves = Array.from(
      new Set(
        advisories
          .map((a) => a.cveId)
          .filter((cve): cve is string => Boolean(cve)),
      ),
    ).slice(0, apiKey ? 25 : 8);

    const nvdMap = new Map<string, NvdCachedRecord>();

    for (const cveId of uniqueCves) {
      const cacheKey = `nvd:${cveId}`;
      const cached = await this.cache.get<NvdCachedRecord>(cacheKey);
      if (cached) {
        nvdMap.set(cveId, cached);
        continue;
      }

      try {
        const headers: Record<string, string> = {};
        if (apiKey) headers.apiKey = apiKey;

        const res = await fetch(
          `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cveId)}`,
          { headers, signal: AbortSignal.timeout(6_000) },
        );

        if (!res.ok) {
          if (res.status === 403 || res.status === 429) {
            warnings.push(
              'NVD API atingiu limite de taxa temporário; alguns scores CVSS detalhados foram preservados apenas com dados do OSV.dev.',
            );
            break;
          }
          continue;
        }

        const data = (await res.json()) as NvdCveResponse;
        const cve = data.vulnerabilities?.[0]?.cve;
        const metric =
          cve?.metrics?.cvssMetricV31?.[0]?.cvssData ??
          cve?.metrics?.cvssMetricV30?.[0]?.cvssData;

        const cweIds = Array.from(
          new Set(
            (cve?.weaknesses ?? [])
              .flatMap((w) => w.description ?? [])
              .map((d) => d.value)
              .filter((v): v is string => Boolean(v && v.startsWith('CWE-'))),
          ),
        );

        const record: NvdCachedRecord = {
          cvssScore: metric?.baseScore ?? null,
          cvssVector: metric?.vectorString ?? null,
          severity: this.mapSeverity(metric?.baseSeverity),
          cweIds,
        };

        await this.cache.set(cacheKey, record, NVD_CACHE_TTL_MS);
        nvdMap.set(cveId, record);

        if (!apiKey) {
          await new Promise((r) => setTimeout(r, 180));
        }
      } catch {
        warnings.push(
          `NVD API indisponível ao enriquecer ${cveId}; prosseguindo com OSV.dev.`,
        );
      }
    }

    const enriched = advisories.map((adv) => {
      if (!adv.cveId) return adv;
      const nvd = nvdMap.get(adv.cveId);
      if (!nvd) return adv;

      return {
        ...adv,
        cvssScore: nvd.cvssScore ?? adv.cvssScore,
        cvssVector: nvd.cvssVector ?? adv.cvssVector,
        severity: nvd.severity ?? adv.severity,
        cweIds: nvd.cweIds.length > 0 ? nvd.cweIds : adv.cweIds,
        source: `${adv.source} + NVD`,
      };
    });

    return { advisories: enriched, warnings };
  }

  private mapSeverity(raw?: string): SeverityLevel | null {
    switch (raw?.toUpperCase()) {
      case 'CRITICAL':
        return 'CRITICAL';
      case 'HIGH':
        return 'HIGH';
      case 'MEDIUM':
        return 'MEDIUM';
      case 'LOW':
        return 'LOW';
      default:
        return null;
    }
  }
}
