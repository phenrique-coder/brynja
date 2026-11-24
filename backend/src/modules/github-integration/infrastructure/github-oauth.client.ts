import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GitHubOAuthConfigSummary,
  GitHubRepoSummary,
  GitHubTokenExchangeResult,
  GitHubUserProfile,
  IGitHubOAuthClient,
} from '../domain/ports/github-integration.port';

interface GitHubTokenResponse {
  access_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string;
  html_url?: string;
}

interface GitHubRepoApiItem {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
  updated_at: string;
}

@Injectable()
export class GitHubOAuthClient implements IGitHubOAuthClient {
  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.getClientId() && this.getClientSecret());
  }

  getConfigSummary(): GitHubOAuthConfigSummary {
    return {
      configured: this.isConfigured(),
      callbackUrl: this.getCallbackUrl(),
      scopes: this.getScopes(),
    };
  }

  buildAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.getClientId(),
      redirect_uri: this.getCallbackUrl(),
      state,
    });
    const scopes = this.getScopes();
    if (scopes) {
      params.set('scope', scopes);
    }
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<GitHubTokenExchangeResult> {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'VereditoSec/0.1',
      },
      body: JSON.stringify({
        client_id: this.getClientId(),
        client_secret: this.getClientSecret(),
        code,
        redirect_uri: this.getCallbackUrl(),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = (await res.json()) as GitHubTokenResponse;
    if (!res.ok || !data.access_token) {
      throw new Error(
        data.error_description ||
          data.error ||
          `GitHub OAuth token exchange falhou (HTTP ${res.status}).`,
      );
    }

    return {
      accessToken: data.access_token,
      scope: data.scope ?? '',
    };
  }

  async fetchAuthenticatedUser(accessToken: string): Promise<GitHubUserProfile> {
    const res = await fetch('https://api.github.com/user', {
      headers: this.apiHeaders(accessToken),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      throw new Error(
        `Falha ao obter perfil autenticado no GitHub (HTTP ${res.status}).`,
      );
    }

    const user = (await res.json()) as GitHubUserResponse;
    return {
      id: String(user.id),
      login: user.login,
      name: user.name ?? null,
      avatarUrl: user.avatar_url ?? null,
      profileUrl: user.html_url ?? `https://github.com/${user.login}`,
    };
  }

  async listRepositories(accessToken: string): Promise<GitHubRepoSummary[]> {
    const res = await fetch(
      'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member',
      {
        headers: this.apiHeaders(accessToken),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) {
      throw new Error(
        `Falha ao listar repositórios do GitHub (HTTP ${res.status}).`,
      );
    }

    const items = (await res.json()) as GitHubRepoApiItem[];
    return items.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      htmlUrl: repo.html_url,
      private: repo.private,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
    }));
  }

  private apiHeaders(accessToken: string): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'VereditoSec/0.1',
    };
  }

  private getClientId(): string {
    return this.config.get<string>('GITHUB_CLIENT_ID')?.trim() ?? '';
  }

  private getClientSecret(): string {
    return this.config.get<string>('GITHUB_CLIENT_SECRET')?.trim() ?? '';
  }

  private getCallbackUrl(): string {
    return (
      this.config.get<string>('GITHUB_CALLBACK_URL')?.trim() ||
      'http://localhost:3001/api/integrations/github/callback'
    );
  }

  private getScopes(): string {
    return (
      this.config.get<string>('GITHUB_OAUTH_SCOPES')?.trim() ?? 'repo read:user'
    );
  }
}
