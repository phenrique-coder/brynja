import { describe, expect, it, vi } from 'vitest';
import { InMemoryVereditoStore } from '@/core/storage/veredito-indexeddb.store';
import { RunSafeProbesUseCase } from '../application/run-safe-probes.use-case';
import {
  TargetNotAuthorizedError,
  UnsafeProbeBlockedError,
} from '../domain/errors/domain.errors';
import {
  IControlledProbe,
  IDomainOwnershipVerifier,
} from '../domain/ports/server.ports';
import { AesTokenCipherService } from '../infrastructure/crypto/aes-token-cipher.service';
import { OwnershipCertificateService } from '../infrastructure/crypto/ownership-certificate.service';
import { SealedSessionService } from '../infrastructure/crypto/sealed-session.service';
import { InMemoryProbeAuditCollector } from '../infrastructure/pentest/in-memory-audit-collector';
import { RateLimitedSafeHttpClient } from '../infrastructure/pentest/rate-limited-http-client.adapter';
import { SsrfDnsGuardService } from '../infrastructure/pentest/ssrf-dns-guard.service';

describe('Stateless Ownership Certificates, Guardrails & Browser Multi-User Isolation', () => {
  const testKey =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const cipher = new AesTokenCipherService(testKey);
  const certificates = new OwnershipCertificateService(cipher);
  const sessionCodec = new SealedSessionService(cipher);

  it('seals and unseals ephemeral GitHub session cookies and rejects expired or tampered tokens', () => {
    const sealed = sessionCodec.seal({
      githubUserId: '1001',
      login: 'octocat',
      avatarUrl: null,
      accessToken: 'gho_ephemeralSecret',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });

    expect(sealed).not.toContain('gho_ephemeralSecret');
    expect(sessionCodec.unseal(sealed)?.githubUserId).toBe('1001');
    expect(sessionCodec.unseal(`${sealed}tampered`)).toBeNull();

    const expired = sessionCodec.seal({
      githubUserId: '1001',
      login: 'octocat',
      avatarUrl: null,
      accessToken: 'gho_expired',
      issuedAt: Date.now() - 10_000,
      expiresAt: Date.now() - 1000,
    });
    expect(sessionCodec.unseal(expired)).toBeNull();
  });

  it('blocks probes when ownership certificate is missing, tampered, or belongs to another user', async () => {
    const probe: IControlledProbe = {
      id: 'safe-probe:test',
      title: 'Test',
      run: vi.fn(),
    };
    const verifier: IDomainOwnershipVerifier = {
      verify: vi.fn(),
    };
    const useCase = new RunSafeProbesUseCase(
      certificates,
      verifier,
      new SsrfDnsGuardService(true),
      [probe],
    );

    const proofForUserA = certificates.sealVerifiedCertificate({
      id: 'auth-a',
      ownerGithubUserId: 'user-a',
      origin: 'https://staging.example.com',
      hostname: 'staging.example.com',
      method: 'WELL_KNOWN_FILE',
      challengeToken: 'vereditosec-verify-123',
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    await expect(
      useCase.execute({
        scanId: 'scan-1',
        ownerGithubUserId: 'user-b',
        targetUrl: 'https://staging.example.com',
        verificationProof: proofForUserA,
        dependencies: [],
        advisories: [],
      }),
    ).rejects.toThrow(TargetNotAuthorizedError);

    await expect(
      useCase.execute({
        scanId: 'scan-2',
        ownerGithubUserId: 'user-a',
        targetUrl: 'https://staging.example.com',
        verificationProof: `${proofForUserA}forged`,
        dependencies: [],
        advisories: [],
      }),
    ).rejects.toThrow(TargetNotAuthorizedError);

    expect(probe.run).not.toHaveBeenCalled();
  });

  it('automatically renews an expired 7-day certificate when live proof is still present, and blocks when removed', async () => {
    const probe: IControlledProbe = {
      id: 'safe-probe:headers',
      title: 'Headers',
      run: vi.fn().mockResolvedValue([
        {
          id: 'res-1',
          probeId: 'safe-probe:headers',
          title: 'OK',
          severity: 'INFO',
          status: 'PASSED',
          targetUrl: 'https://staging.example.com',
          evidence: 'OK',
          recommendation: 'Keep',
          matchedPackage: null,
          createdAt: new Date().toISOString(),
        },
      ]),
    };

    const expiredProof = certificates.sealVerifiedCertificate({
      id: 'auth-renew',
      ownerGithubUserId: 'user-a',
      origin: 'https://staging.example.com',
      hostname: 'staging.example.com',
      method: 'WELL_KNOWN_FILE',
      challengeToken: 'vereditosec-verify-renew',
      verifiedAt: new Date(Date.now() - 10 * 86400_000).toISOString(),
      expiresAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
      createdAt: new Date(Date.now() - 10 * 86400_000).toISOString(),
    });

    // Case 1: proof still live -> automatic renewal!
    const liveVerifier: IDomainOwnershipVerifier = {
      verify: vi
        .fn()
        .mockResolvedValue({ verified: true, reason: 'Token still present' }),
    };
    const renewUseCase = new RunSafeProbesUseCase(
      certificates,
      liveVerifier,
      new SsrfDnsGuardService(true),
      [probe],
    );

    const output = await renewUseCase.execute({
      scanId: 'scan-renew',
      ownerGithubUserId: 'user-a',
      targetUrl: 'https://staging.example.com',
      verificationProof: expiredProof,
      dependencies: [],
      advisories: [],
    });

    expect(liveVerifier.verify).toHaveBeenCalledTimes(1);
    expect(output.renewedAuthorization?.verificationProof).toBeTruthy();
    expect(
      output.auditLogs.some((l) => l.outcome === 'AUTHORIZATION_RENEWED'),
    ).toBe(true);
    expect(output.probeResults).toHaveLength(1);

    // Case 2: proof removed from domain -> blocked!
    const removedVerifier: IDomainOwnershipVerifier = {
      verify: vi
        .fn()
        .mockResolvedValue({ verified: false, reason: 'HTTP 404' }),
    };
    const blockedUseCase = new RunSafeProbesUseCase(
      certificates,
      removedVerifier,
      new SsrfDnsGuardService(true),
      [probe],
    );

    await expect(
      blockedUseCase.execute({
        scanId: 'scan-blocked',
        ownerGithubUserId: 'user-a',
        targetUrl: 'https://staging.example.com',
        verificationProof: expiredProof,
        dependencies: [],
        advisories: [],
      }),
    ).rejects.toThrow(TargetNotAuthorizedError);
  });

  it('enforces method/header allowlist, Set-Cookie extraction, and circuit breaker in RateLimitedSafeHttpClient', async () => {
    const audit = new InMemoryProbeAuditCollector();
    const client = new RateLimitedSafeHttpClient(
      new SsrfDnsGuardService(true),
      audit,
      { maxRps: 100, maxRequestsPerScan: 10, timeoutMs: 2000 },
    );

    await expect(
      client.executeSafeRequest({
        scanId: 'scan-rl',
        ownerGithubUserId: 'user-a',
        authorizationId: 'auth-1',
        probeId: 'p1',
        targetOrigin: 'http://127.0.0.1:3000',
        path: '/',
        method: 'POST' as unknown as 'GET',
      }),
    ).rejects.toThrow(UnsafeProbeBlockedError);

    await expect(
      client.executeSafeRequest({
        scanId: 'scan-rl',
        ownerGithubUserId: 'user-a',
        authorizationId: 'auth-1',
        probeId: 'p2',
        targetOrigin: 'http://127.0.0.1:3000',
        path: '/',
        method: 'GET',
        headers: { Authorization: 'Bearer secret' },
      }),
    ).rejects.toThrow(UnsafeProbeBlockedError);

    const headers = new Headers();
    headers.append('set-cookie', 'a=1; HttpOnly; Secure; SameSite=Lax');
    headers.append('set-cookie', 'b=2; Path=/');

    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('ok', { status: 200, headers }))
      .mockResolvedValueOnce(new Response('Too Many Requests', { status: 429 }));

    try {
      const okRes = await client.executeSafeRequest({
        scanId: 'scan-rl',
        ownerGithubUserId: 'user-a',
        authorizationId: 'auth-1',
        probeId: 'p3',
        targetOrigin: 'http://127.0.0.1:3000',
        path: '/',
        method: 'GET',
        headers: { Origin: 'https://untrusted.vereditosec.test' },
      });
      expect(okRes.setCookies).toEqual([
        'a=1; HttpOnly; Secure; SameSite=Lax',
        'b=2; Path=/',
      ]);

      await client.executeSafeRequest({
        scanId: 'scan-rl',
        ownerGithubUserId: 'user-a',
        authorizationId: 'auth-1',
        probeId: 'p4',
        targetOrigin: 'http://127.0.0.1:3000',
        path: '/',
        method: 'GET',
      });

      await expect(
        client.executeSafeRequest({
          scanId: 'scan-rl',
          ownerGithubUserId: 'user-a',
          authorizationId: 'auth-1',
          probeId: 'p5',
          targetOrigin: 'http://127.0.0.1:3000',
          path: '/next',
          method: 'GET',
        }),
      ).rejects.toThrow(UnsafeProbeBlockedError);

      expect(
        audit.getEntries().some((e) => e.outcome === 'CIRCUIT_OPEN'),
      ).toBe(true);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('isolates local browser store scans, authorizations and audit logs strictly per GitHub owner', async () => {
    const store = new InMemoryVereditoStore();
    const now = new Date().toISOString();

    await store.putScan('user-a', {
      id: 'scan-a',
      repositoryUrl: 'https://github.com/octocat/demo-app',
      branch: 'main',
      targetUrl: null,
      authorizationId: null,
      status: 'COMPLETED',
      currentStage: 'completed',
      ecosystems: ['npm'],
      totalDependencies: 1,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      confirmedActiveCount: 0,
      warnings: [],
      errorMessage: null,
      startedAt: now,
      completedAt: now,
      createdAt: now,
      dependencies: [],
      findings: [],
      probeResults: [],
      auditLogs: [],
    });

    expect(await store.listScans('user-a')).toHaveLength(1);
    expect(await store.listScans('user-b')).toHaveLength(0);
    expect(await store.getScan('user-b', 'scan-a')).toBeNull();

    await store.deleteScan('user-b', 'scan-a');
    expect(await store.getScan('user-a', 'scan-a')).not.toBeNull();

    await store.deleteScan('user-a', 'scan-a');
    expect(await store.getScan('user-a', 'scan-a')).toBeNull();
  });
});
