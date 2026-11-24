import { Inject, Injectable } from '@nestjs/common';
import { TargetAuthorizationEntity } from '../domain/entities/scan.types';
import {
  AuthorizationNotFoundError,
  OwnershipVerificationFailedError,
} from '../domain/errors/domain.errors';
import {
  IProbeAuditLogger,
  PROBE_AUDIT_LOGGER_PORT,
} from '../domain/ports/controlled-probe.port';
import {
  DOMAIN_OWNERSHIP_VERIFIER_PORT,
  IDomainOwnershipVerifier,
  ITargetAuthorizationRepository,
  TARGET_AUTHORIZATION_REPO_PORT,
} from '../domain/ports/target-authorization.port';

@Injectable()
export class VerifyTargetOwnershipUseCase {
  constructor(
    @Inject(TARGET_AUTHORIZATION_REPO_PORT)
    private readonly authRepo: ITargetAuthorizationRepository,
    @Inject(DOMAIN_OWNERSHIP_VERIFIER_PORT)
    private readonly verifier: IDomainOwnershipVerifier,
    @Inject(PROBE_AUDIT_LOGGER_PORT)
    private readonly auditLogger: IProbeAuditLogger,
  ) {}

  async execute(
    authorizationId: string,
    ownerGithubUserId: string,
  ): Promise<TargetAuthorizationEntity> {
    const auth = await this.authRepo.findByIdForOwner(
      authorizationId,
      ownerGithubUserId,
    );
    if (!auth) {
      throw new AuthorizationNotFoundError(
        `Autorização "${authorizationId}" não encontrada para este usuário.`,
      );
    }

    const startedAt = Date.now();
    const outcome = await this.verifier.verify(auth);
    const durationMs = Date.now() - startedAt;

    await this.auditLogger.log({
      ownerGithubUserId,
      scanId: null,
      authorizationId: auth.id,
      targetUrl: auth.origin,
      probeId: `ownership:${auth.method.toLowerCase()}`,
      httpMethod: auth.method === 'DNS_TXT' ? 'DNS_TXT' : 'GET',
      requestPath:
        auth.method === 'WELL_KNOWN_FILE'
          ? '/.well-known/vereditosec-verify.txt'
          : auth.hostname,
      statusCode: outcome.verified ? 200 : null,
      durationMs,
      outcome: outcome.verified ? 'VERIFICATION_SUCCESS' : 'VERIFICATION_FAILED',
      details: outcome.reason,
    });

    if (!outcome.verified) {
      throw new OwnershipVerificationFailedError(outcome.reason);
    }

    return this.authRepo.updateStatusForOwner(
      auth.id,
      ownerGithubUserId,
      'VERIFIED',
      new Date(),
    );
  }
}
