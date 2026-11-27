import type {
  LocalizedPresentationDeck,
  PresentationSlide,
  SlideChapterMeta,
} from '../models/presentation.models';

export const PRESENTATION_CHAPTERS_EN: readonly SlideChapterMeta[] = [
  { id: 'vision', label: 'Vision & Value' },
  { id: 'onboarding', label: 'Access & Setup' },
  { id: 'analysis', label: 'The 4 Analysis Layers' },
  { id: 'results', label: 'Reports, GRC & Audit' },
  { id: 'adoption', label: 'Routine & 30-Day Pilot' },
];

export const BRYNJA_PRESENTATION_SLIDES_EN: readonly PresentationSlide[] = [
  {
    id: 'hero-cover',
    number: 1,
    chapter: 'vision',
    isHeroCover: true,
    kicker: 'Executive & Technical Presentation · IT Team & Leadership',
    title: 'Brynja',
    subtitle:
      'Proactive Application Security Platform — from code and dependency inspection to non-destructive active verification and regulatory compliance.',
    visual: 'hero-cover',
    highlights: [
      {
        title: 'Local-First & Zero Cost',
        description: 'Zero cloud database required',
      },
      {
        title: '8 SCA Ecosystems',
        description: 'OSV · NVD · EPSS · CISA KEV',
      },
      {
        title: '19 Safe Probes',
        description: 'Read-only checks (GET / HEAD)',
      },
      {
        title: 'GRC Governance',
        description: 'CIS v8 · NIST · OWASP · LGPD',
      },
    ],
    itDetails: {
      summary:
        'Next.js 15 App Router (SOLID) · Vercel Serverless · IndexedDB isolated per GitHub account · Anti-SSRF guardrails & AES-256-GCM certificates.',
      tags: ['100% Serverless', 'Local-First', 'Open-Source MIT', 'Defensive'],
    },
    presenterNotes:
      'Opening slide while everyone joins the room or call. Introduce the name Brynja ("chainmail armor" in Old Norse) and preview the agenda: in roughly 25 minutes we will walk through business value, Local-First privacy, all 7 platform stages in practice, and a zero-cost 30-day pilot proposal.',
    estimatedTime: '0.5 min',
  },
  {
    id: 'cover',
    number: 2,
    chapter: 'vision',
    kicker: 'Platform Overview',
    title: 'Why Brynja? Layered Security Without Friction',
    subtitle:
      'From code and third-party library inspection to regulatory compliance (LGPD, ISO 27001, CIS v8), with zero cloud database and zero risk of disrupting systems.',
    analogy:
      'Brynja (pronounced BRIN-ya) means "chainmail armor" in Old Norse: hundreds of interlocking rings that distribute impact without immobilizing its wearer.',
    visual: 'cover',
    highlights: [
      {
        title: 'For Executive Leadership',
        description:
          'Clear business-risk visibility, compliance alignment (LGPD/ISO/CIS), and near-zero infrastructure cost.',
      },
      {
        title: 'For the IT Team',
        description:
          'Full diagnosis in minutes with exact fix versions, non-destructive checks, and seamless GitHub integration.',
      },
      {
        title: 'For Privacy & Compliance',
        description:
          'Local-First architecture: scan history and reports stay in the owner’s browser, never stored on external cloud servers.',
      },
    ],
    itDetails: {
      summary:
        'Next.js 15 App Router (SOLID architecture) · 100% Vercel Serverless + IndexedDB · 8 SCA ecosystems · Static Analysis · 19 Safe Probes · GRC Engine + BYOK AI.',
      tags: [
        '100% Serverless',
        'Local-First',
        '8 Ecosystems',
        '19 Safe Probes',
        'Auto GRC',
        'Open-Source MIT',
      ],
    },
    presenterNotes:
      'Welcome! Explain that this deck is crafted for both audiences in the room: business value, privacy, and governance for leadership, alongside the step-by-step operational workflow for IT. Tip: use the "Executive Only" button at the top anytime to hide technical strips live.',
    estimatedTime: '1 min',
  },
  {
    id: 'problem',
    number: 3,
    chapter: 'vision',
    kicker: 'Why act now?',
    title: 'The Current Challenge in Application Security',
    subtitle:
      'Organizations today face a hard trade-off: stay exposed to known vulnerabilities or overpay for complex tools teams struggle to operate.',
    visual: 'problem',
    highlights: [
      {
        title: 'Modern software is built from third-party parts',
        description:
          'Over 80% of a web application relies on external libraries. A flaw in a single forgotten package can expose the whole company.',
      },
      {
        title: 'High license costs & cloud privacy exposure',
        description:
          'Traditional enterprise platforms charge per developer and require uploading source code, credentials, and vulnerability reports to external servers.',
      },
      {
        title: 'Technical noise without executive clarity',
        description:
          'IT receives hundreds of raw alerts while leadership needs clear answers: "what is urgent, what is the business impact, and are we compliant?"',
      },
    ],
    itDetails: {
      summary:
        'Consolidates what usually takes 4–5 separate tools (SCA/SBOM, Secret Scanner, IaC/SAST, passive DAST, and GRC) with zero vendor lock-in and zero managed database cost.',
      tags: ['Supply Chain', 'Shadow Secrets', 'Alert Fatigue', 'IT ↔ Board Gap'],
    },
    presenterNotes:
      'Frame the pain before introducing the tool. Emphasize that real-world breaches rarely come from movie-style hackers: they stem from an outdated library, a forgotten .env file on a server, or a leaked key in a repository. Brynja closes those doors before they become incidents.',
    estimatedTime: '1.5 min',
  },
  {
    id: 'chainmail',
    number: 4,
    chapter: 'vision',
    kicker: 'Our Philosophy',
    title: 'Defense in Depth: How Chainmail Armor Protects',
    subtitle:
      'Instead of relying on a single isolated check, Brynja weaves four complementary layers into one simple platform.',
    analogy:
      'If one check looks only at source code and another only at the live website, gaps slip between them. Brynja bridges both worlds and turns findings into an action plan.',
    visual: 'chainmail',
    highlights: [
      {
        title: 'Ring 1 — What the system uses (SCA / SBOM)',
        description:
          'Inventories every installed library and checks global intelligence feeds for vulnerabilities already exploited in the wild.',
      },
      {
        title: 'Ring 2 — What is written in the repository',
        description:
          'Detects leaked secrets, insecure container/cloud configurations (Docker, Terraform, CI/CD), and risky code patterns.',
      },
      {
        title: 'Ring 3 — How the live site responds (19 Safe Probes)',
        description:
          'Runs a 100% safe, read-only health check on the published URL (headers, cookies, exposed files, DNS).',
      },
      {
        title: 'Ring 4 — Decision, Optional AI & Governance',
        description:
          'Translates everything into business priorities (P0–P3), Executive PDFs for leadership, and CIS, NIST, OWASP & LGPD matrices.',
      },
    ],
    itDetails: {
      summary:
        'Real SBOM-to-runtime correlation (RuntimeFingerprintProbe upgrades CVEs to CONFIRMED_ACTIVE when the vulnerable library is observed on the live site).',
      tags: ['SCA + SBOM', 'SAST/Secrets/IaC', '19 Safe Probes', 'GRC & BYOK AI'],
    },
    presenterNotes:
      'Use the 4-ring diagram to show how Brynja differs from a generic scanner. It does not just dump a technical list: it inspects the code, validates the live site, and transforms everything into executive decisions and compliance evidence.',
    estimatedTime: '1.5 min',
  },
  {
    id: 'local-first',
    number: 5,
    chapter: 'vision',
    kicker: 'Architecture & Privacy',
    title: 'Zero Cloud Database: Local-First Privacy & Zero Infra Cost',
    subtitle:
      'One of the biggest wins for Leadership and Legal: Brynja never stores source code, passwords, or company reports on any external server.',
    analogy:
      'Brynja’s server works like an X-ray machine: it processes the exam on the spot and hands the report straight back to the user’s computer without keeping a copy.',
    visual: 'local-first',
    highlights: [
      {
        title: 'Data stays in the owner’s browser',
        description:
          'Scan history, SBOM inventories, domain authorizations, and GRC assessments live locally (IndexedDB), strictly isolated per GitHub account.',
      },
      {
        title: 'Ephemeral session that wipes itself',
        description:
          'GitHub access is encrypted solely inside the active browser session and discarded as soon as the user signs out or closes the browser.',
      },
      {
        title: 'Near-zero infrastructure cost',
        description:
          'Runs 100% serverless (1-click deploy on Vercel free tier), with no dedicated server, no database maintenance, and zero per-seat licenses.',
      },
    ],
    itDetails: {
      summary:
        'OAuth session sealed in an AES-256-GCM HttpOnly cookie without Max-Age/Expires; IndexedDB partitioned by ownerGithubUserId with local JSON v2 backup/restore; stateless Next.js Route Handlers (maxDuration=60).',
      tags: [
        'AES-256-GCM',
        'Ephemeral HttpOnly Cookie',
        'Isolated IndexedDB',
        'Vercel Free Tier',
      ],
    },
    presenterNotes:
      'This slide usually wins immediate support from Leadership, Legal, and DPO teams. Reinforce that there is no cloud database hoarding company vulnerability records — centralized breach risk is eliminated by design, at virtually zero hosting cost.',
    estimatedTime: '2 min',
  },
  {
    id: 'journey-map',
    number: 6,
    chapter: 'onboarding',
    kicker: 'End-to-End View',
    title: 'Complete Platform Map: The 7 Stages in Practice',
    subtitle:
      'The entire lifecycle — from first sign-in to delivering an executive report — follows a guided, auditable, repeatable workflow.',
    visual: 'journey-map',
    highlights: [
      {
        title: 'Safe preparation (Stages 1 to 3)',
        description:
          'GitHub sign-in, cryptographic proof of domain ownership, and project/ecosystem selection in under 2 minutes.',
      },
      {
        title: 'Layered automated inspection (Stage 4)',
        description:
          'Pipeline executes SCA/CVEs, Static Analysis, 19 Safe Probes, and (optionally) BYOK AI triage with live stage progress.',
      },
      {
        title: 'Action, Governance & Continuous Improvement (Stages 5 to 7)',
        description:
          'Role-tailored reports (PDF, Excel, AI JSON, SBOM), GRC scorecard, Scan Diff tracking, and immutable audit trail.',
      },
    ],
    itDetails: {
      summary:
        'Dedicated App Router screens: / (Dashboard), /authorizations, /scans/new, /scans/[id], /governance, /history, and /audit — in 3 languages (PT-BR, EN, ES) with Dark/Light themes.',
      tags: ['7 Guided Stages', 'Live Pipeline', 'PT-BR / EN / ES', 'Dark & Light'],
    },
    presenterNotes:
      'Present this slide as the journey map. From the next slide onward, we will walk through each of the 7 stages in detail, showing what IT operates and what Leadership receives at the end.',
    estimatedTime: '1 min',
    demoLink: { label: 'Open Dashboard (/)', href: '/' },
  },
  {
    id: 'stage-auth',
    number: 7,
    chapter: 'onboarding',
    kicker: 'Stage 1 of 7',
    title: 'Secure GitHub Sign-In & Multi-User Isolation',
    subtitle:
      'Team members sign in with their existing corporate GitHub account — no new passwords — accessing personal, private, and Organization repositories.',
    visual: 'stage-auth',
    highlights: [
      {
        title: 'Zero new passwords to manage',
        description:
          'Uses official GitHub OAuth, strictly respecting the repository permissions each engineer already holds.',
      },
      {
        title: 'Full Organization & private repo support',
        description:
          'Lists organization repositories and lets teams choose any branch (main, staging, feature) to audit before releasing.',
      },
      {
        title: 'Also works without linking a repository',
        description:
          'Teams can paste dependency manifests manually (e.g., package.json) or import external security reports without exposing source code.',
      },
    ],
    itDetails: {
      summary:
        'GitHub OAuth (repo, read:user, user:email, read:org scopes) with pagination across /user/repos and /orgs/{org}/repos, OAuth CSRF state cookie, and AES-256-GCM sealed session.',
      tags: ['GitHub OAuth', 'Private & Org Repos', 'Manual Mode', 'CSRF Protection'],
    },
    presenterNotes:
      'Keep it simple: Brynja does not create shadow user accounts or ask IT to share service passwords. Everyone signs in with their own GitHub identity, sees only what they already have access to, and the session token vanishes on sign-out.',
    estimatedTime: '1.5 min',
    demoLink: { label: 'Open Dashboard / Sign-In', href: '/' },
  },
  {
    id: 'stage-authz',
    number: 8,
    chapter: 'onboarding',
    kicker: 'Stage 2 of 7',
    title: 'Cryptographic Domain Authorization (100% Ethical Use)',
    subtitle:
      'Brynja NEVER runs active probes against any URL without first proving mathematically that the organization owns that domain.',
    analogy:
      'Like a certified locksmith who verifies property ownership before touching a lock — preventing accidental or unauthorized testing against third parties.',
    visual: 'stage-authz',
    highlights: [
      {
        title: 'Two official verification methods',
        description:
          'Publish a unique verification token in the RFC 9116 /.well-known/security.txt file or add a _brynja DNS TXT record on the domain.',
      },
      {
        title: 'Turnkey setup guide for Infra / IT',
        description:
          'Automatically generates copy-ready snippets (SSH, Nginx, Apache, Docker) plus an optional cleanup step if teams want to remove it later.',
      },
      {
        title: 'Auto-renewing certificate with instant revocation',
        description:
          'Issues a 7-day signed certificate that renews live as long as the proof stays published — and blocks immediately if removed.',
      },
    ],
    itDetails: {
      summary:
        'Deterministic HMAC-SHA256 challenge scoped per user + origin; stateless AES-256-GCM certificate (AUTHORIZATION_TTL_DAYS=7) verified live before every Safe Probe run + legacy /.well-known/brynja-verify.txt fallback.',
      tags: ['HMAC-SHA256', 'RFC 9116 security.txt', 'DNS TXT _brynja', 'AES-256-GCM Cert'],
    },
    presenterNotes:
      'This reassures both Leadership and Legal: unauthorized scanning is blocked cryptographically in code. For IT, show how /authorizations generates ready-to-paste Nginx, Apache, and Docker snippets — cutting setup to under 3 minutes.',
    estimatedTime: '2 min',
    demoLink: { label: 'Open Targets & Guardrails', href: '/authorizations' },
  },
  {
    id: 'stage-new-scan',
    number: 9,
    chapter: 'onboarding',
    kicker: 'Stage 3 of 7',
    title: 'Launching a Scan & 8 Supported Ecosystems',
    subtitle:
      'On a single screen, the analyst picks the project, selects desired layers, and sees full transparency across major technology stacks.',
    visual: 'stage-new-scan',
    highlights: [
      {
        title: 'Modular 3-click setup',
        description:
          '1) Pick repository & branch (or paste a manifest) · 2) Enable static code/secrets/IaC checks · 3) Optionally attach an authorized URL.',
      },
      {
        title: '8 software ecosystems supported natively',
        description:
          'Node.js/JS/TS, Python, Go, Rust, Java/Kotlin (Maven/Gradle), .NET (C#), PHP, and Ruby — plus stack-agnostic cloud, container, and web layers.',
      },
      {
        title: 'Complete transparency before running',
        description:
          'The page itself displays the supported languages matrix and the full catalog of all 19 read-only probes that will inspect the target.',
      },
    ],
    itDetails: {
      summary:
        'Canonical registries enforced by 1-to-1 backend/UI parity tests: npm/pnpm/yarn, PyPI, Go, crates.io, Maven/Gradle, NuGet (*.csproj/packages.lock.json), Packagist, and RubyGems.',
      tags: ['8 SCA Ecosystems', 'Native JS/TS & Python SAST', 'Transparent Catalog', 'Live Pipeline'],
    },
    presenterNotes:
      'Highlight for IT that Brynja is not locked to a single stack: companies running legacy .NET, Java, or PHP alongside modern Node.js, Python, or Go services can centralize assessments in one platform.',
    estimatedTime: '1.5 min',
    demoLink: { label: 'Open New Scan', href: '/scans/new' },
  },
  {
    id: 'layer-sca',
    number: 10,
    chapter: 'analysis',
    kicker: 'Stage 4 · Layer 1 of 4',
    title: 'Dependency Inventory (SCA/SBOM) & Real Threat Intelligence',
    subtitle:
      'Brynja builds the exact "ingredient label" of your application and correlates every library in parallel against 5 global security feeds — prioritizing what truly matters.',
    analogy:
      'Instead of flooding teams with theoretical noise, we highlight which parts have critical flaws, the real-world exploit probability, and what attackers are exploiting today.',
    visual: 'layer-sca',
    highlights: [
      {
        title: 'Exact lockfile resolution (zero false-positive noise)',
        description:
          'Prioritizes lockfiles to check exact pinned versions in production and identifies the exact fixed version to upgrade to.',
      },
      {
        title: 'Parallel lookup across 5 public intelligence sources',
        description:
          'OSV.dev (Google), NVD 2.0 (US NIST), FIRST EPSS (exploit probability), CISA KEV (active real-world exploitation), and deps.dev (licenses & project health).',
      },
      {
        title: 'Legal license alerts & supply-chain health',
        description:
          'Surfaces SPDX licenses (flagging restrictive GPL/AGPL terms) alongside OpenSSF Scorecard health ratings for each package.',
      },
    ],
    itDetails: {
      summary:
        'AnalyzeScaUseCase with SemVer fixed-version resolution via OSV.dev querybatch + parallel enrichment (Promise.all) across NVD API 2.0 (CVSS v3/v4 + CWE), FIRST EPSS, CISA KEV, and api.deps.dev/v3 with in-memory cache.',
      tags: ['OSV.dev', 'NVD NIST 2.0', 'FIRST EPSS', 'CISA KEV', 'deps.dev / OpenSSF'],
    },
    presenterNotes:
      'Explain CISA KEV and EPSS to Leadership: when a CVE appears in the CISA KEV catalog, attackers are actively exploiting that exact flaw on the internet right now — making it an unmistakable P0 priority without guesswork.',
    estimatedTime: '2 min',
  },
  {
    id: 'layer-static',
    number: 11,
    chapter: 'analysis',
    kicker: 'Stage 4 · Layer 2 of 4',
    title: 'Static Analysis: Code, Secrets, Infrastructure & Posture',
    subtitle:
      'Before code ever reaches production, Brynja inspects the repository for forgotten credentials, cloud misconfigurations, and unsafe coding patterns.',
    visual: 'layer-static',
    highlights: [
      {
        title: 'Secret Scanner with mandatory masking',
        description:
          'Detects AWS, GitHub, Stripe, Google, and Slack keys, database passwords, and committed .env files — always masking values so raw secrets are never stored.',
      },
      {
        title: 'Infrastructure (IaC) & CI/CD Pipeline Audit',
        description:
          'Reviews Dockerfiles (root user, :latest), docker-compose, Terraform (0.0.0.0/0 open ports, public buckets), Kubernetes, and GitHub Actions.',
      },
      {
        title: 'Lightweight SAST & Repository Hygiene',
        description:
          'Flags risky JS/TS & Python patterns (concatenated SQL, interpolated shell, eval) and checks SECURITY.md, Dependabot, CODEOWNERS, and branch protection.',
      },
    ],
    itDetails: {
      summary:
        'POST /api/analyze/static runs SecretScannerAnalyzer (with maskSecretMatch), IacCicdAnalyzer, LightweightSastAnalyzer (JS/TS/Python), and GitHubPostureAnalyzer, mapping findings directly to CIS v8 / OWASP / LGPD.',
      tags: ['Masked Secret Scanner', 'Dockerfile / Terraform / K8s', 'GitHub Actions', 'JS/TS & Python SAST'],
    },
    presenterNotes:
      'Emphasize a key privacy safeguard: when Secret Scanner catches a leaked key, it reports only the file path, line number, and a masked snippet — the actual secret is never saved to reports or IndexedDB, so IT can revoke it without multiplying exposure.',
    estimatedTime: '2 min',
  },
  {
    id: 'layer-probes',
    number: 12,
    chapter: 'analysis',
    kicker: 'Stage 4 · Layer 3 of 4',
    title: '19 Safe Probes: Non-Destructive Live Application Check-Up',
    subtitle:
      'For verified domains, Brynja executes 19 read-only checks emulating a defensive specialist — without modifying a single byte of application data.',
    analogy:
      'Like a medical check-up with a stethoscope and imaging scan: detects real risks fast, with zero invasive surgery.',
    visual: 'layer-probes',
    highlights: [
      {
        title: 'Headers, TLS Encryption & Email DNS (5 probes)',
        description:
          'Validates enforced HTTPS (HSTS), CSP, Permissions-Policy, Cross-Origin isolation (COOP/CORP/COEP), and anti-spoofing email DNS (SPF, DMARC, CAA, MTA-STS).',
      },
      {
        title: 'Cookies, Session, CORS & Redirects (4 probes)',
        description:
          'Checks session hijacking defenses (HttpOnly/Secure/SameSite), overly permissive CORS, cache leakage, and Open Redirect flaws.',
      },
      {
        title: 'Exposed Files, Backups, APIs & Runtime (10 probes)',
        description:
          'Tests for public .git, .env, SQL backups, phpinfo, exposed Swagger/metrics, GraphQL/OAuth, stack traces, Source Maps, CDN SRI integrity, and security.txt.',
      },
    ],
    itDetails: {
      summary:
        '19 IControlledProbe modules registered via OCP container with per-scan GET / memoization; RuntimeFingerprintProbe correlates exposed frontend libraries against the SBOM to confirm active exposure.',
      tags: ['19 Active Probes', '4 Categories', 'Passive SPF/DMARC DNS', 'Runtime ↔ SBOM Correlation'],
    },
    presenterNotes:
      'Highlight how the 19 Safe Probes catch real-world mistakes that cause breaches every day — such as an exposed .env or backup.sql file, missing DMARC/SPF email protection, or verbose stack traces — all without touching the database.',
    estimatedTime: '2 min',
    demoLink: { label: 'View 19 Safe Probes Catalog', href: '/scans/new' },
  },
  {
    id: 'guardrails',
    number: 13,
    chapter: 'analysis',
    kicker: 'Inviolable Security Clause',
    title: 'Hard Guardrails: Why Brynja Cannot Take Down Systems',
    subtitle:
      'The #1 question from every Infrastructure team and Board: "Could this tool take our site offline or probe our internal network?" The technical answer is NO.',
    visual: 'guardrails',
    highlights: [
      {
        title: 'Strict Read-Only Policy (GET & HEAD only)',
        description:
          'Code physically blocks any write, mutation, brute-force login, or form-submission request.',
      },
      {
        title: 'Anti-SSRF Shield (Internal Network Untouchable)',
        description:
          'Resolves DNS pre-flight and blocks private IP ranges, corporate intranets, and cloud metadata endpoints (AWS/GCP/Azure).',
      },
      {
        title: 'Rate Limiter & Automatic Circuit Breaker',
        description:
          'Enforces a gentle pace (max 2 req/s, cap of 80 req/scan). If the target signals stress or errors (429/5xx), the breaker aborts immediately.',
      },
    ],
    itDetails: {
      summary:
        'SafeProbePolicy + SsrfDnsGuardService (blocks RFC1918, CGNAT, link-local 169.254.169.254, and loopback in production) + RateLimitedSafeHttpClient (Origin/Accept header allowlist only, 5s timeout, circuit breaker) + OwnershipCertificateService.',
      tags: ['GET / HEAD Only', 'Anti-SSRF DNS Guard', '2 req/s · Max 80', '429/5xx Circuit Breaker'],
    },
    presenterNotes:
      'Pause calmly on this slide — it removes every concern from Infrastructure and DevOps. Stress that these guardrails are not optional guidelines: they are enforced architectural invariants verified by automated tests on every release.',
    estimatedTime: '1.5 min',
  },
  {
    id: 'layer-ai',
    number: 14,
    chapter: 'analysis',
    kicker: 'Stage 4 · Layer 4 of 4 (Optional)',
    title: 'AppSec AI Advisor (BYOK Under Full Company Control)',
    subtitle:
      'Whenever teams want faster triage, they can connect their own AI key (OpenAI, Google Gemini, or internal endpoint) for an executive diagnosis and prioritized plan.',
    visual: 'layer-ai',
    highlights: [
      {
        title: '100% Optional & Bring Your Own Key (BYOK)',
        description:
          'Your company chooses whether to enable it, selects the provider (OpenAI, Gemini, or corporate endpoint), and keeps the key exclusively in the browser.',
      },
      {
        title: 'Privacy Preserved: Zero Raw Source or Secrets',
        description:
          'Sends only sanitized vulnerability metadata and reachability hints (whether a package is actually imported) — never secrets or full codebases.',
      },
      {
        title: 'Immediate Value for Leadership and IT',
        description:
          'Produces a plain-language Executive Diagnosis plus numbered remediation steps, automatically included in the Executive PDF.',
      },
    ],
    itDetails: {
      summary:
        'ByokAgentAdvisorAdapter + POST /api/analyze/advise & /api/analyze/advise/models (live text-model discovery excluding image/audio/video, protected by SsrfDnsGuardService on custom endpoints) + computeReachabilityHints.',
      tags: ['BYOK OpenAI / Gemini / Custom', 'Reachability Hints', 'Sanitized Metadata', 'Included in PDF'],
    },
    presenterNotes:
      'Clarify to Leadership that Brynja works 100% without AI — yet when the company already has a corporate OpenAI or Gemini account, BYOK turns technical findings into an executive summary and surgical fix order in seconds with no middleman.',
    estimatedTime: '1.5 min',
  },
  {
    id: 'stage-reports',
    number: 15,
    chapter: 'results',
    kicker: 'Stage 5 of 7',
    title: 'Smart Reports: From the Boardroom to the Codebase',
    subtitle:
      'A single scan produces tailored views and exports for every stakeholder — eliminating manual spreadsheets and slide-building.',
    visual: 'stage-reports',
    highlights: [
      {
        title: 'For Leadership & Management (Executive PDF)',
        description:
          'Executive briefing with P0–P3 SLA priority tiers, plain business impact, remediation roadmap, Compliance Matrix, and AI Diagnosis.',
      },
      {
        title: 'For IT & Coding Assistants',
        description:
          'Dedicated tabs (CVEs, Code/IaC, Safe Probes), celebratory "Intact Shield (100% Passed)" badge when clean, and 1-click "JSON for AI" ready to fix with copilots.',
      },
      {
        title: 'For Enterprise Clients, Auditors & Supply Chain',
        description:
          'One-click export to global standards: CycloneDX 1.5 SBOM, SPDX 2.3, SARIF 2.1.0, Markdown, and full technical JSON.',
      },
    ],
    itDetails: {
      summary:
        'RemediationPlanPresenter (P0–P3), ScanPdfExporter (jsPDF), AiRemediationJsonExporter (brynja.ai-remediation.v1 schema with SemVer deduplication), CycloneDX 1.5, SPDX 2.3, and SARIF 2.1.0.',
      tags: ['Executive PDF P0–P3', '1-Click AI JSON', 'CycloneDX & SPDX', 'SARIF 2.1.0'],
    },
    presenterNotes:
      'This slide unites both audiences in the room. For Leadership: the Executive PDF is board-ready out of the box, highlighting P0 urgency and business impact. For IT: "Copy JSON for AI" delivers exact upgrade commands and fixes in minutes.',
    estimatedTime: '2 min',
    demoLink: { label: 'Open Scan History', href: '/history' },
  },
  {
    id: 'stage-governance',
    number: 16,
    chapter: 'results',
    kicker: 'Stage 6 of 7',
    title: 'Governance, Risk & Compliance (Automated GRC)',
    subtitle:
      'Brynja automatically maps technical scan evidence to the 4 leading security and privacy frameworks demanded by clients and regulators.',
    visual: 'stage-governance',
    highlights: [
      {
        title: '4 Corporate Frameworks Built-In',
        description:
          'CIS Controls v8 (IG1, IG2 & IG3 groups), NIST CSF 2.0, OWASP ASVS / Top 10, and LGPD (Arts. 46, 48 & 50) & ISO/IEC 27001:2022.',
      },
      {
        title: 'Technical Adherence + Organizational Attestations',
        description:
          'Combines automated scan evidence with manual organizational controls (policies, training, backups), cleanly separating technical vs. global scores.',
      },
      {
        title: 'Audit & Board-Ready Deliverables',
        description:
          'Exports styled multi-tab Excel (.xlsx) workbooks for auditors + failures-only AI Gaps JSON + built-in educational guide ("What is governance?").',
      },
    ],
    itDetails: {
      summary:
        'CompliancePresenter + /governance persisted in IndexedDB (grcAssessments); zero-dependency native OOXML generator (xlsx-workbook.builder.ts) with formula-injection protection + brynja.ai-governance-gaps.v1.',
      tags: ['CIS v8 (IG1–IG3)', 'NIST CSF 2.0', 'OWASP ASVS', 'LGPD & ISO 27001', 'Multi-Tab Excel .xlsx'],
    },
    presenterNotes:
      'Show the strategic value for Leadership: when an enterprise client, bank, or auditor asks "how do you evidence LGPD, ISO 27001, or CIS compliance?", your team generates a styled multi-tab Excel workbook backed by real technical evidence in one click.',
    estimatedTime: '2 min',
    demoLink: { label: 'Open Governance & GRC', href: '/governance' },
  },
  {
    id: 'stage-history-audit',
    number: 17,
    chapter: 'results',
    kicker: 'Stage 7 of 7',
    title: 'History, Evolution (Scan Diff), Imports & Audit Trail',
    subtitle:
      'Security is not a one-time snapshot — it is a continuous movie. Brynja tracks how every system improves over time and logs every check performed.',
    visual: 'stage-history-audit',
    highlights: [
      {
        title: 'Scan Comparator (Scan Diff)',
        description:
          'Compares two scan dates side by side to prove progress: resolved vulnerabilities, newly introduced issues, and CIS/NIST score delta.',
      },
      {
        title: 'External Scanner Consolidator',
        description:
          'Imports Trivy, Semgrep, Prowler, and SARIF 2.1.0 reports into the same local history, complete with local Backup & Restore.',
      },
      {
        title: 'Immutable Local Audit Trail (/audit)',
        description:
          'Records timestamp, target URL, HTTP method (GET/HEAD), status code, and certificate used for every single probe — giving Infra full traceability.',
      },
    ],
    itDetails: {
      summary:
        'computeScanDiff in /history, parseExternalSecurityReport (OASIS SARIF 2.1.0, Trivy JSON, Semgrep JSON, Prowler OCSF/JSON), LocalBackupBundle v2 export/import, and full /audit trail.',
      tags: ['Scan Diff', 'Trivy/Semgrep/Prowler Import', '/audit Trail', 'Local Backup'],
    },
    presenterNotes:
      'Highlight Scan Diff for Leadership: it proves the ROI of IT’s security work! Instead of just saying "we improved security", IT shows objectively: "we closed 14 critical CVEs and raised CIS v8 adherence from 58% to 89% in 3 weeks."',
    estimatedTime: '1.5 min',
    demoLink: { label: 'Open Audit Trail', href: '/audit' },
  },
  {
    id: 'daily-routine',
    number: 18,
    chapter: 'adoption',
    kicker: 'Day-to-Day Operations',
    title: 'How IT and Leadership Operate Brynja in Practice',
    subtitle:
      'Zero bureaucracy: the platform fits naturally into IT’s release cadence and leadership’s monthly governance reviews.',
    visual: 'daily-routine',
    highlights: [
      {
        title: 'IT Team Routine (15 min per cycle)',
        description:
          'Weekly or pre-release: run a scan, check Scan Diff to prevent regressions, and apply P0/P1 fixes using exact remediation commands.',
      },
      {
        title: 'Infrastructure & Security Routine',
        description:
          'Maintain verified domain authorizations on staging/production, review the /audit trail, and consolidate external reports (Trivy/Semgrep/Prowler).',
      },
      {
        title: 'Leadership & Governance Routine (Monthly)',
        description:
          'Review the Executive PDF + GRC Excel workbook, track CIS/LGPD progress, and share SBOM/compliance evidence as a B2B commercial differentiator.',
      },
    ],
    itDetails: {
      summary:
        'Lightweight workflow that never blocks emergency hotfixes: onboarding a new application takes ~5 minutes (domain authorization + baseline scan + GRC link).',
      tags: ['Pre-Release IT', 'Monthly Board Review', '5-Min Onboarding', 'Client Evidence'],
    },
    presenterNotes:
      'Emphasize low operational overhead. Nobody needs to be a pentester to use Brynja: IT gains speed with direct answers, and Leadership gets predictable monthly visibility without decoding technical jargon.',
    estimatedTime: '1.5 min',
  },
  {
    id: 'pilot-roadmap',
    number: 19,
    chapter: 'adoption',
    kicker: 'Next Steps & Approval',
    title: 'Proposed 30-Day Pilot Plan — Zero Risk, Zero License Cost',
    subtitle:
      'A practical 4-week validation plan to prove Brynja internally before standardizing across all company applications.',
    visual: 'pilot-roadmap',
    highlights: [
      {
        title: 'Week 1 — Setup & 2–3 Pilot Systems',
        description:
          'Deploy on Vercel (free tier), verify selected staging domains, and capture the initial security baseline.',
      },
      {
        title: 'Week 2 — Fast Remediation (P0/P1 Quick Wins)',
        description:
          'IT resolves critical/high vulnerabilities, essential headers, and any leaked secrets/IaC gaps — verifying gains via Scan Diff.',
      },
      {
        title: 'Weeks 3 & 4 — GRC Baseline & Board Review',
        description:
          'Generate the first CIS v8 (IG1) + LGPD/ISO Excel matrix and present the "before vs. after" results to approve full portfolio rollout.',
      },
    ],
    itDetails: {
      summary:
        'Technical prerequisites to start today: 1 corporate GitHub OAuth App, 1 AES-256 key (TOKEN_ENCRYPTION_KEY), ALLOW_LOCAL_LOOPBACK_TARGETS=false, and optional free NVD_API_KEY.',
      tags: ['30-Day Pilot', 'Zero License Cost', '2–3 Pilot Apps', 'Before vs. After'],
    },
    presenterNotes:
      'Close with a crisp, zero-risk ask for the table: "Can we approve this 30-day pilot on 2–3 priority applications, with zero licensing cost and zero external cloud data storage, and reconvene in 4 weeks with the real before-and-after report?" Then open for Q&A or run a quick live demo!',
    estimatedTime: '2 min',
    demoLink: { label: 'Launch Live Demo', href: '/scans/new' },
  },
];

export const EN_PRESENTATION_DECK: LocalizedPresentationDeck = {
  chapters: PRESENTATION_CHAPTERS_EN,
  slides: BRYNJA_PRESENTATION_SLIDES_EN,
};
