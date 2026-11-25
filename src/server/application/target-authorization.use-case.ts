import { randomUUID } from 'node:crypto';
import {
  ProbeAuditEntry,
  TargetAuthorizationEntity,
  VerificationMethod,
} from '../domain/entities/scan.types';
import {
  InvalidTargetUrlError,
  OwnershipVerificationFailedError,
  TargetNotAuthorizedError,
} from '../domain/errors/domain.errors';
import { SafeProbePolicy } from '../domain/policies/safe-probe.policy';
import { IDomainOwnershipVerifier } from '../domain/ports/server.ports';
import { OwnershipCertificateService } from '../infrastructure/crypto/ownership-certificate.service';
import { InMemoryProbeAuditCollector } from '../infrastructure/pentest/in-memory-audit-collector';
import { SsrfDnsGuardService } from '../infrastructure/pentest/ssrf-dns-guard.service';

export interface CreateChallengeResult {
  authorization: TargetAuthorizationEntity;
  instructions: string;
}

export interface ChallengeTokenPreviewResult {
  origin: string;
  hostname: string;
  challengeToken: string;
}

export interface VerifyOwnershipResult {
  authorization: TargetAuthorizationEntity;
  auditLogs: ProbeAuditEntry[];
}

export class TargetAuthorizationUseCase {
  constructor(
    private readonly certificates: OwnershipCertificateService,
    private readonly ssrfGuard: SsrfDnsGuardService,
    private readonly verifier: IDomainOwnershipVerifier,
  ) {}

  previewChallengeToken(input: {
    ownerGithubUserId: string;
    targetUrl: string;
  }): ChallengeTokenPreviewResult {
    const parsed = SafeProbePolicy.parseAndValidateTargetUrl(input.targetUrl);
    const challengeToken = this.certificates.deriveChallengeToken(
      input.ownerGithubUserId,
      parsed.origin,
    );

    return {
      origin: parsed.origin,
      hostname: parsed.hostname,
      challengeToken,
    };
  }

  createChallenge(input: {
    ownerGithubUserId: string;
    targetUrl: string;
    method: VerificationMethod;
  }): CreateChallengeResult {
    const parsed = SafeProbePolicy.parseAndValidateTargetUrl(input.targetUrl);
    const allowLoopback = this.ssrfGuard.isLoopbackAllowed();

    if (
      input.method === 'LOCAL_DEV_SANDBOX' &&
      (!allowLoopback ||
        !SafeProbePolicy.isLoopbackHostnameOrIp(parsed.hostname))
    ) {
      throw new InvalidTargetUrlError(
        'LOCAL_DEV_SANDBOX requer ALLOW_LOCAL_LOOPBACK_TARGETS=true e host loopback (localhost / 127.0.0.1). Em produção/Vercel utilize WELL_KNOWN_FILE ou DNS_TXT.',
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const id = randomUUID();
    const challengeToken = this.certificates.deriveChallengeToken(
      input.ownerGithubUserId,
      parsed.origin,
    );
    const createdAt = now.toISOString();

    const challengeSeal = this.certificates.sealChallenge({
      id,
      ownerGithubUserId: input.ownerGithubUserId,
      origin: parsed.origin,
      hostname: parsed.hostname,
      method: input.method,
      challengeToken,
      createdAt,
      expiresAt,
    });

    const authorization: TargetAuthorizationEntity = {
      id,
      ownerGithubUserId: input.ownerGithubUserId,
      origin: parsed.origin,
      hostname: parsed.hostname,
      method: input.method,
      challengeToken,
      status: 'PENDING',
      verifiedAt: null,
      expiresAt,
      createdAt,
      updatedAt: createdAt,
      challengeSeal,
    };

    const instructions = this.buildInstructions(authorization);
    return { authorization, instructions };
  }

  async verifyOwnership(input: {
    ownerGithubUserId: string;
    challengeSeal: string;
  }): Promise<VerifyOwnershipResult> {
    const challenge = this.certificates.unsealChallenge(input.challengeSeal);
    if (!challenge) {
      throw new TargetNotAuthorizedError(
        'Token de desafio inválido ou corrompido. Gere um novo desafio de posse.',
      );
    }

    if (challenge.ownerGithubUserId !== input.ownerGithubUserId) {
      throw new TargetNotAuthorizedError(
        'Este desafio de posse pertence a outra conta GitHub.',
      );
    }

    const audit = new InMemoryProbeAuditCollector();
    const candidate: TargetAuthorizationEntity = {
      id: challenge.id,
      ownerGithubUserId: challenge.ownerGithubUserId,
      origin: challenge.origin,
      hostname: challenge.hostname,
      method: challenge.method,
      challengeToken: challenge.challengeToken,
      status: 'PENDING',
      verifiedAt: null,
      expiresAt: challenge.expiresAt,
      createdAt: challenge.createdAt,
      updatedAt: challenge.createdAt,
      challengeSeal: input.challengeSeal,
    };

    const startedAt = Date.now();
    const outcome = await this.verifier.verify(candidate);
    const durationMs = Date.now() - startedAt;

    await audit.log({
      ownerGithubUserId: input.ownerGithubUserId,
      scanId: null,
      authorizationId: candidate.id,
      targetUrl: candidate.origin,
      probeId: `ownership:${candidate.method}`,
      httpMethod: candidate.method === 'DNS_TXT' ? 'DNS_TXT' : 'GET',
      requestPath:
        candidate.method === 'WELL_KNOWN_FILE'
          ? '/.well-known/brynja-verify.txt'
          : '/',
      statusCode: outcome.verified ? 200 : null,
      durationMs,
      outcome: outcome.verified ? 'VERIFICATION_SUCCESS' : 'VERIFICATION_FAILED',
      details: outcome.reason,
    });

    if (!outcome.verified) {
      throw new OwnershipVerificationFailedError(outcome.reason);
    }

    const ttlDays = Math.max(
      1,
      Number(process.env.AUTHORIZATION_TTL_DAYS ?? 7),
    );
    const verifiedAt = new Date().toISOString();
    const expiresAt = new Date(
      Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const verificationProof = this.certificates.sealVerifiedCertificate({
      id: challenge.id,
      ownerGithubUserId: challenge.ownerGithubUserId,
      origin: challenge.origin,
      hostname: challenge.hostname,
      method: challenge.method,
      challengeToken: challenge.challengeToken,
      verifiedAt,
      expiresAt,
      createdAt: challenge.createdAt,
    });

    return {
      authorization: {
        ...candidate,
        status: 'VERIFIED',
        verifiedAt,
        expiresAt,
        updatedAt: verifiedAt,
        verificationProof,
      },
      auditLogs: audit.getEntries(),
    };
  }

  private buildInstructions(auth: TargetAuthorizationEntity): string {
    switch (auth.method) {
      case 'WELL_KNOWN_FILE':
        return `Publique um arquivo texto acessível via GET em "${auth.origin}/.well-known/brynja-verify.txt" contendo exatamente: ${auth.challengeToken}`;
      case 'DNS_TXT':
        return `Crie um registro DNS TXT em "_brynja.${auth.hostname}" com o valor: ${auth.challengeToken}`;
      case 'LOCAL_DEV_SANDBOX':
        return `Alvo loopback local "${auth.origin}" pronto para confirmação imediata em ambiente de desenvolvimento.`;
    }
  }
}
