import { describe, expect, it, vi } from 'vitest';
import { GitHubApiRepositoryFetcher } from '../infrastructure/github/github-api-repository.fetcher';
import { NpmManifestParser } from '../infrastructure/parsers/npm-manifest.parser';
import { PythonManifestParser } from '../infrastructure/parsers/python-manifest.parser';
import { resolveFixedVersionForInstalled } from '../infrastructure/vuln-intel/osv-version.resolver';

describe('Manifest Parsers, OSV SemVer Resolver & GitHub API Fetcher', () => {
  it('parses package.json, package-lock.json and pnpm-lock.yaml via NpmManifestParser', () => {
    const parser = new NpmManifestParser();
    expect(parser.supports('package.json')).toBe(true);
    expect(parser.supports('apps/web/pnpm-lock.yaml')).toBe(true);

    const pkgDeps = parser.parse(
      'package.json',
      JSON.stringify({
        dependencies: { lodash: '^4.17.20', next: '15.0.0' },
      }),
    );
    expect(pkgDeps.map((d) => `${d.name}@${d.version}`)).toEqual([
      'lodash@4.17.20',
      'next@15.0.0',
    ]);

    const pnpmDeps = parser.parse(
      'pnpm-lock.yaml',
      `lockfileVersion: '9.0'\npackages:\n  'axios@1.6.0':\n    resolution: {}\n`,
    );
    expect(pnpmDeps[0]?.name).toBe('axios');
    expect(pnpmDeps[0]?.version).toBe('1.6.0');
  });

  it('parses requirements.txt and pyproject.toml (PEP 621 + Poetry) via PythonManifestParser', () => {
    const parser = new PythonManifestParser();
    const reqDeps = parser.parse(
      'requirements.txt',
      `django==3.2.12\nrequests>=2.25.1 # comment\n-r extra.txt\n`,
    );
    expect(reqDeps.map((d) => `${d.name}@${d.version}`)).toEqual([
      'django@3.2.12',
      'requests@2.25.1',
    ]);

    const poetryDeps = parser.parse(
      'pyproject.toml',
      `[tool.poetry.dependencies]\npython = "^3.11"\nfastapi = "^0.110.0"\n`,
    );
    expect(poetryDeps.map((d) => `${d.name}@${d.version}`)).toEqual([
      'fastapi@0.110.0',
    ]);
  });

  it('resolves exact OSV fixed version for installed SemVer branch (next@15.0.0 -> 15.2.3)', () => {
    const fixed = resolveFixedVersionForInstalled(
      [
        {
          package: { name: 'next', ecosystem: 'npm' },
          ranges: [
            {
              type: 'SEMVER',
              events: [
                { introduced: '13.0.0' },
                { fixed: '13.5.9' },
                { introduced: '14.0.0' },
                { fixed: '14.2.25' },
                { introduced: '15.0.0' },
                { fixed: '15.2.3' },
              ],
            },
          ],
        },
      ],
      'next',
      '15.0.0',
      'npm',
    );
    expect(fixed).toBe('15.2.3');
  });

  it('fetches manifests via GitHub Tree/Blob API and ignores node_modules', async () => {
    const fetcher = new GitHubApiRepositoryFetcher();
    const fetchSpy = vi
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
