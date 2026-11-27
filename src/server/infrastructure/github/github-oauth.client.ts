import {
  GitHubOAuthConfigSummary,
  GitHubRepoSummary,
  GitHubTokenExchangeResult,
  GitHubUserProfile,
  IGitHubOAuthClient,
} from '../../domain/ports/server.ports';

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
  email?: string | null;
  avatar_url?: string;
  html_url?: string;
}

interface GitHubEmailApiItem {
  email: string;
  primary?: boolean;
  verified?: boolean;
  visibility?: string | null;
}

interface GitHubRepoApiItem {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
  updated_at: string;
  owner?: {
    login?: string;
    type?: string;
  };
}

interface GitHubOrgApiItem {
  login: string;
}

const DEFAULT_OAUTH_SCOPES = 'repo read:user user:email read:org';
const MAX_REPO_PAGES = 5;
const MAX_STORED_EMAILS = 10;

export class GitHubOAuthClient implements IGitHubOAuthClient {
  isConfigured(): boolean {
    return Boolean(this.getClientId() && this.getClientSecret());
  }

  getConfigSummary(requestOrigin?: string): GitHubOAuthConfigSummary {
    const clientId = this.getClientId();
    return {
      configured: this.isConfigured(),
      callbackUrl: this.getCallbackUrl(requestOrigin),
      scopes: this.getScopes(),
      oauthAppSettingsUrl: clientId
        ? `https://github.com/settings/connections/applications/${encodeURIComponent(clientId)}`
        : null,
    };
  }

