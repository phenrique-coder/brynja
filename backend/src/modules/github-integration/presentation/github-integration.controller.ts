import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Request, Response } from 'express';
import {
  CompleteGitHubOAuthUseCase,
  GetGitHubStatusUseCase,
  ListGitHubReposUseCase,
  StartGitHubOAuthUseCase,
} from '../application/github-integration.use-cases';
import { parseCookies } from './cookie.helper';
import { GITHUB_SESSION_COOKIE } from './session-auth.guard';

const GITHUB_OAUTH_STATE_COOKIE = 'veredito_gh_oauth_state';

@Controller('integrations/github')
export class GitHubIntegrationController {
  constructor(
    private readonly config: ConfigService,
    private readonly getStatus: GetGitHubStatusUseCase,
    private readonly startOAuth: StartGitHubOAuthUseCase,
    private readonly completeOAuth: CompleteGitHubOAuthUseCase,
    private readonly listRepos: ListGitHubReposUseCase,
  ) {}

  @Get('status')
  status(@Req() req: Request) {
    const cookies = parseCookies(req.headers.cookie);
    return this.getStatus.execute(cookies[GITHUB_SESSION_COOKIE]);
  }

  @Get('connect')
  connect(
    @Query('returnTo') returnTo: string | undefined,
    @Res() res: Response,
  ): void {
    const state = randomBytes(24).toString('hex');
    const safeReturnTo = this.sanitizeReturnTo(returnTo);
    const { authorizeUrl } = this.startOAuth.execute(state);

    res.cookie(
      GITHUB_OAUTH_STATE_COOKIE,
      JSON.stringify({ state, returnTo: safeReturnTo }),
      {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 10 * 60 * 1000,
      },
    );
    res.redirect(authorizeUrl);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL')?.trim() || 'http://localhost:3000';
    const cookies = parseCookies(req.headers.cookie);
    const { expectedState, returnTo } = this.parseStateCookie(
      cookies[GITHUB_OAUTH_STATE_COOKIE],
    );

    res.clearCookie(GITHUB_OAUTH_STATE_COOKIE, { path: '/' });

    if (oauthError) {
      res.redirect(
        `${frontendUrl}${returnTo}?github_error=${encodeURIComponent(oauthError)}`,
      );
      return;
    }

    if (
      !code ||
      !state ||
      !expectedState ||
      !this.safeEqual(state, expectedState)
    ) {
      res.redirect(
        `${frontendUrl}${returnTo}?github_error=${encodeURIComponent('Estado OAuth inválido ou expirado (proteção CSRF).')}`,
      );
      return;
    }

    try {
      const { sealedCookie } = await this.completeOAuth.execute(code);
      // Session cookie without Max-Age/Expires: automatically discarded when browser closes,
      // requiring a new token on every new browser session while keeping DB evaluation history.
      res.cookie(GITHUB_SESSION_COOKIE, sealedCookie, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
      const sep = returnTo.includes('?') ? '&' : '?';
      res.redirect(`${frontendUrl}${returnTo}${sep}github=connected`);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Falha ao concluir autenticação GitHub.';
      res.redirect(
        `${frontendUrl}${returnTo}?github_error=${encodeURIComponent(msg)}`,
      );
    }
  }

  @Get('repos')
  async repos(@Req() req: Request) {
    const cookies = parseCookies(req.headers.cookie);
    return this.listRepos.execute(cookies[GITHUB_SESSION_COOKIE]);
  }

  @Post('disconnect')
  disconnectSession(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(GITHUB_SESSION_COOKIE, { path: '/' });
    return { disconnected: true };
  }

  private sanitizeReturnTo(raw?: string): string {
    if (!raw) return '/scans/new';
    const trimmed = raw.trim();
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
      return '/scans/new';
    }
    return trimmed;
  }

  private parseStateCookie(raw?: string): {
    expectedState: string | null;
    returnTo: string;
  } {
    if (!raw) return { expectedState: null, returnTo: '/scans/new' };
    try {
      const parsed = JSON.parse(raw) as { state?: string; returnTo?: string };
      return {
        expectedState: parsed.state ?? null,
        returnTo: this.sanitizeReturnTo(parsed.returnTo),
      };
    } catch {
      return { expectedState: raw, returnTo: '/scans/new' };
    }
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }
}
