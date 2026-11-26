import * as path from 'node:path';
import {
  RepositoryFile,
  RepositoryPostureSignals,
} from '../../domain/entities/scan.types';
import { InvalidRepositoryUrlError } from '../../domain/errors/domain.errors';
import {
  IRepositoryFetcher,
  RepositoryFetchContext,
} from '../../domain/ports/server.ports';

const SUPPORTED_FILENAMES = new Set([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'requirements.txt',
  'pyproject.toml',
  'go.mod',
  'go.sum',
  'Cargo.toml',
  'Cargo.lock',
  'pom.xml',
  'gradle.lockfile',
  'packages.lock.json',
  'composer.json',
  'composer.lock',
  'Gemfile.lock',
]);

function isSupportedManifestFilename(filename: string): boolean {
  return (
    SUPPORTED_FILENAMES.has(filename) ||
    filename.toLowerCase().endsWith('.csproj')
  );
}

const STATIC_IGNORED_PREFIXES = [
  '.git/',
  'node_modules/',
  '.venv/',
  'venv/',
  'dist/',
  'build/',
  '.next/',
  'coverage/',
  'vendor/',
];

const STATIC_LOCKFILE_SKIP = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'go.sum',
  'cargo.lock',
  'composer.lock',
  'gemfile.lock',
]);

function classifyStaticPriority(filePath: string): number {
  const lower = filePath.toLowerCase();
  const base = path.posix.basename(lower);
  if (STATIC_LOCKFILE_SKIP.has(base)) return 0;
  if (
    base === '.env' ||
    base === '.env.local' ||
    base === '.env.production' ||
    base === 'dockerfile' ||
    base.startsWith('dockerfile.') ||
    /^docker-compose(?:\.[^.]+)?\.ya?ml$/.test(base) ||
    lower.endsWith('.tf') ||
    lower.includes('.github/workflows/')
  ) {
    return 3;
  }
  if (
    base.endsWith('.ts') ||
    base.endsWith('.tsx') ||
    base.endsWith('.js') ||
    base.endsWith('.jsx') ||
    base.endsWith('.mjs') ||
    base.endsWith('.py') ||
    base.endsWith('.yaml') ||
    base.endsWith('.yml') ||
    base === 'vercel.json' ||
    base.startsWith('next.config.')
  ) {
    return 1;
  }
  return 0;
}

const IGNORED_SEGMENT_PREFIXES = [
  '.git/',
  'node_modules/',
  '.venv/',
  'venv/',
  'dist/',
  'build/',
  '.next/',
];

const FALLBACK_SUBDIRS = [
  'apps',
  'packages',
  'backend',
  'frontend',
  'server',
  'client',
  'api',
  'web',
  'services',
];

interface GitHubTreeEntry {
  path: string;
  type: string;
  size?: number;
  sha: string;
}

interface GitHubTreeResponse {
  truncated?: boolean;
  tree?: GitHubTreeEntry[];
}

interface GitHubBlobResponse {
  content?: string;
  encoding?: string;
}

interface GitHubRepoMetaResponse {
  default_branch?: string;
  private?: boolean;
  owner?: {
    type?: string;
  };
}

interface GitHubBranchResponse {
  commit?: {
    sha?: string;
    commit?: {
      tree?: {
        sha?: string;
      };
    };
  };
}

interface GitHubContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir' | string;
  sha?: string;
  size?: number;
}

interface HttpFailureInfo {
  status: number;
  message: string;
  ssoHeader: string | null;
  oauthScopes: string | null;
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
    const requestedBranch = context.branch?.trim() || 'main';

    // 1. Try direct recursive Git Tree on requested branch first (fast path, 1 request)
    let resolvedBranch = requestedBranch;
    let treeAttempt = await this.fetchTree(
      coords.owner,
      coords.repo,
      resolvedBranch,
      token,
    );

    // 2. If fast path failed, inspect repo metadata + branch ref (handles non-main default branches,
    //    slashes in branch names, empty repos, SAML SSO, and exact HTTP error reporting)
    let repoMetaFailure: HttpFailureInfo | null = null;
    let ownerIsOrg = false;

