import {
  Ecosystem,
  ProbeFinding,
  ScanDependency,
  ScanReport,
  SeverityLevel,
  VulnerabilityFinding,
} from '@/core/models/scan.models';
import {
  computeOverallRisk,
  filterAndSortFindings,
  OverallRiskSummary,
} from './scan.presenter';
import { SEVERITY_REGISTRY } from '../registries/finding-registries';

export type RemediationPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type RemediationKind = 'dependency' | 'runtime_config';

export interface RemediationItem {
  id: string;
  priority: RemediationPriority;
  slaWindow: string;
  kind: RemediationKind;
  severity: SeverityLevel;
  title: string;
  where: string;
  /** Concise single-line problem description for AI coding models */
  problemSummary: string;
  /** Management-friendly explanation of what the problem is */
  executiveProblem: string;
  /** Management-friendly explanation of business/security impact */
  executiveImpact: string;
  /** Direct imperative fix instruction for AI coding models */
  solutionAction: string;
  /** Structured management-friendly explanation of the recommended solution */
  executiveSolution: string;
  /** Concise English verification check for AI coding models */
  verificationStep: string;
  /** Management-friendly Portuguese validation criterion for the Executive PDF */
  executiveValidation: string;
  packageName?: string;
  ecosystem?: Ecosystem;
  currentVersion?: string;
  targetVersion?: string | null;
  isDirect?: boolean;
  cves?: string[];
  isKnownExploited?: boolean;
  isConfirmedRuntime?: boolean;
  command?: string | null;
  probeId?: string;
  evidence?: string;
}

export interface RemediationPlanCounts {
  total: number;
  p0: number;
  p1: number;
  p2: number;
  p3: number;
  dependency: number;
  runtimeConfig: number;
  kev: number;
  confirmedRuntime: number;
}

export interface RemediationPlan {
  overallRisk: OverallRiskSummary;
  executiveHeadline: string;
  executiveBrief: string;
  counts: RemediationPlanCounts;
  items: RemediationItem[];
}

const PRIORITY_WEIGHT: Record<RemediationPriority, number> = {
  P0: 4,
  P1: 3,
  P2: 2,
  P3: 1,
};

const PRIORITY_SLA: Record<RemediationPriority, string> = {
  P0: 'Imediato (24-48h)',
  P1: 'Curto prazo (7 dias)',
  P2: 'Planejado (30 dias)',
  P3: 'Manutenção (90 dias)',
};

interface ProbeRemediationMeta {
  businessImpact: string;
  verifyAi: string;
  verifyExecutive: string;
}

