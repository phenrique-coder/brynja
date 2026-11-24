import { Injectable } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { RepositoryFile } from '../../domain/entities/scan.types';
import { InvalidRepositoryUrlError } from '../../domain/errors/domain.errors';
import {
  IRepositoryFetcher,
  RepositoryFetchContext,
} from '../../domain/ports/repository-fetcher.port';

const execFileAsync = promisify(execFile);

const SUPPORTED_FILENAMES = new Set([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'requirements.txt',
  'pyproject.toml',
]);

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  '.venv',
  'venv',
  '__pycache__',
  'dist',
  'build',
  '.next',
]);

@Injectable()
export class GitShallowCloneFetcher implements IRepositoryFetcher {
  supports(context: RepositoryFetchContext): boolean {
    return context.repositoryUrl.startsWith('https://');
  }

  async fetchManifestFiles(
    context: RepositoryFetchContext,
  ): Promise<RepositoryFile[]> {
    const parsed = this.validateHttpsRepoUrl(context.repositoryUrl);
    const tempBase = await fs.mkdtemp(path.join(os.tmpdir(), 'veredito-scan-'));

    try {
      await this.cloneShallow(parsed.toString(), context.branch, tempBase);
      return await this.collectManifests(tempBase, tempBase, 0);
    } finally {
      await fs.rm(tempBase, { recursive: true, force: true });
    }
  }

  private validateHttpsRepoUrl(rawUrl: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new InvalidRepositoryUrlError(
        `URL de repositório inválida: "${rawUrl}"`,
      );
    }
    if (parsed.protocol !== 'https:') {
      throw new InvalidRepositoryUrlError(
        'Por segurança, apenas URLs HTTPS são permitidas para clonagem de repositório.',
      );
    }
    if (parsed.username || parsed.password) {
      throw new InvalidRepositoryUrlError(
        'Credenciais embutidas na URL do repositório não são permitidas.',
      );
    }
    return parsed;
  }

  private async cloneShallow(
    repoUrl: string,
    branch: string,
    destDir: string,
  ): Promise<void> {
    // Isolate git from host machine credentials (~/.gitconfig / gh auth / system config)
    const env = {
      PATH: process.env.PATH ?? '/usr/bin:/bin',
      GIT_TERMINAL_PROMPT: '0',
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: '/dev/null',
    };

    try {
      await execFileAsync(
        'git',
        [
          'clone',
          '--depth',
          '1',
          '--single-branch',
          '--branch',
          branch,
          '--no-tags',
          repoUrl,
          destDir,
        ],
        { timeout: 25_000, env, maxBuffer: 1024 * 1024 },
      );
    } catch {
      const entries = await fs.readdir(destDir);
      await Promise.all(
        entries.map((entry) =>
          fs.rm(path.join(destDir, entry), { recursive: true, force: true }),
        ),
      );
      try {
        await execFileAsync(
          'git',
          ['clone', '--depth', '1', '--no-tags', repoUrl, destDir],
          { timeout: 25_000, env, maxBuffer: 1024 * 1024 },
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Falha ao clonar repositório';
        throw new InvalidRepositoryUrlError(
          `Não foi possível clonar o repositório (${repoUrl}). Se for privado, conecte sua conta via GitHub OAuth: ${message}`,
        );
      }
    }
  }

  private async collectManifests(
    rootDir: string,
    currentDir: string,
    depth: number,
  ): Promise<RepositoryFile[]> {
    if (depth > 4) return [];

    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    const collected: RepositoryFile[] = [];

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          const nested = await this.collectManifests(
            rootDir,
            fullPath,
            depth + 1,
          );
          collected.push(...nested);
        }
        continue;
      }

      if (entry.isFile() && SUPPORTED_FILENAMES.has(entry.name)) {
        const stat = await fs.stat(fullPath);
        if (stat.size > 4 * 1024 * 1024) continue;
        const content = await fs.readFile(fullPath, 'utf8');
        const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
        collected.push({ path: relPath, content });
      }
    }

    return collected;
  }
}
