import { describe, expect, it, vi } from 'vitest';
import { InMemoryBrynjaStore } from '@/core/storage/brynja-indexeddb.store';
import { RunSafeProbesUseCase } from '../application/run-safe-probes.use-case';
import { TargetAuthorizationUseCase } from '../application/target-authorization.use-case';
import {
  InvalidTargetUrlError,
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
import { DomainOwnershipVerifierAdapter } from '../infrastructure/pentest/domain-ownership-verifier.adapter';
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

  it('derives deterministic per-user/per-origin ownership challenge tokens via HMAC-SHA256', () => {
    const tokenA1 = certificates.deriveChallengeToken(
      'user-a',
      'https://staging.example.com',
    );
    const tokenA2 = certificates.deriveChallengeToken(
      'user-a',
      'https://staging.example.com',
    );
    const tokenUserB = certificates.deriveChallengeToken(
      'user-b',
      'https://staging.example.com',
    );
    const tokenOtherOrigin = certificates.deriveChallengeToken(
      'user-a',
      'https://other.example.com',
    );

    expect(tokenA1).toMatch(/^brynja-verify-[0-9a-f]{32}$/);
    expect(tokenA1).toBe(tokenA2);
    expect(tokenA1).not.toBe(tokenUserB);
    expect(tokenA1).not.toBe(tokenOtherOrigin);
  });

  it('previews the exact deterministic challenge token matching createChallenge and rejects unsafe URLs', () => {
    const verifier: IDomainOwnershipVerifier = {
      verify: vi.fn(),
    };
    const authUseCase = new TargetAuthorizationUseCase(
      certificates,
      new SsrfDnsGuardService(false),
      verifier,
    );

    const preview = authUseCase.previewChallengeToken({
      ownerGithubUserId: 'user-a',
      targetUrl: 'https://STAGING.Example.com:8443/dashboard?tab=1',
    });

    const created = authUseCase.createChallenge({
      ownerGithubUserId: 'user-a',
      targetUrl: 'https://staging.example.com:8443',
      method: 'WELL_KNOWN_FILE',
    });

    expect(preview.origin).toBe('https://staging.example.com:8443');
    expect(preview.hostname).toBe('staging.example.com');
    expect(preview.challengeToken).toBe(created.authorization.challengeToken);

    expect(() =>
      authUseCase.previewChallengeToken({
        ownerGithubUserId: 'user-a',
        targetUrl: 'ftp://staging.example.com',
      }),
    ).toThrow(InvalidTargetUrlError);

    expect(() =>
      authUseCase.previewChallengeToken({
        ownerGithubUserId: 'user-a',
        targetUrl: 'https://user:pass@staging.example.com',
      }),
    ).toThrow(InvalidTargetUrlError);
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
      challengeToken: 'brynja-verify-123',
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
      challengeToken: 'brynja-verify-renew',
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
        headers: { Origin: 'https://untrusted.brynja.test' },
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
    const store = new InMemoryBrynjaStore();
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

  it('verifies WELL_KNOWN_FILE via RFC 9116 /.well-known/security.txt and supports legacy /.well-known/brynja-verify.txt fallback', async () => {
    const ssrfAllowLoopback = new SsrfDnsGuardService(true);
    const verifier = new DomainOwnershipVerifierAdapter(ssrfAllowLoopback);
    const baseAuth = {
      id: 'auth-wk',
      ownerGithubUserId: 'user-a',
      origin: 'http://127.0.0.1:4010',
      hostname: '127.0.0.1',
      method: 'WELL_KNOWN_FILE' as const,
      status: 'PENDING' as const,
      challengeToken: 'brynja-verify-0123456789abcdef0123456789abcdef',
      verifiedAt: null,
      expiresAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const fetchMock = vi.spyOn(globalThis, 'fetch');
    try {
      // 1. Primary path: RFC 9116 /.well-known/security.txt containing Contact, Expires, and verification comment
      fetchMock.mockResolvedValueOnce(
        new Response(
          `Contact: mailto:security@example.com\nExpires: 2027-12-31T23:59:59Z\n# Brynja-Verification: ${baseAuth.challengeToken}\n`,
          { status: 200 },
        ),
      );

      const primaryRes = await verifier.verify(baseAuth);
      expect(primaryRes.verified).toBe(true);
      expect(primaryRes.reason).toContain('/.well-known/security.txt');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // 2. Fallback path: /.well-known/security.txt 404 -> tries legacy /.well-known/brynja-verify.txt
      fetchMock
        .mockResolvedValueOnce(new Response('Not found', { status: 404 }))
        .mockResolvedValueOnce(
          new Response(baseAuth.challengeToken, { status: 200 }),
        );

      const fallbackRes = await verifier.verify(baseAuth);
      expect(fallbackRes.verified).toBe(true);
      expect(fallbackRes.reason).toContain('/.well-known/brynja-verify.txt');
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      fetchMock.mockRestore();
    }
  });
});
