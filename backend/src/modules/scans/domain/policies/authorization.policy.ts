import { TargetAuthorizationEntity } from '../entities/scan.types';
import { TargetNotAuthorizedError } from '../errors/domain.errors';

export class AuthorizationPolicy {
  static assertTargetAuthorized(
    authorization: TargetAuthorizationEntity | null,
    targetUrl: string,
    ownerGithubUserId: string,
    now: Date = new Date(),
  ): TargetAuthorizationEntity {
    if (!authorization) {
      throw new TargetNotAuthorizedError(
        `Nenhuma autorização registrada para o alvo "${targetUrl}". Execute a verificação de posse antes de iniciar sondas ativas.`,
      );
    }

    if (authorization.ownerGithubUserId !== ownerGithubUserId) {
      throw new TargetNotAuthorizedError(
        `Autorização "${authorization.id}" não pertence ao usuário autenticado.`,
      );
    }

    const targetOrigin = new URL(targetUrl).origin;
    if (authorization.origin !== targetOrigin) {
      throw new TargetNotAuthorizedError(
        `Origem autorizada "${authorization.origin}" não corresponde ao alvo "${targetOrigin}".`,
      );
    }

    if (authorization.status !== 'VERIFIED') {
      throw new TargetNotAuthorizedError(
        `Autorização para "${targetOrigin}" está com status "${authorization.status}". Apenas alvos VERIFIED podem receber sondas.`,
      );
    }

    if (authorization.expiresAt && authorization.expiresAt <= now) {
      throw new TargetNotAuthorizedError(
        `Autorização para "${targetOrigin}" expirou em ${authorization.expiresAt.toISOString()}.`,
      );
    }

    return authorization;
  }
}