// OCP registry keyed by canonical Safe Probe base ID
const PROBE_REMEDIATION_REGISTRY: Record<string, ProbeRemediationMeta> = {
  'safe-probe:exposed-artifacts': {
    businessImpact:
      'Arquivos internos (.git, .env ou manifestos) acessíveis na internet podem expor código-fonte, credenciais de API e segredos operacionais, elevando drasticamente o risco de invasão e vazamento de dados.',
    verifyAi:
      'Request the exposed path via GET/HEAD and confirm HTTP 403 or 404 (never HTTP 200).',
    verifyExecutive:
      'Confirmar via requisição GET/HEAD que o caminho bloqueado retorna HTTP 403 ou 404 e não expõe conteúdo interno.',
  },
  'safe-probe:cors-policy': {
    businessImpact:
      'Política CORS permissiva permite que sites maliciosos de terceiros façam requisições autenticadas em nome de usuários legítimos e acessem dados sensíveis pelo navegador.',
    verifyAi:
      'Send GET with an untrusted Origin header and confirm Access-Control-Allow-Origin does not reflect it with Access-Control-Allow-Credentials: true.',
    verifyExecutive:
      'Validar que origens externas não autorizadas deixam de ser aceitas nos cabeçalhos Access-Control-Allow-Origin.',
  },
  'safe-probe:hsts-tls': {
    businessImpact:
      'Sem HSTS adequado em HTTPS, usuários podem sofrer ataques de downgrade para HTTP e interceptação de tráfego (Man-in-the-Middle) em redes não confiáveis.',
    verifyAi:
      'Run HEAD on the target URL and confirm Strict-Transport-Security includes max-age>=31536000.',
    verifyExecutive:
      'Validar via HEAD na URL principal a presença de Strict-Transport-Security com max-age igual ou superior a 1 ano (31536000).',
  },
  'safe-probe:security-headers': {
    businessImpact:
      'A ausência de cabeçalhos defensivos (CSP, X-Frame-Options, X-Content-Type-Options) ou exposição de banners amplia a superfície para clickjacking, XSS e reconhecimento automatizado.',
    verifyAi:
      'Inspect GET response headers on the target URL and confirm CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy are present without server version leakage.',
    verifyExecutive:
      'Confirmar na resposta HTTP a presença dos cabeçalhos defensivos obrigatórios e a remoção de banners de versão.',
  },
  'safe-probe:cookie-security': {
    businessImpact:
      'Cookies de sessão sem HttpOnly, Secure ou SameSite facilitam sequestro de sessão por scripts maliciosos (XSS), tráfego inseguro ou ataques CSRF.',
    verifyAi:
      'Inspect Set-Cookie headers and confirm HttpOnly, Secure, and SameSite=Lax or Strict flags are set.',
    verifyExecutive:
      'Inspecionar os cabeçalhos Set-Cookie em produção/staging e confirmar os atributos HttpOnly, Secure e SameSite.',
  },
  'safe-probe:exposed-docs-metrics': {
    businessImpact:
      'Documentação interna (Swagger/OpenAPI) ou métricas operacionais (/metrics, /actuator) expostas publicamente aceleram o mapeamento da arquitetura e endpoints críticos por atacantes.',
    verifyAi:
      'Confirm exposed internal docs/metrics routes return HTTP 401, 403, or 404 publicly or require authentication.',
    verifyExecutive:
      'Confirmar que rotas internas de documentação/telemetria passaram a exigir autenticação ou retornar HTTP 403/404 externamente.',
  },
  'safe-probe:source-maps': {
    businessImpact:
      'Source maps (.js.map) públicos expõem o código-fonte original do frontend, facilitando engenharia reversa de regras de negócio e identificação de falhas.',
    verifyAi:
      'Disable public source map serving in production builds and confirm .js.map URLs return HTTP 404.',
    verifyExecutive:
      'Validar novo deploy confirmando que arquivos .js.map deixaram de responder HTTP 200 publicamente.',
  },
  'safe-probe:runtime-fingerprint': {
    businessImpact:
      'Biblioteca com vulnerabilidade conhecida foi confirmada diretamente nos scripts servidos ao navegador, elevando a chance real de exploração externa.',
    verifyAi:
      'Upgrade the vulnerable library, rebuild frontend assets, and verify the old version is no longer served.',
    verifyExecutive:
      'Após atualizar a biblioteca e republicar o frontend, executar nova varredura confirmando ausência da versão vulnerável em runtime.',
  },
  'safe-probe:csp-permissions': {
    businessImpact:
      'Diretivas CSP permissivas (unsafe-eval/wildcards), ausência de Permissions-Policy ou recursos ativos em HTTP puro (Mixed Content) reduzem a defesa em profundidade contra XSS e interceptação no navegador.',
    verifyAi:
      'Inspect GET / headers and HTML to confirm CSP has no unsafe-eval/wildcards, Permissions-Policy is set, and HTTPS pages load no active http:// resources.',
    verifyExecutive:
      'Validar em nova varredura que a CSP está endurecida sem diretivas permissivas, o cabeçalho Permissions-Policy está ativo e não há recursos carregados em HTTP puro.',
  },
  'safe-probe:cache-security': {
    businessImpact:
      'Respostas com Set-Cookie armazenadas em cache compartilhado (CDN/proxy) podem entregar a sessão de um usuário a outro; CORS dinâmico sem Vary: Origin pode envenenar caches intermediários.',
    verifyAi:
      'Inspect GET / headers to confirm Set-Cookie responses set Cache-Control: private, no-store and dynamic Access-Control-Allow-Origin responses include Vary: Origin.',
    verifyExecutive:
      'Confirmar que respostas com cookies de sessão usam Cache-Control: private, no-store e respostas CORS dinâmicas retornam Vary: Origin.',
  },
  'safe-probe:open-redirect': {
    businessImpact:
      'Redirecionamentos abertos (CWE-601) permitem que invasores usem o domínio confiável da empresa em campanhas de phishing e roubo de tokens OAuth/sessão.',
    verifyAi:
      'Send GET /?next=https://untrusted.brynja.test and /login?next=https://untrusted.brynja.test with redirect: manual and confirm no 3xx Location points to the external domain.',
    verifyExecutive:
      'Confirmar que parâmetros de redirecionamento aceitam apenas rotas internas ou domínios confiáveis e não redirecionam para domínios externos arbitrários.',
  },
  'safe-probe:backup-config-exposure': {
    businessImpact:
      'Arquivos .env adicionais, dumps SQL, docker-compose.yml ou phpinfo.php acessíveis publicamente podem expor credenciais de banco de dados, chaves de API e toda a base de clientes.',
    verifyAi:
      'Request the exposed backup/config path via HEAD/GET and confirm HTTP 403 or 404 (never HTTP 200), then rotate any exposed credentials.',
    verifyExecutive:
      'Confirmar bloqueio (HTTP 403/404) do arquivo exposto, remoção definitiva da raiz pública e rotação preventiva de segredos.',
  },
  'safe-probe:debug-error-leakage': {
    businessImpact:
      'Modo debug ativo, stack traces detalhados ou listagem de diretórios revelam caminhos internos do servidor, versões e trechos de código que aceleram ataques direcionados.',
    verifyAi:
      'Request / and a non-existent route and confirm generic error handling without stack traces, framework debuggers, or directory listing.',
    verifyExecutive:
      'Validar que o modo debug está desabilitado em produção, o autoindex foi desativado e páginas de erro retornam mensagens genéricas.',
  },
  'safe-probe:sri-integrity': {
    businessImpact:
      'Scripts e folhas de estilo carregados de CDNs públicas sem Subresource Integrity (SRI) podem executar código malicioso nos clientes caso a CDN ou o pacote externo seja comprometido.',
    verifyAi:
      'Inspect third-party CDN <script> and <link rel="stylesheet"> tags in root HTML and confirm valid integrity="sha384-..." and crossorigin="anonymous" attributes.',
    verifyExecutive:
      'Confirmar que bibliotecas carregadas de CDNs públicas possuem hashes integrity (SRI) válidos ou foram migradas para hospedagem na mesma origem.',
  },
};

