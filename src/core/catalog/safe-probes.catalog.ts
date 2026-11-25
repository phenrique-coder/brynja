import type { SeverityLevel } from '../models/scan.models';

/**
 * Canonical ordered list of all non-destructive Safe Probes executed by Brynja.
 *
 * IMPORTANT: Whenever a new Safe Probe is added to
 * `src/server/infrastructure/pentest/probes/` and registered in
 * `createRegisteredSafeProbes()` (`src/server/application/container.ts`):
 *  1. Add its probe ID here (`SAFE_PROBE_IDS`) and metadata in `SAFE_PROBES_CATALOG_MAP`.
 *  2. Add its translated explanation (`name`, `summary`, `checks`) to:
 *     - `src/core/i18n/dictionaries/pt-BR.ts`
 *     - `src/core/i18n/dictionaries/en.ts`
 *     - `src/core/i18n/dictionaries/es.ts`
 *  3. Run `pnpm typecheck && pnpm test` — `safe-probes-catalog.spec.tsx` enforces
 *     1-to-1 parity between the server registry and the `/scans/new` UI catalog.
 */
export const SAFE_PROBE_IDS = [
  'safe-probe:security-headers',
  'safe-probe:hsts-tls',
  'safe-probe:csp-permissions',
  'safe-probe:cookie-security',
  'safe-probe:cors-policy',
  'safe-probe:cache-security',
  'safe-probe:open-redirect',
  'safe-probe:exposed-artifacts',
  'safe-probe:exposed-docs-metrics',
  'safe-probe:backup-config-exposure',
  'safe-probe:runtime-fingerprint',
  'safe-probe:source-maps',
  'safe-probe:debug-error-leakage',
  'safe-probe:sri-integrity',
] as const;

export type SafeProbeId = (typeof SAFE_PROBE_IDS)[number];

export type SafeProbeCategory =
  | 'headers-tls'
  | 'cookies-cors'
  | 'exposure'
  | 'runtime';

export type SafeProbeHttpMethod = 'GET' | 'HEAD';

export interface SafeProbeCatalogMeta {
  readonly category: SafeProbeCategory;
  readonly methods: readonly SafeProbeHttpMethod[];
  readonly targets: readonly string[];
  readonly maxSeverity: SeverityLevel;
}

export interface SafeProbeCatalogItem extends SafeProbeCatalogMeta {
  readonly id: SafeProbeId;
}

export interface SafeProbeCopy {
  readonly name: string;
  readonly summary: string;
  readonly checks: string;
}

export const SAFE_PROBES_CATALOG_MAP: Record<SafeProbeId, SafeProbeCatalogMeta> = {
  'safe-probe:security-headers': {
    category: 'headers-tls',
    methods: ['GET'],
    targets: ['/', 'CSP', 'X-Frame-Options', 'X-Content-Type-Options', 'X-Powered-By'],
    maxSeverity: 'MEDIUM',
  },
  'safe-probe:hsts-tls': {
    category: 'headers-tls',
    methods: ['HEAD'],
    targets: ['/', 'Strict-Transport-Security'],
    maxSeverity: 'MEDIUM',
  },
  'safe-probe:csp-permissions': {
    category: 'headers-tls',
    methods: ['GET'],
    targets: ['/', 'CSP directives', 'Permissions-Policy', 'Mixed Content'],
    maxSeverity: 'MEDIUM',
  },
  'safe-probe:cookie-security': {
    category: 'cookies-cors',
    methods: ['GET'],
    targets: ['/', 'Set-Cookie', 'HttpOnly', 'Secure', 'SameSite'],
    maxSeverity: 'MEDIUM',
  },
  'safe-probe:cors-policy': {
    category: 'cookies-cors',
    methods: ['GET'],
    targets: ['/', 'Origin', 'ACAO', 'ACAC'],
    maxSeverity: 'HIGH',
  },
  'safe-probe:cache-security': {
    category: 'cookies-cors',
    methods: ['GET'],
    targets: ['/', 'Cache-Control', 'Set-Cookie', 'Vary: Origin'],
    maxSeverity: 'HIGH',
  },
  'safe-probe:open-redirect': {
    category: 'cookies-cors',
    methods: ['GET'],
    targets: ['/?next=', '/?redirect=', '/login?next=', 'Location (3xx)'],
    maxSeverity: 'HIGH',
  },
  'safe-probe:exposed-artifacts': {
    category: 'exposure',
    methods: ['HEAD', 'GET'],
    targets: ['/.git/HEAD', '/.env', '/package.json'],
    maxSeverity: 'CRITICAL',
  },
  'safe-probe:exposed-docs-metrics': {
    category: 'exposure',
    methods: ['HEAD', 'GET'],
    targets: [
      '/openapi.json',
      '/swagger',
      '/api/docs',
      '/metrics',
      '/actuator/health',
      '/graphql',
      '/.well-known/security.txt',
    ],
    maxSeverity: 'MEDIUM',
  },
  'safe-probe:backup-config-exposure': {
    category: 'exposure',
    methods: ['HEAD', 'GET'],
    targets: [
      '/.env.local',
      '/.env.production',
      '/docker-compose.yml',
      '/backup.sql',
      '/phpinfo.php',
    ],
    maxSeverity: 'CRITICAL',
  },
  'safe-probe:runtime-fingerprint': {
    category: 'runtime',
    methods: ['GET'],
    targets: ['/', '<script src>', 'SBOM CVEs'],
    maxSeverity: 'HIGH',
  },
  'safe-probe:source-maps': {
    category: 'runtime',
    methods: ['GET', 'HEAD'],
    targets: ['/', '*.js.map'],
    maxSeverity: 'LOW',
  },
  'safe-probe:debug-error-leakage': {
    category: 'runtime',
    methods: ['GET'],
    targets: ['/', '/__brynja_probe_nonexistent_404__', 'Stack Traces', 'Autoindex'],
    maxSeverity: 'HIGH',
  },
  'safe-probe:sri-integrity': {
    category: 'runtime',
    methods: ['GET'],
    targets: ['/', 'CDN <script>', 'CDN <link>', 'integrity='],
    maxSeverity: 'MEDIUM',
  },
};

export const SAFE_PROBES_CATALOG: readonly SafeProbeCatalogItem[] =
  SAFE_PROBE_IDS.map((id) => ({
    id,
    ...SAFE_PROBES_CATALOG_MAP[id],
  }));
