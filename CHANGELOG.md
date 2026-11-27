# Changelog

> **English** · [Português (Brasil)](./docs/pt-BR/CHANGELOG.md)

All notable changes to **Brynja** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [1.23.0] - 2026-11-27

### Added
- Added interactive **Executive & IT Presentation** route (`/presentation`) with 19 end-to-end slides (dedicated keynote cover + 18 detailed slides covering access & Local-First architecture, cryptographic domain authorization, 8 SCA ecosystems, 4 analysis layers, 19 Safe Probes, inviolable guardrails, BYOK AI Advisor, reports/exports, GRC compliance, Scan Diff/audit trail, daily routines, and a 30-day pilot roadmap).
- Added full stage controls in `PresentationDeckView`: live audience focus toggle (**Board + IT** vs **Executive Only**), collapsible presenter speaking notes (`N`), visual slide overview index (`G`), live demo shortcuts opening real platform pages in a new tab, fullscreen stage mode (`F`), keyboard navigation, and 1-slide-per-page landscape PDF print export.
- Added strict fail-closed server-side access control via `PRESENTATION_ALLOWED_USERS` (`presentation-access.policy.ts` + `resolvePresentationAccess`), matching authenticated GitHub `@login` and verified GitHub emails (`user:email` OAuth scope stored inside the ephemeral AES-256-GCM `HttpOnly` session cookie) and exposing a discrete **Executive Presentation** shortcut in `UserAccountMenu` exclusively for authorized users.

### Fixed
- Removed the redundant `nonce` attribute from the same-origin external `/theme-init.js` script tag in `src/app/layout.tsx` (already permitted by `script-src 'self'`), fixing React 19 hydration mismatches when browsers strip script nonces from the DOM while preserving dynamic CSP nonce injection for Next.js inline hydration scripts.

## [1.22.0] - 2026-11-27

### Added
- Added canonical single-source-of-truth ecosystems catalog (`src/core/catalog/ecosystems.catalog.ts`) synced 1-to-1 with `createRegisteredDependencyParsers()` (`src/server/application/container.ts`) and verified by automated parity tests (`ecosystems-catalog.spec.tsx`).
- Added interactive **Supported Ecosystems, Manifests & Languages** matrix (`SupportedEcosystemsSection` on `/scans/new#ecosystems-catalog`) and a compact **Supported Ecosystems** bar (`SupportedEcosystemsBar` on `/` Dashboard) displaying all 8 SCA ecosystems (`npm`, `PyPI`, `Go`, `crates.io`, `Maven`, `NuGet`, `Packagist`, `RubyGems`), native JS/TS & Python SAST/Reachability coverage, and language-agnostic layers (IaC/CI-CD, Secrets/Posture, 19 Safe Probes, and SARIF/Trivy/Semgrep/Prowler imports) across PT-BR, EN, and ES.
- Added `*.csproj` (`App.csproj`) option to the manual manifest paste selector in `NewScanView` and refreshed pipeline/footer stack summaries.

## [1.21.0] - 2026-11-26

