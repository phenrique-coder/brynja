import { Inject, Injectable } from '@nestjs/common';
import { TargetAuthorizationEntity } from '../domain/entities/scan.types';
import { AuthorizationNotFoundError } from '../domain/errors/domain.errors';
import {
  IProbeAuditLogger,
  PROBE_AUDIT_LOGGER_PORT,
} from '../domain/ports/controlled-probe.port';
import {
  ITargetAuthorizationRepository,
  TARGET_AUTHORIZATION_REPO_PORT,
} from '../domain/ports/target-authorization.port';

@Injectable()
export class ListTargetAuthorizationsUseCase {
  constructor(
    @Inject(TARGET_AUTHORIZATION_REPO_PORT)
    private readonly authRepo: ITargetAuthorizationRepository,
  ) {}

  async execute(
    ownerGithubUserId: string,
  ): Promise<TargetAuthorizationEntity[]> {
    return this.authRepo.listByOwner(ownerGithubUserId);
  }
}

export interface RevokedTargetAuthorizationResult {
  id: string;
  origin: string;
  deleted: true;
  status: 'REVOKED';
}

@Injectable()
export class RevokeTargetAuthorizationUseCase {
  constructor(
    @Inject(TARGET_AUTHORIZATION_REPO_PORT)
    private readonly authRepo: ITargetAuthorizationRepository,
    @Inject(PROBE_AUDIT_LOGGER_PORT)
    private readonly auditLogger: IProbeAuditLogger,
  ) {}

  async execute(
    authorizationId: string,
    ownerGithubUserId: string,
  ): Promise<RevokedTargetAuthorizationResult> {
    const existing = await this.authRepo.findByIdForOwner(
      authorizationId,
      ownerGithubUserId,
    );
    if (!existing) {
      throw new AuthorizationNotFoundError(
        `Autorização "${authorizationId}" não encontrada para este usuário.`,
      );
    }

    await this.auditLogger.log({
      ownerGithubUserId,
      scanId: null,
      authorizationId: existing.id,
      targetUrl: existing.origin,
      probeId: 'guardrail:authorization-revoke',
      httpMethod: 'DELETE',
      requestPath: '/',
      statusCode: null,
      durationMs: 0,
      outcome: 'AUTHORIZATION_REVOKED',
      details: `Autorização ${existing.id} (${existing.origin}) revogada e removida permanentemente pelo proprietário.`,
    });

    await this.authRepo.deleteForOwner(authorizationId, ownerGithubUserId);

    return {
      id: existing.id,
      origin: existing.origin,
      deleted: true,
      status: 'REVOKED',
    };
  }
}
