import { randomUUID } from 'node:crypto';
import {
  NormalizedAdvisory,
  ParsedDependency,
  RepositoryFile,
} from '../domain/entities/scan.types';
import { InvalidRepositoryUrlError } from '../domain/errors/domain.errors';
import {
  IDependencyEnricher,
  IDependencyParser,
  IRepositoryFetcher,
  IVulnerabilityEnricher,
  IVulnerabilityProvider,
} from '../domain/ports/server.ports';

export interface AnalyzeScaInput {
  repositoryUrl: string;
  branch: string;
  accessToken?: string | null;
  manifestFiles?: RepositoryFile[];
}

export interface AnalyzeScaOutput {
  ecosystems: string[];
  dependencies: Array<ParsedDependency & { id: string }>;
  findings: Array<NormalizedAdvisory & { id: string; dependencyId: string }>;
  warnings: string[];
}

export class AnalyzeScaUseCase {
  constructor(
    private readonly fetchers: IRepositoryFetcher[],
    private readonly parsers: IDependencyParser[],
    private readonly vulnProvider: IVulnerabilityProvider,
    private readonly enrichers: IVulnerabilityEnricher[],
    private readonly dependencyEnrichers: IDependencyEnricher[] = [],
  ) {}

  async execute(input: AnalyzeScaInput): Promise<AnalyzeScaOutput> {
    const warnings: string[] = [];

    let files: RepositoryFile[] = [];
    if (input.manifestFiles && input.manifestFiles.length > 0) {
      files = input.manifestFiles;
    } else {
      const ctx = {
        repositoryUrl: input.repositoryUrl,
        branch: input.branch,
        accessToken: input.accessToken,
      };
      const fetcher = this.fetchers.find((f) => f.supports(ctx));
      if (!fetcher) {
        throw new InvalidRepositoryUrlError(
          `Formato de repositório não suportado em modo serverless: "${input.repositoryUrl}". Informe uma URL HTTPS do GitHub (https://github.com/org/repo) ou cole os manifestos manualmente.`,
        );
      }
      files = await fetcher.fetchManifestFiles(ctx);
    }

    if (files.length === 0) {
      warnings.push(
        'Nenhum manifesto suportado (npm/yarn/pnpm, Python, Go, Rust, Java, .NET, PHP, Ruby) foi encontrado.',
      );
    }

    const dedupMap = new Map<string, ParsedDependency>();
    for (const file of files) {
      for (const parser of this.parsers) {
        if (!parser.supports(file.path)) continue;
        const parsed = parser.parse(file.path, file.content);
        for (const dep of parsed) {
          const key = `${dep.ecosystem}:${dep.name}@${dep.version}`;
          const existing = dedupMap.get(key);
          if (!existing || (!existing.isDirect && dep.isDirect)) {
            dedupMap.set(key, dep);
          }
        }
      }
    }

    let rawDependencies = Array.from(dedupMap.values());

    const [osvResult, ...depEnrichResults] = await Promise.all([
      this.vulnProvider.lookupBatch(rawDependencies),
      ...this.dependencyEnrichers.map(async (enricher) => {
        try {
          return await enricher.enrichDependencies(rawDependencies);
        } catch (err) {
          return {
            dependencies: rawDependencies,
            warnings: [
              `Enriquecedor SBOM ${enricher.name} falhou: ${err instanceof Error ? err.message : 'erro'}`,
            ],
          };
        }
      }),
    ]);

    for (const res of depEnrichResults) {
      const metaByPurl = new Map(res.dependencies.map((d) => [d.purl, d]));
      rawDependencies = rawDependencies.map((d) => {
        const enriched = metaByPurl.get(d.purl);
        return enriched
          ? {
              ...d,
              license: enriched.license ?? d.license,
              openssfScore: enriched.openssfScore ?? d.openssfScore,
            }
          : d;
      });
      warnings.push(...res.warnings);
    }

    const dependencies = rawDependencies.map((d) => ({
      ...d,
      id: randomUUID(),
    }));
    const depIdByKey = new Map(
      dependencies.map((d) => [`${d.ecosystem}:${d.name}@${d.version}`, d.id]),
    );
    const ecosystems = Array.from(
      new Set(dependencies.map((d) => d.ecosystem)),
    );

    warnings.push(...osvResult.warnings);
    let advisories = osvResult.advisories;

    for (const enricher of this.enrichers) {
      try {
        const enriched = await enricher.enrich(advisories);
        advisories = enriched.advisories;
        warnings.push(...enriched.warnings);
      } catch (err) {
        warnings.push(
          `Enriquecedor ${enricher.name} falhou: ${err instanceof Error ? err.message : 'erro'}`,
        );
      }
    }

    const findings = advisories.map((adv) => ({
      ...adv,
      id: randomUUID(),
      dependencyId:
        depIdByKey.get(`${adv.ecosystem}:${adv.packageName}@${adv.packageVersion}`) ??
        dependencies[0]?.id ??
        randomUUID(),
    }));

    return {
      ecosystems,
      dependencies,
      findings,
      warnings,
    };
  }
}
