# Architecture & Product Blueprint — Brynja (`brynja`)

> **English** · [Português (Brasil)](./pt-BR/PLAN.md)

## Product Vision

An open-source **100% Vercel Serverless + Local-First (IndexedDB)** Web Platform for proactive application security analysis. Users select a GitHub repository (or paste dependency manifests) and optionally link a cryptographically verified staging target URL to execute:

1. **Dependency Analysis (SCA / SBOM):** parses manifests and lockfiles to map third-party libraries and exact versions (`npm`/`pnpm`, `pip`/`pyproject.toml`, extensible to new ecosystems via OCP).
2. **Public Vulnerability Intelligence:**
   - **OSV.dev** (`https://api.osv.dev/v1/querybatch`) — batch vulnerability lookup by package/version/ecosystem with exact SemVer fixed-version resolution.
   - **NVD API 2.0 (NIST)** (`https://services.nvd.nist.gov/rest/json/cves/2.0`) — CVSS and CWE enrichment.
   - **FIRST EPSS** (`https://api.first.org/data/v1/epss`) — real-world exploitation probability.
   - **CISA KEV** (`https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`) — confirmation of known active exploitation.
3. **Controlled Active Verification (*8 Non-Destructive Safe Probes*):** strictly read-only (`GET`/`HEAD`) checks gated by:
   - Deterministic per-user/per-origin HMAC-SHA256 ownership challenges (`/.well-known/security.txt` RFC 9116 `# Brynja-Verification:` with legacy fallback `/.well-known/brynja-verify.txt`, `_brynja` DNS `TXT`, or loopback sandbox in development) sealed into AES-256-GCM 7-day certificates with automatic live renewal.
   - Pre-flight DNS SSRF protection, strict header allowlist (`Origin`/`Accept`), rate limiting, timeouts, and circuit breaker.
   - Local-first audit trail persisted in the user's browser (`IndexedDB`) alongside scan history and SBOMs, isolated per `ownerGithubUserId`.
4. **AI Agent Extensibility:** decoupled `IAgentAdvisorPort` interface ready for future reachability analysis and remediation guidance powered by AI agents.

## Unified SOLID Architecture (Next.js 15 App Router)

- **Server Core (`src/server/`):**
  - `src/server/domain/`: pure entities, typed domain errors, security policies (`SafeProbePolicy`, `AuthorizationPolicy`), and segregated ports free of framework coupling.
  - `src/server/application/`: single-responsibility use cases (`AnalyzeRepositoryScaUseCase`, `TargetAuthorizationUseCase`, `RunSafeProbesUseCase`) and the OCP composition root (`container.ts`).
  - `src/server/infrastructure/`: pluggable adapters (AES-256-GCM cipher, ephemeral session codec, ownership certificate service, parsers, OSV/NVD/EPSS/KEV clients, SSRF DNS guard, rate-limited HTTP client, and 8 Safe Probes).
  - `src/server/http/`: stateless route helpers and Zod validation utilities.
- **Stateless API Surface (`src/app/api/`):** thin Next.js Route Handlers (`maxDuration = 60` on analysis endpoints) delegating directly to use cases with zero cloud database.
- **Frontend & Local-First Core (`src/core/` & `src/features/scans/`):**
  - `src/core/ports/`, `src/core/storage/brynja-indexeddb.store.ts`, and `src/core/gateways/`: Dependency Inversion (DIP) and browser-local multi-user isolation via IndexedDB.
  - `src/features/scans/`: pure presenters, focused hooks, OCP registries, executive PDF/JSON/Markdown/CycloneDX exporters, and accessible Dark/Light UI components.