    if (!treeAttempt.ok) {
      const metaRes = await this.fetchRepoMeta(coords.owner, coords.repo, token);
      if (metaRes.ok) {
        ownerIsOrg = metaRes.data.owner?.type === 'Organization';
        const defaultBranch = metaRes.data.default_branch?.trim();

        // Try resolving exact tree SHA via branch endpoint (supports slashes in branch names)
        const branchToTry =
          defaultBranch && defaultBranch !== requestedBranch
            ? [requestedBranch, defaultBranch]
            : [requestedBranch];

        for (const candidateBranch of branchToTry) {
          const treeSha = await this.fetchBranchTreeSha(
            coords.owner,
            coords.repo,
            candidateBranch,
            token,
          );
          if (treeSha) {
            const shaTree = await this.fetchTree(
              coords.owner,
              coords.repo,
              treeSha,
              token,
            );
            if (shaTree.ok) {
              resolvedBranch = candidateBranch;
              treeAttempt = shaTree;
              break;
            }
          } else if (candidateBranch !== requestedBranch) {
            const altTree = await this.fetchTree(
              coords.owner,
              coords.repo,
              candidateBranch,
              token,
            );
            if (altTree.ok) {
              resolvedBranch = candidateBranch;
              treeAttempt = altTree;
              break;
            }
            treeAttempt = altTree;
          }
        }
      } else {
        repoMetaFailure = metaRes.failure;
      }
    }

    // 3. Fallback to Contents API if recursive Git Tree failed on a reachable repo (e.g. huge tree / 422 / 500)
    if (!treeAttempt.ok) {
      const failure = repoMetaFailure ?? treeAttempt.failure;

      if (failure.status === 409) {
        throw new InvalidRepositoryUrlError(
          `O repositório "${coords.owner}/${coords.repo}" está vazio (sem commits publicados na branch "${resolvedBranch}").`,
        );
      }

      // For 422 / 500 / 502 / 503 on git/trees (or when repo metadata succeeded), try Contents API fallback
      if (!repoMetaFailure && [404, 422, 500, 502, 503].includes(failure.status)) {
        const fallbackFiles = await this.fetchManifestsViaContentsApi(
          coords.owner,
          coords.repo,
          resolvedBranch,
          token,
        );
        if (fallbackFiles.length > 0) {
          return fallbackFiles;
        }
      }

      throw new InvalidRepositoryUrlError(
        this.formatActionableError(
          coords.owner,
          coords.repo,
          resolvedBranch,
          failure,
          ownerIsOrg,
        ),
      );
    }

    const candidates = (treeAttempt.data.tree ?? []).filter((entry) => {
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
      return isSupportedManifestFilename(base);
    });

    const files = await this.loadBlobs(
      coords.owner,
      coords.repo,
      candidates,
      token,
    );

    // If tree was truncated by GitHub and we found nothing, also check root via Contents API
    if (treeAttempt.data.truncated && files.length === 0) {
      return this.fetchManifestsViaContentsApi(
        coords.owner,
        coords.repo,
        resolvedBranch,
        token,
      );
    }

