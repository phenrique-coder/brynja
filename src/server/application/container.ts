import { NoopAgentAdvisorAdapter } from '../infrastructure/ai-agents/noop-agent-advisor.adapter';
import { MemoryVulnerabilityCacheService } from '../infrastructure/cache/memory-vuln-cache.service';
import { AesTokenCipherService } from '../infrastructure/crypto/aes-token-cipher.service';
import { OwnershipCertificateService } from '../infrastructure/crypto/ownership-certificate.service';
import { SealedSessionService } from '../infrastructure/crypto/sealed-session.service';
import { GitHubApiRepositoryFetcher } from '../infrastructure/github/github-api-repository.fetcher';
import { GitHubOAuthClient } from '../infrastructure/github/github-oauth.client';
import { NpmManifestParser } from '../infrastructure/parsers/npm-manifest.parser';
import { PythonManifestParser } from '../infrastructure/parsers/python-manifest.parser';
import { DomainOwnershipVerifierAdapter } from '../infrastructure/pentest/domain-ownership-verifier.adapter';
import { CookieSecurityProbe } from '../infrastructure/pentest/probes/cookie-security.probe';
import { CorsMisconfigProbe } from '../infrastructure/pentest/probes/cors-misconfig.probe';
import { ExposedArtifactsProbe } from '../infrastructure/pentest/probes/exposed-artifacts.probe';
import { ExposedDocsAndMetricsProbe } from '../infrastructure/pentest/probes/exposed-docs-metrics.probe';
import { HstsTlsProbe } from '../infrastructure/pentest/probes/hsts-tls.probe';
import { RuntimeFingerprintProbe } from '../infrastructure/pentest/probes/runtime-fingerprint.probe';
import { SecurityHeadersProbe } from '../infrastructure/pentest/probes/security-headers.probe';
import { SourceMapExposureProbe } from '../infrastructure/pentest/probes/source-map-exposure.probe';
import { SsrfDnsGuardService } from '../infrastructure/pentest/ssrf-dns-guard.service';
import { CisaKevEnricher } from '../infrastructure/vuln-intel/cisa-kev-enricher.adapter';
import { EpssVulnerabilityEnricher } from '../infrastructure/vuln-intel/epss-enricher.adapter';
import { NvdVulnerabilityEnricher } from '../infrastructure/vuln-intel/nvd-enricher.adapter';
import { OsvVulnerabilityProvider } from '../infrastructure/vuln-intel/osv-client.adapter';
import { IControlledProbe } from '../domain/ports/server.ports';
import { AnalyzeScaUseCase } from './analyze-sca.use-case';
import { RunSafeProbesUseCase } from './run-safe-probes.use-case';
import { TargetAuthorizationUseCase } from './target-authorization.use-case';

/**
 * Single server-side factory for all active Safe Probes.
 * Exported so automated parity tests enforce that every registered probe is
 * documented in `src/core/catalog/safe-probes.catalog.ts` and displayed on `/scans/new`.
 */
export function createRegisteredSafeProbes(): IControlledProbe[] {
  return [
    new SecurityHeadersProbe(),
    new HstsTlsProbe(),
    new CookieSecurityProbe(),
    new CorsMisconfigProbe(),
    new ExposedArtifactsProbe(),
    new ExposedDocsAndMetricsProbe(),
    new RuntimeFingerprintProbe(),
    new SourceMapExposureProbe(),
  ];
}

export interface ServerContainer {
  cipher: AesTokenCipherService;
  sessionCodec: SealedSessionService;
  certificates: OwnershipCertificateService;
  githubOAuth: GitHubOAuthClient;
  ssrfGuard: SsrfDnsGuardService;
  ownershipVerifier: DomainOwnershipVerifierAdapter;
  targetAuthorizations: TargetAuthorizationUseCase;
  analyzeSca: AnalyzeScaUseCase;
  runSafeProbes: RunSafeProbesUseCase;
  aiAdvisor: NoopAgentAdvisorAdapter;
}

let cachedContainer: ServerContainer | null = null;

export function getServerContainer(): ServerContainer {
  if (cachedContainer) return cachedContainer;

  const cipher = new AesTokenCipherService();
  const sessionCodec = new SealedSessionService(cipher);
  const certificates = new OwnershipCertificateService(cipher);
  const githubOAuth = new GitHubOAuthClient();
  const vulnCache = new MemoryVulnerabilityCacheService();
  const ssrfGuard = new SsrfDnsGuardService();
  const ownershipVerifier = new DomainOwnershipVerifierAdapter(ssrfGuard);

  // OCP Extensible Registries
  const fetchers = [new GitHubApiRepositoryFetcher()];
  const parsers = [new NpmManifestParser(), new PythonManifestParser()];
  const vulnProvider = new OsvVulnerabilityProvider(vulnCache);
  const enrichers = [
    new NvdVulnerabilityEnricher(vulnCache),
    new EpssVulnerabilityEnricher(),
    new CisaKevEnricher(vulnCache),
  ];
  const probes = createRegisteredSafeProbes();

  cachedContainer = {
    cipher,
    sessionCodec,
    certificates,
    githubOAuth,
    ssrfGuard,
    ownershipVerifier,
    targetAuthorizations: new TargetAuthorizationUseCase(
      certificates,
      ssrfGuard,
      ownershipVerifier,
    ),
    analyzeSca: new AnalyzeScaUseCase(
      fetchers,
      parsers,
      vulnProvider,
      enrichers,
    ),
    runSafeProbes: new RunSafeProbesUseCase(
      certificates,
      ownershipVerifier,
      ssrfGuard,
      probes,
    ),
    aiAdvisor: new NoopAgentAdvisorAdapter(),
  };

  return cachedContainer;
}