const DEFAULT_PROBE_META: ProbeRemediationMeta = {
  businessImpact:
    'Configuração de segurança exposta no ambiente avaliado amplia a superfície de ataque da aplicação e requer endurecimento preventivo.',
  verifyAi:
    'Re-run the corresponding read-only HTTP check and confirm the finding is resolved.',
  verifyExecutive:
    'Reexecutar a verificação segura após o ajuste para confirmar o encerramento do achado.',
};

function resolveProbeMeta(probeId: string): ProbeRemediationMeta {
  if (PROBE_REMEDIATION_REGISTRY[probeId]) {
    return PROBE_REMEDIATION_REGISTRY[probeId];
  }
  const baseKey = Object.keys(PROBE_REMEDIATION_REGISTRY).find((key) =>
    probeId.startsWith(`${key}:`),
  );
  return baseKey ? PROBE_REMEDIATION_REGISTRY[baseKey] : DEFAULT_PROBE_META;
}

/**
 * Numeric-aware loose version comparison (handles SemVer, PEP 440, and optional leading "v").
 * Returns > 0 if a > b, < 0 if a < b, 0 if equal.
 */
export function compareSemverLoose(a: string, b: string): number {
  const cleanA = a.trim().replace(/^v/i, '');
  const cleanB = b.trim().replace(/^v/i, '');
  if (cleanA === cleanB) return 0;

  const [mainA, preA = ''] = cleanA.split('-', 2);
  const [mainB, preB = ''] = cleanB.split('-', 2);

  const partsA = mainA.split('.').map((seg) => Number.parseInt(seg, 10));
  const partsB = mainB.split('.').map((seg) => Number.parseInt(seg, 10));
  const len = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < len; i += 1) {
    const numA = Number.isFinite(partsA[i]) ? partsA[i] : 0;
    const numB = Number.isFinite(partsB[i]) ? partsB[i] : 0;
    if (numA !== numB) return numA - numB;
  }

  // Stable release > prerelease for identical numeric core
  if (!preA && preB) return 1;
  if (preA && !preB) return -1;
  return preA.localeCompare(preB);
}