    return files;
  }

  async fetchStaticFiles(context: RepositoryFetchContext): Promise<{
    files: RepositoryFile[];
    posture: RepositoryPostureSignals | null;
    truncated: boolean;
  }> {
    const coords = this.parseGitHubCoordinates(context.repositoryUrl);
    if (!coords) {
      return { files: [], posture: null, truncated: false };
    }

    const token = context.accessToken ?? null;
    const requestedBranch = context.branch?.trim() || 'main';
    let resolvedBranch = requestedBranch;

    let treeAttempt = await this.fetchTree(
      coords.owner,
      coords.repo,
      resolvedBranch,
      token,
    );

    if (!treeAttempt.ok) {
      const metaRes = await this.fetchRepoMeta(coords.owner, coords.repo, token);
      if (metaRes.ok) {
        const defaultBranch = metaRes.data.default_branch?.trim();
        const candidates =
          defaultBranch && defaultBranch !== requestedBranch
            ? [requestedBranch, defaultBranch]
            : [requestedBranch];

        for (const candidateBranch of candidates) {
          const sha = await this.fetchBranchTreeSha(
            coords.owner,
            coords.repo,
            candidateBranch,
            token,
          );
          if (sha) {
            const shaTree = await this.fetchTree(
              coords.owner,
              coords.repo,
              sha,
              token,
            );
            if (shaTree.ok) {
              resolvedBranch = candidateBranch;
              treeAttempt = shaTree;
              break;
            }
          }
        }
      }
    }

    if (!treeAttempt.ok) {
      return { files: [], posture: null, truncated: false };
    }

    const tree = treeAttempt.data.tree ?? [];
    const blobPaths = new Set(
      tree.filter((e) => e.type === 'blob').map((e) => e.path.toLowerCase()),
    );

    const hasSecurityMd =
      blobPaths.has('security.md') ||
      blobPaths.has('.github/security.md') ||
      blobPaths.has('docs/security.md');
    const hasDependabotOrRenovate =
      blobPaths.has('.github/dependabot.yml') ||
      blobPaths.has('.github/dependabot.yaml') ||
      blobPaths.has('renovate.json') ||
      blobPaths.has('.github/renovate.json');
    const hasCodeowners =
      blobPaths.has('codeowners') ||
      blobPaths.has('.github/codeowners') ||
      blobPaths.has('docs/codeowners');

    const defaultBranchProtected = await this.fetchBranchProtectionFlag(
      coords.owner,
      coords.repo,
      resolvedBranch,
      token,
    );

    const prioritized = tree
      .filter((entry) => {
        if (entry.type !== 'blob') return false;
        if ((entry.size ?? 0) > 256 * 1024) return false;
        if (
          STATIC_IGNORED_PREFIXES.some(
            (prefix) =>
              entry.path.startsWith(prefix) ||
              entry.path.includes(`/${prefix}`),
          )
        ) {
          return false;
        }
        return classifyStaticPriority(entry.path) > 0;
      })
      .sort(
        (a, b) =>
          classifyStaticPriority(b.path) - classifyStaticPriority(a.path),
      )
      .slice(0, 60);

    const files = await this.loadBlobs(
      coords.owner,
      coords.repo,
      prioritized,
      token,
    );

    return {
      files,
      posture: {
        hasSecurityMd,
        hasDependabotOrRenovate,
        hasCodeowners,
        defaultBranchProtected,
      },
      truncated: Boolean(treeAttempt.data.truncated) || prioritized.length === 60,
    };
  }

  private async fetchBranchProtectionFlag(
    owner: string,
    repo: string,
    branch: string,
    token: string | null,
  ): Promise<boolean | null> {
    if (!token) return null;
    try {
      const encodedBranch = branch
        .split('/')
        .map(encodeURIComponent)
        .join('/');
      const res = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodedBranch}/protection`,
        {
          headers: this.headers(token),
          signal: AbortSignal.timeout(4_000),
        },
      );
      if (res.ok) return true;
      if (res.status === 404) return false;
      return null;
    } catch {
      return null;
    }
  }

  private async loadBlobs(
    owner: string,
    repo: string,
    candidates: GitHubTreeEntry[],
    token: string | null,
  ): Promise<RepositoryFile[]> {
    const files: RepositoryFile[] = [];
    const concurrency = 6;
    for (let i = 0; i < candidates.length; i += concurrency) {
      const batch = candidates.slice(i, i + concurrency);
      const loaded = await Promise.all(
        batch.map(async (item) => {
          const content = await this.fetchBlobContent(
            owner,
            repo,
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

  private async fetchManifestsViaContentsApi(
    owner: string,
    repo: string,
    branch: string,
    token: string | null,
  ): Promise<RepositoryFile[]> {
    const rootItems = await this.listContentsDir(owner, repo, '', branch, token);
    if (rootItems.length === 0) return [];

    const toFetch: GitHubTreeEntry[] = [];
    const dirsToScan: string[] = [];

    for (const item of rootItems) {
      if (item.type === 'file' && item.sha && isSupportedManifestFilename(item.name)) {
        toFetch.push({ path: item.path, type: 'blob', sha: item.sha, size: item.size });
      } else if (
        item.type === 'dir' &&
        FALLBACK_SUBDIRS.includes(item.name.toLowerCase())
      ) {
        dirsToScan.push(item.path);
      }
    }

    await Promise.all(
      dirsToScan.map(async (dir) => {
        const subItems = await this.listContentsDir(owner, repo, dir, branch, token);
        for (const sub of subItems) {
          if (sub.type === 'file' && sub.sha && isSupportedManifestFilename(sub.name)) {
            toFetch.push({ path: sub.path, type: 'blob', sha: sub.sha, size: sub.size });
          } else if (sub.type === 'dir') {
            const nested = await this.listContentsDir(
              owner,
              repo,
              sub.path,
              branch,
              token,
            );
            for (const leaf of nested) {
              if (
                leaf.type === 'file' &&
                leaf.sha &&
                isSupportedManifestFilename(leaf.name)
              ) {
                toFetch.push({
                  path: leaf.path,
                  type: 'blob',
                  sha: leaf.sha,
                  size: leaf.size,
                });
              }
            }
          }
        }
      }),
    );

    return this.loadBlobs(owner, repo, toFetch, token);
  }

  private async listContentsDir(
    owner: string,
    repo: string,
    dirPath: string,
    branch: string,
    token: string | null,
  ): Promise<GitHubContentItem[]> {
    const encodedPath = dirPath
      ? `/${dirPath.split('/').map(encodeURIComponent).join('/')}`
      : '';
    try {
      const res = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents${encodedPath}?ref=${encodeURIComponent(branch)}`,
        {
          headers: this.headers(token),
          signal: AbortSignal.timeout(8_000),
        },
      );
      if (!res.ok) return [];
      const data = (await res.json()) as unknown;
      return Array.isArray(data) ? (data as GitHubContentItem[]) : [];
    } catch {
      return [];
    }
  }

  private formatActionableError(
    owner: string,
    repo: string,
    branch: string,
    failure: HttpFailureInfo,
    ownerIsOrg: boolean,
  ): string {
    if (failure.status === 401) {
      return `Sessão GitHub expirada ou revogada ao acessar "${owner}/${repo}" (HTTP 401). Clique em Sair no menu superior e conecte novamente.`;
    }

    if (failure.ssoHeader) {
      return `A organização "${owner}" exige autorização SAML SSO para o OAuth App ler "${owner}/${repo}" (HTTP ${failure.status}). Autorize o aplicativo nas configurações de SAML SSO da organização no GitHub.`;
    }

    if (failure.status === 403) {
      return `Acesso negado pela GitHub API ao ler "${owner}/${repo}" (HTTP 403: ${failure.message}). Se o repositório pertence a uma organização ou conta com restrição de OAuth App, conceda acesso (Grant) ao Brynja em GitHub → Settings → Applications → Authorized OAuth Apps.`;
    }

    if (failure.status === 404) {
      const scopeHint =
        failure.oauthScopes && !failure.oauthScopes.split(/[\s,]+/).includes('repo')
          ? ` Escopos atuais do token: "${failure.oauthScopes}" (falta o escopo "repo" — saia e entre novamente).`
          : '';
      const orgHint = ownerIsOrg
        ? ` Como "${owner}" é uma organização, confirme que o Brynja recebeu permissão (Grant) em GitHub → Settings → Applications → Authorized OAuth Apps.`
        : ` Verifique se a conta GitHub conectada tem permissão no repositório (ou se uma organização exige aprovação "Grant" no OAuth App) e se a branch "${branch}" existe.`;
      return `Não foi possível ler "${owner}/${repo}" na branch "${branch}" via GitHub API (HTTP 404).${orgHint}${scopeHint}`;
    }

    return `Não foi possível ler o repositório "${owner}/${repo}" via GitHub API (HTTP ${failure.status}: ${failure.message}).`;
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

  private async extractFailure(res: Response): Promise<HttpFailureInfo> {
    let message = res.statusText || 'Erro desconhecido';
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // ignore non-json body
    }
    return {
      status: res.status,
      message,
      ssoHeader: res.headers.get('x-github-sso'),
      oauthScopes: res.headers.get('x-oauth-scopes'),
    };
  }

  private async fetchTree(
    owner: string,
    repo: string,
    refOrSha: string,
    token: string | null,
  ): Promise<
    | { ok: true; data: GitHubTreeResponse }
    | { ok: false; failure: HttpFailureInfo }
  > {
    const encodedRef = refOrSha
      .split('/')
      .map(encodeURIComponent)
      .join('/');
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodedRef}?recursive=1`,
      {
        headers: this.headers(token),
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok) {
      return { ok: false, failure: await this.extractFailure(res) };
    }
    return { ok: true, data: (await res.json()) as GitHubTreeResponse };
  }

  private async fetchRepoMeta(
    owner: string,
    repo: string,
    token: string | null,
  ): Promise<
    | { ok: true; data: GitHubRepoMetaResponse }
    | { ok: false; failure: HttpFailureInfo }
  > {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      {
        headers: this.headers(token),
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!res.ok) {
      return { ok: false, failure: await this.extractFailure(res) };
    }
    return { ok: true, data: (await res.json()) as GitHubRepoMetaResponse };
  }

  private async fetchBranchTreeSha(
    owner: string,
    repo: string,
    branch: string,
    token: string | null,
  ): Promise<string | null> {
    const encodedBranch = branch
      .split('/')
      .map(encodeURIComponent)
      .join('/');
    try {
      const res = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodedBranch}`,
        {
          headers: this.headers(token),
          signal: AbortSignal.timeout(8_000),
        },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as GitHubBranchResponse;
      return data.commit?.commit?.tree?.sha ?? data.commit?.sha ?? null;
    } catch {
      return null;
    }
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
