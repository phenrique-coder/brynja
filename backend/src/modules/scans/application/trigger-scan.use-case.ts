import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  NormalizedAdvisory,
  ParsedDependency,
  ProbeResult,
  RepositoryFile,
  ScanSummary,
} from '../domain/entities/scan.types';
import {
  InvalidRepositoryUrlError,
  TargetNotAuthorizedError,
} from '../domain/errors/domain.errors';
import { AuthorizationPolicy } from '../domain/policies/authorization.policy';
import { SafeProbePolicy } from '../domain/policies/safe-probe.policy';
import {
  IProbeAuditLogger,
  PROBE_AUDIT_LOGGER_PORT,
} from '../domain/ports/controlled-probe.port';
import {
  DEPENDENCY_PARSERS_PORT,
  IDependencyParser,
} from '../domain/ports/dependency-parser.port';
import {
  IRepositoryFetcher,
  REPOSITORY_FETCHERS_PORT,
  RepositoryFetchContext,
} from '../domain/ports/repository-fetcher.port';
import {
  IScanWriter,
  SCAN_WRITER_PORT,
} from '../domain/ports/scan-repository.port';
import {
  ITargetAuthorizationRepository,
  TARGET_AUTHORIZATION_REPO_PORT,
} from '../domain/ports/target-authorization.port';
import {
  IVulnerabilityEnricher,
  IVulnerabilityProvider,
  VULNERABILITY_ENRICHERS_PORT,
  VULNERABILITY_LOOKUP_PORT,
} from '../domain/ports/vulnerability-provider.port';
import { RunSafeProbesUseCase } from './run-safe-probes.use-case';

export interface TriggerScanInput {
  ownerGithubUserId: string;
  ownerLogin: string | null;
  repositoryUrl: string;
  branch?: string;
  targetUrl?: string | null;
  authorizationId?: string | null;
  manifestFiles?: RepositoryFile[];
  githubAccessToken?: string | null;
}

@Injectable()
export class TriggerScanUseCase {
  private readonly logger = new Logger(TriggerScanUseCase.name);

  constructor(
    @Inject(SCAN_WRITER_PORT)
    private readonly scanWriter: IScanWriter,
    @Inject(REPOSITORY_FETCHERS_PORT)
    private readonly repoFetchers: IRepositoryFetcher[],
    @Inject(DEPENDENCY_PARSERS_PORT)
    private readonly parsers: IDependencyParser[],
    @Inject(VULNERABILITY_LOOKUP_PORT)
    private readonly vulnProvider: IVulnerabilityProvider,
    @Inject(VULNERABILITY_ENRICHERS_PORT)
    private readonly vulnEnrichers: IVulnerabilityEnricher[],
    @Inject(TARGET_AUTHORIZATION_REPO_PORT)
    private readonly authRepo: ITargetAuthorizationRepository,
    @Inject(PROBE_AUDIT_LOGGER_PORT)
    private readonly auditLogger: IProbeAuditLogger,
    private readonly runSafeProbesUseCase: RunSafeProbesUseCase,
  ) {}

  async execute(input: TriggerScanInput): Promise<ScanSummary> {
    this.validateRepositoryInput(input);
    const branch = (input.branch ?? 'main').trim() || 'main';
    let normalizedTargetUrl: string | null = null;
    let resolvedAuthId: string | null = input.authorizationId ?? null;

    if (input.targetUrl && input.targetUrl.trim().length > 0) {
      const parsed = SafeProbePolicy.parseAndValidateTargetUrl(input.targetUrl);
      normalizedTargetUrl = parsed.origin;
      const auth = resolvedAuthId
        ? await this.authRepo.findByIdForOwner(
            resolvedAuthId,
            input.ownerGithubUserId,
          )
        : await this.authRepo.findByOriginForOwner(
            parsed.origin,
            input.ownerGithubUserId,
          );

      try {
        const verified = AuthorizationPolicy.assertTargetAuthorized(
          auth,
          parsed.origin,
          input.ownerGithubUserId,
        );
        resolvedAuthId = verified.id;
      } catch (error) {
        if (error instanceof TargetNotAuthorizedError) {
          await this.auditLogger.log({
            ownerGithubUserId: input.ownerGithubUserId,
            scanId: null,
            authorizationId: auth?.id ?? null,
            targetUrl: parsed.origin,
            probeId: 'guardrail:pre-scan-authorization',
            httpMethod: 'NONE',
            requestPath: '/',
            statusCode: null,
            durationMs: 0,
            outcome: 'BLOCKED_UNVERIFIED',
            details: error.message,
          });
        }
        throw error;
      }
    }

    const scan = await this.scanWriter.createQueued({
      ownerGithubUserId: input.ownerGithubUserId,
      ownerLogin: input.ownerLogin,
      repositoryUrl: input.repositoryUrl.trim(),
      branch,
      targetUrl: normalizedTargetUrl,
      authorizationId: resolvedAuthId,
    });

    void this.runPipeline(scan.id, {
      ...input,
      branch,
      targetUrl: normalizedTargetUrl,
      authorizationId: resolvedAuthId,
    });

    return scan;
  }

