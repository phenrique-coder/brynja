import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  TargetAuthorizationEntity,
  VerificationMethod,
} from '../domain/entities/scan.types';
import { InvalidTargetUrlError } from '../domain/errors/domain.errors';
import { SafeProbePolicy } from '../domain/policies/safe-probe.policy';
import {
  ITargetAuthorizationRepository,
  TARGET_AUTHORIZATION_REPO_PORT,
} from '../domain/ports/target-authorization.port';

export interface CreateTargetAuthorizationInput {
  ownerGithubUserId: string;
  targetUrl: string;
  method: VerificationMethod;
  allowLocalLoopbackTargets: boolean;
}

export interface CreateTargetAuthorizationOutput {
  authorization: TargetAuthorizationEntity;
  instructions: string;
}

@Injectable()
export class CreateTargetAuthorizationUseCase {
  constructor(
    @Inject(TARGET_AUTHORIZATION_REPO_PORT)
    private readonly authRepo: ITargetAuthorizationRepository,
  ) {}

  async execute(
    input: CreateTargetAuthorizationInput,
  ): Promise<CreateTargetAuthorizationOutput> {
    const parsed = SafeProbePolicy.parseAndValidateTargetUrl(input.targetUrl);
    const isLoopback = SafeProbePolicy.isLoopbackHostnameOrIp(parsed.hostname);

    if (input.method === 'LOCAL_DEV_SANDBOX') {
      if (!input.allowLocalLoopbackTargets || !isLoopback) {
        throw new InvalidTargetUrlError(
          'O método LOCAL_DEV_SANDBOX só é permitido para alvos loopback (localhost / 127.0.0.1) com ALLOW_LOCAL_LOOPBACK_TARGETS=true.',
        );
      }
    } else if (isLoopback && !input.allowLocalLoopbackTargets) {
      throw new InvalidTargetUrlError(
        'Alvos loopback exigem ALLOW_LOCAL_LOOPBACK_TARGETS=true.',
      );
    }

    const challengeToken = `vereditosec-verify-${randomBytes(16).toString('hex')}`;
    const tokenHash = createHash('sha256')
      .update(challengeToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const authorization = await this.authRepo.upsertPendingChallenge({
      ownerGithubUserId: input.ownerGithubUserId,
      origin: parsed.origin,
      hostname: parsed.hostname,
      method: input.method,
      challengeToken,
      tokenHash,
      expiresAt,
    });

    const instructions = this.buildInstructions(authorization);
    return { authorization, instructions };
  }

  private buildInstructions(auth: TargetAuthorizationEntity): string {
    switch (auth.method) {
      case 'WELL_KNOWN_FILE':
        return `Publique um arquivo texto acessível via GET em "${auth.origin}/.well-known/vereditosec-verify.txt" contendo exatamente: ${auth.challengeToken}`;
      case 'DNS_TXT':
        return `Crie um registro DNS TXT em "_vereditosec.${auth.hostname}" com o valor exato: ${auth.challengeToken}`;
      case 'LOCAL_DEV_SANDBOX':
        return `Alvo local loopback (${auth.origin}) em modo sandbox de desenvolvimento. Confirme a autorização no botão "Verificar Posse".`;
    }
  }
}