export function pickHighestVersion(
  versions: Array<string | null | undefined>,
): string | null {
  const valid = versions
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v));
  if (valid.length === 0) return null;

  return valid.reduce((best, current) =>
    compareSemverLoose(current, best) > 0 ? current : best,
  );
}

function normalizeSentence(value: string, maxLen = 220): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 3).trimEnd()}...`;
}

function computeDependencyPriority(
  severity: SeverityLevel,
  isKev: boolean,
  isConfirmedRuntime: boolean,
): RemediationPriority {
  if (isKev || severity === 'CRITICAL') return 'P0';
  if (isConfirmedRuntime && severity === 'HIGH') return 'P0';
  if (severity === 'HIGH' || isConfirmedRuntime) return 'P1';
  if (severity === 'MEDIUM') return 'P2';
  return 'P3';
}

function computeProbePriority(severity: SeverityLevel): RemediationPriority {
  if (severity === 'CRITICAL') return 'P0';
  if (severity === 'HIGH') return 'P1';
  if (severity === 'MEDIUM') return 'P2';
  return 'P3';
}

function inferDependencyCommand(
  ecosystem: Ecosystem,
  packageName: string,
  targetVersion: string | null,
  sourceFile: string,
  isDirect: boolean,
  repoUsesPnpm: boolean,
): string | null {
  if (!targetVersion) return null;

  if (ecosystem === 'npm') {
    const lowerSource = sourceFile.toLowerCase();
    if (lowerSource.endsWith('yarn.lock')) {
      return `yarn upgrade ${packageName}@^${targetVersion}`;
    }
    const isPnpm =
      repoUsesPnpm || lowerSource.endsWith('pnpm-lock.yaml');
    if (isDirect) {
      return isPnpm
        ? `pnpm up ${packageName}@^${targetVersion}`
        : `npm install ${packageName}@^${targetVersion}`;
    }
    return isPnpm
      ? `pnpm up ${packageName} # or pin "${packageName}": ">=${targetVersion}" in package.json pnpm.overrides && pnpm install`
      : `npm audit fix # or pin "${packageName}": ">=${targetVersion}" in package.json overrides && npm install`;
  }

  switch (ecosystem) {
    case 'PyPI':
      return `pip install --upgrade "${packageName}>=${targetVersion}"`;
    case 'Go':
      return `go get ${packageName}@${targetVersion.startsWith('v') ? targetVersion : `v${targetVersion}`} && go mod tidy`;
    case 'crates.io':
      return `cargo update -p ${packageName} --precise ${targetVersion}`;
    case 'Maven':
      return `# Update ${packageName} to >= ${targetVersion} in ${sourceFile}`;
    case 'NuGet':
      return `dotnet add package ${packageName} --version ${targetVersion}`;
    case 'Packagist':
      return `composer require ${packageName}:^${targetVersion}`;
    case 'RubyGems':
      return `bundle update ${packageName}`;
  }
}

const DEFAULT_MANIFEST_BY_ECOSYSTEM: Record<Ecosystem, string> = {
  npm: 'package.json',
  PyPI: 'requirements.txt',
  Go: 'go.mod',
  'crates.io': 'Cargo.toml',
  Maven: 'pom.xml',
  NuGet: 'packages.lock.json',
  Packagist: 'composer.json',
  RubyGems: 'Gemfile.lock',
};

