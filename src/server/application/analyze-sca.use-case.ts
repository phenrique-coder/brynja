import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import {
  NormalizedAdvisory,
  ParsedDependency,
  RepositoryFile,
} from '../domain/entities/scan.types';

const LOCKFILE_BASENAMES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'cargo.lock',
  'composer.lock',
  'gemfile.lock',
  'packages.lock.json',
  'gradle.lockfile',
  'go.sum',
]);

function isLockfilePath(filePath: string): boolean {
  return LOCKFILE_BASENAMES.has(path.posix.basename(filePath).toLowerCase());
}
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

    const lockfileDeps: ParsedDependency[] = [];
    const manifestDeps: ParsedDependency[] = [];

    for (const file of files) {
      const targetBucket = isLockfilePath(file.path)
        ? lockfileDeps
        : manifestDeps;
      for (const parser of this.parsers) {
        if (!parser.supports(file.path)) continue;
        targetBucket.push(...parser.parse(file.path, file.content));
      }
    }

    const directPkgKeys = new Set<string>();
    for (const dep of manifestDeps) {
      if (dep.isDirect) {
        directPkgKeys.add(`${dep.ecosystem}:${dep.name.toLowerCase()}`);
      }
    }

    const lockedPkgKeys = new Set<string>();
    const dedupMap = new Map<string, ParsedDependency>();

    for (const dep of lockfileDeps) {
      const pkgKey = `${dep.ecosystem}:${dep.name.toLowerCase()}`;
      lockedPkgKeys.add(pkgKey);
      const versionKey = `${dep.ecosystem}:${dep.name}@${dep.version}`;
      const existing = dedupMap.get(versionKey);
      const isDirect =
        Boolean(existing?.isDirect) || dep.isDirect || directPkgKeys.has(pkgKey);
      if (!existing || (!existing.isDirect && isDirect)) {
        dedupMap.set(versionKey, { ...dep, isDirect });
      }
    }

    for (const dep of manifestDeps) {
      const pkgKey = `${dep.ecosystem}:${dep.name.toLowerCase()}`;
      // Prefer resolved versions from lockfiles rather than lower-bound semver ranges in package.json/manifests
      if (lockedPkgKeys.has(pkgKey)) continue;
      const versionKey = `${dep.ecosystem}:${dep.name}@${dep.version}`;
      const existing = dedupMap.get(versionKey);
      if (!existing || (!existing.isDirect && dep.isDirect)) {
        dedupMap.set(versionKey, dep);
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
    const baseAdvisories = osvResult.advisories;

    const enricherResults = await Promise.all(
      this.enrichers.map(async (enricher) => {
        try {
          return await enricher.enrich(baseAdvisories);
        } catch (err) {
          return {
            advisories: baseAdvisories,
            warnings: [
              `Enriquecedor ${enricher.name} falhou: ${err instanceof Error ? err.message : 'erro'}`,
            ],
          };
        }
      }),
    );

    for (const res of enricherResults) {
      warnings.push(...res.warnings);
    }

    const advisories: NormalizedAdvisory[] = baseAdvisories.map((base, idx) => {
      const merged: NormalizedAdvisory = { ...base };
      const sourceParts = new Set(
        base.source
          .split(' + ')
          .map((s) => s.trim())
          .filter(Boolean),
      );

      for (const res of enricherResults) {
        const item = res.advisories[idx];
        if (!item) continue;

        if (item.cvssScore !== null && item.cvssScore !== base.cvssScore) {
          merged.cvssScore = item.cvssScore;
        }
        if (item.cvssVector && item.cvssVector !== base.cvssVector) {
          merged.cvssVector = item.cvssVector;
        }
        if (item.severity !== base.severity) {
          merged.severity = item.severity;
        }
        if (item.cweIds.length > 0 && merged.cweIds.length === 0) {
          merged.cweIds = item.cweIds;
        } else if (item.cweIds.length > base.cweIds.length) {
          merged.cweIds = Array.from(
            new Set([...merged.cweIds, ...item.cweIds]),
          );
        }
        if (item.epssScore !== null) {
          merged.epssScore = item.epssScore;
        }
        if (item.epssPercentile !== null) {
          merged.epssPercentile = item.epssPercentile;
        }
        if (item.isKnownExploited) {
          merged.isKnownExploited = true;
          if (merged.verdict === 'DEPENDENCY_ONLY') {
            merged.verdict = 'POTENTIALLY_EXPOSED';
          }
        }
        for (const s of item.source.split(' + ')) {
          const trimmed = s.trim();
          if (trimmed) sourceParts.add(trimmed);
        }
      }

      merged.source = Array.from(sourceParts).join(' + ');
      return merged;
    });

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
