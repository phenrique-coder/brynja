import { ConfigService } from '@nestjs/config';
import { RunSafeProbesUseCase } from '../application/run-safe-probes.use-case';
import {
  ProbeAuditEntry,
  TargetAuthorizationEntity,
} from '../domain/entities/scan.types';
import {
  TargetNotAuthorizedError,
  UnsafeProbeBlockedError,
} from '../domain/errors/domain.errors';
import {
  IControlledProbe,
  IProbeAuditLogger,
  IRateLimitedHttpClient,
} from '../domain/ports/controlled-probe.port';
import { ITargetAuthorizationRepository } from '../domain/ports/target-authorization.port';
import { RateLimitedSafeHttpClient } from '../infrastructure/pentest/rate-limited-http-client.adapter';
import { SsrfDnsGuardService } from '../infrastructure/pentest/ssrf-dns-guard.service';

class InMemoryAuditLogger implements IProbeAuditLogger {
  entries: ProbeAuditEntry[] = [];
  async log(entry: ProbeAuditEntry): Promise<void> {
    this.entries.push(entry);
  }
  async listByScanForOwner(scanId: string, ownerGithubUserId: string) {
    return this.entries
      .filter(
        (e) =>
          e.scanId === scanId && e.ownerGithubUserId === ownerGithubUserId,
      )
      .map((e, i) => ({ ...e, id: String(i), createdAt: new Date() }));
  }
  async listRecentByOwner(ownerGithubUserId: string) {
    return this.entries
      .filter((e) => e.ownerGithubUserId === ownerGithubUserId)
      .map((e, i) => ({
        ...e,
        id: String(i),
        createdAt: new Date(),
      }));
  }
}

