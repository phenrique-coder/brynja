import { describe, expect, it, vi } from 'vitest';
import {
  NormalizedAdvisory,
  ParsedDependency,
  ProbeExecutionContext,
} from '../domain/entities/scan.types';
import {
  IRateLimitedHttpClient,
  SafeHttpRequest,
  SafeHttpResponse,
} from '../domain/ports/server.ports';
import { CookieSecurityProbe } from '../infrastructure/pentest/probes/cookie-security.probe';
import { CorsMisconfigProbe } from '../infrastructure/pentest/probes/cors-misconfig.probe';
import { ExposedDocsAndMetricsProbe } from '../infrastructure/pentest/probes/exposed-docs-metrics.probe';
import { HstsTlsProbe } from '../infrastructure/pentest/probes/hsts-tls.probe';
import { RuntimeFingerprintProbe } from '../infrastructure/pentest/probes/runtime-fingerprint.probe';
import { SecurityHeadersProbe } from '../infrastructure/pentest/probes/security-headers.probe';

function makeContext(
  overrides: Partial<ProbeExecutionContext> = {},
): ProbeExecutionContext {
  const now = new Date().toISOString();
  return {
    scanId: 'scan-probe-test',
    ownerGithubUserId: 'user-100',
    authorization: {
      id: 'auth-1',
      ownerGithubUserId: 'user-100',
      origin: 'https://app.example.com',
      hostname: 'app.example.com',
      method: 'WELL_KNOWN_FILE',
      challengeToken: 'tok',
      status: 'VERIFIED',
      verifiedAt: now,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      createdAt: now,
      updatedAt: now,
    },
    targetUrl: 'https://app.example.com',
    dependencies: [],
    advisories: [],
    ...overrides,
  };
}

function makeAdvisory(
  packageName: string,
  packageVersion: string,
): NormalizedAdvisory {
  return {
    advisoryId: `GHSA-${packageName}`,
    cveId: 'CVE-2025-0001',
    packageName,
    packageVersion,
    ecosystem: 'npm',
    title: `Advisory for ${packageName}`,
    description: 'Test advisory',
    severity: 'HIGH',
    cvssScore: 7.5,
    cvssVector: null,
    cweIds: [],
    epssScore: null,
    epssPercentile: null,
    isKnownExploited: false,
    fixedVersion: '9.9.9',
    references: [],
    verdict: 'DEPENDENCY_ONLY',
    source: 'OSV.dev',
  };
}

function makeHttpClient(
  handler: (req: SafeHttpRequest) => SafeHttpResponse,
): IRateLimitedHttpClient {
  return {
    executeSafeRequest: vi.fn(async (req) => handler(req)),
  };
}

