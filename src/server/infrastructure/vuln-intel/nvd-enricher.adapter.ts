import {
  NormalizedAdvisory,
  SeverityLevel,
} from '../../domain/entities/scan.types';
import {
  IVulnerabilityCache,
  IVulnerabilityEnricher,
} from '../../domain/ports/server.ports';

interface NvdCvssData {
  baseScore?: number;
  vectorString?: string;
  baseSeverity?: string;
}

interface NvdCveResponse {
  vulnerabilities?: Array<{
    cve?: {
      id: string;
      metrics?: {
        cvssMetricV40?: Array<{ cvssData?: NvdCvssData }>;
        cvssMetricV31?: Array<{ cvssData?: NvdCvssData }>;
        cvssMetricV30?: Array<{ cvssData?: NvdCvssData }>;
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
const NVD_REQUEST_TIMEOUT_MS = 8_500;
const NVD_TOTAL_BUDGET_MS = 22_000;
const NVD_RETRY_DELAY_MS = 350;
const NVD_MAX_CONSECUTIVE_FAILURES = 2;

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
    ).slice(0, apiKey ? 20 : 6);

    const nvdMap = new Map<string, NvdCachedRecord>();
    const failedCves: string[] = [];
    const startedAt = Date.now();
    let consecutiveFailures = 0;
    let rateLimited = false;

    for (let idx = 0; idx < uniqueCves.length; idx += 1) {
      const cveId = uniqueCves[idx];
      const cacheKey = `nvd:${cveId}`;
      const cached = await this.cache.get<NvdCachedRecord>(cacheKey);
      if (cached) {
        nvdMap.set(cveId, cached);
        continue;
      }

      if (Date.now() - startedAt > NVD_TOTAL_BUDGET_MS) {
        warnings.push(
          'Enriquecimento NVD atingiu o tempo máximo por varredura; as demais CVEs mantiveram os dados oficiais do OSV.dev.',
        );
        break;
      }

      const result = await this.fetchCveWithRetry(cveId, apiKey);

      if (result.kind === 'rate_limited') {
        rateLimited = true;
        break;
      }

      if (result.kind === 'ok') {
        consecutiveFailures = 0;
        if (result.record) {
          await this.cache.set(cacheKey, result.record, NVD_CACHE_TTL_MS);
          nvdMap.set(cveId, result.record);
        }
      } else {
        failedCves.push(cveId);
        consecutiveFailures += 1;
        if (consecutiveFailures >= NVD_MAX_CONSECUTIVE_FAILURES) {
          break;
        }
      }

      if (idx < uniqueCves.length - 1) {
        const paceMs = apiKey ? 120 : 650;
        await new Promise((r) => setTimeout(r, paceMs));
      }
    }

    if (rateLimited) {
      warnings.push(
        'NVD API atingiu limite de taxa temporário; alguns scores CVSS detalhados foram preservados com os dados do OSV.dev.',
      );
    } else if (failedCves.length > 0) {
      const preview = failedCves.slice(0, 3).join(', ');
      const suffix =
        failedCves.length > 3 ? ` e mais ${failedCves.length - 3}` : '';
      warnings.push(
        `NVD API apresentou instabilidade/timeout temporário ao enriquecer ${preview}${suffix}; os dados do OSV.dev foram mantidos normalmente.`,
      );
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

  private async fetchCveWithRetry(
    cveId: string,
    apiKey?: string,
  ): Promise<
    | { kind: 'ok'; record: NvdCachedRecord | null }
    | { kind: 'rate_limited' }
    | { kind: 'failed' }
  > {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'Brynja/1.0',
    };
    if (apiKey) headers.apiKey = apiKey;

    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cveId)}`;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const res = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(NVD_REQUEST_TIMEOUT_MS),
        });

        if (res.status === 403 || res.status === 429) {
          return { kind: 'rate_limited' };
        }

        if (res.status === 404) {
          return { kind: 'ok', record: null };
        }

        if (res.status >= 500) {
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, NVD_RETRY_DELAY_MS));
            continue;
          }
          return { kind: 'failed' };
        }

        if (!res.ok) {
          return { kind: 'ok', record: null };
        }

        const data = (await res.json()) as NvdCveResponse;
        const cve = data.vulnerabilities?.[0]?.cve;
        if (!cve) {
          return { kind: 'ok', record: null };
        }

        const metric =
          cve.metrics?.cvssMetricV31?.[0]?.cvssData ??
          cve.metrics?.cvssMetricV30?.[0]?.cvssData ??
          cve.metrics?.cvssMetricV40?.[0]?.cvssData;

        const cweIds = Array.from(
          new Set(
            (cve.weaknesses ?? [])
              .flatMap((w) => w.description ?? [])
              .map((d) => d.value)
              .filter((v): v is string => Boolean(v && v.startsWith('CWE-'))),
          ),
        );

        return {
          kind: 'ok',
          record: {
            cvssScore: metric?.baseScore ?? null,
            cvssVector: metric?.vectorString ?? null,
            severity: this.mapSeverity(metric?.baseSeverity),
            cweIds,
          },
        };
      } catch {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, NVD_RETRY_DELAY_MS));
          continue;
        }
        return { kind: 'failed' };
      }
    }

    return { kind: 'failed' };
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
