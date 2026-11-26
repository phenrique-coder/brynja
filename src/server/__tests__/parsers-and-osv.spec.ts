import { describe, expect, it, vi } from 'vitest';
import { MemoryVulnerabilityCacheService } from '../infrastructure/cache/memory-vuln-cache.service';
import { GitHubApiRepositoryFetcher } from '../infrastructure/github/github-api-repository.fetcher';
import { GitHubOAuthClient } from '../infrastructure/github/github-oauth.client';
import { DotNetManifestParser } from '../infrastructure/parsers/dotnet-manifest.parser';
import { GoManifestParser } from '../infrastructure/parsers/go-manifest.parser';
import { JavaManifestParser } from '../infrastructure/parsers/java-manifest.parser';
import { NpmManifestParser } from '../infrastructure/parsers/npm-manifest.parser';
import {
  PhpComposerParser,
  RubyGemfileParser,
} from '../infrastructure/parsers/php-ruby-manifest.parser';
import { PythonManifestParser } from '../infrastructure/parsers/python-manifest.parser';
import { RustManifestParser } from '../infrastructure/parsers/rust-manifest.parser';
import { DepsDevDependencyEnricher } from '../infrastructure/vuln-intel/deps-dev-enricher.adapter';
import { NvdVulnerabilityEnricher } from '../infrastructure/vuln-intel/nvd-enricher.adapter';
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

  it('retries transient NVD network failures once and extracts CVSS v4.0 metrics', async () => {
    const enricher = new NvdVulnerabilityEnricher(
      new MemoryVulnerabilityCacheService(),
    );
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('transient timeout'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            vulnerabilities: [
              {
                cve: {
                  id: 'CVE-2026-100701',
                  metrics: {
                    cvssMetricV40: [
                      {
                        cvssData: {
                          baseScore: 8.7,
                          vectorString: 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N',
                          baseSeverity: 'HIGH',
                        },
                      },
                    ],
                  },
                  weaknesses: [
                    { description: [{ value: 'CWE-79' }] },
                  ],
                },
              },
            ],
          }),
          { status: 200 },
        ),
      );

    try {
      const res = await enricher.enrich([
        {
          advisoryId: 'GHSA-test-1',
          cveId: 'CVE-2026-100701',
          packageName: 'demo',
          packageVersion: '1.0.0',
          ecosystem: 'npm',
          title: 'Demo',
          description: 'Demo',
          severity: 'MEDIUM',
          cvssScore: null,
          cvssVector: null,
          cweIds: [],
          epssScore: null,
          epssPercentile: null,
          isKnownExploited: false,
          fixedVersion: '1.0.1',
          references: [],
          verdict: 'DEPENDENCY_ONLY',
          source: 'OSV.dev',
        },
      ]);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(res.warnings).toHaveLength(0);
      expect(res.advisories[0].cvssScore).toBe(8.7);
      expect(res.advisories[0].severity).toBe('HIGH');
      expect(res.advisories[0].cweIds).toEqual(['CWE-79']);
      expect(res.advisories[0].source).toBe('OSV.dev + NVD');
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('merges personal and GitHub organization repositories without duplicates and includes read:org scope', async () => {
    const client = new GitHubOAuthClient();
    const authUrl = client.buildAuthorizeUrl('state-1', 'https://brynja-sec.vercel.app');
    expect(authUrl).toContain('read%3Aorg');

    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockImplementation(async (url) => {
        const u = String(url);
        if (u.includes('/user/repos?')) {
          return new Response(
            JSON.stringify([
              {
                id: 10,
                name: 'personal-app',
                full_name: 'alice/personal-app',
                html_url: 'https://github.com/alice/personal-app',
                private: true,
                default_branch: 'main',
                updated_at: '2026-11-25T08:00:00Z',
                owner: { login: 'alice', type: 'User' },
              },
            ]),
            { status: 200 },
          );
        }
        if (u.includes('/user/orgs?')) {
          return new Response(
            JSON.stringify([{ login: 'acme-org' }]),
            { status: 200 },
          );
        }
        if (u.includes('/orgs/acme-org/repos?')) {
          return new Response(
            JSON.stringify([
              {
                id: 20,
                name: 'org-backend',
                full_name: 'acme-org/org-backend',
                html_url: 'https://github.com/acme-org/org-backend',
                private: true,
                default_branch: 'main',
                updated_at: '2026-11-25T09:00:00Z',
                owner: { login: 'acme-org', type: 'Organization' },
              },
            ]),
            { status: 200 },
          );
        }
        return new Response('Not found', { status: 404 });
      });

    try {
      const repos = await client.listRepositories('gho_token');
      expect(repos).toHaveLength(2);
      expect(repos[0].fullName).toBe('acme-org/org-backend');
      expect(repos[0].ownerType).toBe('Organization');
      expect(repos[1].fullName).toBe('alice/personal-app');
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('falls back to Contents API when recursive Git Tree fails and reports clear diagnostics for empty or SSO-gated repos', async () => {
    const fetcher = new GitHubApiRepositoryFetcher();

    const fallbackSpy = vi
      .spyOn(global, 'fetch')
      .mockImplementation(async (url) => {
        const u = String(url);
        if (u.includes('/git/trees/')) {
          return new Response(JSON.stringify({ message: 'Server Error' }), {
            status: 500,
          });
        }
        if (u.endsWith('/repos/acme/big-repo')) {
          return new Response(
            JSON.stringify({ default_branch: 'main', owner: { type: 'Organization' } }),
            { status: 200 },
          );
        }
        if (u.includes('/branches/')) {
          return new Response(
            JSON.stringify({ commit: { sha: 'abc123', commit: { tree: { sha: 'tree123' } } } }),
            { status: 200 },
          );
        }
        if (u.includes('/contents?ref=main')) {
          return new Response(
            JSON.stringify([
              { name: 'package.json', path: 'package.json', type: 'file', sha: 'blob-pkg' },
            ]),
            { status: 200 },
          );
        }
        if (u.includes('/git/blobs/blob-pkg')) {
          const content = Buffer.from(
            JSON.stringify({ dependencies: { express: '4.19.2' } }),
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
        repositoryUrl: 'https://github.com/acme/big-repo',
        branch: 'main',
        accessToken: 'gho_123',
      });
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('package.json');
    } finally {
      fallbackSpy.mockRestore();
    }

    const emptySpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ message: 'Git Repository is empty.' }), {
          status: 409,
        }),
      );

    try {
      await expect(
        fetcher.fetchManifestFiles({
          repositoryUrl: 'https://github.com/acme/empty-repo',
          branch: 'main',
          accessToken: 'gho_123',
        }),
      ).rejects.toThrow(/vazio/i);
    } finally {
      emptySpy.mockRestore();
    }
  });

  it('parses yarn.lock, Go, Rust, Java, .NET, PHP Composer, and Ruby Gemfile.lock manifests', () => {
    const npm = new NpmManifestParser();
    const yarnDeps = npm.parse(
      'yarn.lock',
      `"lodash@^4.17.20":\n  version "4.17.21"\n\n"@next/env@npm:15.2.3":\n  version: 15.2.3\n`,
    );
    expect(yarnDeps.map((d) => `${d.name}@${d.version}`)).toEqual([
      'lodash@4.17.21',
      '@next/env@15.2.3',
    ]);

    const go = new GoManifestParser();
    const goDeps = go.parse(
      'go.mod',
      `module github.com/acme/api\nrequire (\n\tgithub.com/gin-gonic/gin v1.9.1\n\tgolang.org/x/net v0.20.0 // indirect\n)\n`,
    );
    expect(goDeps.map((d) => `${d.ecosystem}:${d.name}@${d.version}:${d.isDirect}`)).toEqual([
      'Go:github.com/gin-gonic/gin@v1.9.1:true',
      'Go:golang.org/x/net@v0.20.0:false',
    ]);

    const rust = new RustManifestParser();
    const cargoDeps = rust.parse(
      'Cargo.lock',
      `[[package]]\nname = "serde"\nversion = "1.0.210"\n\n[[package]]\nname = "tokio"\nversion = "1.40.0"\n`,
    );
    expect(cargoDeps.map((d) => d.purl)).toEqual([
      'pkg:cargo/serde@1.0.210',
      'pkg:cargo/tokio@1.40.0',
    ]);

    const java = new JavaManifestParser();
    const mavenDeps = java.parse(
      'pom.xml',
      `<project><properties><spring.version>6.1.14</spring.version></properties><dependencies><dependency><groupId>org.springframework</groupId><artifactId>spring-web</artifactId><version>\${spring.version}</version></dependency></dependencies></project>`,
    );
    expect(mavenDeps[0]?.name).toBe('org.springframework:spring-web');
    expect(mavenDeps[0]?.version).toBe('6.1.14');

    const dotnet = new DotNetManifestParser();
    const nugetDeps = dotnet.parse(
      'Api.csproj',
      `<Project><ItemGroup><PackageReference Include="Newtonsoft.Json" Version="13.0.3" /></ItemGroup></Project>`,
    );
    expect(nugetDeps[0]?.purl).toBe('pkg:nuget/Newtonsoft.Json@13.0.3');

    const php = new PhpComposerParser();
    const phpDeps = php.parse(
      'composer.lock',
      JSON.stringify({ packages: [{ name: 'symfony/http-kernel', version: 'v6.4.12' }] }),
    );
    expect(phpDeps[0]?.purl).toBe('pkg:composer/symfony/http-kernel@6.4.12');

    const ruby = new RubyGemfileParser();
    const rubyDeps = ruby.parse(
      'Gemfile.lock',
      `GEM\n  specs:\n    rails (7.1.3.4)\n      actionpack (= 7.1.3.4)\n`,
    );
    expect(rubyDeps.map((d) => d.purl)).toEqual(['pkg:gem/rails@7.1.3.4']);
  });

  it('enriches SPDX licenses and OpenSSF Scorecard via DepsDevDependencyEnricher with restrictive license & low-score warnings', async () => {
    const enricher = new DepsDevDependencyEnricher(
      new MemoryVulnerabilityCacheService(),
    );
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (url) => {
        const u = String(url);
        if (u.includes('/systems/npm/packages/')) {
          return new Response(
            JSON.stringify({
              licenses: ['GPL-3.0'],
              relatedProjects: [
                {
                  relationType: 'SOURCE_REPO',
                  projectKey: { id: 'github.com/acme/lib' },
                },
              ],
            }),
            { status: 200 },
          );
        }
        if (u.includes('/v3/projects/')) {
          return new Response(
            JSON.stringify({ scorecard: { overallScore: 3.2 } }),
            { status: 200 },
          );
        }
        return new Response('Not found', { status: 404 });
      });

    try {
      const res = await enricher.enrichDependencies([
        {
          name: 'gpl-lib',
          version: '1.0.0',
          ecosystem: 'npm',
          purl: 'pkg:npm/gpl-lib@1.0.0',
          sourceFile: 'package.json',
          isDirect: true,
        },
      ]);

      expect(res.dependencies[0].license).toBe('GPL-3.0');
      expect(res.dependencies[0].openssfScore).toBe(3.2);
      expect(res.warnings.some((w) => w.includes('GPL-3.0'))).toBe(true);
      expect(res.warnings.some((w) => w.includes('3.2/10'))).toBe(true);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
