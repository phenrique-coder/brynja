import type {
  SafeProbeCopy,
  SafeProbeId,
} from '../../catalog/safe-probes.catalog';
import type { Messages } from './pt-BR';

const SAFE_PROBE_ITEMS_EN: Record<SafeProbeId, SafeProbeCopy> = {
  'safe-probe:security-headers': {
    name: 'HTTP Security Headers & Banners',
    summary:
      'Checks whether the root response includes essential defensive headers against XSS, clickjacking, and MIME sniffing, while detecting technology/version leaks.',
    checks:
      'Inspects Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and X-Powered-By / Server banners correlated with the SBOM.',
  },
  'safe-probe:hsts-tls': {
    name: 'HTTPS Strict Transport Security (HSTS)',
    summary:
      'Verifies on HTTPS targets that browsers are instructed to enforce encrypted connections long enough to prevent HTTP downgrade attacks.',
    checks:
      'Runs HEAD / and validates Strict-Transport-Security with max-age ≥ 15,552,000s (180 days). Automatically skipped for plain HTTP targets.',
  },
  'safe-probe:csp-permissions': {
    name: 'CSP Directive Strength, Permissions-Policy & Mixed Content',
    summary:
      'Evaluates actual Content-Security-Policy directive hardening, browser feature restrictions, and insecure active HTTP resources on HTTPS pages.',
    checks:
      "Inspects 'unsafe-eval', '*' wildcards, 'unsafe-inline' without nonces/hashes, frame-ancestors '*', Report-Only without active CSP, missing Permissions-Policy, and http:// scripts/iframes/CSS on HTTPS.",
  },
  'safe-probe:cookie-security': {
    name: 'Cookie Security Flags (Set-Cookie)',
    summary:
      'Audits defensive flags on cookies issued at the root route without ever storing or displaying raw cookie values.',
    checks:
      'Checks HttpOnly, Secure (on HTTPS), and SameSite (Lax/Strict or None paired with Secure), prioritizing session and authentication cookies.',
  },
  'safe-probe:cors-policy': {
    name: 'CORS Policy (Cross-Origin Resource Sharing)',
    summary:
      'Detects overly permissive cross-origin policies that could allow untrusted websites to read authenticated application data.',
    checks:
      'Sends GET / with an untrusted test Origin and checks for arbitrary Access-Control-Allow-Origin reflection, wildcard "*" with credentials, or "null" origin trust.',
  },
  'safe-probe:cache-security': {
    name: 'HTTP Cache Security (Cookies & Vary: Origin)',
    summary:
      'Prevents authenticated session leakage across shared CDNs/proxies and cache poisoning on dynamic CORS responses.',
    checks:
      'Audits GET / for Set-Cookie paired with public/s-maxage Cache-Control (or session cookies missing private/no-store) and specific Access-Control-Allow-Origin headers missing Vary: Origin.',
  },
  'safe-probe:open-redirect': {
    name: 'Open Redirect Verification',
    summary:
      'Detects unvalidated return URL parameters that redirect visitors to arbitrary external domains for phishing or token theft.',
    checks:
      'Sends manual-redirect GET requests to /?next=, /?redirect=, and /login?next= targeting synthetic untrusted.brynja.test and checks whether 3xx Location headers redirect externally.',
  },
  'safe-probe:exposed-artifacts': {
    name: 'Exposed Sensitive Artifacts',
    summary:
      'Checks whether critical version-control, environment-variable, or manifest files are accidentally served publicly on the web root.',
    checks:
      'Probes /.git/HEAD, /.env, and /package.json via HEAD and verifies structural signatures in the first 512 bytes only on HTTP 200, never downloading full files or logging secrets.',
  },
  'safe-probe:exposed-docs-metrics': {
    name: 'API Docs, Metrics & security.txt',
    summary:
      'Identifies internal API documentation or observability endpoints unintentionally exposed in production and detects RFC 9116 disclosure files.',
    checks:
      'Checks /openapi.json, /swagger, /swagger-ui, /api/docs, /metrics, /actuator/health, and /graphql (ignoring SPA HTML catch-alls), plus /.well-known/security.txt.',
  },
  'safe-probe:backup-config-exposure': {
    name: 'Backups, Env Configs & Diagnostics Exposure',
    summary:
      'Detects publicly exposed environment overrides, SQL database dumps, Docker Compose manifests, or phpinfo diagnostics.',
    checks:
      'Runs HEAD-first checks and 512-byte structural signature verification (ignoring SPA HTML, never storing secrets) for /.env.local, /.env.production, /docker-compose.yml, /backup.sql, and /phpinfo.php.',
  },
  'safe-probe:runtime-fingerprint': {
    name: 'Runtime Library & CVE Correlation',
    summary:
      'Cross-checks publicly served JavaScript assets against vulnerable packages in your repository SBOM to confirm active runtime exposure.',
    checks:
      'Inspects up to 32 KB of root HTML (GET /) for <script src> paths and explicit version banners matching CVEs found during SCA.',
  },
  'safe-probe:source-maps': {
    name: 'Source Map Exposure (.js.map)',
    summary:
      'Detects publicly accessible JavaScript source maps that expose original unobfuscated client code in staging or production.',
    checks:
      'Extracts up to 3 same-origin JS bundles from "/" and verifies via HEAD whether their corresponding .js.map files return HTTP 200.',
  },
  'safe-probe:debug-error-leakage': {
    name: 'Debug Mode, Stack Traces & Directory Listing',
    summary:
      'Detects open web directory autoindexing and verbose error pages that expose internal server paths, frameworks, or interactive debuggers.',
    checks:
      'Inspects GET / for directory listings ("Index of /") and GET /__brynja_probe_nonexistent_404__ for Django DEBUG, Werkzeug, Node/Express, Laravel Ignition, PHP, Java/Spring, and ASP.NET traces.',
  },
  'safe-probe:sri-integrity': {
    name: 'Subresource Integrity (SRI) on External CDNs',
    summary:
      'Verifies whether scripts and stylesheets loaded from static public library CDNs enforce cryptographic hashes against supply-chain tampering.',
    checks:
      'Parses root HTML <script src> and <link rel="stylesheet"> tags targeting static CDNs (cdnjs, jsDelivr, unpkg, jQuery/Bootstrap) and validates sha256/384/512 integrity attributes.',
  },
  'safe-probe:cross-origin-isolation': {
    name: 'Cross-Origin Isolation (COOP, COEP & CORP)',
    summary:
      'Checks whether the application instructs browsers to isolate windows and subresources against cross-origin leaks and side-channel attacks.',
    checks:
      'Inspects GET / for Cross-Origin-Opener-Policy (COOP), Cross-Origin-Resource-Policy (CORP), and Cross-Origin-Embedder-Policy (COEP).',
  },
  'safe-probe:dns-email-posture': {
    name: 'DNS, Anti-Spoofing (SPF/DMARC) & CAA Posture',
    summary:
      'Passively checks domain DNS posture against email spoofing/phishing, unauthorized TLS certificate issuance, and MTA-STS policy.',
    checks:
      'Resolves DNS TXT (SPF, _dmarc) and CAA records plus GET /.well-known/mta-sts.txt (automatically skipped for loopback or IP literals).',
  },
  'safe-probe:robots-sitemap-exposure': {
    name: 'Sensitive Routes in robots.txt & sitemap.xml',
    summary:
      'Identifies administrative, internal, or staging paths publicly disclosed inside search-engine indexing files.',
    checks:
      'Fetches GET /robots.txt and GET /sitemap.xml (ignoring SPA HTML catch-alls) looking for sensitive route patterns like /admin, /internal, /backup, and /debug without crawling them.',
  },
  'safe-probe:oauth-graphql-posture': {
    name: 'OIDC Discovery & GraphQL Introspection Posture',
    summary:
      'Detects weak OpenID Connect discovery metadata and publicly enabled GraphQL schema introspection in production.',
    checks:
      'Inspects GET /.well-known/openid-configuration (for http:// endpoints, alg=none, or implicit flow without PKCE) and passive GET /graphql?query=__schema.',
  },
  'safe-probe:security-txt-rfc9116': {
    name: 'RFC 9116 security.txt Validation',
    summary:
      'Validates that the official vulnerability disclosure channel exists, lists a contact method, and has not expired.',
    checks:
      'Fetches GET /.well-known/security.txt (ignoring SPA HTML catch-alls) and validates required "Contact:" and non-expired future "Expires:" directives.',
  },
};

