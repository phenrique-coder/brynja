import { Module } from '@nestjs/common';
import { AiAgentsModule } from '../ai-agents/ai-agents.module';
import { GitHubIntegrationModule } from '../github-integration/github-integration.module';
import { GitHubApiRepositoryFetcher } from '../github-integration/infrastructure/github-api-repository.fetcher';
import { CreateTargetAuthorizationUseCase } from './application/create-target-authorization.use-case';
import {
  ListTargetAuthorizationsUseCase,
  RevokeTargetAuthorizationUseCase,
} from './application/manage-target-authorizations.use-case';
import {
  DeleteScanUseCase,
  GetScanReportUseCase,
  ListAuditLogsUseCase,
  ListScansUseCase,
} from './application/query-scans.use-case';
import { RunSafeProbesUseCase } from './application/run-safe-probes.use-case';
import { TriggerScanUseCase } from './application/trigger-scan.use-case';
import { VerifyTargetOwnershipUseCase } from './application/verify-target-ownership.use-case';
import {
  CONTROLLED_PROBES_PORT,
  PROBE_AUDIT_LOGGER_PORT,
  SAFE_HTTP_CLIENT_PORT,
} from './domain/ports/controlled-probe.port';
import { DEPENDENCY_PARSERS_PORT } from './domain/ports/dependency-parser.port';
import { REPOSITORY_FETCHERS_PORT } from './domain/ports/repository-fetcher.port';
import {
  SCAN_READER_PORT,
  SCAN_WRITER_PORT,
} from './domain/ports/scan-repository.port';
import {
  DOMAIN_OWNERSHIP_VERIFIER_PORT,
  TARGET_AUTHORIZATION_REPO_PORT,
} from './domain/ports/target-authorization.port';
import {
  VULNERABILITY_ENRICHERS_PORT,
  VULNERABILITY_LOOKUP_PORT,
} from './domain/ports/vulnerability-provider.port';
import { GitShallowCloneFetcher } from './infrastructure/fetchers/git-shallow-clone.fetcher';
import { NpmManifestParser } from './infrastructure/parsers/npm-manifest.parser';
import { PythonManifestParser } from './infrastructure/parsers/python-manifest.parser';
import { DomainOwnershipVerifierAdapter } from './infrastructure/pentest/domain-ownership-verifier.adapter';
import { CookieSecurityProbe } from './infrastructure/pentest/probes/cookie-security.probe';
import { CorsMisconfigProbe } from './infrastructure/pentest/probes/cors-misconfig.probe';
import { ExposedArtifactsProbe } from './infrastructure/pentest/probes/exposed-artifacts.probe';
import { ExposedDocsAndMetricsProbe } from './infrastructure/pentest/probes/exposed-docs-metrics.probe';
import { HstsTlsProbe } from './infrastructure/pentest/probes/hsts-tls.probe';
import { RuntimeFingerprintProbe } from './infrastructure/pentest/probes/runtime-fingerprint.probe';
import { SecurityHeadersProbe } from './infrastructure/pentest/probes/security-headers.probe';
import { SourceMapExposureProbe } from './infrastructure/pentest/probes/source-map-exposure.probe';
import { RateLimitedSafeHttpClient } from './infrastructure/pentest/rate-limited-http-client.adapter';
import { SsrfDnsGuardService } from './infrastructure/pentest/ssrf-dns-guard.service';
import { PrismaProbeAuditLogger } from './infrastructure/persistence/prisma-probe-audit.logger';
import { PrismaScanRepository } from './infrastructure/persistence/prisma-scan.repository';
import { PrismaTargetAuthorizationRepository } from './infrastructure/persistence/prisma-target-authorization.repository';
import { CisaKevEnricher } from './infrastructure/vuln-intel/cisa-kev-enricher.adapter';
import { EpssVulnerabilityEnricher } from './infrastructure/vuln-intel/epss-enricher.adapter';
import { NvdVulnerabilityEnricher } from './infrastructure/vuln-intel/nvd-enricher.adapter';
import { OsvVulnerabilityProvider } from './infrastructure/vuln-intel/osv-client.adapter';
import { PrismaVulnerabilityCacheService } from './infrastructure/vuln-intel/vuln-cache.service';
import { AuthorizationsController } from './presentation/authorizations.controller';
import { HealthController } from './presentation/health.controller';
import { ScansController } from './presentation/scans.controller';

