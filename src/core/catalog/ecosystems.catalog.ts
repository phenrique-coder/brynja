import { Ecosystem, SUPPORTED_ECOSYSTEMS } from '../models/scan.models';

/**
 * Canonical single source of truth describing all SCA dependency ecosystems,
 * manifests/lockfiles, native SAST capabilities, and cross-stack layers supported
 * by Brynja.
 *
 * Parity with server parsers (`createRegisteredDependencyParsers()` in
 * `src/server/application/container.ts`) and all three i18n dictionaries
 * (`pt-BR.ts`, `en.ts`, `es.ts`) is enforced by
 * `src/features/scans/__tests__/ecosystems-catalog.spec.tsx`.
 */
export type EcosystemSastSupport = 'native' | 'external-import';

export interface EcosystemCatalogMeta {
  readonly manifests: readonly string[];
  readonly sastSupport: EcosystemSastSupport;
  readonly reachabilitySupport: boolean;
  readonly sastLanguages: readonly string[];
}

export interface EcosystemCatalogItem extends EcosystemCatalogMeta {
  readonly id: Ecosystem;
}

export interface EcosystemCopy {
  readonly language: string;
  readonly description: string;
}

export const ECOSYSTEMS_CATALOG_MAP: Record<Ecosystem, EcosystemCatalogMeta> = {
  npm: {
    manifests: ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'],
    sastSupport: 'native',
    reachabilitySupport: true,
    sastLanguages: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
  },
  PyPI: {
    manifests: ['requirements.txt', 'pyproject.toml'],
    sastSupport: 'native',
    reachabilitySupport: true,
    sastLanguages: ['.py'],
  },
  Go: {
    manifests: ['go.mod', 'go.sum'],
    sastSupport: 'external-import',
    reachabilitySupport: false,
    sastLanguages: [],
  },
  'crates.io': {
    manifests: ['Cargo.toml', 'Cargo.lock'],
    sastSupport: 'external-import',
    reachabilitySupport: false,
    sastLanguages: [],
  },
  Maven: {
    manifests: ['pom.xml', 'gradle.lockfile'],
    sastSupport: 'external-import',
    reachabilitySupport: false,
    sastLanguages: [],
  },
  NuGet: {
    manifests: ['packages.lock.json', '*.csproj'],
    sastSupport: 'external-import',
    reachabilitySupport: false,
    sastLanguages: [],
  },
  Packagist: {
    manifests: ['composer.json', 'composer.lock'],
    sastSupport: 'external-import',
    reachabilitySupport: false,
    sastLanguages: [],
  },
  RubyGems: {
    manifests: ['Gemfile.lock'],
    sastSupport: 'external-import',
    reachabilitySupport: false,
    sastLanguages: [],
  },
};

export const ECOSYSTEMS_CATALOG: readonly EcosystemCatalogItem[] =
  SUPPORTED_ECOSYSTEMS.map((id) => ({
    id,
    ...ECOSYSTEMS_CATALOG_MAP[id],
  }));

export const CROSS_STACK_LAYER_IDS = [
  'iac-cicd',
  'secrets-posture',
  'safe-probes',
  'external-imports',
] as const;

export type CrossStackLayerId = (typeof CROSS_STACK_LAYER_IDS)[number];

export interface CrossStackLayerMeta {
  readonly id: CrossStackLayerId;
  readonly artifacts: readonly string[];
}

export interface CrossStackLayerCopy {
  readonly title: string;
  readonly summary: string;
}

export const CROSS_STACK_LAYERS: readonly CrossStackLayerMeta[] = [
  {
    id: 'iac-cicd',
    artifacts: [
      'Dockerfile',
      'docker-compose.yml',
      '*.tf',
      '.github/workflows/*.yml',
      'Kubernetes YAML',
    ],
  },
  {
    id: 'secrets-posture',
    artifacts: [
      '.env*',
      'SECURITY.md',
      '.github/dependabot.yml',
      'renovate.json',
      'CODEOWNERS',
    ],
  },
  {
    id: 'safe-probes',
    artifacts: ['HTTP GET / HEAD', 'HSTS / TLS', 'CSP / CORS', 'DNS SPF / DMARC / CAA'],
  },
  {
    id: 'external-imports',
    artifacts: ['SARIF 2.1.0', 'Trivy JSON', 'Semgrep JSON', 'Prowler JSON'],
  },
];