interface PackageGroup {
  key: string;
  packageName: string;
  packageVersion: string;
  ecosystem: Ecosystem;
  sourceFile: string;
  isDirect: boolean;
  findings: VulnerabilityFinding[];
  runtimeEvidence: string[];
}

function buildDependencyItem(
  group: PackageGroup,
  repoUsesPnpm: boolean,
): Omit<RemediationItem, 'id'> {
  const sorted = filterAndSortFindings(group.findings, {
    severity: 'ALL',
    verdict: 'ALL',
    onlyKev: false,
    search: '',
  });
  const primary = sorted[0];

  const highestSeverity = sorted.reduce<SeverityLevel>(
    (best, cur) =>
      SEVERITY_REGISTRY[cur.severity].weight > SEVERITY_REGISTRY[best].weight
        ? cur.severity
        : best,
    primary.severity,
  );
  const isKev = sorted.some((f) => f.isKnownExploited);
  const isConfirmedRuntime =
    sorted.some((f) => f.verdict === 'CONFIRMED_ACTIVE') ||
    group.runtimeEvidence.length > 0;
  const targetVersion = pickHighestVersion(sorted.map((f) => f.fixedVersion));
  const cves = Array.from(new Set(sorted.map((f) => f.cveId ?? f.advisoryId)));
  const maxEpss = sorted.reduce<number | null>((best, cur) => {
    if (cur.epssScore === null) return best;
    return best === null ? cur.epssScore : Math.max(best, cur.epssScore);
  }, null);

  const priority = computeDependencyPriority(
    highestSeverity,
    isKev,
    isConfirmedRuntime,
  );
  const command = inferDependencyCommand(
    group.ecosystem,
    group.packageName,
    targetVersion,
    group.sourceFile,
    group.isDirect,
    repoUsesPnpm,
  );

  const cvePreview =
    cves.length <= 3
      ? cves.join(', ')
      : `${cves.slice(0, 3).join(', ')} (+${cves.length - 3})`;

  const title = targetVersion
    ? `Atualizar ${group.packageName} (${group.packageVersion} -> >= ${targetVersion})`
    : `Mitigar vulnerabilidade em ${group.packageName}@${group.packageVersion}`;

  const problemSummary =
    cves.length === 1
      ? `${normalizeSentence(primary.title, 140)} (${cves[0]})`
      : `${cves.length} vulnerabilities in ${group.packageName}@${group.packageVersion}: ${normalizeSentence(primary.title, 110)} (${cvePreview})`;

  const solutionAction = targetVersion
    ? group.isDirect
      ? `Upgrade ${group.packageName} from ${group.packageVersion} to >= ${targetVersion} in ${group.sourceFile} and update the lockfile.`
      : `Update parent dependency pulling ${group.packageName}@${group.packageVersion} or pin >= ${targetVersion} via overrides in package.json (${group.sourceFile}) and regenerate the lockfile.`
    : `No patched release published for ${group.packageName}@${group.packageVersion}; replace the dependency, restrict vulnerable code paths, or apply vendor mitigation.`;

  const verificationStep = targetVersion
    ? `Confirm resolved version of ${group.packageName} is >= ${targetVersion} in the lockfile and run typecheck, tests, and build.`
    : `Verify vulnerable code paths using ${group.packageName} are removed or mitigated and run tests/build.`;

  const executiveProblem = `A dependência "${group.packageName}" na versão ${group.packageVersion} (${group.isDirect ? 'direta' : 'transitiva'} em ${group.sourceFile}) apresenta ${cves.length} vulnerabilidade(s) catalogada(s): ${cvePreview}. Achado principal: ${normalizeSentence(primary.title, 160)}.`;

  const epssNote =
    maxEpss !== null && maxEpss >= 0.1
      ? ` (probabilidade estimada de exploração EPSS de ${(maxEpss * 100).toFixed(1)}%)`
      : '';

  let executiveImpact: string;
  if (isKev && isConfirmedRuntime) {
    executiveImpact =
      'Impacto crítico imediato: vulnerabilidade sob exploração ativa no mundo real (CISA KEV) e confirmada em execução no ambiente avaliado, com risco direto de comprometimento ou vazamento de dados.';
  } else if (isKev) {
    executiveImpact =
      'Impacto crítico: vulnerabilidade listada no catálogo CISA KEV (exploração ativa confirmada contra sistemas reais). Recomenda-se mobilização prioritária da engenharia.';
  } else if (isConfirmedRuntime) {
    executiveImpact =
      'Exposição confirmada: a biblioteca vulnerável foi identificada em execução no ambiente alvo, aumentando a chance de exploração externa.';
  } else if (highestSeverity === 'CRITICAL' || highestSeverity === 'HIGH') {
    executiveImpact = `Severidade ${SEVERITY_REGISTRY[highestSeverity].label.toLowerCase()}${epssNote}: falha relevante na cadeia de suprimentos de software que pode afetar confidencialidade, integridade ou disponibilidade da aplicação.`;
  } else {
    executiveImpact = `Severidade ${SEVERITY_REGISTRY[highestSeverity].label.toLowerCase()}${epssNote}: exposição moderada/preventiva identificada no inventário SBOM; a atualização reduz débito de segurança e riscos futuros.`;
  }

  const executiveSolution = targetVersion
    ? group.isDirect
      ? `Atualizar a biblioteca "${group.packageName}" de ${group.packageVersion} para a versão ${targetVersion} (ou superior) em ${group.sourceFile}, regenerar o lockfile e publicar após aprovação na esteira de testes.`
      : `Atualizar a dependência principal que carrega "${group.packageName}" ou fixar versão segura (>= ${targetVersion}) via overrides no manifesto do projeto, regenerando o lockfile e validando regressões.`
    : `Ainda não há versão corrigida publicada pelo mantenedor para "${group.packageName}@${group.packageVersion}". Recomenda-se avaliar substituição do pacote, aplicar controles compensatórios (WAF/isolamento) e monitorar novos patches.`;

  const executiveValidation = targetVersion
    ? `Confirmar "${group.packageName}" >= ${targetVersion} no lockfile atualizado, executar testes/build sem falhas e rodar nova varredura Brynja.`
    : `Validar em revisão técnica que o vetor vulnerável foi isolado ou substituído e registrar aceite de risco até publicação de patch.`;

  return {
    priority,
    slaWindow: PRIORITY_SLA[priority],
    kind: 'dependency',
    severity: highestSeverity,
    title,
    where: group.sourceFile,
    problemSummary,
    executiveProblem,
    executiveImpact,
    solutionAction,
    executiveSolution,
    verificationStep,
    executiveValidation,
    packageName: group.packageName,
    ecosystem: group.ecosystem,
    currentVersion: group.packageVersion,
    targetVersion,
    isDirect: group.isDirect,
    cves,
    isKnownExploited: isKev,
    isConfirmedRuntime,
    command,
    ...(group.runtimeEvidence.length > 0
      ? { evidence: normalizeSentence(group.runtimeEvidence[0], 180) }
      : {}),
  };
}