describe('Controlled Pentest Guardrails', () => {
  function makeAuth(
    overrides: Partial<TargetAuthorizationEntity> = {},
  ): TargetAuthorizationEntity {
    return {
      id: 'auth-1',
      ownerGithubUserId: 'user-100',
      origin: 'https://staging.example.com',
      hostname: 'staging.example.com',
      method: 'WELL_KNOWN_FILE',
      challengeToken: 'vereditosec-verify-abc',
      tokenHash: 'hash',
      status: 'VERIFIED',
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  it('blocks RunSafeProbesUseCase when target is not authorized and writes BLOCKED_UNVERIFIED audit log', async () => {
    const auditLogger = new InMemoryAuditLogger();
    const authRepo: ITargetAuthorizationRepository = {
      upsertPendingChallenge: jest.fn(),
      findByIdForOwner: jest.fn().mockResolvedValue(makeAuth({ status: 'PENDING' })),
      findByOriginForOwner: jest.fn().mockResolvedValue(null),
      listByOwner: jest.fn(),
      updateStatusForOwner: jest.fn(),
      deleteForOwner: jest.fn(),
    };
    const httpClient: IRateLimitedHttpClient = {
      executeSafeRequest: jest.fn(),
    };
    const probe: IControlledProbe = {
      id: 'test-probe',
      title: 'Test',
      run: jest.fn(),
    };

    const useCase = new RunSafeProbesUseCase(
      authRepo,
      [probe],
      httpClient,
      auditLogger,
    );

    await expect(
      useCase.execute({
        scanId: 'scan-1',
        ownerGithubUserId: 'user-100',
        targetUrl: 'https://staging.example.com',
        authorizationId: 'auth-1',
        dependencies: [],
        advisories: [],
      }),
    ).rejects.toThrow(TargetNotAuthorizedError);

    expect(probe.run).not.toHaveBeenCalled();
    expect(httpClient.executeSafeRequest).not.toHaveBeenCalled();
    expect(auditLogger.entries).toHaveLength(1);
    expect(auditLogger.entries[0].outcome).toBe('BLOCKED_UNVERIFIED');
  });

  it('blocks cross-user authorization reuse even if auth record is returned', async () => {
    const auditLogger = new InMemoryAuditLogger();
    const authRepo: ITargetAuthorizationRepository = {
      upsertPendingChallenge: jest.fn(),
      findByIdForOwner: jest
        .fn()
        .mockResolvedValue(makeAuth({ ownerGithubUserId: 'user-100' })),
      findByOriginForOwner: jest.fn(),
      listByOwner: jest.fn(),
      updateStatusForOwner: jest.fn(),
      deleteForOwner: jest.fn(),
    };
    const probe: IControlledProbe = {
      id: 'test-probe',
      title: 'Test',
      run: jest.fn(),
    };

    const useCase = new RunSafeProbesUseCase(
      authRepo,
      [probe],
      { executeSafeRequest: jest.fn() },
      auditLogger,
    );

    await expect(
      useCase.execute({
        scanId: 'scan-cross',
        ownerGithubUserId: 'user-999',
        targetUrl: 'https://staging.example.com',
        authorizationId: 'auth-1',
        dependencies: [],
        advisories: [],
      }),
    ).rejects.toThrow(TargetNotAuthorizedError);
  });

  it('executes probes only when authorization is VERIFIED and logs ALLOWED', async () => {
    const auditLogger = new InMemoryAuditLogger();
    const authRepo: ITargetAuthorizationRepository = {
      upsertPendingChallenge: jest.fn(),
      findByIdForOwner: jest.fn().mockResolvedValue(makeAuth()),
      findByOriginForOwner: jest.fn(),
      listByOwner: jest.fn(),
      updateStatusForOwner: jest.fn(),
      deleteForOwner: jest.fn(),
    };
    const httpClient: IRateLimitedHttpClient = {
      executeSafeRequest: jest.fn(),
    };
    const probe: IControlledProbe = {
      id: 'safe-probe:headers',
      title: 'Headers',
      run: jest.fn().mockResolvedValue([
        {
          probeId: 'safe-probe:headers',
          title: 'OK',
          severity: 'INFO',
          status: 'PASSED',
          targetUrl: 'https://staging.example.com',
          evidence: 'Headers ok',
          recommendation: 'Keep',
          matchedPackage: null,
        },
      ]),
    };

    const useCase = new RunSafeProbesUseCase(
      authRepo,
      [probe],
      httpClient,
      auditLogger,
    );

    const results = await useCase.execute({
      scanId: 'scan-2',
      ownerGithubUserId: 'user-100',
      targetUrl: 'https://staging.example.com',
      authorizationId: 'auth-1',
      dependencies: [],
      advisories: [],
    });

    expect(results).toHaveLength(1);
    expect(probe.run).toHaveBeenCalledTimes(1);
    expect(auditLogger.entries[0].outcome).toBe('ALLOWED');
  });

  it('blocks unsafe HTTP methods and opens circuit breaker on 429 in RateLimitedSafeHttpClient', async () => {
    const auditLogger = new InMemoryAuditLogger();
    const config = {
      get: (key: string) => {
        const map: Record<string, string> = {
          ALLOW_LOCAL_LOOPBACK_TARGETS: 'true',
          SAFE_PROBE_MAX_RPS: '100',
          SAFE_PROBE_MAX_REQUESTS_PER_SCAN: '10',
          SAFE_PROBE_TIMEOUT_MS: '2000',
        };
        return map[key];
      },
    } as unknown as ConfigService;

    const ssrfGuard = new SsrfDnsGuardService(config);
    const client = new RateLimitedSafeHttpClient(
      config,
      ssrfGuard,
      auditLogger,
    );

    await expect(
      client.executeSafeRequest({
        scanId: 'scan-rl',
        ownerGithubUserId: 'user-100',
        authorizationId: 'auth-1',
        probeId: 'probe-1',
        targetOrigin: 'http://127.0.0.1:3001',
        path: '/',
        method: 'POST' as unknown as 'GET',
      }),
    ).rejects.toThrow(UnsafeProbeBlockedError);
    expect(auditLogger.entries[0].outcome).toBe('BLOCKED_UNSAFE_METHOD');

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('Too Many Requests', { status: 429 }),
    );

    try {
      await client.executeSafeRequest({
        scanId: 'scan-rl',
        ownerGithubUserId: 'user-100',
        authorizationId: 'auth-1',
        probeId: 'probe-2',
        targetOrigin: 'http://127.0.0.1:3001',
        path: '/',
        method: 'GET',
      });

      await expect(
        client.executeSafeRequest({
          scanId: 'scan-rl',
          ownerGithubUserId: 'user-100',
          authorizationId: 'auth-1',
          probeId: 'probe-3',
          targetOrigin: 'http://127.0.0.1:3001',
          path: '/health',
          method: 'GET',
        }),
      ).rejects.toThrow(UnsafeProbeBlockedError);

      expect(
        auditLogger.entries.some((e) => e.outcome === 'CIRCUIT_OPEN'),
      ).toBe(true);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('forwards allowlisted Origin header, extracts Set-Cookie headers, and blocks disallowed headers', async () => {
    const auditLogger = new InMemoryAuditLogger();
    const config = {
      get: (key: string) => {
        const map: Record<string, string> = {
          ALLOW_LOCAL_LOOPBACK_TARGETS: 'true',
          SAFE_PROBE_MAX_RPS: '100',
          SAFE_PROBE_MAX_REQUESTS_PER_SCAN: '10',
          SAFE_PROBE_TIMEOUT_MS: '2000',
        };
        return map[key];
      },
    } as unknown as ConfigService;

    const ssrfGuard = new SsrfDnsGuardService(config);
    const client = new RateLimitedSafeHttpClient(
      config,
      ssrfGuard,
      auditLogger,
    );

    await expect(
      client.executeSafeRequest({
        scanId: 'scan-hdr',
        ownerGithubUserId: 'user-100',
        authorizationId: 'auth-1',
        probeId: 'probe-hdr',
        targetOrigin: 'http://127.0.0.1:3001',
        path: '/',
        method: 'GET',
        headers: { Authorization: 'Bearer leaked' },
      }),
    ).rejects.toThrow(UnsafeProbeBlockedError);

    const headers = new Headers();
    headers.append('set-cookie', 'a=1; HttpOnly; Secure; SameSite=Lax');
    headers.append('set-cookie', 'b=2; Path=/');

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('ok', { status: 200, headers }),
    );

    try {
      const res = await client.executeSafeRequest({
        scanId: 'scan-hdr',
        ownerGithubUserId: 'user-100',
        authorizationId: 'auth-1',
        probeId: 'probe-cors',
        targetOrigin: 'http://127.0.0.1:3001',
        path: '/',
        method: 'GET',
        headers: { Origin: 'https://untrusted.vereditosec.test' },
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://127.0.0.1:3001/',
        expect.objectContaining({
          headers: expect.objectContaining({
            Origin: 'https://untrusted.vereditosec.test',
          }),
        }),
      );
      expect(res.setCookies).toEqual([
        'a=1; HttpOnly; Secure; SameSite=Lax',
        'b=2; Path=/',
      ]);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