  async runPipeline(
    scanId: string,
    input: TriggerScanInput & {
      branch: string;
      targetUrl: string | null;
      authorizationId: string | null;
    },
  ): Promise<void> {
    const warnings: string[] = [];

    try {
      await this.scanWriter.updateProgress(
        scanId,
        'RUNNING',
        'fetching_repository',
        new Date(),
      );

      const files =
        input.manifestFiles && input.manifestFiles.length > 0
          ? input.manifestFiles
          : await this.fetchRepositoryManifests({
              repositoryUrl: input.repositoryUrl.trim(),
              branch: input.branch,
              accessToken: input.githubAccessToken,
            });

      await this.scanWriter.updateProgress(
        scanId,
        'RUNNING',
        'parsing_dependencies',
      );

      const dependencies = this.extractDependencies(files);
      if (dependencies.length === 0) {
        warnings.push(
          'Nenhum arquivo de dependências suportado (package.json, package-lock.json, pnpm-lock.yaml, requirements.txt, pyproject.toml) foi encontrado.',
        );
      }

      await this.scanWriter.updateProgress(
        scanId,
        'RUNNING',
        'querying_vulnerability_intel',
      );

      const lookupResult = await this.vulnProvider.lookupBatch(dependencies);
      warnings.push(...lookupResult.warnings);
      let advisories = lookupResult.advisories;

      for (const enricher of this.vulnEnrichers) {
        const enriched = await enricher.enrich(advisories);
        advisories = enriched.advisories;
        warnings.push(...enriched.warnings);
      }

      let probeResults: ProbeResult[] = [];
      if (input.targetUrl) {
        await this.scanWriter.updateProgress(
          scanId,
          'RUNNING',
          'running_safe_probes',
        );

        probeResults = await this.runSafeProbesUseCase.execute({
          scanId,
          ownerGithubUserId: input.ownerGithubUserId,
          targetUrl: input.targetUrl,
          authorizationId: input.authorizationId,
          dependencies,
          advisories,
        });

        advisories = this.correlateActiveProbes(advisories, probeResults);
      }

      const ecosystems = Array.from(
        new Set(dependencies.map((d) => d.ecosystem)),
      );

      await this.scanWriter.saveCompletedReport({
        scanId,
        status: 'COMPLETED',
        currentStage: 'completed',
        ecosystems,
        dependencies,
        advisories,
        probeResults,
        warnings: Array.from(new Set(warnings)),
        completedAt: new Date(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha inesperada no scan';
      this.logger.error(`Scan ${scanId} failed: ${message}`);
      await this.scanWriter.markFailed(scanId, message);
    }
  }

  private async fetchRepositoryManifests(
    context: RepositoryFetchContext,
  ): Promise<RepositoryFile[]> {
    const fetcher = this.repoFetchers.find((f) => f.supports(context));
    if (!fetcher) {
      throw new InvalidRepositoryUrlError(
        `Nenhum conector disponível para o repositório "${context.repositoryUrl}".`,
      );
    }
    return fetcher.fetchManifestFiles(context);
  }

  private validateRepositoryInput(input: TriggerScanInput): void {
    const hasManifests = Boolean(
      input.manifestFiles && input.manifestFiles.length > 0,
    );
    const repoUrl = input.repositoryUrl?.trim() ?? '';

    if (!repoUrl) {
      throw new InvalidRepositoryUrlError(
        'Informe a URL HTTPS do repositório ou envie os arquivos de manifesto.',
      );
    }

    if (hasManifests && repoUrl.startsWith('manifest://')) {
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(repoUrl);
    } catch {
      throw new InvalidRepositoryUrlError(
        `URL de repositório inválida: "${repoUrl}".`,
      );
    }

    if (parsed.protocol !== 'https:') {
      throw new InvalidRepositoryUrlError(
        'Apenas repositórios Git via HTTPS (https://...) são permitidos.',
      );
    }
  }

  private extractDependencies(files: RepositoryFile[]): ParsedDependency[] {
    const dedup = new Map<string, ParsedDependency>();

    for (const file of files) {
      for (const parser of this.parsers) {
        if (!parser.supports(file.path)) continue;
        const parsed = parser.parse(file.path, file.content);
        for (const dep of parsed) {
          const existing = dedup.get(dep.purl);
          if (!existing || (dep.isDirect && !existing.isDirect)) {
            dedup.set(dep.purl, dep);
          }
        }
      }
    }

    return Array.from(dedup.values());
  }

  private correlateActiveProbes(
    advisories: NormalizedAdvisory[],
    probeResults: ProbeResult[],
  ): NormalizedAdvisory[] {
    const exposedPackages = new Set(
      probeResults
        .filter((p) => p.status === 'FINDING' && p.matchedPackage)
        .map((p) => p.matchedPackage!.toLowerCase()),
    );

    if (exposedPackages.size === 0) return advisories;

    return advisories.map((adv) => {
      if (exposedPackages.has(adv.packageName.toLowerCase())) {
        return {
          ...adv,
          verdict: 'CONFIRMED_ACTIVE',
        };
      }
      return adv;
    });
  }
}
