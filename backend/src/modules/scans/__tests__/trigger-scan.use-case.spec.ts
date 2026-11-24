import { RunSafeProbesUseCase } from '../application/run-safe-probes.use-case';
import { TriggerScanUseCase } from '../application/trigger-scan.use-case';
import {
  NormalizedAdvisory,
  ProbeAuditEntry,
  ScanSummary,
  TargetAuthorizationEntity,
} from '../domain/entities/scan.types';
import { TargetNotAuthorizedError } from '../domain/errors/domain.errors';
import { IProbeAuditLogger } from '../domain/ports/controlled-probe.port';
import { IRepositoryFetcher } from '../domain/ports/repository-fetcher.port';
import {
  IScanWriter,
  SaveScanResultsInput,
} from '../domain/ports/scan-repository.port';
import { ITargetAuthorizationRepository } from '../domain/ports/target-authorization.port';
import { IVulnerabilityProvider } from '../domain/ports/vulnerability-provider.port';
import { NpmManifestParser } from '../infrastructure/parsers/npm-manifest.parser';

describe('TriggerScanUseCase', () => {
  it('rejects scan immediately if targetUrl has no verified authorization for owner', async () => {
    const auditLogs: ProbeAuditEntry[] = [];
    const scanWriter: IScanWriter = {
      createQueued: jest.fn(),
      updateProgress: jest.fn(),
      saveCompletedReport: jest.fn(),
      markFailed: jest.fn(),
      deleteForOwner: jest.fn(),
    };
    const authRepo: ITargetAuthorizationRepository = {
      upsertPendingChallenge: jest.fn(),
      findByIdForOwner: jest.fn(),
      findByOriginForOwner: jest.fn().mockResolvedValue(null),
      listByOwner: jest.fn(),
      updateStatusForOwner: jest.fn(),
      deleteForOwner: jest.fn(),
    };
    const auditLogger: IProbeAuditLogger = {
      log: async (entry) => {
        auditLogs.push(entry);
      },
      listByScanForOwner: jest.fn(),
      listRecentByOwner: jest.fn(),
    };

    const useCase = new TriggerScanUseCase(
      scanWriter,
      [{ supports: () => true, fetchManifestFiles: jest.fn() }],
      [new NpmManifestParser()],
      { name: 'OSV', lookupBatch: jest.fn() },
      [],
      authRepo,
      auditLogger,
      {} as RunSafeProbesUseCase,
    );

    await expect(
      useCase.execute({
        ownerGithubUserId: 'user-100',
        ownerLogin: 'octocat',
        repositoryUrl: 'https://github.com/org/repo',
        targetUrl: 'https://staging.example.com',
      }),
    ).rejects.toThrow(TargetNotAuthorizedError);

    expect(scanWriter.createQueued).not.toHaveBeenCalled();
    expect(auditLogs[0]?.outcome).toBe('BLOCKED_UNVERIFIED');
  });

  it('runs full pipeline and elevates verdict to CONFIRMED_ACTIVE when safe probe matches package', async () => {
    let savedReport: SaveScanResultsInput | null = null;
    const scanSummary: ScanSummary = {
      id: 'scan-123',
      ownerGithubUserId: 'user-100',
      ownerLogin: 'octocat',
      repositoryUrl: 'manifest://demo',
      branch: 'main',
      targetUrl: 'https://staging.example.com',
      authorizationId: 'auth-1',
      status: 'QUEUED',
      currentStage: 'queued',
      ecosystems: [],
      totalDependencies: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      confirmedActiveCount: 0,
      warnings: [],
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
    };

    const scanWriter: IScanWriter = {
      createQueued: jest.fn().mockResolvedValue(scanSummary),
      updateProgress: jest.fn().mockResolvedValue(undefined),
      saveCompletedReport: jest.fn().mockImplementation(async (input) => {
        savedReport = input;
      }),
      markFailed: jest.fn(),
      deleteForOwner: jest.fn(),
    };

    const repoFetcher: IRepositoryFetcher = {
      supports: jest.fn().mockReturnValue(true),
      fetchManifestFiles: jest.fn().mockResolvedValue([
        {
          path: 'package.json',
          content: JSON.stringify({ dependencies: { lodash: '4.17.20' } }),
        },
      ]),
    };

    const advisory: NormalizedAdvisory = {
      advisoryId: 'GHSA-35jh-r3h4-6jhm',
      cveId: 'CVE-2021-23337',
      packageName: 'lodash',
      packageVersion: '4.17.20',
      ecosystem: 'npm',
      title: 'Command Injection in lodash',
      description: 'Lodash template command injection',
      severity: 'HIGH',
      cvssScore: 7.2,
      cvssVector: null,
      cweIds: ['CWE-77'],
      epssScore: 0.45,
      epssPercentile: 0.91,
      isKnownExploited: false,
      fixedVersion: '4.17.21',
      references: [],
      verdict: 'DEPENDENCY_ONLY',
      source: 'OSV.dev',
    };

    const vulnProvider: IVulnerabilityProvider = {
      name: 'OSV.dev',
      lookupBatch: jest.fn().mockResolvedValue({
        advisories: [advisory],
        warnings: [],
      }),
    };

    const auth: TargetAuthorizationEntity = {
      id: 'auth-1',
      ownerGithubUserId: 'user-100',
      origin: 'https://staging.example.com',
      hostname: 'staging.example.com',
      method: 'WELL_KNOWN_FILE',
      challengeToken: 'tok',
      tokenHash: 'hash',
      status: 'VERIFIED',
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const authRepo: ITargetAuthorizationRepository = {
      upsertPendingChallenge: jest.fn(),
      findByIdForOwner: jest.fn().mockResolvedValue(auth),
      findByOriginForOwner: jest.fn().mockResolvedValue(auth),
      listByOwner: jest.fn(),
      updateStatusForOwner: jest.fn(),
      deleteForOwner: jest.fn(),
    };

    const runProbes = {
      execute: jest.fn().mockResolvedValue([
        {
          probeId: 'safe-probe:runtime-fingerprint',
          title: 'lodash exposed',
          severity: 'HIGH',
          status: 'FINDING',
          targetUrl: 'https://staging.example.com',
          evidence: 'script /vendor/lodash@4.17.20.js',
          recommendation: 'Upgrade lodash',
          matchedPackage: 'lodash',
        },
      ]),
    } as unknown as RunSafeProbesUseCase;

    const useCase = new TriggerScanUseCase(
      scanWriter,
      [repoFetcher],
      [new NpmManifestParser()],
      vulnProvider,
      [],
      authRepo,
      {
        log: jest.fn(),
        listByScanForOwner: jest.fn(),
        listRecentByOwner: jest.fn(),
      },
      runProbes,
    );

    await useCase.runPipeline('scan-123', {
      ownerGithubUserId: 'user-100',
      ownerLogin: 'octocat',
      repositoryUrl: 'https://github.com/org/repo',
      branch: 'main',
      targetUrl: 'https://staging.example.com',
      authorizationId: 'auth-1',
    });

    expect(savedReport).not.toBeNull();
    expect(savedReport!.status).toBe('COMPLETED');
    expect(savedReport!.advisories[0].verdict).toBe('CONFIRMED_ACTIVE');
  });
});
