import { NormalizedAdvisory } from '../../domain/entities/scan.types';
import { IVulnerabilityEnricher } from '../../domain/ports/server.ports';

interface FirstEpssResponse {
  data?: Array<{
    cve: string;
    epss: string;
    percentile: string;
  }>;
}

export class EpssVulnerabilityEnricher implements IVulnerabilityEnricher {
  readonly name = 'FIRST EPSS';

  async enrich(
    advisories: NormalizedAdvisory[],
  ): Promise<{ advisories: NormalizedAdvisory[]; warnings: string[] }> {
    const warnings: string[] = [];
    const cves = Array.from(
      new Set(
        advisories
          .map((a) => a.cveId)
          .filter((cve): cve is string => Boolean(cve)),
      ),
    );

    if (cves.length === 0) {
      return { advisories, warnings };
    }

    const epssMap = new Map<string, { epss: number; percentile: number }>();

    for (let i = 0; i < cves.length; i += 40) {
      const chunk = cves.slice(i, i + 40);
      try {
        const res = await fetch(
          `https://api.first.org/data/v1/epss?cve=${encodeURIComponent(chunk.join(','))}`,
          { signal: AbortSignal.timeout(8_000) },
        );
        if (!res.ok) {
          warnings.push(`FIRST EPSS retornou HTTP ${res.status}.`);
          continue;
        }
        const json = (await res.json()) as FirstEpssResponse;
        for (const item of json.data ?? []) {
          epssMap.set(item.cve, {
            epss: Number(item.epss),
            percentile: Number(item.percentile),
          });
        }
      } catch {
        warnings.push(
          'Não foi possível consultar a API FIRST EPSS; métricas de probabilidade omitidas.',
        );
      }
    }

    const enriched = advisories.map((adv) => {
      if (!adv.cveId) return adv;
      const hit = epssMap.get(adv.cveId);
      if (!hit) return adv;
      return {
        ...adv,
        epssScore: Number.isFinite(hit.epss) ? hit.epss : adv.epssScore,
        epssPercentile: Number.isFinite(hit.percentile)
          ? hit.percentile
          : adv.epssPercentile,
        source: `${adv.source} + EPSS`,
      };
    });

    return { advisories: enriched, warnings };
  }
}