function buildProbeItem(probe: ProbeFinding): Omit<RemediationItem, 'id'> {
  const priority = computeProbePriority(probe.severity);
  const meta = resolveProbeMeta(probe.probeId);
  const cleanTitle = normalizeSentence(probe.title, 140);
  const cleanEvidence = normalizeSentence(probe.evidence, 180);
  const cleanRecommendation = normalizeSentence(probe.recommendation, 220);

  return {
    priority,
    slaWindow: PRIORITY_SLA[priority],
    kind: 'runtime_config',
    severity: probe.severity,
    title: cleanTitle,
    where: probe.targetUrl,
    problemSummary: cleanTitle,
    executiveProblem: `${cleanTitle} em ${probe.targetUrl}. Evidência coletada de forma não destrutiva: ${cleanEvidence}`,
    executiveImpact: meta.businessImpact,
    solutionAction: cleanRecommendation,
    executiveSolution: cleanRecommendation,
    verificationStep: meta.verifyAi,
    executiveValidation: meta.verifyExecutive,
    probeId: probe.probeId,
    evidence: cleanEvidence,
  };
}

/**
 * Pure SRP planner transforming a ScanReport into a deduplicated, priority-ordered
 * remediation plan consumed by both the AI Remediation JSON exporter and the
 * Executive PDF report for management and leadership.
 */