### Added
- Added `.github/dependabot.yml` automating weekly npm and GitHub Actions security updates (resolving `posture:missing-dependency-automation` / CIS 7.4).
- Added strict defense-in-depth HTTP response headers across `next.config.ts` and cryptographic nonce CSP in `src/middleware.ts` (`Content-Security-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and disabled `X-Powered-By`).
- Externalized early dark/light theme initialization to `public/theme-init.js`, eliminating `dangerouslySetInnerHTML` in `src/app/layout.tsx` (`sast:react-dangerously-set-inner-html`).

### Fixed
- Upgraded `next` direct range in `package.json` from `^15.2.3` to `^15.5.29` and updated `AnalyzeScaUseCase` to prioritize resolved lockfile versions (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, etc.) while preserving `isDirect` flags so speculative ranges never trigger false CVE storms.
- Parallelized NVD, FIRST EPSS, and CISA KEV vulnerability enrichment (`Promise.all`) with tighter NVD serverless timeout budgets (`8.5s`) to keep `/api/analyze/sca` well under Vercel serverless limits.
- Added client fetch timeouts (`65s`) and orphaned `RUNNING` scan recovery (`> 2m`) in `HttpScanGateway` so interrupted or timed-out scans transition cleanly to `FAILED` instead of hanging forever in `IndexedDB`.

## [1.20.0] - 2026-11-26

### Added
- Added live BYOK AI model discovery endpoint (`POST /api/analyze/advise/models` backed by `ByokAgentAdvisorAdapter.listModels` with SSRF guardrails) for OpenAI, Google Gemini, and OpenAI-compatible custom endpoints, automatically filtering out non-text-triage modalities (image/Nano Banana, TTS/audio, video, embeddings, computer-use, and deep-research).
- Updated `AiAdvisorPanel` to automatically populate an interactive model selector once a valid API key is present (with curated fallback and custom model ID entry across PT-BR, EN, and ES), setting **Gemini 3.8 Flash (`gemini-3.8-flash`)** as the default Gemini model.

## [1.19.0] - 2026-11-26

### Added
- Added a direct **"Governance"** shortcut button to every row in `ScanHistoryTable` (on both the Dashboard and `/history`), linking straight to `/governance?scanId=<id>` alongside **"View Report"**.

### Fixed
- Hardened `/governance` (`GovernanceView`) deep-linking via `?scanId=<id>` to wait cleanly for both `useScanList` and `getScanReport` settlement, enrich draft names/repositories even when outside the top 50 scans, provide a `<select>` fallback option, and avoid flashing empty/un-evaluated scores before linked evidence loads.

## [1.18.0] - 2026-11-26

### Added
- Added a dedicated, zero-bloat AI export schema (`brynja.ai-governance-gaps.v1` via `ai-governance-gaps-json.exporter.ts`, `buildGovernanceAiGapsPayload`, and `buildGovernanceAiGapsFile`) engineered strictly for `/governance` failures (`GAP_DETECTED` and explicitly attested `PARTIAL` controls across CIS Controls v8, NIST CSF 2.0, OWASP ASVS / Top 10, and LGPD & ISO 27001), keeping the `/scans` code-remediation payload (`brynja.ai-remediation.v1`) focused and separate.
- Exposed concise redacted `technicalSignals` (blocking CVEs, failed Safe Probes, and non-sensitive static rule references) on failing `ComplianceControlEvaluation` items in `compliance.presenter.ts`.

### Changed
- Upgraded the **"Export"** button on `/governance` (`GovernanceView`) into a dropdown menu offering **AI Gaps JSON (Failures Only)** download, one-click **Copy AI Gaps JSON**, and **Excel Workbook (`.xlsx`)** export, disabling AI JSON actions cleanly when zero failures exist, while extracting shared menu dismissal and download helpers (`export-helpers.ts`) reused with `ScanReportView`.
- Redesigned `/governance` layout by moving assessment options and saved assessment selection into a responsive horizontal toolbar above the scorecards (stacking cleanly on mobile) so framework scorecards and controls occupy 100% of screen width.

## [1.17.0] - 2026-11-26

### Added
- Added a zero-dependency native OOXML **Excel (`.xlsx`)** workbook builder (`xlsx-workbook.builder.ts` and `buildComplianceMatrixExcel`) exporting multi-sheet compliance workbooks (`Resumo GRC`, `CIS Controls v8`, `NIST CSF 2.0`, `OWASP ASVS`, `LGPD & ISO 27001`) with styled headers, status color coding, auto-sized columns, and spreadsheet formula-injection neutralization.

### Changed
- Updated `/governance` (`GovernanceView`) to place the **"What is governance?"** button in the top-right corner of the header card (`PageHeader` `topActions`) so the page heading stays uncluttered, switched GRC matrix exports from CSV to Excel (`.xlsx` via `ComplianceExcelReportExporter`), and simplified the action label to **"Export"** (`"Exportar"` in PT-BR/ES).

## [1.16.0] - 2026-11-26

### Added
- Added an interactive **"What is governance?"** button and tabbed educational guide modal (`GovernanceGuideModal`) inside `/governance` (`GovernanceView`) explaining GRC technical vs overall adherence, **CIS Controls v8** (including **IG1 / IG2 / IG3** implementation groups), **NIST CSF 2.0**, **OWASP ASVS / Top 10**, and **LGPD & ISO/IEC 27001:2022** across PT-BR, EN, and ES.

## [1.15.0] - 2026-11-26

### Added
- Added separate executive KPI indicators for **Code, Secrets & IaC** (`staticIssuesCount`, `staticCriticalHighCount`) and **Compliance** across `DashboardView.tsx`, `ScanHistoryView.tsx`, `ScanHistoryTable.tsx` (`E:` / `S:` badge + stacked bar segment), `ScanReportView.tsx`, and the **Executive PDF**, keeping **Critical / High / Medium** metrics strictly scoped to dependency CVEs while dynamically deriving counts for legacy `IndexedDB` scans.
- Added the BYOK **AI Executive Diagnosis** (`aiRemediationPlan` summary, reachability hints, and prioritized steps) directly into both the **Executive PDF** (`scan-pdf.exporter.ts`) and the **AI Fix JSON** payload (`aiDiagnosis` in `ai-remediation-json.exporter.ts`).

### Changed
- Standardized the `WELL_KNOWN_FILE` domain ownership verification path on RFC 9116 `/.well-known/security.txt` (`Contact:`, `Expires:`, and `# Brynja-Verification: <token>`) across `DomainOwnershipVerifierAdapter`, `TargetAuthorizationUseCase`, `RunSafeProbesUseCase`, `/authorizations` (`OwnershipSetupGuide` + Nginx/Apache snippets), PT-BR/EN/ES copy, and security docs — while retaining automatic legacy fallback support for `/.well-known/brynja-verify.txt`.
- Redesigned `AiAdvisorPanel.tsx` with a dedicated executive callout card, reachability chips, scannable numbered remediation cards with inline monospace path/header tokens, and replaced the ambiguous `"Copilot"` badge label with brand-neutral AppSec AI Advisor terminology across PT-BR, EN, and ES.

## [1.14.0] - 2026-11-26

### Added
- Added user-configurable **BYOK AI Triage & Reachability Advisor** (`ByokAgentAdvisorAdapter`, `AnalyzeAdviseUseCase`, `POST /api/analyze/advise` with `maxDuration = 60`, and `AiAdvisorPanel` in `/scans/[id]`):
  - Supports **OpenAI**, **Google Gemini**, and **OpenAI-compatible custom endpoints** validated through `SsrfDnsGuardService` against private networks/cloud metadata.
  - Stores user API keys strictly opt-in inside browser `localStorage` (`brynja-ai-byok-v1`) — never persisted in cookies or cloud databases — and transmits only sanitized CVE, Safe Probe, static rule metadata, and repository import reachability hints (`computeReachabilityHints`).
- Added **External Security Report Importers** (`parseExternalSecurityReport` and **Import SARIF / Trivy / Semgrep** action on `/history`) normalizing **OASIS SARIF 2.1.0**, **Trivy JSON**, **Semgrep JSON**, and **Prowler OCSF/JSON** reports into local `IndexedDB` scans.
- Added **Enterprise Interoperability Exporters** registered via OCP in `REPORT_EXPORTERS`: **SARIF 2.1.0** (`SarifReportExporter`), **SPDX 2.3 SBOM** (`SpdxSbomExporter`), and **Compliance Matrix CSV** (`ComplianceCsvReportExporter`).
- Added **Scan Comparison (Diff)** on `/history` (`computeScanDiff`) comparing any two local scans for new, resolved, and persistent CVEs, Safe Probe deltas, static finding deltas, and CIS v8 / NIST CSF 2.0 adherence progression.

## [1.13.0] - 2026-11-26

### Added
- Added lightweight, Vercel-friendly **Static Code, Secrets, IaC/CI-CD & GitHub Posture Analysis** (`src/server/infrastructure/static-analysis/` and `POST /api/analyze/static`, `maxDuration = 60`):
  - `SecretScannerAnalyzer`: detects AWS/GitHub/Stripe/Google/Slack keys, embedded DB credentials, private key blocks, and committed `.env*` files while **automatically masking secret values** (`maskSecretMatch`) so plaintext secrets never persist in reports or `IndexedDB`.
  - `IacCicdAnalyzer`: evaluates `Dockerfile` (CIS Docker Benchmark `:latest`, `USER root`, `curl | sh`), `docker-compose.yml` (`privileged`, `docker.sock`), Terraform (`0.0.0.0/0`, unencrypted storage/public ACLs), Kubernetes SecurityContext, and GitHub Actions (`pull_request_target`, `write-all`, unpinned third-party actions, `${{ github.event.* }}` script injection).
  - `LightweightSastAnalyzer`: comment-aware JS/TS and Python static pattern checks (`eval`/`new Function`, `dangerouslySetInnerHTML`, shell command interpolation, disabled TLS verification, SQL string interpolation, unsafe Python deserialization).
  - `GitHubPostureAnalyzer`: checks repository hygiene (`SECURITY.md`, Dependabot/Renovate, `CODEOWNERS`, and default branch protection).
- Added the **Code, Secrets & IaC** tab (`staticFindings`) in `/scans/[id]` (`ScanReportView`), an optional toggle on `/scans/new`, compliance mapping rules across CIS/NIST/OWASP/LGPD, and remediation tasks in the Executive PDF and AI Fix JSON.

## [1.12.0] - 2026-11-26

### Added
- Expanded the non-destructive Safe Probes suite from **14 to 19 probes** (`GET`/`HEAD` read-only + passive DNS), synchronized across `/scans/new` (`safe-probes.catalog.ts`), PT-BR/EN/ES dictionaries, compliance rules, and Executive PDF / AI Fix JSON remediation plans:
  - `safe-probe:cross-origin-isolation`: checks `Cross-Origin-Opener-Policy` (COOP), `Cross-Origin-Resource-Policy` (CORP), and `Cross-Origin-Embedder-Policy` (COEP) on `GET /`.
  - `safe-probe:dns-email-posture`: passively checks DNS `TXT` (`SPF`, `_dmarc`), `CAA` records, and `GET /.well-known/mta-sts.txt` (automatically skipped on loopback/IP targets).
  - `safe-probe:robots-sitemap-exposure`: passively inspects `GET /robots.txt` and `GET /sitemap.xml` (ignoring SPA catch-all HTML) for sensitive administrative or internal path disclosures.
  - `safe-probe:oauth-graphql-posture`: checks `GET /.well-known/openid-configuration` for weak OIDC settings (`http://`, `alg=none`, implicit without PKCE) and passive `GET /graphql?query=__schema` introspection.
  - `safe-probe:security-txt-rfc9116`: validates `GET /.well-known/security.txt` for RFC 9116 `Contact:` and unexpired future `Expires:` directives.

### Changed
- Added per-scan in-memory response memoization in `RateLimitedSafeHttpClient` for default-header `GET`/`HEAD` requests (such as repeated `GET /` reads across probes) and raised default `SAFE_PROBE_MAX_REQUESTS_PER_SCAN` from `60` to `80` while preserving `SAFE_PROBE_MAX_RPS=2`, SSRF guard, and circuit breaker.

## [1.11.0] - 2026-11-26

### Added
- Expanded SCA/SBOM manifest parsing from 2 to **8 OSV.dev-compatible ecosystems**: added **Yarn** (`yarn.lock`), **Go** (`go.mod`, `go.sum`), **Rust** (`Cargo.toml`, `Cargo.lock`), **Java/Kotlin Maven & Gradle** (`pom.xml`, `gradle.lockfile`), **.NET NuGet** (`packages.lock.json`, `*.csproj`), **PHP Packagist** (`composer.json`, `composer.lock`), and **RubyGems** (`Gemfile.lock`), along with ecosystem-aware upgrade commands in `remediation-plan.presenter.ts`, `/scans/new`, and `/api/analyze/sca`.
- Added `DepsDevDependencyEnricher` (`src/server/infrastructure/vuln-intel/deps-dev-enricher.adapter.ts`) querying `api.deps.dev/v3` in parallel with OSV.dev (6h cached, fail-open) to enrich direct dependencies with **SPDX licenses** and **OpenSSF Scorecard** ratings, surfacing copyleft (`GPL`/`AGPL`) and low-scorecard warnings and badges inside the SBOM inventory table.

## [1.10.0] - 2026-11-26

### Added
- Added an automated **Compliance & Governance Engine** (`src/core/catalog/compliance-frameworks.catalog.ts`, `src/features/scans/presenters/compliance.presenter.ts`) mapping SCA/SBOM inventory, CWE/KEV findings, Safe Probes, and probe audit trails across **CIS Controls v8 (IG1/IG2/IG3)**, **NIST CSF 2.0**, **OWASP ASVS / Top 10**, and **LGPD (Art. 46/48/50) & ISO/IEC 27001:2022**.
- Added the **Compliance Scorecard** tab (`ComplianceScorecardTab`) on `/scans/[id]` (`ScanReportView`) with framework switchers, CIS Implementation Group (`IG1`–`IG3`) and status filters, domain coverage bars, and technical adherence metrics.
- Added the local-first **Governance & Compliance (GRC)** workspace at `/governance` (`GovernanceView`, linked in `Navbar`) allowing teams to combine automated scan evidence with manual organizational attestations, export formula-safe CSV matrices, and persist assessments locally in browser `IndexedDB`.
- Added a **Compliance Matrix** section to the **Executive PDF** (`scan-pdf.exporter.ts`) summarizing technical adherence and top detected gaps across all four frameworks.

### Changed
- Upgraded browser local persistence (`IndexedDbBrynjaStore`) from schema `DB_VERSION = 1` to `DB_VERSION = 2` with a dedicated user-isolated `grcAssessments` store and `LocalBackupBundle` v2 export/import backward-compatible with v1 backups.

## [1.9.0] - 2026-11-26

### Added
- Added a Safe Probe issues badge (`P:<count>`) and proportional violet segment (`bg-violet-500`) inside the **Severity** column and distribution bar of the scan history table (`ScanHistoryTable` on `/history` and `/`) whenever a scan reports runtime Safe Probe problems (`FINDING` or `ABORTED`), with localized tooltips across PT-BR, EN, and ES.
- Added `probeIssuesCount` on `ScanSummary` along with shared `countProbeIssues` / `resolveScanProbeIssuesCount` helpers (`src/core/models/scan.models.ts`) so `HttpScanGateway.summarizeReport` automatically computes probe problem counts even for existing reports previously stored in browser `IndexedDB`.

## [1.8.0] - 2026-11-25

### Added
- Expanded the non-destructive Safe Probes suite from **8 to 14 probes** (`GET`/`HEAD` read-only), synchronized across `/scans/new`, PT-BR/EN/ES dictionaries, and Executive PDF / AI Fix JSON remediation plans.
- `safe-probe:csp-permissions`: audits CSP directive strength (`'unsafe-eval'`, `*`/`http:`/`data:`, `'unsafe-inline'` without nonce/hash, `frame-ancestors *`, `Report-Only` without active CSP), `Permissions-Policy`, and active Mixed Content on HTTPS targets.
- `safe-probe:cache-security`: detects `Set-Cookie` on publicly cacheable responses (`public`/`s-maxage`), session cookies missing `private`/`no-store`, and dynamic `Access-Control-Allow-Origin` responses missing `Vary: Origin`.
- `safe-probe:open-redirect`: checks `/?next=`, `/?redirect=`, and `/login?next=` with manual redirect handling against synthetic `untrusted.brynja.test` for `3xx` open redirects (CWE-601).
- `safe-probe:backup-config-exposure`: `HEAD`-first + 512-byte structural checks (with SPA HTML filtering and zero secret persistence) for `/.env.local`, `/.env.production`, `/docker-compose.yml`, `/backup.sql`, and `/phpinfo.php`.
- `safe-probe:debug-error-leakage`: checks root `/` for open directory listing (`Index of /`) and a synthetic 404 route for verbose stack traces and debug modes (Django `DEBUG=True`, Werkzeug, Node/Express, Laravel Ignition/Whoops, PHP, Java/Spring, ASP.NET).
- `safe-probe:sri-integrity`: validates Subresource Integrity (`integrity="sha256|384|512-..."`) on `<script>` and `<link rel="stylesheet">` tags loaded from static third-party library CDNs (`cdnjs`, `jsDelivr`, `unpkg`, jQuery/Bootstrap CDNs).

### Changed
- Updated `/changelog` (`ChangelogView`) to render only the latest release expanded by default and collapse older versions into an accessible accordion for a more concise history view.
- Raised default `SAFE_PROBE_MAX_REQUESTS_PER_SCAN` from `40` to `60` (preserving `SAFE_PROBE_MAX_RPS=2`, SSRF guard, and circuit breaker) to accommodate all 14 Safe Probes smoothly including on SPA catch-all targets.

## [1.7.1] - 2026-11-25

### Fixed
- Fixed the **Shield Intact (100% Passed)** celebratory banner on `/scans/[id]` (`ScanReportView`) rendering with a bright light-mode gradient background in dark mode by replacing unsupported Tailwind v3 `/12` and `/8` opacity modifiers (`dark:from-emerald-500/12 dark:via-teal-500/8 dark:to-cyan-500/8`) with valid `/15` and `/10` opacity utilities (`dark:from-emerald-500/15 dark:via-teal-500/10 dark:to-cyan-500/10`).

## [1.7.0] - 2026-11-25

### Added
- Right-aligned **Export Report** dropdown menu on `/scans/[id]` (`ScanReportView`) consolidating all export actions in priority order: **Executive PDF (Board)** first, followed by **AI Fix JSON** (download + one-click clipboard copy) and other technical formats (`Full JSON`, `Markdown`, `SBOM CycloneDX`), with Escape and outside-click dismissal.
- Celebratory **Shield Intact (100% Passed)** banner and positive empty state on `/scans/[id]` (`isScanAllClear`) whenever all SCA dependency checks and Safe Probes complete with zero vulnerabilities, zero probe findings, and zero execution errors, translated across PT-BR, EN, and ES.

### Changed
- When a scan completes cleanly with zero issues (`isScanAllClear`), non-PDF export entries inside the report dropdown (`AI Fix JSON`, `Copy AI Fix JSON`, `Full JSON`, `Markdown`, and `SBOM`) are automatically disabled with a clear status hint, leaving only **Executive PDF (Board)** active.

## [1.6.1] - 2026-11-25

### Fixed
- Improved the `/authorizations` reverse-proxy setup guide (`OwnershipSetupGuide` + `ownership-guide.presenter.ts`) for real-world Linux + Docker + Certbot servers across PT-BR, EN, and ES: added a copyable command to identify the actual active config file in `/etc/nginx/sites-enabled/` or `/etc/apache2/sites-enabled/` (warning about standalone copies vs symlinks and HTTPS port 443 blocks), switched the Nginx snippet to exact-match `location = /.well-known/brynja-verify.txt` so it beats container `proxy_pass` without conflicting with Let's Encrypt `acme-challenge`, expanded Step 5 rollback search to include `sites-enabled/`, and added Docker container vs containerized reverse-proxy guidance and troubleshooting tips.

## [1.6.0] - 2026-11-25

### Added
- Concise, machine-actionable **AI Fix JSON** export (`AiRemediationJsonExporter`, schema `brynja.ai-remediation.v1`, file `brynja-ai-fix-<id>.json`) tailored for AI coding models: consolidates multiple CVEs per package into single highest-SemVer upgrade tasks with exact package-manager CLI commands (`pnpm`/`npm`/`pip`), folds runtime-fingerprint hits into matching dependency tasks, strips non-actionable bloat (clean SBOM entries, passed probes, raw audit logs), and provides both download and one-click clipboard copy on `/scans/[id]`.
- Shared pure remediation planner (`src/features/scans/presenters/remediation-plan.presenter.ts`) prioritizing issues across `P0`–`P3` SLA windows with business impact explanations, direct fix actions, and verification criteria.
- Management & Board **Executive PDF** upgrade (`scan-pdf.exporter.ts`): adds an executive brief callout card (`Parecer Executivo para Gerência e Diretoria`) with P0–P3 action breakdown and a dedicated **Section 01 — Problem Presentation & Solution Plan** rendering structured cards that pair each problem explanation and business impact with its recommended solution and validation criterion.

### Fixed
- `/authorizations` target URL input and backend validation (`AuthorizationsView`, `SafeProbePolicy.parseAndValidateTargetUrl`, `/api/authorizations/challenge`, `/api/authorizations/preview`) now accept valid bare domains (e.g., `prenora.com.br`) and transparently prepend `https://` under the hood (or `http://` for loopback targets) without native `type="url"` blocking, while continuing to reject invalid hosts, non-HTTP protocols, and embedded credentials.

## [1.5.0] - 2026-11-25

### Added
- Synchronized **Nginx / Apache** reverse-proxy selector in the `/authorizations` SSH setup guide (`OwnershipSetupGuide` + `ownership-guide.presenter.ts`), automatically updating Step 3 and Step 5 rollback snippets across PT-BR, EN, and ES.
- Copy-ready Apache HTTP Server (`apache2` / `httpd`) configuration for `/.well-known/brynja-verify.txt` (`ProxyPass /.well-known/ !`, `Alias /.well-known/`, scoped `<Directory>` with `Options -Indexes`, `AllowOverride None`, `Require all granted`, and `ForceType text/plain`), reload commands for Debian/Ubuntu and RHEL/Rocky/Alma/CentOS/Fedora, rollback search across `/etc/apache2/` and `/etc/httpd/`, plus `<Location />` / `mod_rewrite` / redirect troubleshooting guidance and automated tests.

## [1.4.0] - 2026-11-25

### Added
- Interactive Safe Probes catalog (`SafeProbesCatalogSection`) directly on `/scans/new` explaining all 8 non-destructive Safe Probes (HTTP Security Headers, HSTS, Cookie Security, CORS Policy, Exposed Artifacts, Exposed API Docs & Metrics, Runtime Library Fingerprint, and Source Maps) with category filters, HTTP method chips (`GET`/`HEAD`), inspected paths/headers, max severity badges, active target indicator, and quick jump link from the Safe Probes selector.
- Single Source of Truth Safe Probes catalog (`src/core/catalog/safe-probes.catalog.ts`) with compile-time TypeScript exhaustiveness across PT-BR, EN, and ES i18n dictionaries plus an automated 1-to-1 parity test (`safe-probes-catalog.spec.tsx`) against `createRegisteredSafeProbes()` (`src/server/application/container.ts`) so any future probe added to the backend must also be documented on `/scans/new`.
- Permanent workspace rules in `AGENTS.md` and `.agents/skills/controlled-pentest-guardrails/SKILL.md` enforcing Safe Probe catalog and i18n synchronization whenever new probes are added, renamed, or removed.

## [1.3.1] - 2026-11-25

### Added
- Optional Step 5 rollback guide on `/authorizations` (`OwnershipSetupGuide`) with copyable commands to safely remove `.well-known/brynja-verify.txt` and the `.well-known` folder only when empty (preserving Let's Encrypt/Certbot files), locate and revert the Step 3 Nginx reverse-proxy block, validate/reload Nginx, and verify removal via `curl -i` (plus a web-project cleanup command in the non-SSH tab), translated across PT-BR, EN, and ES.

## [1.3.0] - 2026-11-25

### Added
- Dynamic terminal snippets on `/authorizations` (`OwnershipSetupGuide` + `ownership-guide.presenter.ts`) that react live to the target URL typed in the form (SSH, `/.well-known/brynja-verify.txt` creation, `curl`, web file content, and DNS TXT commands/records).
- Stateless authenticated endpoint `POST /api/authorizations/preview` and `TargetAuthorizationUseCase.previewChallengeToken` to derive the exact deterministic per-user/per-origin HMAC verification token on the fly without polluting local IndexedDB storage.
- Copy-ready guarantee on `/authorizations`: clicking Copy resolves the real verification token immediately (even before the typing debounce finishes) and includes a one-click copy button for the DNS TXT record value.
- Automated unit and component tests (`dynamic-ownership-snippets.spec.tsx` and `guardrails-and-certificates.spec.ts`) covering URL parsing/shell-safety, live snippet updates, on-demand token resolution on copy, and deterministic preview parity.

## [1.2.0] - 2026-11-25

### Added
- Full multi-language UI support across the entire application in **Portuguese (`pt-BR`)**, **English (`en`)**, and **Spanish (`es`)**.
- Inline SVG flag language selector (`LanguageSwitcher`) placed right beside the Light/Dark theme toggle in the top navigation bar, with accessible dropdown menu (`role="menu"` / `menuitemradio`), keyboard Escape dismissal, and crisp cross-platform flags for Brazil, United States, and Spain.
- `I18nProvider` with `localStorage` persistence (`brynja-locale`), browser language auto-detection, dynamic `<html lang>` synchronization, and locale-aware date/time formatting (`Intl`).
- Locale-aware `/changelog` page switching dynamically between English and Portuguese release notes, plus language-aware Security and Contributing documentation links in the global footer.
- Unit test suite (`i18n-switcher.spec.tsx`) verifying live PT/EN/ES switching, `localStorage` persistence, browser locale detection, and placeholder interpolation.

## [1.1.0] - 2026-11-25

### Added
- Global application footer across all pages displaying the dynamic version badge (`v1.1.0`), technical stack summary, local-first privacy posture, and quick links to Changelog, Repository, Security, Contributing, and MIT License.
- Public `/changelog` page rendered directly from the project's changelog so users can inspect what changed in every release from inside the app.
- Semantic Versioning workspace skill (`.agents/skills/semantic-versioning`) with `bump-version.mjs` helper to enforce SemVer bumps and changelog updates on every feature or fix.
- Detailed beginner-friendly and remote SSH terminal ownership setup guide (`OwnershipSetupGuide`) on `/authorizations` with copyable commands, Nginx reverse-proxy snippets, and DNS propagation checks.
- Full GitHub Organization repository support (`read:org` scope, paginated `/user/repos` + `/user/orgs` → `/orgs/{org}/repos` discovery, `Org` badges, and direct GitHub OAuth organization-access link).
- Origin-aware labels for vulnerability reference links (`GitHub Advisory`, `GitHub Commit`, `NVD (NIST)`, `OSV.dev`, etc.) and redesigned two-zone Scan Report header with dedicated export toolbar.
- Medieval heraldic Light/Dark theme toggle and `512×512` PNG app icon (`src/app/icon.png`).

### Changed
- CycloneDX 1.5 SBOM exporter now reads the application version dynamically from `package.json`.
- Centered "View GitHub Profile" and "Sign out" actions inside the account dropdown menu and added the open-source GitHub repository link to the home screen.

### Fixed
- Eliminated unauthenticated route-switch UI flash via shared session state in `GatewayProvider` and initial loading guards across all views.
- Hardened NVD API 2.0 enricher with automatic retry on transient network/5xx errors, `Accept`/`User-Agent` headers, CVSS v4.0 support, request pacing, and circuit breaker.
- Hardened GitHub repository fetcher with `/branches/{branch}` resolution, automatic Contents API fallback for large/truncated repositories, and exact HTTP diagnostics (`401`/`403`/SAML/`404`/`409`).

## [1.0.0] - 2026-11-24

### Added
- Unified 100% Vercel Serverless + Local-First (`IndexedDB`) Next.js 15 App Router release under strict SOLID architecture and the **Brynja** Nordic chainmail-shield identity.
- SCA/SBOM manifest parsers for Node.js (`package.json`, `package-lock.json`, `pnpm-lock.yaml`) and Python (`requirements.txt`, `pyproject.toml`) correlated with OSV.dev, NVD 2.0, FIRST EPSS, and CISA KEV.
- 8 non-destructive Safe Probes (`GET`/`HEAD` only) behind deterministic per-user HMAC-SHA256 ownership verification (`/.well-known/brynja-verify.txt`, `_brynja` DNS TXT, or local dev sandbox), 7-day auto-renewing AES-256-GCM certificates, anti-SSRF DNS guard, rate limiter, and circuit breaker.
- Executive PDF, JSON, Markdown, and CycloneDX 1.5 SBOM exporters, searchable scan history, and bilingual open-source documentation (English + Portuguese).

### Security
- Ephemeral AES-256-GCM sealed `HttpOnly` GitHub OAuth session cookies with zero cloud database persistence and strict per-user `IndexedDB` isolation (`ownerGithubUserId`).
