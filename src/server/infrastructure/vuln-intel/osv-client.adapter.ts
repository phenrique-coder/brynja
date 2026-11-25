import {
  NormalizedAdvisory,
  ParsedDependency,
  SeverityLevel,
} from '../../domain/entities/scan.types';
import {
  IVulnerabilityCache,
  IVulnerabilityProvider,
  VulnerabilityLookupResult,
} from '../../domain/ports/server.ports';
import {
  OsvAffectedPackage,
  resolveFixedVersionForInstalled,
} from './osv-version.resolver';

interface OsvQueryBatchResponse {
  results?: Array<{
    vulns?: Array<{ id: string; modified?: string }>;
  }>;
}

interface OsvVulnDetail {
  id: string;
  summary?: string;
  details?: string;
  aliases?: string[];
  severity?: Array<{ type: string; score: string }>;
  database_specific?: { severity?: string };
  affected?: OsvAffectedPackage[];
  references?: Array<{ url: string }>;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export class OsvVulnerabilityProvider implements IVulnerabilityProvider {
  readonly name = 'OSV.dev';

  constructor(private readonly cache: IVulnerabilityCache) {}

  async lookupBatch(
    dependencies: ParsedDependency[],
  ): Promise<VulnerabilityLookupResult> {
    if (dependencies.length === 0) {
      return { advisories: [], warnings: [] };
    }

    const advisories: NormalizedAdvisory[] = [];
    const warnings: string[] = [];
    const uncachedDeps: ParsedDependency[] = [];
    const vulnIdsToFetch = new Set<string>();
    const depToVulnIds = new Map<string, string[]>();

    for (const dep of dependencies) {
      const cachedIds = await this.cache.get<string[]>(
        `osv:pkg:${dep.ecosystem}:${dep.name}@${dep.version}`,
      );
      if (cachedIds) {
        depToVulnIds.set(dep.purl, cachedIds);
        cachedIds.forEach((id) => vulnIdsToFetch.add(id));
      } else {
        uncachedDeps.push(dep);
      }
    }

    for (let i = 0; i < uncachedDeps.length; i += 100) {
      const chunk = uncachedDeps.slice(i, i + 100);
      try {
        const res = await fetch('https://api.osv.dev/v1/querybatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queries: chunk.map((d) => ({
              version: d.version,
              package: { name: d.name, ecosystem: d.ecosystem },
            })),
          }),
          signal: AbortSignal.timeout(12_000),
        });

        if (!res.ok) {
          warnings.push(
            `OSV.dev retornou HTTP ${res.status} durante consulta em lote.`,
          );
          continue;
        }

        const data = (await res.json()) as OsvQueryBatchResponse;
        const results = data.results ?? [];

        for (let idx = 0; idx < chunk.length; idx++) {
          const dep = chunk[idx];
          const ids = (results[idx]?.vulns ?? []).map((v) => v.id);
          depToVulnIds.set(dep.purl, ids);
          ids.forEach((id) => vulnIdsToFetch.add(id));
          await this.cache.set(
            `osv:pkg:${dep.ecosystem}:${dep.name}@${dep.version}`,
            ids,
            CACHE_TTL_MS,
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'erro de rede';
        warnings.push(`Falha ao consultar OSV.dev querybatch: ${msg}`);
      }
    }

    const detailMap = new Map<string, OsvVulnDetail>();
    const uniqueIds = Array.from(vulnIdsToFetch).slice(0, 250);
    if (vulnIdsToFetch.size > 250) {
      warnings.push(
        `OSV.dev encontrou ${vulnIdsToFetch.size} vulnerabilidades únicas; detalhando as primeiras 250.`,
      );
    }

    const batchSize = 8;
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const slice = uniqueIds.slice(i, i + batchSize);
      await Promise.all(
        slice.map(async (vulnId) => {
          const detail = await this.fetchVulnDetail(vulnId);
          if (detail) {
            detailMap.set(vulnId, detail);
          }
        }),
      );
    }

    for (const dep of dependencies) {
      const ids = depToVulnIds.get(dep.purl) ?? [];
      for (const id of ids) {
        const detail = detailMap.get(id);
        if (!detail) continue;
        advisories.push(this.normalizeOsvDetail(dep, detail));
      }
    }

    return { advisories, warnings };
  }

  private async fetchVulnDetail(vulnId: string): Promise<OsvVulnDetail | null> {
    const cacheKey = `osv:vuln:${vulnId}`;
    const cached = await this.cache.get<OsvVulnDetail>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(
        `https://api.osv.dev/v1/vulns/${encodeURIComponent(vulnId)}`,
        { signal: AbortSignal.timeout(8_000) },
      );
      if (!res.ok) return null;
      const detail = (await res.json()) as OsvVulnDetail;
      await this.cache.set(cacheKey, detail, CACHE_TTL_MS);
      return detail;
    } catch {
      return null;
    }
  }

  private normalizeOsvDetail(
    dep: ParsedDependency,
    detail: OsvVulnDetail,
  ): NormalizedAdvisory {
    const cveId =
      detail.id.startsWith('CVE-')
        ? detail.id
        : (detail.aliases?.find((a) => a.startsWith('CVE-')) ?? null);

    const fixedVersion = resolveFixedVersionForInstalled(
      detail.affected,
      dep.name,
      dep.version,
      dep.ecosystem,
    );
    const severity = this.inferSeverity(detail);
    const title =
      detail.summary?.trim() ||
      `${cveId ?? detail.id} em ${dep.name}@${dep.version}`;

    return {
      advisoryId: detail.id,
      cveId,
      packageName: dep.name,
      packageVersion: dep.version,
      ecosystem: dep.ecosystem,
      title,
      description:
        detail.details?.trim().slice(0, 2000) ||
        detail.summary?.trim() ||
        'Sem descrição detalhada disponível.',
      severity,
      cvssScore: null,
      cvssVector: detail.severity?.[0]?.score ?? null,
      cweIds: [],
      epssScore: null,
      epssPercentile: null,
      isKnownExploited: false,
      fixedVersion,
      references: (detail.references ?? []).slice(0, 6).map((r) => r.url),
      verdict: 'DEPENDENCY_ONLY',
      source: 'OSV.dev',
    };
  }

  private inferSeverity(detail: OsvVulnDetail): SeverityLevel {
    const dbSev = detail.database_specific?.severity?.toUpperCase();
    if (dbSev === 'CRITICAL') return 'CRITICAL';
    if (dbSev === 'HIGH') return 'HIGH';
    if (dbSev === 'MODERATE' || dbSev === 'MEDIUM') return 'MEDIUM';
    if (dbSev === 'LOW') return 'LOW';
    return 'MEDIUM';
  }
}
