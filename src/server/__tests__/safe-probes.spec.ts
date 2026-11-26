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
import { BackupConfigExposureProbe } from '../infrastructure/pentest/probes/backup-config-exposure.probe';
import { CacheSecurityProbe } from '../infrastructure/pentest/probes/cache-security.probe';
import { CookieSecurityProbe } from '../infrastructure/pentest/probes/cookie-security.probe';
import { CorsMisconfigProbe } from '../infrastructure/pentest/probes/cors-misconfig.probe';
import { CrossOriginIsolationProbe } from '../infrastructure/pentest/probes/cross-origin-isolation.probe';
import { CspPermissionsProbe } from '../infrastructure/pentest/probes/csp-permissions.probe';
import { DebugErrorLeakageProbe } from '../infrastructure/pentest/probes/debug-error-leakage.probe';
import { DnsEmailPostureProbe } from '../infrastructure/pentest/probes/dns-email-posture.probe';
import { ExposedDocsAndMetricsProbe } from '../infrastructure/pentest/probes/exposed-docs-metrics.probe';
import { HstsTlsProbe } from '../infrastructure/pentest/probes/hsts-tls.probe';
import { OauthGraphqlPostureProbe } from '../infrastructure/pentest/probes/oauth-graphql-posture.probe';
import { OpenRedirectProbe } from '../infrastructure/pentest/probes/open-redirect.probe';
import { RobotsSitemapExposureProbe } from '../infrastructure/pentest/probes/robots-sitemap-exposure.probe';
import { RuntimeFingerprintProbe } from '../infrastructure/pentest/probes/runtime-fingerprint.probe';
import { SecurityHeadersProbe } from '../infrastructure/pentest/probes/security-headers.probe';
import { SecurityTxtRfc9116Probe } from '../infrastructure/pentest/probes/security-txt-rfc9116.probe';
import { SriIntegrityProbe } from '../infrastructure/pentest/probes/sri-integrity.probe';
import { InMemoryProbeAuditCollector } from '../infrastructure/pentest/in-memory-audit-collector';
import { RateLimitedSafeHttpClient } from '../infrastructure/pentest/rate-limited-http-client.adapter';
import { SsrfDnsGuardService } from '../infrastructure/pentest/ssrf-dns-guard.service';

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