describe('Safe Probes Suite (8 Non-Destructive Probes)', () => {
  describe('RuntimeFingerprintProbe', () => {
    const probe = new RuntimeFingerprintProbe();

    it('does NOT falsely match "glob" against Next.js global-error or globals assets', async () => {
      const httpClient = makeHttpClient(() => ({
        statusCode: 200,
        headers: { 'content-type': 'text/html' },
        setCookies: [],
        bodySnippet: `
          <html>
            <head>
              <link rel="stylesheet" href="/_next/static/css/globals.css" />
              <script src="/_next/static/chunks/app/global-error-a1b2c3.js"></script>
              <script src="/assets/glob-helper.js"></script>
            </head>
            <body>Hello global world</body>
          </html>
        `,
        durationMs: 12,
      }));

      const results = await probe.run(
        makeContext({ advisories: [makeAdvisory('glob', '10.3.10')] }),
        httpClient,
      );

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('PASSED');
      expect(results[0].matchedPackage).toBeNull();
    });

    it('matches genuinely exposed versioned, node_modules, and banner libraries', async () => {
      const httpClient = makeHttpClient(() => ({
        statusCode: 200,
        headers: { 'content-type': 'text/html' },
        setCookies: [],
        bodySnippet: `
          <html>
            <head>
              <script src="/vendor/lodash@4.17.20.js"></script>
              <script src="https://cdn.example.com/js/jquery-3.5.1.min.js"></script>
              <script src="/node_modules/axios/dist/axios.min.js"></script>
              <!-- built with moment/2.29.1 -->
            </head>
          </html>
        `,
        durationMs: 15,
      }));

      const results = await probe.run(
        makeContext({
          advisories: [
            makeAdvisory('lodash', '4.17.20'),
            makeAdvisory('jquery', '3.5.1'),
            makeAdvisory('axios', '0.21.1'),
            makeAdvisory('moment', '2.29.1'),
            makeAdvisory('glob', '10.3.10'),
          ],
        }),
        httpClient,
      );

      expect(results.map((r) => r.matchedPackage).sort()).toEqual([
        'axios',
        'jquery',
        'lodash',
        'moment',
      ]);
      expect(results.every((r) => r.status === 'FINDING')).toBe(true);
    });
  });

  describe('SecurityHeadersProbe banner correlation', () => {
    const probe = new SecurityHeadersProbe();

    it('matches exact technology token "next" without substring false positives like "in" inside "nginx"', async () => {
      const deps: ParsedDependency[] = [
        {
          name: 'in',
          version: '1.0.0',
          ecosystem: 'npm',
          purl: 'pkg:npm/in@1.0.0',
          sourceFile: 'package.json',
          isDirect: false,
        },
        {
          name: 'next',
          version: '15.0.0',
          ecosystem: 'npm',
          purl: 'pkg:npm/next@15.0.0',
          sourceFile: 'package.json',
          isDirect: true,
        },
      ];

      const httpClient = makeHttpClient(() => ({
        statusCode: 200,
        headers: {
          'content-security-policy': "default-src 'self'",
          'x-content-type-options': 'nosniff',
          'x-frame-options': 'DENY',
          'referrer-policy': 'strict-origin-when-cross-origin',
          'x-powered-by': 'Next.js',
          server: 'nginx/1.18.0',
        },
        setCookies: [],
        bodySnippet: '',
        durationMs: 10,
      }));

      const results = await probe.run(
        makeContext({ dependencies: deps }),
        httpClient,
      );

      expect(
        results.find((r) => r.probeId.endsWith(':banner'))?.matchedPackage,
      ).toBe('next');
    });
  });

  describe('CookieSecurityProbe', () => {
    const probe = new CookieSecurityProbe();

    it('skips when no cookies are returned', async () => {
      const results = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: {},
          setCookies: [],
          bodySnippet: '',
          durationMs: 8,
        })),
      );
      expect(results[0].status).toBe('SKIPPED');
    });

    it('flags insecure cookies without leaking secret values', async () => {
      const results = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: {},
          setCookies: [
            'auth_session=super-secret-value; Path=/',
            'prefs=dark; Path=/; HttpOnly; SameSite=None',
          ],
          bodySnippet: '',
          durationMs: 8,
        })),
      );
      expect(results[0].status).toBe('FINDING');
      expect(results[0].severity).toBe('MEDIUM');
      expect(results[0].evidence).toContain('auth_session');
      expect(results[0].evidence).not.toContain('super-secret-value');
    });
  });

  describe('CorsMisconfigProbe', () => {
    const probe = new CorsMisconfigProbe();

    it('flags reflected untrusted Origin with credentials as HIGH', async () => {
      const results = await probe.run(
        makeContext(),
        makeHttpClient((req) => {
          expect(req.headers?.Origin).toBe('https://untrusted.brynja.test');
          return {
            statusCode: 200,
            headers: {
              'access-control-allow-origin': 'https://untrusted.brynja.test',
              'access-control-allow-credentials': 'true',
            },
            setCookies: [],
            bodySnippet: '',
            durationMs: 9,
          };
        }),
      );
      expect(results[0].status).toBe('FINDING');
      expect(results[0].severity).toBe('HIGH');
    });
  });

  describe('HstsTlsProbe', () => {
    const probe = new HstsTlsProbe();

    it('skips HTTP targets without network requests and validates HTTPS HSTS', async () => {
      const httpClient = makeHttpClient(() => ({
        statusCode: 200,
        headers: {
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
        },
        setCookies: [],
        bodySnippet: '',
        durationMs: 5,
      }));

      const httpRes = await probe.run(
        makeContext({ targetUrl: 'http://localhost:3000' }),
        httpClient,
      );
      expect(httpRes[0].status).toBe('SKIPPED');
      expect(httpClient.executeSafeRequest).not.toHaveBeenCalled();

      const httpsRes = await probe.run(makeContext(), httpClient);
      expect(httpsRes[0].status).toBe('PASSED');
    });
  });

  describe('ExposedDocsAndMetricsProbe', () => {
    const probe = new ExposedDocsAndMetricsProbe();

    it('flags exposed /openapi.json and /metrics and ignores SPA HTML catch-all 200', async () => {
      const exposedClient = makeHttpClient((req): SafeHttpResponse => {
        if (req.path === '/openapi.json') {
          return {
            statusCode: 200,
            headers: { 'content-type': 'application/json' },
            setCookies: [],
            bodySnippet: '{"openapi":"3.1.0","info":{"title":"API"}}',
            durationMs: 5,
          };
        }
        if (req.path === '/metrics') {
          return {
            statusCode: 200,
            headers: { 'content-type': 'text/plain; version=0.0.4' },
            setCookies: [],
            bodySnippet: '# HELP process_cpu_seconds_total CPU\n',
            durationMs: 5,
          };
        }
        return {
          statusCode: 404,
          headers: {},
          setCookies: [],
          bodySnippet: '',
          durationMs: 4,
        };
      });

      const res = await probe.run(makeContext(), exposedClient);
      expect(res.filter((r) => r.status === 'FINDING')).toHaveLength(2);

      const spaRes = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
          setCookies: [],
          bodySnippet: '<!doctype html><html><body>SPA</body></html>',
          durationMs: 4,
        })),
      );
      expect(spaRes).toHaveLength(1);
      expect(spaRes[0].status).toBe('PASSED');
    });
  });
});