export const EN_MESSAGES: Messages = {
  common: {
    loading: 'Loading...',
    refresh: 'Refresh',
    cancel: 'Cancel',
    copy: 'Copy',
    copied: 'Copied',
    close: 'Close',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    signInWithGitHub: 'Sign in with GitHub',
    signInShort: 'Sign in',
    backToDashboard: 'Back to Dashboard',
    backToHistory: 'Back to History',
    scaOnly: 'SCA Only',
    languageSelectorLabel: 'Select language',
  },
  enums: {
    severity: {
      CRITICAL: 'Critical',
      HIGH: 'High',
      MEDIUM: 'Medium',
      LOW: 'Low',
      INFO: 'Info',
    },
    verdict: {
      CONFIRMED_ACTIVE: 'Confirmed in Runtime',
      POTENTIALLY_EXPOSED: 'Potential / Active KEV',
      DEPENDENCY_ONLY: 'Manifest Only',
    },
    scanStatus: {
      QUEUED: 'Queued',
      RUNNING: 'Running',
      COMPLETED: 'Completed',
      FAILED: 'Failed',
    },
    authStatus: {
      PENDING: 'Pending',
      VERIFIED: 'Verified',
      REVOKED: 'Revoked',
    },
    probeOutcome: {
      FINDING: 'Weakness Found',
      PASSED: 'Passed',
      SKIPPED: 'Skipped',
      ABORTED: 'Aborted (Guardrail)',
    },
    pipelineStage: {
      queued: 'Queued',
      fetching_repository: 'Fetching repo',
      parsing_dependencies: 'SBOM Extraction',
      querying_vulnerability_intel: 'OSV / NVD / EPSS / KEV',
      running_static_analysis: 'Secrets / IaC / SAST',
      running_safe_probes: 'Safe Probes',
      completed: 'Report ready',
    },
  },
  nav: {
    dashboard: 'Dashboard',
    history: 'History',
    newScan: 'New Scan',
    authorizations: 'Targets & Guardrails',
    audit: 'Audit Trail',
    governance: 'Governance',
    mainNavLabel: 'Primary navigation',
    mobileNavLabel: 'Mobile navigation',
    tagline: 'SCA · CVEs · Safe Probes',
  },
  theme: {
    switchToLight: 'Switch to light theme',
    switchToDark: 'Switch to dark theme',
    tooltipLight: 'Switch to light mode',
    tooltipDark: 'Switch to dark mode',
  },
  accountMenu: {
    viewProfile: 'View GitHub Profile',
    githubId: 'GitHub ID',
    scopes: 'Scopes',
    ephemeralSession: 'Ephemeral session',
    expiresAt: 'Expires at {time}',
    activeInTab: 'Active in session',
    securityBadge: 'OAuth token encrypted only for this session (never stored in DB)',
    signingOut: 'Signing out...',
    signOut: 'Sign out (Discard token)',
  },
  authCard: {
    defaultTitle: 'Connect your GitHub to start this session',
    dashboardTitle: 'Connect your GitHub to access your dashboard and history',
    historyTitle: 'Connect your GitHub to access your complete scan history',
    newScanTitle: 'Connect your GitHub to launch a new security scan',
    authorizationsTitle: 'Connect your GitHub to manage your authorized targets',
    auditTitle: 'Connect your GitHub to view your probe audit trail',
    governanceTitle: 'Connect your GitHub to manage your compliance assessments (GRC)',
    reportTitle: 'Connect your GitHub to open this report',
    description:
      'To guarantee privacy and multi-user isolation, Brynja never stores OAuth tokens or reports in a cloud database. When you sign in with GitHub, an ephemeral token is sealed inside your browser session and your local history (IndexedDB) loads automatically.',
    card1Title: 'Ephemeral Token',
    card1Body: 'Discarded on sign out or when closing the browser.',
    card2Title: 'Local History',
    card2Body: 'Your scans stay strictly isolated to your account.',
    card3Title: 'Active Guardrails',
    card3Body: 'Safe probes only run on verified domains.',
    openSourceLabel: 'Open-source on GitHub:',
  },
  footer: {
    versionTooltip: 'View changelog and release notes for every version',
    stackSummary: 'SCA / SBOM · OSV · NVD · EPSS · CISA KEV · 19 Safe Probes',
    linksAria: 'Project links',
    changelog: 'Changelog',
    repository: 'Repository',
    security: 'Security',
    contributing: 'Contributing',
    license: 'MIT License',
    localFirst: 'Local-First (IndexedDB) · Zero cloud database',
    defensiveUse: 'Strictly defensive & authorized use (GET/HEAD only)',
    copyright: '© {year} Brynja Contributors · Open-Source (MIT)',
  },
  dashboard: {
    loading: 'Checking session and loading dashboard...',
    badge: 'Proactive Pipeline with Non-Destructive Guardrails',
    title: 'Vulnerability Dashboard & Active Verification',
    description:
      'Analyze repository libraries via OSV.dev, NVD, EPSS, and CISA KEV, and run controlled safe probes exclusively against cryptographically verified targets.',
    authorizeTarget: 'Authorize Target',
    newScan: 'New Scan',
    kpiScans: 'Scans',
    kpiDependencies: 'Dependencies',
    kpiCriticalHigh: 'Critical & High (CVEs)',
    kpiConfirmed: 'Confirmed / Probes',
    kpiStaticIssues: 'Code, Secrets & IaC',
    historyTitle: 'Scan History',
    historySubtitle:
      'Select an assessment to inspect SBOM, CVEs, EPSS, Safe Probes, and download the executive PDF.',
    viewFullHistory: 'View full history',
    loadingScans: 'Loading scans...',
    emptyTitle: 'No scans executed on this account yet.',
    emptySubtitle:
      'Start a scan by selecting a GitHub repository or loading the sample manifests.',
    createFirstScan: 'Create first scan',
  },
  history: {
    loading: 'Loading scan history...',
    badge: 'Local History (IndexedDB) · Isolated per GitHub Account',
    title: 'Scan History',
    description:
      'Browse all previous dependency assessments (SBOM/CVEs) and Safe Probe executions, filter by status or scope, and export reports in PDF, JSON, Markdown, or CycloneDX.',
    kpiTotal: 'Total Assessments',
    kpiCompleted: 'Completed',
    kpiWithProbes: 'With Safe Probes',
    kpiCritHigh: 'With Critical / High (CVEs)',
    kpiWithStatic: 'With Code / IaC',
    searchPlaceholder:
      'Filter by repository, branch, ecosystem, or staging target...',
    filterStatusAria: 'Filter by status',
    allStatuses: 'All statuses',
    scopeAll: 'All',
    scopeWithProbes: 'Safe Probes',
    scopeScaOnly: 'SCA Only',
    foundTitle: 'Assessments Found ({count})',
    foundSubtitle:
      'Click any assessment to open the interactive report or download the executive PDF.',
    emptyAccountTitle: 'No scans executed on this account yet.',
    emptyFilterTitle: 'No scans match the active filters.',
    emptyAccountSubtitle:
      'Run your first assessment to inspect your scan history here.',
    emptyFilterSubtitle:
      'Try adjusting the search query or status/scope filters above.',
    importButton: 'Import SARIF / Trivy / Semgrep',
    importingButton: 'Importing...',
    importSuccess:
      'External report "{name}" imported and saved locally in IndexedDB.',
    importErrorFallback: 'Failed to import JSON/SARIF report file.',
    compareButton: 'Compare 2 Scans',
    diffTitle: 'Scan Comparison (Diff)',
    diffSubtitle:
      'Compare a baseline assessment with a newer scan to track new CVEs, resolved findings, static analysis deltas, and CIS/NIST compliance progression.',
    diffBaselineLabel: 'Baseline Scan (older)',
    diffCurrentLabel: 'Current Scan (compared)',
    diffRunButton: 'Compare Selected',
    diffSameScanError: 'Select two distinct scans to run a comparison.',
    diffLoadError: 'Failed to load scan reports for comparison.',
    diffNewVulns: 'New Vulnerabilities',
    diffResolvedVulns: 'Resolved',
    diffPersistentVulns: 'Persistent',
    diffProbeDelta: 'Safe Probes Delta',
    diffStaticDelta: 'Static Delta',
    diffCisDelta: 'CIS v8',
    diffNistDelta: 'NIST CSF 2.0',
    diffNoChanges:
      'No vulnerability or static analysis differences found between the selected scans.',
  },
  historyTable: {
    colRepository: 'Repository',
    colStatus: 'Status',
    colDependencies: 'Dependencies',
    colSeverity: 'Severity',
    colStagingTarget: 'Staging Target',
    colAction: 'Action',
    viewReport: 'View Report',
    deleteAria: 'Delete scan {name}',
    deleteTitle: 'Remove from history',
    critShort: 'C',
    highShort: 'H',
    medShort: 'M',
    lowShort: 'L',
    probeShort: 'P',
    staticShort: 'S',
    critTitle: '{count} Critical (CVEs)',
    highTitle: '{count} High (CVEs)',
    medTitle: '{count} Medium (CVEs)',
    lowTitle: '{count} Low (CVEs)',
    probeTitle: '{count} Safe Probe issue(s)',
    staticTitle: '{count} Code, Secrets & IaC finding(s)',
  },
  newScan: {
    loading: 'Checking GitHub session...',
    title: 'New Security Scan',
    description:
      'Choose a private or public repository from your GitHub account, enter a public Git URL, or paste dependency manifests directly for SCA and controlled active verification.',
    loadSample: 'Load Vulnerable Sample',
    tabGithub: 'GitHub OAuth',
    tabPublicUrl: 'Public Git URL',
    tabManifests: 'Paste Manifests',
    checkingGithub: 'Checking GitHub connection status...',
    oauthPendingTitle: 'GitHub OAuth App configuration pending in .env',
    oauthPendingBody:
      'Register a GitHub OAuth App using the callback below and configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your environment variables (.env.local or Vercel):',
    connectTitle: 'Connect your GitHub account',
    connectSubtitle:
      'Issues an ephemeral session token to read manifests from private and public repositories.',
    connectButton: 'Connect GitHub',
    selectRepoLabel: 'Select Repository ({count})',
    refreshList: 'Refresh list',
    filterPlaceholder: 'Filter personal or organization repositories...',
    noReposFound: 'No repositories found.',
    orgBadge: 'Org',
    privateBadge: 'Private',
    publicBadge: 'Public',
    orgNoticeLead: 'Missing an Organization?',
    orgNoticeBody:
      'On GitHub, organizations restrict OAuth Apps by default until you click Grant (or request admin approval) in the app permissions.',
    grantOrgsButton: 'Grant Orgs on GitHub',
    updateOrgScope: 'Update read:org scope',
    selectedRepoLabel: 'Selected Repository',
    selectedRepoPlaceholder: 'https://github.com/user/private-repo',
    branchLabel: 'Branch',
    publicRepoLabel: 'Public Repository URL (HTTPS)',
    publicRepoPlaceholder: 'https://github.com/user/public-project',
    projectIdLabel: 'Project Identifier',
    projectIdPlaceholder: 'manifest://my-project',
    primaryFileLabel: 'Primary Manifest',
    manifestContentLabel: 'Contents of {name}',
    extraRequirementsLabel: 'Additional requirements.txt (optional)',
    submitting: 'Starting scan...',
    submitButton: 'Run Security Scan',
    startErrorFallback: 'Could not start the security scan.',
    enableStaticLabel: 'Include Static Analysis (Secrets, IaC/CI, Lightweight SAST & Repo Posture)',
    enableStaticHint:
      'Inspects prioritized repository files via GitHub API with automatic secret masking.',
    probesTitle: 'Safe Probes (Optional)',
    authorizeTargetLink: 'Authorize target',
    probesDescription:
      'Only targets with cryptographically verified ownership appear below. Probes execute strictly GET/HEAD requests with rate limiting and audit logging.',
    probesNoneOption: 'SCA + CVEs only (no active probes)',
    viewProbesCatalog: 'View all {count} Safe Probe types below',
    probesReadyLink: '{count} Safe Probes ready for this target',
    pipelineTitle: 'Assessment Pipeline',
    pipelineSteps: [
      'SBOM Inventory (npm, pnpm, pip, pyproject)',
      'Batch lookup via public OSV.dev API',
      'CVSS / CWE enrichment (NVD 2.0)',
      'Real-world exploitation (EPSS) + CISA KEV',
      'Authorized Safe Probes + local audit trail',
    ],
  },
  safeProbesCatalog: {
    title: 'Safe Probe Types Executed',
    subtitle:
      '100% non-destructive, read-only active checks (GET/HEAD only) executed exclusively when you select a target with a verified cryptographic ownership certificate.',
    countBadge: '{count} active probes',
    readOnlyBadge: 'GET / HEAD only',
    statusActiveForTarget: 'Active for {origin}',
    statusInactiveHint: 'Executed when a verified target is selected above',
    filterAll: 'All ({count})',
    categories: {
      'headers-tls': 'Headers & TLS',
      'cookies-cors': 'Cookies & CORS',
      exposure: 'Exposure',
      runtime: 'Runtime & Code',
    },
    whatItChecksLabel: 'What it checks',
    maxSeverityPrefix: 'Up to {severity}',
    guardrailsNote:
      'Guardrails enforced on every probe: mandatory cryptographic ownership certificate, anti-SSRF DNS guard, rate limiter + circuit breaker, and zero storage of sensitive values.',
    items: SAFE_PROBE_ITEMS_EN,
  },
  scanReport: {
    loading: 'Loading report...',
    notFound: 'Report not found.',
    copyIdTitle: 'Copy full Scan ID: {id}',
    targetPrefix: 'Target: {host}',
    scaOnlyBadge: 'SCA Only (no staging target)',
    exportReportLabel: 'Export Report',
    exportDropdownMenuLabel: 'Report export options',
    exportOnlyPdfHint:
      'No issues detected — only Executive PDF remains enabled.',
    generatingPdf: 'Generating PDF...',
    executivePdf: 'Executive PDF (Board)',
    executivePdfTitle:
      'Executive PDF report for management and leadership with problem explanations and solution plans',
    executivePdfMenuHint: 'For management & leadership (problems & solutions)',
    aiJson: 'AI Fix JSON',
    aiJsonTitle:
      'Download concise, structured remediation JSON built for AI coding models',
    aiJsonMenuHint: 'Concise remediation JSON for AI coding models',
    copyAiJsonLabel: 'Copy AI Fix JSON',
    copyAiJsonTitle: 'Copy AI remediation JSON to clipboard',
    copyAiJsonMenuHint: 'Copy directly to paste into an AI chat or agent',
    copiedAiJsonLabel: 'AI Fix JSON copied!',
    otherExportsLabel: 'Other technical formats',
    disabledNoErrorsBadge: 'No issues',
    rawJsonLabel: 'Full JSON',
    markdownLabel: 'Markdown',
    sbomLabel: 'SBOM (CycloneDX)',
    sarifLabel: 'SARIF 2.1.0',
    spdxLabel: 'SBOM (SPDX 2.3)',
    complianceCsvLabel: 'Compliance CSV',
    aiAdvisor: {
      badge: 'AppSec AI Advisor (BYOK)',
      title: 'AI Triage & Reachability Advisor (BYOK)',
      subtitle:
        'Bring your own API key (OpenAI, Gemini, or compatible endpoint) to prioritize remediation using repository import reachability hints.',
      configureButton: 'Configure & Generate AI Plan',
      hideConfig: 'Hide Configuration',
      providerLabel: 'AI Provider',
      providerOpenAi: 'OpenAI (ChatGPT API)',
      providerGemini: 'Google Gemini API',
      providerCustom: 'OpenAI-Compatible Endpoint',
      apiKeyLabel: 'Your API Key / Token (BYOK)',
      apiKeyPlaceholder: 'sk-... or AIza...',
      modelLabel: 'Model (optional)',
      endpointLabel: 'Custom Endpoint URL',
      endpointPlaceholder: 'https://api.openai.com/v1/chat/completions',
      securityNotice:
        'BYOK Privacy: your key stays in your browser only (opt-in) and is sent per-request — never stored in cookies or cloud databases. Only sanitized metadata (CVEs, Safe Probes, rules/paths) is sent; raw secret values are never transmitted.',
      saveLocallyLabel: 'Keep key saved in this browser only (localStorage)',
      clearSavedKey: 'Clear Key',
      generateButton: 'Generate AI Plan',
      regenerateButton: 'Regenerate AI Plan',
      generatingButton: 'Analyzing findings...',
      generatedByLabel: 'Generated by {model}',
      stepsCountLabel: '{count} prioritized actions',
      summaryTitle: 'AI Executive Summary',
      reachabilityTitle: 'Reachability Hints (Active Imports)',
      stepsTitle: 'Prioritized Remediation Steps',
      errorMissingKey:
        'Enter your OpenAI, Gemini, or compatible API token before generating.',
      errorFallback: 'Failed to generate remediation plan from the AI provider.',
    },
    allClearBadge: '100% Passed',
    allClearTitle: 'Shield Intact — All checks passed with zero issues!',
    allClearBodyWithProbes:
      'Great work! {deps} dependency(ies) audited and {probes} Safe Probe(s) verified with zero vulnerabilities or security issues detected.',
    allClearBodyScaOnly:
      'Great work! {deps} dependency(ies) audited in the SBOM inventory with zero known vulnerabilities detected.',
    noVulnsCleanState:
      'All clear! No vulnerabilities were detected across {deps} audited dependency(ies).',
    noVulnsButProbeFindings:
      'No dependency (SCA) vulnerabilities found, but there are {count} finding(s) in the Safe Probes tab.',
    executionError: 'Execution error: {message}',
    kpiDependencies: 'Dependencies',
    kpiCritical: 'Critical (CVEs)',
    kpiHigh: 'High (CVEs)',
    kpiMedium: 'Medium (CVEs)',
    kpiConfirmed: 'Confirmed / Probes',
    kpiProbesSublabel: '{count} probe issue(s)',
    kpiStatic: 'Code & IaC',
    kpiStaticCritHighSublabel: '{count} Crit/High',
    kpiCompliance: 'Compliance',
    tabFindings: 'Vulnerabilities ({count})',
    tabDependencies: 'SBOM Inventory ({count})',
    tabProbes: 'Safe Probes ({count})',
    tabAudit: 'Audit Trail ({count})',
    tabStatic: 'Code, Secrets & IaC ({count})',
    tabCompliance: 'Compliance ({score}%)',
    noStaticFindings:
      'No secret leaks, IaC/CI misconfigurations, or insecure SAST patterns were detected across inspected files.',
    staticCategoryAll: 'All categories',
    staticCategories: {
      SECRET_LEAK: 'Secret Leak',
      IAC_MISCONFIG: 'IaC / Container',
      CI_CD_RISK: 'CI/CD Pipeline',
      SAST_PATTERN: 'Code SAST',
      REPO_POSTURE: 'GitHub Posture',
    },
    searchPlaceholder: 'Search package, CVE, or title...',
    allSeverities: 'All Severities',
    allVerdicts: 'All Verdicts',
    onlyKev: 'CISA KEV Only',
    noFindingsFiltered: 'No vulnerabilities match the active filters.',
    kevBadge: 'CISA KEV (Actively Exploited)',
    upgradeTo: '→ Upgrade to ≥ {version}',
    sbomColLibrary: 'Library',
    sbomColVersion: 'Version',
    sbomColEcosystem: 'Ecosystem',
    sbomColSource: 'Source File',
    sbomColPurl: 'PURL',
    noProbesExecuted: 'No active probes were executed during this scan.',
    evidenceLabel: 'Evidence:',
    recommendationLabel: 'Recommendation:',
    auditColTimestamp: 'Timestamp',
    auditColOutcome: 'Outcome',
    auditColMethodPath: 'Method / Path',
    auditColHttp: 'HTTP',
    auditColDetails: 'Details',
    noAuditEvents: 'No probe audit events recorded for this scan.',
  },
  authorizations: {
    loading: 'Loading authorized targets...',
    badge: 'Active Security Clause',
    title: 'Authorized Targets & Guardrails',
    description:
      'No active probe runs without cryptographic proof of domain ownership. All checks are strictly non-destructive GET/HEAD requests with anti-SSRF protection, rate limiting, and audit logging.',
    formTitle: 'Register New Staging Target',
    targetUrlLabel: 'Target Base URL',
    targetUrlPlaceholder: 'https://staging.yourcompany.com',
    methodLabel: 'Proof Method',
    methodWellKnown: 'File /.well-known/security.txt (RFC 9116)',
    methodDns: 'DNS TXT Record (_brynja)',
    methodSandbox: 'Local Loopback Sandbox (dev)',
    generateButton: 'Generate Ownership Challenge',
    instructionPrefix: 'Verification Instruction:',
    invalidTargetUrl:
      'Enter a valid domain or URL (e.g., yoursite.com or https://staging.yourcompany.com).',
    createErrorFallback: 'Failed to create ownership challenge.',
    verifyErrorFallback: 'Domain ownership verification failed.',
    revokeErrorFallback: 'Failed to revoke and remove authorization.',
    guardrailsTitle: 'Mandatory Guardrails',
    guardrails: [
      'Anti-SSRF blocking of private networks and cloud metadata',
      'Strictly non-destructive GET / HEAD requests only',
      'Per-scan rate limiting and circuit breaker on 429 / 5xx',
      'Signed certificate (7 days) with automatic renewal while proof remains published',
      'History and audit trail stored locally in your browser (IndexedDB)',
    ],
    registeredTitle: 'Registered Targets ({count})',
    registeredSubtitle: 'Strictly scoped to your GitHub account.',
    emptyRegistered:
      'No targets registered yet. Generate a challenge on the left to enable safe probes.',
    tokenPrefix: 'Token:',
    copyTokenTitle: 'Copy token',
    howToSetup: 'How to configure',
    verifyOwnership: 'Verify Ownership',
    revoke: 'Revoke',
    remove: 'Remove',
    removing: 'Removing...',
    removePermanently: 'Remove permanently',
  },
  setupGuide: {
    eyebrow: 'Step-by-Step Setup Guide',
    title: 'How to prove domain ownership (beginners & remote SSH terminal)',
    subtitlePrefix:
      'Follow the steps below to unlock safe probes for your site.',
    subtitleReady:
      'The commands below are already pre-filled with your target domain and token.',
    subtitleDraftReady:
      'The commands below were dynamically updated for {origin} with your real token ready to copy and run in the terminal.',
    subtitleResolving:
      'Preparing your real verification token for {origin}...',
    subtitlePlaceholder:
      'Enter your target URL above or generate a challenge to automatically populate all commands with your real token.',
    commandsReadyFor: 'Commands ready for',
    resolvingTokenFor: 'Preparing token for',
    tokenReadyBadge: 'Real token ready to copy',
    copyingToken: 'Preparing...',
    copyDnsTokenTitle: 'Copy DNS TXT token value',
    step1Title: 'Generate the token',
    step1Body:
      'Enter your site URL above, choose a proof method, and click Generate Ownership Challenge.',
    step2Title: 'Publish the proof on your site or DNS',
    step2Body:
      'Pick one of the options below (remote SSH terminal, web project/cPanel, or DNS dashboard) and paste the exact token.',
    step3Title: 'Click Verify Ownership',
    step3Body:
      'Brynja verifies the proof and issues a 7-day certificate (automatically renewed as long as the file or DNS record stays live).',
    tabWellKnown: '/.well-known File (Recommended)',
    tabDns: 'DNS TXT Record',
    tabSandbox: 'Local Sandbox (dev)',
    wellKnownIntroPrefix: 'The goal is to make',
    wellKnownIntroSuffix:
      'publicly reachable in RFC 9116 format (Contact, Expires, and the `# Brynja-Verification` token comment — proving domain ownership while passing RFC 9116 checks at the same time). Choose how you deploy:',
    subtabSsh: 'Via Remote Terminal (SSH)',
    subtabWeb: 'Without SSH (Vercel / Project / cPanel)',
    sshStep1Title: 'Step 1 — Connect to your remote server via terminal',
    sshStep1Body:
      'Open your computer terminal (Linux, macOS, or PowerShell/WSL on Windows) and connect over SSH:',
    sshStep1Label: 'Local terminal → SSH',
    sshStep1Caption:
      "Replace 'usuario' with your server username (e.g., root, ubuntu, deploy) or use an alias from your ~/.ssh/config.",
    sshStep2Title:
      'Step 2 — Create the .well-known folder and write security.txt (RFC 9116)',
    sshStep2Body:
      'Once connected to the remote server, run the command below to create the directory and write an RFC 9116 security.txt with Contact, Expires, and your Brynja token (or append `# Brynja-Verification:` if you already publish security.txt):',
    sshStep2Label: 'Remote server (Linux / VPS)',
    sshStep2Caption:
      'If your web root is not /var/www/html (e.g., /var/www/mysite/public or /usr/share/nginx/html), replace the path before running.',
    proxySelectorAriaStep3: 'Select reverse proxy server (Step 3)',
    proxySelectorAriaStep5: 'Select reverse proxy server (Step 5)',
    proxyNginx: 'Nginx',
    proxyApache: 'Apache',
    sshStep3Title:
      'Step 3 — (Optional, very common) If you use a reverse proxy (Nginx or Apache)',
    sshStep3BodyBefore:
      'If your site runs Node.js, Next.js, Docker, or Python behind Nginx (',
    sshStep3BodyMiddle:
      '), Nginx may forward the route to your app/container and return 404. First locate the active config file and add this block inside',
    sshStep3BodyAfter: 'in the active site file under',
    sshStep3NginxFindActiveLabel:
      'Locate the active Nginx config file for this domain',
    sshStep3NginxFindActiveCaption:
      'Important: if the file in /etc/nginx/sites-enabled/ has NO arrow (->), it is a standalone copy (not a symlink to sites-available). Edit that file in sites-enabled/ directly — always inside the "listen 443 ssl" block when using HTTPS.',
    sshStep3Label: 'Nginx snippet (port 443 server block in active config)',
    sshStep3NginxSnippetCaption:
      'Uses "location = /.well-known/security.txt" (exact match): takes precedence over Docker container proxy_pass (e.g., 127.0.0.1:3000) without conflicting with Certbot (/.well-known/acme-challenge/).',
    sshStep3ReloadLabel: 'Validate syntax and reload Nginx with zero downtime',
    sshStep3ApacheBodyBefore:
      'If your site runs Node.js, Next.js, Docker, or Python behind Apache (',
    sshStep3ApacheBodyMiddle:
      '), Apache may forward the route to your app/container and return 404. First locate the active config file and add this block inside',
    sshStep3ApacheBodyAfter: 'in the active site file under',
    sshStep3ApacheBodyOr: 'or',
    sshStep3ApacheFindActiveLabel:
      'Locate the active Apache config file for this domain',
    sshStep3ApacheFindActiveCaption:
      'Important: if the file in /etc/apache2/sites-enabled/ has NO arrow (->), it is a standalone copy (not a symlink to sites-available). Edit that active file directly inside <VirtualHost *:443>.',
    sshStep3ApacheLabel:
      'Apache snippet (/etc/apache2/sites-enabled/... or /etc/httpd/conf.d/...)',
    sshStep3ApacheCaption:
      'Important: place "ProxyPass /.well-known/ !" BEFORE "ProxyPass / ...". If your proxy uses <Location />, add "<Location /.well-known/> ProxyPass ! </Location>" after it; if using mod_rewrite ([P]), add "RewriteCond %{REQUEST_URI} !^/\\.well-known/".',
    sshStep3ApacheReloadLabel:
      'Validate syntax and reload Apache with zero downtime',
    sshStep3ApacheReloadCaption:
      'On RHEL, Rocky, Alma, CentOS, or Fedora, run: sudo httpd -t && sudo systemctl reload httpd',
    sshStep3ContainerNoteLead: 'Running apps in Docker containers?',
    sshStep3ContainerNoteBody:
      'If your app runs in Docker (e.g., Next.js/Node on 127.0.0.1:3000) behind host Nginx/Apache, keep the file at /var/www/html/.well-known/ on the host and update the host active proxy config. If the reverse proxy itself runs inside a container (Traefik, Caddy, Nginx Proxy Manager), serve the file from that proxy container or use the "DNS TXT Record" tab with zero container changes.',
    sshStep4Title: 'Step 4 — Test from the terminal that the file is public',
    sshStep4Body:
      'Run the command below (on the server or locally). It should output your security.txt with Contact, Expires, and your verification token:',
    sshStep4Label: 'Quick check via curl',
    sshStep4Caption:
      'Expected output includes "# Brynja-Verification: {token}". Once visible, scroll up and click "Verify Ownership"!',
    sshStep5Title:
      'Step 5 — (Optional) Revert everything: remove the file, .well-known folder, and Step 3 (Nginx / Apache)',
    sshStep5Body:
      'Whenever you want to restore your server to its exact previous state (or revoke access), follow the steps below. RFC 9116 tip: to keep security.txt live on production, remove only the "# Brynja-Verification:" line instead of deleting the whole file. Note: removing the token stops automatic 7-day certificate renewal.',
    sshStep5RemoveFileLabel:
      '5.1 — Remove .well-known/security.txt and the .well-known folder (if empty)',
    sshStep5RemoveFileCaption:
      'Deletes security.txt and removes the .well-known folder only if empty (safely preserving existing folders such as Certbot/Let’s Encrypt acme-challenge). Adjust /var/www/html if you used a different web root.',
    sshStep5NginxBodyBefore:
      'If you added the Step 3 block in Nginx, locate the config file with the command below, remove the',
    sshStep5NginxBodyAfter:
      'block (only if it is not used by Certbot/Let’s Encrypt), save, and reload Nginx:',
    sshStep5NginxFindLabel: '5.2 — Locate the Nginx block (Step 3)',
    sshStep5NginxReloadLabel:
      '5.3 — Validate and reload Nginx after removing the Step 3 block',
    sshStep5ApacheBodyBefore:
      'If you added the Step 3 directives in Apache, locate the config file with the command below, remove the',
    sshStep5ApacheBodyAfter:
      'block (only if it is not used by Certbot/Let’s Encrypt), save, and reload Apache:',
    sshStep5ApacheFindLabel: '5.2 — Locate the Apache block (Step 3)',
    sshStep5ApacheReloadLabel:
      '5.3 — Validate and reload Apache after removing the Step 3 block',
    sshStep5VerifyLabel:
      '5.4 — Confirm from the terminal that the file was removed',
    sshStep5VerifyCaption:
      'Should return HTTP 404 (or your app default route). To finish, also click "Revoke" in the registered targets list above.',
    webOptionATitle:
      'Option A — Web Project (Next.js, React, Vite, Vercel, Netlify)',
    webOptionAStep1: 'Open the public/ folder at the root of your project.',
    webOptionAStep2:
      'Create a subfolder named .well-known (including the leading dot).',
    webOptionAStep3:
      'Create (or update) public/.well-known/security.txt with the RFC 9116 content below (Contact, Expires, and `# Brynja-Verification: <token>`).',
    webOptionAStep4:
      'Commit/deploy and open {url} in your browser to confirm.',
    webOptionACodeLabel: 'Recommended security.txt content (RFC 9116 + proof)',
    webOptionBTitle: 'Option B — Hosting Panel (cPanel, Hostinger, FTP)',
    webOptionBStep1:
      'Open File Manager and navigate to your public site root (usually public_html).',
    webOptionBStep2:
      'In File Manager settings, enable Show Hidden Files (dotfiles).',
    webOptionBStep3:
      'Create the .well-known folder (if missing) and create or edit security.txt inside it.',
    webOptionBStep4:
      'Paste the full RFC 9116 content (or append the # Brynja-Verification line to an existing security.txt), save, and click Verify Ownership here in Brynja.',
    webCleanupTitle:
      'How to revert and remove .well-known/security.txt later (optional)',
    webCleanupBody:
      'In web projects (Next.js/React/Vercel/Netlify), run the command below at the project root to remove the file completely (or delete only the # Brynja-Verification line to preserve RFC 9116 compliance). In cPanel/FTP, remove the file or verification line.',
    webCleanupCodeLabel: 'Remove verification file and .well-known folder in web project',
    dnsIntro:
      'Ideal when you do not have server file access but manage your domain DNS (Cloudflare, Route 53, GoDaddy, Vercel DNS, etc.). Create a record with the values below:',
    dnsColType: 'Type',
    dnsColName: 'Name / Host',
    dnsColValue: 'Value / Content',
    dnsColTtl: 'TTL',
    dnsHostAlt: '(or _brynja.{hostname})',
    dnsTtlValue: 'Auto / 300s',
    dnsCheckTitle: 'Check DNS propagation via terminal (optional)',
    dnsCheckBody:
      'After saving in your DNS panel (typically propagates in 1–10 minutes), verify from the terminal before clicking Verify Ownership:',
    dnsCheckLabel: 'Terminal (Linux / macOS / Windows)',
    dnsCheckCaption:
      'Once the output displays "{token}", DNS has propagated and verification will succeed immediately.',
    sandboxIntro:
      'This mode is exclusively for testing an application running locally on your own machine (http://localhost:3000, http://127.0.0.1:8080). For anti-SSRF security, it stays disabled on Vercel production.',
    sandboxCodeLabel: 'In your .env.local (local development only)',
    sandboxCodeCaption:
      'After saving in .env.local, restart the local server (pnpm dev), generate a challenge for http://localhost:<port>, and click Verify Ownership.',
    troubleshootingTitle: 'Quick troubleshooting if verification fails',
    tip1Lead: 'Returned HTML page or 404:',
    tip1Body:
      'check whether your reverse proxy (Nginx/Apache/Cloudflare/Vercel rewrites) is capturing /.well-known/, redirecting (301/302), or returning your app index.',
    tip2Lead: 'Keep the proof published after verification:',
    tip2Body:
      'leaving the file or DNS TXT record active allows Brynja to automatically renew your certificate after 7 days with no reconfiguration.',
    tip3Lead: 'Need to revoke access?',
    tip3Body:
      'simply delete the verification file (or DNS TXT record) and click the Revoke button in the target list above.',
    tip4Lead: 'Edited sites-available but still getting 404 (e.g. Next.js/Docker)?',
    tip4Body:
      'check whether sites-enabled/ contains a regular copy instead of a symlink, confirm the block is inside the HTTPS (port 443) virtual host, and wait ~1s after reload before testing with curl.',
    placeholderOrigin: 'https://yoursite.com',
    placeholderHost: 'yoursite.com',
    placeholderToken: 'brynja-verify-YOUR_GENERATED_TOKEN',
    dnsAltComment: '# Alternative (Windows / Linux / macOS):',
  },
  audit: {
    loading: 'Loading audit trail...',
    title: 'Immutable Probe Audit Trail',
    description:
      'All domain ownership checks, anti-SSRF blocks, rate limiting events, and safe probe executions for your account are stored locally in your browser (IndexedDB).',
    kpiTotal: 'Total Events',
    kpiAllowed: 'Authorized / Executed',
    kpiBlocked: 'Blocked by Guardrail',
    colDate: 'Date/Time',
    colOutcome: 'Outcome',
    colTarget: 'Target',
    colProbeMethod: 'Probe / Method',
    colStatus: 'Status',
    colDetails: 'Details',
    loadingRows: 'Loading logs...',
    emptyRows: 'No audit events recorded yet.',
  },
  changelog: {
    badge: 'Current Version: v{version} · SemVer 2.0.0',
    title: 'Release History (Changelog)',
    description:
      'Explore every new feature, architectural enhancement, and security fix shipped in each version of Brynja.',
    ptGithub: 'PT-BR on GitHub',
    enGithub: 'English (CHANGELOG.md)',
    empty: 'No versions recorded in the changelog yet.',
    latestBadge: 'Latest',
    spanishFallbackNote:
      'The detailed release notes below are shown in English (official CHANGELOG.md).',
  },
  compliance: {
    tabTitle: 'Compliance & Framework Scorecard',
    tabSubtitle:
      'Automated mapping of technical evidence collected during this scan (SCA/SBOM, CWE/KEV, Safe Probes, and Audit Trail) to CIS Controls v8, NIST CSF 2.0, OWASP, and LGPD/ISO 27001.',
    frameworkSelectorLabel: 'Compliance framework',
    igFilterLabel: 'CIS Group',
    igAll: 'All (IG1–IG3)',
    statusFilterLabel: 'Filter status',
    allStatuses: 'All statuses',
    kpiTechnicalAdherence: 'Technical Adherence',
    kpiOverallAdherence: 'Overall Adherence',
    kpiCompliant: 'Compliant',
    kpiGaps: 'Gaps',
    kpiPending: 'Manual / Pending',
    domainBreakdownTitle: 'Coverage by Domain / Function',
    scopeTechnical: 'Automated (Technical)',
    scopeHybrid: 'Hybrid (Technical + GRC)',
    scopeOrganizational: 'Organizational (GRC)',
    evidencePrefix: 'Evidence:',
    guidancePrefix: 'Guidance:',
    linkedAssessmentNote:
      'Combined with GRC assessment "{name}" stored locally in your browser.',
    openGovernanceCta: 'Complete manual attestations in Governance (GRC)',
    emptyFiltered: 'No controls match the active filters.',
    statusLabels: {
      COMPLIANT_EVIDENCE: 'Compliant (Technical Evidence)',
      MANUAL_ATTESTED: 'Attested (GRC)',
      PARTIAL: 'Partial',
      GAP_DETECTED: 'Gap Detected',
      MANUAL_REQUIRED: 'Manual Attestation Required',
      NOT_EVALUATED: 'Not Evaluated (SCA Only)',
      NOT_APPLICABLE: 'Not Applicable',
    },
    governance: {
      loading: 'Loading governance assessments...',
      badge: 'Local-First GRC (IndexedDB) · Zero Cloud DB',
      title: 'Governance & Compliance (CIS Controls · NIST CSF 2.0)',
      description:
        'Combine automated technical scan evidence with organizational attestations for policies, MFA, backups, and incident response — stored strictly locally in your browser.',
      newAssessmentBtn: 'New GRC Assessment',
      defaultAssessmentName: 'Security & Compliance Assessment',
      emptyTitle: 'No GRC assessments created yet.',
      emptySubtitle:
        'Create an assessment linked to a scan report to pre-populate technical controls across CIS Controls v8, NIST CSF 2.0, OWASP, and LGPD/ISO 27001.',
      assessmentsListTitle: 'Saved Assessments ({count})',
      assessmentNameLabel: 'Assessment / system name',
      assessmentNamePlaceholder: 'e.g., Production Web Portal — Q4',
      linkedScanLabel: 'Linked scan (technical evidence)',
      noLinkedScan: 'No linked scan (manual only)',
      targetIgLabel: 'Target CIS Implementation Group',
      saveAssessmentBtn: 'Save to Browser',
      savedToast: 'Assessment saved to IndexedDB!',
      deleteBtn: 'Delete',
      confirmDeleteBtn: 'Confirm delete',
      cancelBtn: 'Cancel',
      exportCsvBtn: 'Export CSV Matrix',
      ownerLabel: 'Owner',
      ownerPlaceholder: 'e.g., AppSec Team / DPO',
      noteLabel: 'GRC Evidence / Notes',
      notePlaceholder:
        'e.g., MFA enforced via Okta, IR-04 runbook reviewed Nov/2026...',
      attestationLabel: 'Manual Attestation',
      attestationOptions: {
        UNANSWERED: 'Unanswered',
        COMPLIANT: 'Implemented / Compliant',
        PARTIAL: 'Partially implemented',
        NON_COMPLIANT: 'Non-compliant (Gap)',
        NOT_APPLICABLE: 'Not applicable',
      },
      autoEvidenceBadge: 'Pre-filled from scan',
      lastUpdated: 'Updated {date}',
    },
  },
};
