# Changelog

> **English** · [Português (Brasil)](./docs/pt-BR/CHANGELOG.md)

All notable changes to **Brynja** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

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
