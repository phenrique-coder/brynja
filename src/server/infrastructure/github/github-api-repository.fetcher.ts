import * as path from 'node:path';
import { RepositoryFile } from '../../domain/entities/scan.types';
import { InvalidRepositoryUrlError } from '../../domain/errors/domain.errors';
import {
  IRepositoryFetcher,
  RepositoryFetchContext,
} from '../../domain/ports/server.ports';

const SUPPORTED_FILENAMES = new Set([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'requirements.txt',
  'pyproject.toml',
]);

const IGNORED_SEGMENT_PREFIXES = [
  '.git/',
  'node_modules/',
  '.venv/',
  'venv/',
  'dist/',
  'build/',
  '.next/',
];

interface GitHubTreeResponse {
  truncated?: boolean;
  tree?: Array<{
    path: string;
    type: string;
    size?: number;
    sha: string;
  }>;
}

interface GitHubBlobResponse {
  content?: string;
  encoding?: string;
}

interface GitHubRepoMetaResponse {
  default_branch?: string;
}

export class GitHubApiRepositoryFetcher implements IRepositoryFetcher {
  supports(context: RepositoryFetchContext): boolean {
    return this.parseGitHubCoordinates(context.repositoryUrl) !== null;
  }

  async fetchManifestFiles(
    context: RepositoryFetchContext,
  ): Promise<RepositoryFile[]> {
    const coords = this.parseGitHubCoordinates(context.repositoryUrl);
    if (!coords) {
      throw new InvalidRepositoryUrlError(
        `Repositório "${context.repositoryUrl}" não é uma URL HTTPS válida do GitHub (ex.: https://github.com/org/repo). Para outros provedores Git, cole os manifestos diretamente.`,
      );
    }

    const token = context.accessToken ?? null;
    let tree = await this.fetchTree(
      coords.owner,
      coords.repo,
      context.branch,
      token,
    );

    if (!tree) {
      const defaultBranch = await this.fetchDefaultBranch(
        coords.owner,
        coords.repo,
        token,
      );
      if (defaultBranch && defaultBranch !== context.branch) {
        tree = await this.fetchTree(
          coords.owner,
          coords.repo,
          defaultBranch,
          token,
        );
      }
    }

    if (!tree) {
      throw new InvalidRepositoryUrlError(
        `Não foi possível ler o repositório "${coords.owner}/${coords.repo}" via GitHub API (verifique permissões do OAuth App ou nome da branch).`,
      );
    }

    const candidates = (tree.tree ?? []).filter((entry) => {
      if (entry.type !== 'blob') return false;
      if ((entry.size ?? 0) > 4 * 1024 * 1024) return false;
      if (entry.path.split('/').length > 5) return false;
      if (
        IGNORED_SEGMENT_PREFIXES.some(
          (prefix) =>
            entry.path.startsWith(prefix) ||
            entry.path.includes(`/${prefix}`),
        )
      ) {
        return false;
      }
      const base = path.posix.basename(entry.path);
      return SUPPORTED_FILENAMES.has(base);
    });

    const files: RepositoryFile[] = [];
    const concurrency = 6;
    for (let i = 0; i < candidates.length; i += concurrency) {
      const batch = candidates.slice(i, i + concurrency);
      const loaded = await Promise.all(
        batch.map(async (item) => {
          const content = await this.fetchBlobContent(
            coords.owner,
            coords.repo,
            item.sha,
            token,
          );
          return content !== null ? { path: item.path, content } : null;
        }),
      );
      for (const file of loaded) {
        if (file) files.push(file);
      }
    }

    return files;
  }

  private parseGitHubCoordinates(
    rawUrl: string,
  ): { owner: string; repo: string } | null {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return null;
    }

    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname.toLowerCase() !== 'github.com'
    ) {
      return null;
    }

    const segments = parsed.pathname
      .replace(/^\/+|\/+$/g, '')
      .replace(/\.git$/i, '')
      .split('/');

    if (segments.length !== 2 || !segments[0] || !segments[1]) {
      return null;
    }

    return { owner: segments[0], repo: segments[1] };
  }

  private async fetchTree(
    owner: string,
    repo: string,
    branch: string,
    token: string | null,
  ): Promise<GitHubTreeResponse | null> {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      {
        headers: this.headers(token),
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as GitHubTreeResponse;
  }

  private async fetchDefaultBranch(
    owner: string,
    repo: string,
    token: string | null,
  ): Promise<string | null> {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      {
        headers: this.headers(token),
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as GitHubRepoMetaResponse;
    return data.default_branch ?? null;
  }

  private async fetchBlobContent(
    owner: string,
    repo: string,
    sha: string,
    token: string | null,
  ): Promise<string | null> {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/blobs/${encodeURIComponent(sha)}`,
      {
        headers: this.headers(token),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as GitHubBlobResponse;
    if (!data.content) return null;
    if (data.encoding === 'base64') {
      return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString(
        'utf8',
      );
    }
    return data.content;
  }

  private headers(token: string | null): Record<string, string> {
    const hdrs: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Brynja/1.0',
    };
    if (token) {
      hdrs.Authorization = `Bearer ${token}`;
    }
    return hdrs;
  }
}