@Module({
  imports: [AiAgentsModule, GitHubIntegrationModule],
  controllers: [ScansController, AuthorizationsController, HealthController],
  providers: [
    // Concrete Adapters
    PrismaScanRepository,
    PrismaTargetAuthorizationRepository,
    PrismaProbeAuditLogger,
    PrismaVulnerabilityCacheService,
    GitShallowCloneFetcher,
    NpmManifestParser,
    PythonManifestParser,
    OsvVulnerabilityProvider,
    NvdVulnerabilityEnricher,
    EpssVulnerabilityEnricher,
    CisaKevEnricher,
    SsrfDnsGuardService,
    DomainOwnershipVerifierAdapter,
    RateLimitedSafeHttpClient,
    SecurityHeadersProbe,
    HstsTlsProbe,
    CookieSecurityProbe,
    CorsMisconfigProbe,
    ExposedArtifactsProbe,
    ExposedDocsAndMetricsProbe,
    RuntimeFingerprintProbe,
    SourceMapExposureProbe,

    // Segregated Ports (ISP + DIP)
    { provide: SCAN_READER_PORT, useExisting: PrismaScanRepository },
    { provide: SCAN_WRITER_PORT, useExisting: PrismaScanRepository },
    {
      provide: TARGET_AUTHORIZATION_REPO_PORT,
      useExisting: PrismaTargetAuthorizationRepository,
    },
    { provide: PROBE_AUDIT_LOGGER_PORT, useExisting: PrismaProbeAuditLogger },
    {
      provide: REPOSITORY_FETCHERS_PORT,
      useFactory: (
        githubApi: GitHubApiRepositoryFetcher,
        gitClone: GitShallowCloneFetcher,
      ) => [githubApi, gitClone],
      inject: [GitHubApiRepositoryFetcher, GitShallowCloneFetcher],
    },
    {
      provide: VULNERABILITY_LOOKUP_PORT,
      useExisting: OsvVulnerabilityProvider,
    },
    {
      provide: DOMAIN_OWNERSHIP_VERIFIER_PORT,
      useExisting: DomainOwnershipVerifierAdapter,
    },
    { provide: SAFE_HTTP_CLIENT_PORT, useExisting: RateLimitedSafeHttpClient },

    // Extensible Multi-Providers (OCP)
    {
      provide: DEPENDENCY_PARSERS_PORT,
      useFactory: (npm: NpmManifestParser, py: PythonManifestParser) => [
        npm,
        py,
      ],
      inject: [NpmManifestParser, PythonManifestParser],
    },
    {
      provide: VULNERABILITY_ENRICHERS_PORT,
      useFactory: (
        nvd: NvdVulnerabilityEnricher,
        epss: EpssVulnerabilityEnricher,
        kev: CisaKevEnricher,
      ) => [nvd, epss, kev],
      inject: [
        NvdVulnerabilityEnricher,
        EpssVulnerabilityEnricher,
        CisaKevEnricher,
      ],
    },
    {
      provide: CONTROLLED_PROBES_PORT,
      useFactory: (
        headers: SecurityHeadersProbe,
        hsts: HstsTlsProbe,
        cookies: CookieSecurityProbe,
        cors: CorsMisconfigProbe,
        artifacts: ExposedArtifactsProbe,
        docsAndMetrics: ExposedDocsAndMetricsProbe,
        fingerprint: RuntimeFingerprintProbe,
        sourceMaps: SourceMapExposureProbe,
      ) => [
        headers,
        hsts,
        cookies,
        cors,
        artifacts,
        docsAndMetrics,
        fingerprint,
        sourceMaps,
      ],
      inject: [
        SecurityHeadersProbe,
        HstsTlsProbe,
        CookieSecurityProbe,
        CorsMisconfigProbe,
        ExposedArtifactsProbe,
        ExposedDocsAndMetricsProbe,
        RuntimeFingerprintProbe,
        SourceMapExposureProbe,
      ],
    },

    // Application UseCases (SRP)
    CreateTargetAuthorizationUseCase,
    VerifyTargetOwnershipUseCase,
    ListTargetAuthorizationsUseCase,
    RevokeTargetAuthorizationUseCase,
    RunSafeProbesUseCase,
    TriggerScanUseCase,
    ListScansUseCase,
    GetScanReportUseCase,
    ListAuditLogsUseCase,
    DeleteScanUseCase,
  ],
})
export class ScansModule {}