  buildAuthorizeUrl(state: string, requestOrigin?: string): string {
    const params = new URLSearchParams({
      client_id: this.getClientId(),
      redirect_uri: this.getCallbackUrl(requestOrigin),
      state,
    });
    const scopes = this.getScopes();
    if (scopes) {
      params.set('scope', scopes);
    }
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(
    code: string,
    requestOrigin?: string,
  ): Promise<GitHubTokenExchangeResult> {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Brynja/1.0',
      },
      body: JSON.stringify({
        client_id: this.getClientId(),
        client_secret: this.getClientSecret(),
        code,
        redirect_uri: this.getCallbackUrl(requestOrigin),
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
    const [res, apiVerifiedEmails] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: this.apiHeaders(accessToken),
        signal: AbortSignal.timeout(10_000),
      }),
      this.fetchVerifiedEmails(accessToken),
    ]);

    if (!res.ok) {
      throw new Error(
        `Falha ao obter perfil autenticado no GitHub (HTTP ${res.status}).`,
      );
    }

    const user = (await res.json()) as GitHubUserResponse;
    const publicEmail = user.email?.trim().toLowerCase() || null;
    const verifiedEmails =
      apiVerifiedEmails.length > 0
        ? apiVerifiedEmails
        : publicEmail
          ? [publicEmail]
          : [];
    const primaryEmail = verifiedEmails[0] ?? publicEmail;

    return {
      id: String(user.id),
      login: user.login,
      name: user.name ?? null,
      email: primaryEmail,
      verifiedEmails,
      avatarUrl: user.avatar_url ?? null,
      profileUrl: user.html_url ?? `https://github.com/${user.login}`,
    };
  }

  async fetchVerifiedEmails(accessToken: string): Promise<string[]> {
    try {
      const res = await fetch('https://api.github.com/user/emails', {
        headers: this.apiHeaders(accessToken),
        signal: AbortSignal.timeout(6_000),
      });
      if (!res.ok) return [];

      const items = (await res.json()) as GitHubEmailApiItem[];
      if (!Array.isArray(items)) return [];

      const verified = items
        .filter(
          (item) =>
            item &&
            item.verified === true &&
            typeof item.email === 'string' &&
            item.email.trim().length > 0,
        )
        .sort((a, b) => Number(Boolean(b.primary)) - Number(Boolean(a.primary)))
        .map((item) => item.email.trim().toLowerCase());

      return Array.from(new Set(verified)).slice(0, MAX_STORED_EMAILS);
    } catch {
      return [];
    }
  }

  async listRepositories(accessToken: string): Promise<GitHubRepoSummary[]> {
    const byId = new Map<number, GitHubRepoSummary>();

    const collect = (items: GitHubRepoApiItem[]) => {
      for (const repo of items) {
        if (!byId.has(repo.id)) {
          byId.set(repo.id, this.mapRepoItem(repo));
        }
      }
    };

    // 1. Paginated /user/repos (owner, collaborator, organization_member)
    for (let page = 1; page <= MAX_REPO_PAGES; page += 1) {
      const res = await fetch(
        `https://api.github.com/user/repos?sort=updated&per_page=100&page=${page}&affiliation=owner,collaborator,organization_member`,
        {
          headers: this.apiHeaders(accessToken),
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (!res.ok) {
        if (page === 1) {
          throw new Error(
            `Falha ao listar repositórios do GitHub (HTTP ${res.status}).`,
          );
        }
        break;
      }

      const items = (await res.json()) as GitHubRepoApiItem[];
      collect(items);
      if (items.length < 100) break;
    }

    // 2. Explicitly enumerate user's GitHub Organizations and fetch their repos
    //    (covers org repos omitted from /user/repos pagination or visibility filters)
    try {
      const orgsRes = await fetch(
        'https://api.github.com/user/orgs?per_page=100',
        {
          headers: this.apiHeaders(accessToken),
          signal: AbortSignal.timeout(8_000),
        },
      );

      if (orgsRes.ok) {
        const orgs = (await orgsRes.json()) as GitHubOrgApiItem[];
        const orgBatches = orgs.slice(0, 15);
        await Promise.all(
          orgBatches.map(async (org) => {
            try {
              const orgReposRes = await fetch(
                `https://api.github.com/orgs/${encodeURIComponent(org.login)}/repos?sort=updated&per_page=100&type=all`,
                {
                  headers: this.apiHeaders(accessToken),
                  signal: AbortSignal.timeout(8_000),
                },
              );
              if (!orgReposRes.ok) return;
              const orgRepos = (await orgReposRes.json()) as GitHubRepoApiItem[];
              collect(orgRepos);
            } catch {
              // Ignore single-org fetch errors so other repos still load
            }
          }),
        );
      }
    } catch {
      // Non-fatal: user repos already collected above
    }

    return Array.from(byId.values()).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  private mapRepoItem(repo: GitHubRepoApiItem): GitHubRepoSummary {
    const ownerType =
      repo.owner?.type === 'Organization' ? 'Organization' : 'User';
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      htmlUrl: repo.html_url,
      private: repo.private,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
      ownerLogin: repo.owner?.login,
      ownerType,
    };
  }

  private apiHeaders(accessToken: string): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Brynja/1.0',
    };
  }

  private getClientId(): string {
    return process.env.GITHUB_CLIENT_ID?.trim() ?? '';
  }

  private getClientSecret(): string {
    return process.env.GITHUB_CLIENT_SECRET?.trim() ?? '';
  }

  private getCallbackUrl(requestOrigin?: string): string {
    const explicit = process.env.GITHUB_CALLBACK_URL?.trim();
    if (explicit) return explicit;
    if (requestOrigin) {
      return `${requestOrigin.replace(/\/+$/, '')}/api/integrations/github/callback`;
    }
    const appUrl =
      process.env.APP_URL?.trim() ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000');
    return `${appUrl.replace(/\/+$/, '')}/api/integrations/github/callback`;
  }

  private getScopes(): string {
    const raw = process.env.GITHUB_OAUTH_SCOPES?.trim();
    if (!raw) return DEFAULT_OAUTH_SCOPES;
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.includes('repo') && !parts.includes('read:org')) {
      parts.push('read:org');
    }
    if (parts.includes('read:user') && !parts.includes('user:email')) {
      parts.push('user:email');
    }
    return parts.join(' ');
  }
}
