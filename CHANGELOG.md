# Changelog

> **English** · [Português (Brasil)](./docs/pt-BR/CHANGELOG.md)

All notable changes to **Brynja** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

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
