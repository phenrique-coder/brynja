import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import {
  CompleteGitHubOAuthUseCase,
  GetGitHubStatusUseCase,
  ListGitHubReposUseCase,
  ResolveGitHubSessionUseCase,
  StartGitHubOAuthUseCase,
} from '../application/github-integration.use-cases';
import { IGitHubOAuthClient } from '../domain/ports/github-integration.port';
import { AesTokenCipherService } from '../infrastructure/aes-token-cipher.service';
import { GitHubApiRepositoryFetcher } from '../infrastructure/github-api-repository.fetcher';
import { SealedSessionService } from '../infrastructure/sealed-session.service';
import { GitHubIntegrationController } from '../presentation/github-integration.controller';
import { GITHUB_SESSION_COOKIE } from '../presentation/session-auth.guard';

describe('GitHub Integration (Ephemeral Multi-User Session & API Fetcher)', () => {
  const mockConfig = {
    get: (key: string) => {
      const map: Record<string, string> = {
        TOKEN_ENCRYPTION_KEY:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        FRONTEND_URL: 'http://localhost:3000',
        GITHUB_CLIENT_ID: 'client-123',
        GITHUB_CLIENT_SECRET: 'secret-456',
      };
      return map[key];
    },
  } as unknown as ConfigService;

  it('seals and unseals ephemeral session in AES-256-GCM without DB storage and rejects expired/tampered cookies', () => {
    const cipher = new AesTokenCipherService(mockConfig);
    const codec = new SealedSessionService(cipher);

    const sealed = codec.seal({
      githubUserId: '1001',
      login: 'user-a',
      avatarUrl: null,
      accessToken: 'gho_ephemeralSecret',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });

    expect(sealed).not.toContain('gho_ephemeralSecret');
    const unsealed = codec.unseal(sealed);
    expect(unsealed?.githubUserId).toBe('1001');
    expect(unsealed?.accessToken).toBe('gho_ephemeralSecret');

    const expired = codec.seal({
      githubUserId: '1001',
      login: 'user-a',
      avatarUrl: null,
      accessToken: 'gho_expired',
      issuedAt: Date.now() - 10_000,
      expiresAt: Date.now() - 1000,
    });
    expect(codec.unseal(expired)).toBeNull();
    expect(codec.unseal(`${sealed}tampered`)).toBeNull();
  });

  it('completes OAuth flow into ephemeral sealed cookie and sets browser-session cookie (no Max-Age)', async () => {
    const cipher = new AesTokenCipherService(mockConfig);
    const codec = new SealedSessionService(cipher);

    const oauthClient: IGitHubOAuthClient = {
      isConfigured: () => true,
      getConfigSummary: () => ({
        configured: true,
        callbackUrl: 'http://localhost:3001/api/integrations/github/callback',
        scopes: 'repo read:user',
      }),
      buildAuthorizeUrl: (state) =>
        `https://github.com/login/oauth/authorize?state=${state}`,
      exchangeCodeForToken: jest.fn().mockResolvedValue({
        accessToken: 'gho_privateAccessToken',
        scope: 'repo read:user',
      }),
      fetchAuthenticatedUser: jest.fn().mockResolvedValue({
        id: '99',
        login: 'octocat',
        avatarUrl: 'https://avatars.githubusercontent.com/u/99',
      }),
      listRepositories: jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'demo-app',
          fullName: 'octocat/demo-app',
          htmlUrl: 'https://github.com/octocat/demo-app',
          private: true,
          defaultBranch: 'main',
          updatedAt: '2026-11-24T17:00:00Z',
        },
      ]),
    };

    const complete = new CompleteGitHubOAuthUseCase(oauthClient, codec);
    const getStatus = new GetGitHubStatusUseCase(oauthClient, codec);
    const resolveSession = new ResolveGitHubSessionUseCase(codec);
    const listRepos = new ListGitHubReposUseCase(resolveSession, oauthClient);

    const controller = new GitHubIntegrationController(
      mockConfig,
      getStatus,
      new StartGitHubOAuthUseCase(oauthClient),
      complete,
      listRepos,
    );

    const stateCookieVal = JSON.stringify({
      state: 'valid-state',
      returnTo: '/scans/new',
    });
    const req = {
      headers: {
        cookie: `veredito_gh_oauth_state=${encodeURIComponent(stateCookieVal)}`,
      },
    } as unknown as Request;

    const cookieCalls: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    const res = {
      clearCookie: jest.fn(),
      cookie: jest.fn((name, value, options) => {
        cookieCalls.push({ name, value, options });
      }),
      redirect: jest.fn(),
    } as unknown as Response;

    await controller.callback('code-123', 'valid-state', undefined, req, res);

    expect(cookieCalls).toHaveLength(1);
    expect(cookieCalls[0].name).toBe(GITHUB_SESSION_COOKIE);
    expect(cookieCalls[0].options.httpOnly).toBe(true);
    expect(cookieCalls[0].options.maxAge).toBeUndefined();
    expect(cookieCalls[0].options.expires).toBeUndefined();

    const status = getStatus.execute(cookieCalls[0].value);
    expect(status.connected).toBe(true);
    expect(status.githubUserId).toBe('99');
    expect(status.login).toBe('octocat');

    const repos = await listRepos.execute(cookieCalls[0].value);
    expect(repos[0].private).toBe(true);
  });

  it('rejects callback with mismatched CSRF OAuth state', async () => {
    const controller = new GitHubIntegrationController(
      mockConfig,
      {} as GetGitHubStatusUseCase,
      {} as StartGitHubOAuthUseCase,
      { execute: jest.fn() } as unknown as CompleteGitHubOAuthUseCase,
      {} as ListGitHubReposUseCase,
    );

    const req = {
      headers: {
        cookie: `veredito_gh_oauth_state=${encodeURIComponent(
          JSON.stringify({ state: 'expected-state', returnTo: '/' }),
        )}`,
      },
    } as unknown as Request;

    const clearCookie = jest.fn();
    const redirect = jest.fn();
    const res = { clearCookie, redirect } as unknown as Response;

    await controller.callback('code-123', 'forged-state', undefined, req, res);

    expect(clearCookie).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining('github_error='),
    );
  });

  it('GitHubApiRepositoryFetcher reads manifests via GitHub Tree/Blob API and skips node_modules', async () => {
    const fetcher = new GitHubApiRepositoryFetcher();
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (url) => {
        const u = String(url);
        if (u.includes('/git/trees/')) {
          return new Response(
            JSON.stringify({
              tree: [
                { path: 'package.json', type: 'blob', size: 120, sha: 'sha-1' },
                {
                  path: 'node_modules/pkg/package.json',
                  type: 'blob',
                  size: 80,
                  sha: 'sha-ignored',
                },
              ],
            }),
            { status: 200 },
          );
        }
        if (u.includes('/git/blobs/sha-1')) {
          const content = Buffer.from(
            JSON.stringify({ dependencies: { hono: '4.6.14' } }),
          ).toString('base64');
          return new Response(
            JSON.stringify({ content, encoding: 'base64' }),
            { status: 200 },
          );
        }
        return new Response('Not found', { status: 404 });
      });

    try {
      const files = await fetcher.fetchManifestFiles({
        repositoryUrl: 'https://github.com/octocat/demo-app',
        branch: 'main',
        accessToken: 'gho_123',
      });
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('package.json');
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