describe('Safe Probes Suite (19 Non-Destructive Probes)', () => {
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

  describe('CspPermissionsProbe', () => {
    const probe = new CspPermissionsProbe();

    it('flags unsafe-eval CSP, missing Permissions-Policy, and HTTPS mixed content', async () => {
      const results = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: {
            'content-type': 'text/html',
            'content-security-policy':
              "default-src 'self'; script-src 'self' 'unsafe-eval' *; frame-ancestors *",
          },
          setCookies: [],
          bodySnippet:
            '<html><head><script src="http://cdn.legacy.example/app.js?token=secret"></script></head></html>',
          durationMs: 7,
        })),
      );

      expect(results.filter((r) => r.status === 'FINDING')).toHaveLength(3);
      const cspFinding = results.find((r) =>
        r.probeId.endsWith(':csp-directives'),
      );
      expect(cspFinding?.severity).toBe('MEDIUM');
      const mixedFinding = results.find((r) =>
        r.probeId.endsWith(':mixed-content'),
      );
      expect(mixedFinding?.severity).toBe('MEDIUM');
      expect(mixedFinding?.evidence).toContain('http://cdn.legacy.example/app.js');
      expect(mixedFinding?.evidence).not.toContain('token=secret');
    });

    it('passes nonce-based CSP (ignoring unsafe-inline fallback) with Permissions-Policy and HTTPS assets', async () => {
      const results = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: {
            'content-type': 'text/html',
            'content-security-policy':
              "default-src 'self'; script-src 'self' 'nonce-abc123' 'unsafe-inline'; frame-ancestors 'none'",
            'permissions-policy': 'camera=(), microphone=(), geolocation=()',
          },
          setCookies: [],
          bodySnippet:
            '<html><head><script src="https://app.example.com/main.js"></script></head></html>',
          durationMs: 6,
        })),
      );

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('PASSED');
    });
  });

  describe('CacheSecurityProbe', () => {
    const probe = new CacheSecurityProbe();

    it('flags Set-Cookie on publicly cacheable responses (HIGH) and dynamic CORS without Vary: Origin (MEDIUM)', async () => {
      const results = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: {
            'cache-control': 'public, max-age=3600',
            'access-control-allow-origin': 'https://partner.example.com',
          },
          setCookies: ['session_id=top-secret-cookie; Path=/; HttpOnly; Secure'],
          bodySnippet: '',
          durationMs: 6,
        })),
      );

      const cookieCache = results.find((r) =>
        r.probeId.endsWith(':cookie-public-cache'),
      );
      const corsVary = results.find((r) =>
        r.probeId.endsWith(':cors-vary-origin'),
      );
      expect(cookieCache?.severity).toBe('HIGH');
      expect(cookieCache?.evidence).not.toContain('top-secret-cookie');
      expect(corsVary?.severity).toBe('MEDIUM');
    });

    it('passes when Set-Cookie uses private, no-store and dynamic CORS includes Vary: Origin', async () => {
      const results = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: {
            'cache-control': 'private, no-store',
            'access-control-allow-origin': 'https://partner.example.com',
            vary: 'Accept-Encoding, Origin',
          },
          setCookies: ['session_id=secret; Path=/; HttpOnly; Secure'],
          bodySnippet: '',
          durationMs: 5,
        })),
      );

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('PASSED');
    });
  });

  describe('OpenRedirectProbe', () => {
    const probe = new OpenRedirectProbe();

    it('flags 302 Location redirecting to synthetic untrusted.brynja.test as HIGH', async () => {
      const results = await probe.run(
        makeContext(),
        makeHttpClient((req): SafeHttpResponse => {
          if (req.path.startsWith('/login?next=')) {
            return {
              statusCode: 302,
              headers: { location: 'https://untrusted.brynja.test/' },
              setCookies: [],
              bodySnippet: '',
              durationMs: 6,
            };
          }
          return {
            statusCode: 200,
            headers: {},
            setCookies: [],
            bodySnippet: '',
            durationMs: 5,
          };
        }),
      );

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('FINDING');
      expect(results[0].severity).toBe('HIGH');
    });

    it('passes when redirects remain same-origin or return 200/404', async () => {
      const results = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 302,
          headers: { location: '/dashboard' },
          setCookies: [],
          bodySnippet: '',
          durationMs: 4,
        })),
      );

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('PASSED');
    });
  });

  describe('BackupConfigExposureProbe', () => {
    const probe = new BackupConfigExposureProbe();

    it('flags exposed /.env.production and /backup.sql without leaking raw secrets and ignores SPA HTML catch-all', async () => {
      const exposedRes = await probe.run(
        makeContext(),
        makeHttpClient((req): SafeHttpResponse => {
          if (req.path === '/.env.production') {
            return {
              statusCode: 200,
              headers: { 'content-type': 'text/plain' },
              setCookies: [],
              bodySnippet: 'DATABASE_URL=postgres://user:supersecret@db:5432/app\n',
              durationMs: 5,
            };
          }
          if (req.path === '/backup.sql') {
            return {
              statusCode: 200,
              headers: { 'content-type': 'application/sql' },
              setCookies: [],
              bodySnippet: '-- PostgreSQL database dump\nCREATE TABLE users (id int);\n',
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
        }),
      );

      expect(exposedRes.filter((r) => r.status === 'FINDING')).toHaveLength(2);
      expect(exposedRes.every((r) => r.severity === 'CRITICAL')).toBe(true);
      expect(
        exposedRes.every((r) => !r.evidence.includes('supersecret')),
      ).toBe(true);

      const spaRes = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
          setCookies: [],
          bodySnippet: '<!doctype html><html><body>App</body></html>',
          durationMs: 4,
        })),
      );
      expect(spaRes).toHaveLength(1);
      expect(spaRes[0].status).toBe('PASSED');
    });
  });

  describe('DebugErrorLeakageProbe', () => {
    const probe = new DebugErrorLeakageProbe();

    it('detects directory listing on root and Django DEBUG=True on synthetic 404 route', async () => {
      const results = await probe.run(
        makeContext(),
        makeHttpClient((req) => {
          if (req.path === '/') {
            return {
              statusCode: 200,
              headers: { 'content-type': 'text/html' },
              setCookies: [],
              bodySnippet: '<html><head><title>Index of /</title></head><body><h1>Index of /</h1></body></html>',
              durationMs: 5,
            };
          }
          return {
            statusCode: 404,
            headers: { 'content-type': 'text/html' },
            setCookies: [],
            bodySnippet:
              "<h1>Page not found</h1><p>You're seeing this error because you have <code>DEBUG = True</code> in your Django settings file.</p>",
            durationMs: 6,
          };
        }),
      );

      expect(results.filter((r) => r.status === 'FINDING')).toHaveLength(2);
      expect(
        results.find((r) => r.probeId.endsWith(':dir-listing'))?.severity,
      ).toBe('MEDIUM');
      expect(
        results.find((r) => r.probeId.endsWith(':stack-trace'))?.severity,
      ).toBe('HIGH');
    });

    it('passes on normal homepage and generic 404 page', async () => {
      const results = await probe.run(
        makeContext(),
        makeHttpClient((req) => ({
          statusCode: req.path === '/' ? 200 : 404,
          headers: { 'content-type': 'text/html' },
          setCookies: [],
          bodySnippet:
            req.path === '/'
              ? '<html><body>Welcome</body></html>'
              : '<html><body>404 - Page Not Found</body></html>',
          durationMs: 5,
        })),
      );

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('PASSED');
    });
  });

  describe('SriIntegrityProbe', () => {
    const probe = new SriIntegrityProbe();

    it('flags static third-party CDN scripts without SRI while ignoring dynamic SaaS scripts', async () => {
      const results = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: { 'content-type': 'text/html' },
          setCookies: [],
          bodySnippet: `
            <html>
              <head>
                <script src="https://www.googletagmanager.com/gtag/js?id=G-123"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"></script>
              </head>
            </html>
          `,
          durationMs: 5,
        })),
      );

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('FINDING');
      expect(results[0].severity).toBe('MEDIUM');
      expect(results[0].evidence).toContain('cdnjs.cloudflare.com');
      expect(results[0].evidence).not.toContain('googletagmanager.com');
    });

    it('passes when all static CDN assets include valid SRI hashes and skips when none are used', async () => {
      const validHash = `sha384-${'A'.repeat(64)}`;
      const passRes = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: { 'content-type': 'text/html' },
          setCookies: [],
          bodySnippet: `<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.0/dist/cdn.min.js" integrity="${validHash}" crossorigin="anonymous"></script>`,
          durationMs: 5,
        })),
      );
      expect(passRes[0].status).toBe('PASSED');

      const skipRes = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: { 'content-type': 'text/html' },
          setCookies: [],
          bodySnippet: '<script src="/_next/static/chunks/main.js"></script>',
          durationMs: 5,
        })),
      );
      expect(skipRes[0].status).toBe('SKIPPED');
    });
  });

  describe('CrossOriginIsolationProbe, DnsEmailPostureProbe, RobotsSitemapExposureProbe, OauthGraphqlPostureProbe & SecurityTxtRfc9116Probe', () => {
    it('flags missing COOP/CORP headers and passes when set', async () => {
      const probe = new CrossOriginIsolationProbe();
      const missingRes = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: {},
          setCookies: [],
          bodySnippet: '',
          durationMs: 4,
        })),
      );
      expect(missingRes[0].status).toBe('FINDING');

      const okRes = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: {
            'cross-origin-opener-policy': 'same-origin',
            'cross-origin-resource-policy': 'same-site',
          },
          setCookies: [],
          bodySnippet: '',
          durationMs: 4,
        })),
      );
      expect(okRes[0].status).toBe('PASSED');
    });

    it('audits SPF/DMARC/CAA via DnsEmailPostureProbe and skips loopback targets', async () => {
      const probe = new DnsEmailPostureProbe({
        resolveTxt: vi.fn(async (domain) =>
          domain.startsWith('_dmarc.')
            ? [['v=DMARC1; p=reject']]
            : [['v=spf1 -all']],
        ),
        resolveCaa: vi.fn(async () => [{ issue: 'letsencrypt.org' }]),
      });

      const skipRes = await probe.run(
        makeContext({ targetUrl: 'http://127.0.0.1:3000' }),
        makeHttpClient(() => ({
          statusCode: 404,
          headers: {},
          setCookies: [],
          bodySnippet: '',
          durationMs: 1,
        })),
      );
      expect(skipRes[0].status).toBe('SKIPPED');

      const passRes = await probe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 404,
          headers: {},
          setCookies: [],
          bodySnippet: '',
          durationMs: 5,
        })),
      );
      expect(passRes[0].status).toBe('PASSED');

      const weakProbe = new DnsEmailPostureProbe({
        resolveTxt: vi.fn(async () => []),
        resolveCaa: vi.fn(async () => []),
      });
      const weakRes = await weakProbe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 404,
          headers: {},
          setCookies: [],
          bodySnippet: '',
          durationMs: 5,
        })),
      );
      expect(weakRes[0].status).toBe('FINDING');
      expect(weakRes[0].severity).toBe('MEDIUM');
    });

    it('detects sensitive routes in robots.txt/sitemap.xml, weak OIDC/GraphQL introspection, and expired security.txt', async () => {
      const robotsProbe = new RobotsSitemapExposureProbe();
      const robotsRes = await robotsProbe.run(
        makeContext(),
        makeHttpClient((req) =>
          req.path === '/robots.txt'
            ? {
                statusCode: 200,
                headers: { 'content-type': 'text/plain' },
                setCookies: [],
                bodySnippet: 'User-agent: *\nDisallow: /admin/console\n',
                durationMs: 3,
              }
            : {
                statusCode: 404,
                headers: {} as Record<string, string>,
                setCookies: [],
                bodySnippet: '',
                durationMs: 3,
              },
        ),
      );
      expect(robotsRes[0].status).toBe('FINDING');

      const oauthProbe = new OauthGraphqlPostureProbe();
      const oauthRes = await oauthProbe.run(
        makeContext(),
        makeHttpClient((req) => {
          if (req.path.includes('openid-configuration')) {
            return {
              statusCode: 200,
              headers: { 'content-type': 'application/json' },
              setCookies: [],
              bodySnippet: JSON.stringify({
                issuer: 'http://app.example.com',
                id_token_signing_alg_values_supported: ['none'],
              }),
              durationMs: 4,
            };
          }
          return {
            statusCode: 200,
            headers: { 'content-type': 'application/json' },
            setCookies: [],
            bodySnippet: '{"data":{"__schema":{"types":[{"name":"Query"}]}}}',
            durationMs: 4,
          };
        }),
      );
      expect(oauthRes).toHaveLength(2);
      expect(oauthRes.every((r) => r.status === 'FINDING')).toBe(true);

      const secTxtProbe = new SecurityTxtRfc9116Probe();
      const expiredRes = await secTxtProbe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: { 'content-type': 'text/plain' },
          setCookies: [],
          bodySnippet:
            'Contact: mailto:sec@example.com\nExpires: 2020-01-01T00:00:00Z\n',
          durationMs: 3,
        })),
      );
      expect(expiredRes[0].status).toBe('FINDING');

      const validRes = await secTxtProbe.run(
        makeContext(),
        makeHttpClient(() => ({
          statusCode: 200,
          headers: { 'content-type': 'text/plain' },
          setCookies: [],
          bodySnippet:
            'Contact: mailto:sec@example.com\nExpires: 2099-12-31T23:59:59Z\n',
          durationMs: 3,
        })),
      );
      expect(validRes[0].status).toBe('PASSED');
    });

    it('memoizes repeated default GET / requests within a single scan in RateLimitedSafeHttpClient', async () => {
      const audit = new InMemoryProbeAuditCollector();
      const client = new RateLimitedSafeHttpClient(
        new SsrfDnsGuardService(true),
        audit,
        { maxRps: 100, maxRequestsPerScan: 10, timeoutMs: 2000 },
      );

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('<html><body>Hello</body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      );

      try {
        await client.executeSafeRequest({
          scanId: 'scan-memo',
          authorizationId: 'auth-1',
          probeId: 'p1',
          targetOrigin: 'http://127.0.0.1:3000',
          path: '/',
          method: 'GET',
          maxBodyBytes: 1024,
        });
        await client.executeSafeRequest({
          scanId: 'scan-memo',
          authorizationId: 'auth-1',
          probeId: 'p2',
          targetOrigin: 'http://127.0.0.1:3000',
          path: '/',
          method: 'GET',
          maxBodyBytes: 4096,
        });

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(audit.getEntries()).toHaveLength(2);
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });
});
