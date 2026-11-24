import { Inject, Injectable } from '@nestjs/common';
import {
  GitHubIntegrationError,
  GitHubNotConnectedError,
} from '../../scans/domain/errors/domain.errors';
import {
  EphemeralGitHubSession,
  GITHUB_OAUTH_CLIENT_PORT,
  GitHubRepoSummary,
  IGitHubOAuthClient,
  ISessionTokenCodec,
  SESSION_TOKEN_CODEC_PORT,
} from '../domain/ports/github-integration.port';

export interface GitHubIntegrationStatus {
  configured: boolean;
  connected: boolean;
  githubUserId: string | null;
  login: string | null;
  name: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  sessionExpiresAt: number | null;
  callbackUrl: string;
  scopes: string;
}

const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours max; cookie has no Max-Age (browser session)

@Injectable()
export class GetGitHubStatusUseCase {
  constructor(
    @Inject(GITHUB_OAUTH_CLIENT_PORT)
    private readonly oauthClient: IGitHubOAuthClient,
    @Inject(SESSION_TOKEN_CODEC_PORT)
    private readonly sessionCodec: ISessionTokenCodec,
  ) {}

  execute(sealedCookie?: string | null): GitHubIntegrationStatus {
    const config = this.oauthClient.getConfigSummary();
    const session = this.sessionCodec.unseal(sealedCookie);

    if (!session) {
      return {
        ...config,
        connected: false,
        githubUserId: null,
        login: null,
        name: null,
        avatarUrl: null,
        profileUrl: null,
        sessionExpiresAt: null,
      };
    }

    return {
      ...config,
      connected: true,
      githubUserId: session.githubUserId,
      login: session.login,
      name: session.name ?? null,
      avatarUrl: session.avatarUrl,
      profileUrl: session.profileUrl ?? `https://github.com/${session.login}`,
      sessionExpiresAt: session.expiresAt,
    };
  }
}

@Injectable()
export class StartGitHubOAuthUseCase {
  constructor(
    @Inject(GITHUB_OAUTH_CLIENT_PORT)
    private readonly oauthClient: IGitHubOAuthClient,
  ) {}

  execute(state: string): { authorizeUrl: string } {
    if (!this.oauthClient.isConfigured()) {
      throw new GitHubIntegrationError(
        'Integração GitHub OAuth não configurada. Defina GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET no .env.',
      );
    }
    return { authorizeUrl: this.oauthClient.buildAuthorizeUrl(state) };
  }
}

@Injectable()
export class CompleteGitHubOAuthUseCase {
  constructor(
    @Inject(GITHUB_OAUTH_CLIENT_PORT)
    private readonly oauthClient: IGitHubOAuthClient,
    @Inject(SESSION_TOKEN_CODEC_PORT)
    private readonly sessionCodec: ISessionTokenCodec,
  ) {}

  async execute(code: string): Promise<{
    sealedCookie: string;
    session: EphemeralGitHubSession;
  }> {
    const tokenResult = await this.oauthClient.exchangeCodeForToken(code);
    const profile = await this.oauthClient.fetchAuthenticatedUser(
      tokenResult.accessToken,
    );

    const now = Date.now();
    const session: EphemeralGitHubSession = {
      githubUserId: profile.id,
      login: profile.login,
      name: profile.name ?? null,
      avatarUrl: profile.avatarUrl,
      profileUrl: profile.profileUrl ?? `https://github.com/${profile.login}`,
      accessToken: tokenResult.accessToken,
      issuedAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };

    return {
      sealedCookie: this.sessionCodec.seal(session),
      session,
    };
  }
}

@Injectable()
export class ResolveGitHubSessionUseCase {
  constructor(
    @Inject(SESSION_TOKEN_CODEC_PORT)
    private readonly sessionCodec: ISessionTokenCodec,
  ) {}

  execute(sealedCookie?: string | null): EphemeralGitHubSession | null {
    return this.sessionCodec.unseal(sealedCookie);
  }
}

@Injectable()
export class ListGitHubReposUseCase {
  constructor(
    private readonly resolveSession: ResolveGitHubSessionUseCase,
    @Inject(GITHUB_OAUTH_CLIENT_PORT)
    private readonly oauthClient: IGitHubOAuthClient,
  ) {}

  async execute(sealedCookie?: string | null): Promise<GitHubRepoSummary[]> {
    const session = this.resolveSession.execute(sealedCookie);
    if (!session) {
      throw new GitHubNotConnectedError(
        'Sessão GitHub expirada ou não iniciada. Conecte com seu GitHub para continuar.',
      );
    }
    return this.oauthClient.listRepositories(session.accessToken);
  }
}
