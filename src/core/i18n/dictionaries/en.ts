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
    stackSummary: 'SCA / SBOM · OSV · NVD · EPSS · CISA KEV · 8 Safe Probes',
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
    kpiCriticalHigh: 'Critical & High',
    kpiConfirmed: 'Confirmed / Probes',
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
    kpiCritHigh: 'With Critical / High',
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
    critTitle: '{count} Critical',
    highTitle: '{count} High',
    medTitle: '{count} Medium',
    lowTitle: '{count} Low',
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
    generatingPdf: 'Generating PDF...',
    executivePdf: 'Executive PDF',
    executionError: 'Execution error: {message}',
    kpiDependencies: 'Dependencies',
    kpiCritical: 'Critical',
    kpiHigh: 'High',
    kpiMedium: 'Medium',
    kpiConfirmed: 'Confirmed / Probes',
    tabFindings: 'Vulnerabilities ({count})',
    tabDependencies: 'SBOM Inventory ({count})',
    tabProbes: 'Safe Probes ({count})',
    tabAudit: 'Audit Trail ({count})',
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
    methodWellKnown: 'File /.well-known/brynja-verify.txt',
    methodDns: 'DNS TXT Record (_brynja)',
    methodSandbox: 'Local Loopback Sandbox (dev)',
    generateButton: 'Generate Ownership Challenge',
    instructionPrefix: 'Verification Instruction:',
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
      'publicly reachable returning only your token. Choose how you deploy to your server:',
    subtabSsh: 'Via Remote Terminal (SSH)',
    subtabWeb: 'Without SSH (Vercel / Project / cPanel)',
    sshStep1Title: 'Step 1 — Connect to your remote server via terminal',
    sshStep1Body:
      'Open your computer terminal (Linux, macOS, or PowerShell/WSL on Windows) and connect over SSH:',
    sshStep1Label: 'Local terminal → SSH',
    sshStep1Caption:
      "Replace 'usuario' with your server username (e.g., root, ubuntu, deploy) or use an alias from your ~/.ssh/config.",
    sshStep2Title:
      'Step 2 — Create the .well-known folder and write the verification file',
    sshStep2Body:
      'Once connected to the remote server, run the command below to create the directory and write the exact token:',
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
      '), Nginx may forward the route to your app and return 404. Add this block inside',
    sshStep3BodyAfter: 'in your site config under',
    sshStep3Label: 'Nginx snippet (/etc/nginx/sites-available/...)',
    sshStep3ReloadLabel: 'Validate syntax and reload Nginx with zero downtime',
    sshStep3ApacheBodyBefore:
      'If your site runs Node.js, Next.js, Docker, or Python behind Apache (',
    sshStep3ApacheBodyMiddle:
      '), Apache may forward the route to your app and return 404. Add this block inside',
    sshStep3ApacheBodyAfter: 'in your site config under',
    sshStep3ApacheBodyOr: 'or',
    sshStep3ApacheLabel:
      'Apache snippet (/etc/apache2/sites-available/... or /etc/httpd/conf.d/...)',
    sshStep3ApacheCaption:
      'Important: place "ProxyPass /.well-known/ !" BEFORE "ProxyPass / ...". If your proxy uses <Location />, add "<Location /.well-known/> ProxyPass ! </Location>" after it; if using mod_rewrite ([P]), add "RewriteCond %{REQUEST_URI} !^/\\.well-known/".',
    sshStep3ApacheReloadLabel:
      'Validate syntax and reload Apache with zero downtime',
    sshStep3ApacheReloadCaption:
      'On RHEL, Rocky, Alma, CentOS, or Fedora, run: sudo httpd -t && sudo systemctl reload httpd',
    sshStep4Title: 'Step 4 — Test from the terminal that the file is public',
    sshStep4Body:
      'Run the command below (on the server or locally). It should print your exact token:',
    sshStep4Label: 'Quick check via curl',
    sshStep4Caption:
      'Expected output: {token}. If that exact string appears, scroll up and click "Verify Ownership"!',
    sshStep5Title:
      'Step 5 — (Optional) Revert everything: remove the file, .well-known folder, and Step 3 (Nginx / Apache)',
    sshStep5Body:
      'Whenever you want to restore your server to its exact previous state (or revoke access), follow the steps below. Note: removing the file stops automatic 7-day certificate renewal.',
    sshStep5RemoveFileLabel:
      '5.1 — Remove .well-known/brynja-verify.txt and the .well-known folder (if empty)',
    sshStep5RemoveFileCaption:
      'Deletes brynja-verify.txt and removes the .well-known folder only if empty (safely preserving existing folders such as Certbot/Let’s Encrypt acme-challenge). Adjust /var/www/html if you used a different web root.',
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
      'Create public/.well-known/brynja-verify.txt and paste only the token below inside it.',
    webOptionAStep4:
      'Commit/deploy and open {url} in your browser to confirm.',
    webOptionACodeLabel: 'Exact content of brynja-verify.txt',
    webOptionBTitle: 'Option B — Hosting Panel (cPanel, Hostinger, FTP)',
    webOptionBStep1:
      'Open File Manager and navigate to your public site root (usually public_html).',
    webOptionBStep2:
      'In File Manager settings, enable Show Hidden Files (dotfiles).',
    webOptionBStep3:
      'Create the .well-known folder (if missing) and create brynja-verify.txt inside it.',
    webOptionBStep4:
      'Edit the file, paste only the token, save, and click Verify Ownership here in Brynja.',
    webCleanupTitle:
      'How to revert and remove .well-known/brynja-verify.txt later (optional)',
    webCleanupBody:
      'In web projects (Next.js/React/Vercel/Netlify), run the command below at the project root and commit/deploy. In cPanel/FTP, delete brynja-verify.txt and remove the .well-known folder if it is empty.',
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
};
