import {
  CanActivate,
  ExecutionContext,
  Injectable,
  createParamDecorator,
} from '@nestjs/common';
import { Request } from 'express';
import { GitHubNotConnectedError } from '../../scans/domain/errors/domain.errors';
import { ResolveGitHubSessionUseCase } from '../application/github-integration.use-cases';
import { EphemeralGitHubSession } from '../domain/ports/github-integration.port';
import { parseCookies } from './cookie.helper';

export const GITHUB_SESSION_COOKIE = 'veredito_gh_session';

export interface AuthenticatedRequest extends Request {
  vereditoSession?: EphemeralGitHubSession;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly resolveSession: ResolveGitHubSessionUseCase) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookies = parseCookies(req.headers.cookie);
    const session = this.resolveSession.execute(cookies[GITHUB_SESSION_COOKIE]);

    if (!session) {
      throw new GitHubNotConnectedError(
        'Sessão GitHub necessária. Conecte seu GitHub para gerar o token desta sessão.',
      );
    }

    req.vereditoSession = session;
    return true;
  }
}

export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): EphemeralGitHubSession => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.vereditoSession) {
      throw new GitHubNotConnectedError(
        'Sessão GitHub não encontrada na requisição.',
      );
    }
    return req.vereditoSession;
  },
);
