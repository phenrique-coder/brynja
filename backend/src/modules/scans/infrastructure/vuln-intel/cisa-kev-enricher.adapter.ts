import { Injectable } from '@nestjs/common';
import { NormalizedAdvisory } from '../../domain/entities/scan.types';
import { IVulnerabilityEnricher } from '../../domain/ports/vulnerability-provider.port';
import { PrismaVulnerabilityCacheService } from './vuln-cache.service';

interface CisaKevFeed {
  vulnerabilities?: Array<{ cveID: string }>;
}

const KEV_CACHE_KEY = 'cisa:kev:catalog';
const KEV_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

@Injectable()
export class CisaKevEnricher implements IVulnerabilityEnricher {
  readonly name = 'CISA KEV';

  constructor(private readonly cache: PrismaVulnerabilityCacheService) {}

  async enrich(
    advisories: NormalizedAdvisory[],
  ): Promise<{ advisories: NormalizedAdvisory[]; warnings: string[] }> {
    const warnings: string[] = [];
    if (advisories.length === 0) {
      return { advisories, warnings };
    }

    let kevList = await this.cache.get<string[]>(KEV_CACHE_KEY);
    if (!kevList) {
      try {
        const res = await fetch(
          'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
          { signal: AbortSignal.timeout(10_000) },
        );
        if (res.ok) {
          const data = (await res.json()) as CisaKevFeed;
          kevList = (data.vulnerabilities ?? []).map((v) => v.cveID);
          await this.cache.set(KEV_CACHE_KEY, kevList, KEV_CACHE_TTL_MS);
        } else {
          warnings.push(`Feed CISA KEV retornou HTTP ${res.status}.`);
        }
      } catch {
        warnings.push(
          'Não foi possível atualizar o catálogo CISA KEV; prosseguindo sem flag KEV.',
        );
      }
    }

    if (!kevList || kevList.length === 0) {
      return { advisories, warnings };
    }

    const kevSet = new Set(kevList);
    const enriched = advisories.map((adv) => {
      if (!adv.cveId || !kevSet.has(adv.cveId)) return adv;
      return {
        ...adv,
        isKnownExploited: true,
        verdict:
          adv.verdict === 'DEPENDENCY_ONLY'
            ? ('POTENTIALLY_EXPOSED' as const)
            : adv.verdict,
        source: `${adv.source} + KEV`,
      };
    });

    return { advisories: enriched, warnings };
  }
}
