import {
  Ecosystem,
  ParsedDependency,
} from '../../domain/entities/scan.types';
import {
  IDependencyEnricher,
  IVulnerabilityCache,
} from '../../domain/ports/server.ports';

interface DepsDevVersionResponse {
  licenses?: string[];
  relatedProjects?: Array<{
    projectKey?: { id?: string };
    relationType?: string;
  }>;
}

interface DepsDevProjectResponse {
  scorecard?: {
    overallScore?: number;
  };
}

const DEPS_DEV_SYSTEM_BY_ECOSYSTEM: Partial<Record<Ecosystem, string>> = {
  npm: 'npm',
  PyPI: 'pypi',
  Go: 'go',
  'crates.io': 'cargo',
  Maven: 'maven',
  NuGet: 'nuget',
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_ENRICHED_DEPS = 25;
const RESTRICTIVE_LICENSES = ['GPL-', 'AGPL-', 'SSPL-'];

export class DepsDevDependencyEnricher implements IDependencyEnricher {
  readonly name = 'deps.dev (Licenses & OpenSSF Scorecard)';

  constructor(private readonly cache: IVulnerabilityCache) {}

  async enrichDependencies(
    dependencies: ParsedDependency[],
  ): Promise<{ dependencies: ParsedDependency[]; warnings: string[] }> {
    if (dependencies.length === 0) {
      return { dependencies, warnings: [] };
    }

    const targets = dependencies
      .filter((d) => d.isDirect && DEPS_DEV_SYSTEM_BY_ECOSYSTEM[d.ecosystem])
      .slice(0, MAX_ENRICHED_DEPS);

    if (targets.length === 0) {
      return { dependencies, warnings: [] };
    }

    const enrichedByPurl = new Map<
      string,
      { license: string | null; openssfScore: number | null }
    >();
    let transientFailures = 0;

    const batchSize = 6;
    for (let i = 0; i < targets.length; i += batchSize) {
      const slice = targets.slice(i, i + batchSize);
      await Promise.all(
        slice.map(async (dep) => {
          const result = await this.lookupPackageMeta(dep);
          if (result.failed) {
            transientFailures += 1;
            return;
          }
          enrichedByPurl.set(dep.purl, {
            license: result.license,
            openssfScore: result.openssfScore,
          });
        }),
      );
    }

    const warnings: string[] = [];
    const restrictivePackages: string[] = [];
    const lowScorePackages: string[] = [];

    const updated = dependencies.map((dep) => {
      const info = enrichedByPurl.get(dep.purl);
      if (!info) return dep;

      if (
        info.license &&
        RESTRICTIVE_LICENSES.some((prefix) =>
          info.license!.toUpperCase().includes(prefix),
        )
      ) {
        restrictivePackages.push(`${dep.name} (${info.license})`);
      }
      if (info.openssfScore !== null && info.openssfScore < 4.0) {
        lowScorePackages.push(
          `${dep.name} (${info.openssfScore.toFixed(1)}/10)`,
        );
      }

      return {
        ...dep,
        license: info.license,
        openssfScore: info.openssfScore,
      };
    });

    if (restrictivePackages.length > 0) {
      warnings.push(
        `Licença copyleft restritiva identificada no SBOM: ${restrictivePackages.slice(0, 5).join(', ')}.`,
      );
    }
    if (lowScorePackages.length > 0) {
      warnings.push(
        `OpenSSF Scorecard baixo (< 4.0/10) em dependências diretas: ${lowScorePackages.slice(0, 5).join(', ')}.`,
      );
    }
    if (transientFailures > 0 && enrichedByPurl.size === 0) {
      warnings.push(
        'deps.dev indisponível temporariamente; licenças SPDX e OpenSSF Scorecard não puderam ser enriquecidos.',
      );
    }

    return { dependencies: updated, warnings };
  }

  private async lookupPackageMeta(dep: ParsedDependency): Promise<{
    license: string | null;
    openssfScore: number | null;
    failed: boolean;
  }> {
    const system = DEPS_DEV_SYSTEM_BY_ECOSYSTEM[dep.ecosystem];
    if (!system) {
      return { license: null, openssfScore: null, failed: false };
    }

    const cacheKey = `depsdev:${system}:${dep.name}@${dep.version}`;
    const cached = await this.cache.get<{
      license: string | null;
      openssfScore: number | null;
    }>(cacheKey);
    if (cached) {
      return { ...cached, failed: false };
    }

    try {
      const url = `https://api.deps.dev/v3/systems/${encodeURIComponent(system)}/packages/${encodeURIComponent(dep.name)}/versions/${encodeURIComponent(dep.version)}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3_500),
      });
      if (!res.ok) {
        return {
          license: null,
          openssfScore: null,
          failed: res.status >= 500 || res.status === 429,
        };
      }

      const data = (await res.json()) as DepsDevVersionResponse;
      const license =
        data.licenses && data.licenses.length > 0
          ? data.licenses.join(' OR ')
          : null;

      let openssfScore: number | null = null;
      const sourceProjectId = data.relatedProjects?.find(
        (rp) => rp.relationType === 'SOURCE_REPO' && rp.projectKey?.id,
      )?.projectKey?.id;

      if (sourceProjectId) {
        openssfScore = await this.lookupProjectScorecard(sourceProjectId);
      }

      const result = { license, openssfScore };
      await this.cache.set(cacheKey, result, CACHE_TTL_MS);
      return { ...result, failed: false };
    } catch {
      return { license: null, openssfScore: null, failed: true };
    }
  }

  private async lookupProjectScorecard(
    projectId: string,
  ): Promise<number | null> {
    const cacheKey = `depsdev:project:${projectId}`;
    const cached = await this.cache.get<number | null>(cacheKey);
    if (cached !== null) return cached;

    try {
      const res = await fetch(
        `https://api.deps.dev/v3/projects/${encodeURIComponent(projectId)}`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(2_500),
        },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as DepsDevProjectResponse;
      const score =
        typeof data.scorecard?.overallScore === 'number'
          ? data.scorecard.overallScore
          : null;
      if (score !== null) {
        await this.cache.set(cacheKey, score, CACHE_TTL_MS);
      }
      return score;
    } catch {
      return null;
    }
  }
}