export function buildRemediationPlan(report: ScanReport): RemediationPlan {
  const depById = new Map<string, ScanDependency>();
  const depByPkgKey = new Map<string, ScanDependency>();
  let repoUsesPnpm = false;

  for (const dep of report.dependencies) {
    depById.set(dep.id, dep);
    const pkgKey = `${dep.ecosystem}:${dep.name}@${dep.version}`;
    if (!depByPkgKey.has(pkgKey)) {
      depByPkgKey.set(pkgKey, dep);
    }
    if (dep.sourceFile.toLowerCase().endsWith('pnpm-lock.yaml')) {
      repoUsesPnpm = true;
    }
  }

  // Group SCA vulnerability findings by package so multiple CVEs on the same package
  // collapse into a single decisive upgrade action targeting the highest fixed version.
  const groups = new Map<string, PackageGroup>();
  const coveredPackages = new Set<string>();

  for (const finding of report.findings) {
    const dep =
      depById.get(finding.dependencyId) ??
      depByPkgKey.get(
        `${finding.ecosystem}:${finding.packageName}@${finding.packageVersion}`,
      );
    const sourceFile =
      dep?.sourceFile ??
      DEFAULT_MANIFEST_BY_ECOSYSTEM[finding.ecosystem] ??
      'package.json';
    const isDirect = dep?.isDirect ?? true;
    const key = `${finding.ecosystem}:${finding.packageName}@${finding.packageVersion}:${sourceFile}`;

    coveredPackages.add(finding.packageName.toLowerCase());

    const existing = groups.get(key);
    if (existing) {
      existing.findings.push(finding);
    } else {
      groups.set(key, {
        key,
        packageName: finding.packageName,
        packageVersion: finding.packageVersion,
        ecosystem: finding.ecosystem,
        sourceFile,
        isDirect,
        findings: [finding],
        runtimeEvidence: [],
      });
    }
  }

  // Filter actionable Safe Probe findings; fold runtime-fingerprint hits into matching
  // dependency tasks to eliminate redundant instructions.
  const standaloneProbeFindings: ProbeFinding[] = [];
  for (const probe of report.probeResults) {
    if (probe.status !== 'FINDING') continue;

    if (
      probe.probeId === 'safe-probe:runtime-fingerprint' &&
      probe.matchedPackage &&
      coveredPackages.has(probe.matchedPackage.toLowerCase())
    ) {
      for (const group of groups.values()) {
        if (
          group.packageName.toLowerCase() === probe.matchedPackage.toLowerCase()
        ) {
          group.runtimeEvidence.push(probe.evidence);
        }
      }
      continue;
    }

    standaloneProbeFindings.push(probe);
  }

  const rawItems: Array<Omit<RemediationItem, 'id'>> = [
    ...Array.from(groups.values()).map((g) =>
      buildDependencyItem(g, repoUsesPnpm),
    ),
    ...standaloneProbeFindings.map((p) => buildProbeItem(p)),
  ];

  // Deterministic priority sorting: Priority (P0->P3) > KEV > Confirmed Runtime > Severity > Kind
  rawItems.sort((a, b) => {
    const prioDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (prioDiff !== 0) return prioDiff;

    const kevDiff = Number(Boolean(b.isKnownExploited)) - Number(Boolean(a.isKnownExploited));
    if (kevDiff !== 0) return kevDiff;

    const runtimeDiff =
      Number(Boolean(b.isConfirmedRuntime)) - Number(Boolean(a.isConfirmedRuntime));
    if (runtimeDiff !== 0) return runtimeDiff;

    const sevDiff =
      SEVERITY_REGISTRY[b.severity].weight - SEVERITY_REGISTRY[a.severity].weight;
    if (sevDiff !== 0) return sevDiff;

    if (a.kind !== b.kind) {
      return a.kind === 'dependency' ? -1 : 1;
    }
    return a.title.localeCompare(b.title);
  });

  const items: RemediationItem[] = rawItems.map((item, idx) => ({
    id: `FIX-${String(idx + 1).padStart(2, '0')}`,
    ...item,
  }));

  const counts: RemediationPlanCounts = {
    total: items.length,
    p0: items.filter((i) => i.priority === 'P0').length,
    p1: items.filter((i) => i.priority === 'P1').length,
    p2: items.filter((i) => i.priority === 'P2').length,
    p3: items.filter((i) => i.priority === 'P3').length,
    dependency: items.filter((i) => i.kind === 'dependency').length,
    runtimeConfig: items.filter((i) => i.kind === 'runtime_config').length,
    kev: items.filter((i) => Boolean(i.isKnownExploited)).length,
    confirmedRuntime: items.filter((i) => Boolean(i.isConfirmedRuntime)).length,
  };

  // Include active high/critical runtime probe findings when classifying overall executive risk
  const probeCritical = standaloneProbeFindings.filter(
    (p) => p.severity === 'CRITICAL',
  ).length;
  const probeHigh = standaloneProbeFindings.filter(
    (p) => p.severity === 'HIGH',
  ).length;
  const probeMedium = standaloneProbeFindings.filter(
    (p) => p.severity === 'MEDIUM',
  ).length;
  const probeLow = standaloneProbeFindings.filter(
    (p) => p.severity === 'LOW',
  ).length;

  const overallRisk = computeOverallRisk({
    criticalCount: report.criticalCount + probeCritical,
    highCount: report.highCount + probeHigh,
    mediumCount: report.mediumCount + probeMedium,
    lowCount: report.lowCount + probeLow,
    confirmedActiveCount: report.confirmedActiveCount,
  });

  let executiveHeadline: string;
  let executiveBrief: string;

  if (counts.total === 0) {
    executiveHeadline =
      'Postura de Segurança Saudável — Nenhuma Correção Imediata Pendente';
    executiveBrief =
      'A avaliação automatizada de dependências (SBOM/CVE) e verificações seguras não identificou vulnerabilidades abertas ou exposições acionáveis neste momento. Recomenda-se manter a rotina periódica de varreduras a cada ciclo de release.';
  } else if (counts.p0 > 0) {
    executiveHeadline = `Atenção Executiva Imediata — ${counts.p0} Ação(ões) P0 Prioritária(s)`;
    executiveBrief = `Foram consolidados ${counts.total} plano(s) objetivo(s) de solução (${counts.dependency} atualização(ões) de dependência e ${counts.runtimeConfig} ajuste(s) de hardening em runtime). Há ${counts.p0} item(ns) P0 de risco crítico${counts.kev > 0 ? `, incluindo ${counts.kev} com exploração ativa no catálogo CISA KEV` : ''}, recomendando-se janela emergencial de correção em 24h a 48h.`;
  } else if (counts.p1 > 0) {
    executiveHeadline = `Prioridade Alta — ${counts.p1} Ação(ões) Recomendada(s) para Curto Prazo`;
    executiveBrief = `A análise consolidou ${counts.total} plano(s) de remediação (${counts.dependency} em dependências e ${counts.runtimeConfig} em configuração/runtime), sem exposições críticas P0, porém com ${counts.p1} item(ns) P1 recomendados para resolução no ciclo atual (até 7 dias).`;
  } else {
    executiveHeadline = `Risco Controlado — ${counts.total} Melhoria(s) de Hardening Planejáveis`;
    executiveBrief = `Não foram identificadas vulnerabilidades críticas ou de alta severidade. Os ${counts.total} item(ns) consolidados abaixo representam atualizações preventivas e boas práticas de proteção recomendadas para os próximos ciclos de manutenção.`;
  }

  return {
    overallRisk,
    executiveHeadline,
    executiveBrief,
    counts,
    items,
  };
}
