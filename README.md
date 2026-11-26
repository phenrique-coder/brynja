<p align="center">
  <img src="./public/brynja-logo.svg" alt="Brynja — SCA, CVEs & Safe Probes" width="320" />
</p>

<p align="center">
  <strong>Open-source, 100% Vercel Serverless + Local-First (IndexedDB) Web Platform for Proactive Application Security.</strong><br/>
  Zero cloud database · Zero separate backend server · Strict SOLID architecture.
</p>

<p align="center">
  <strong>English</strong> · <a href="./README.pt-BR.md">Português (Brasil)</a>
</p>

---

## Why *Brynja*?

**Brynja** (pronounced *BRIN-ya*) comes from **Old Norse and Icelandic**, meaning **chainmail armor** — armor forged from interlocking metal rings that distribute impact across a resilient mesh instead of relying on a single rigid plate.

That concept directly reflects the platform's **defense-in-depth** philosophy:

- **Interlocking defensive rings:** rather than trusting a single isolated check, Brynja weaves together three complementary layers — **dependency inventory (SCA / SBOM)**, **public vulnerability intelligence (OSV, NVD, EPSS, CISA KEV)**, and **8 non-destructive active checks (*Safe Probes*)**.
- **Strength without friction:** just as chainmail protects without immobilizing its wearer, Brynja's guardrails (cryptographic ownership proof, anti-SSRF DNS guard, strict `GET`/`HEAD` policy, rate limiting, and browser-local storage) deliver rigorous security without requiring heavy infrastructure or storing secrets in a cloud database.
- **The emblem:** the Brynja mark combines a Nordic shield silhouette with a geometric interlocking chainmail weave converging on a forged core, symbolizing layered protection working as one.

## Key Features

1. **Dependency Inventory (SCA / SBOM):** extracts packages and exact versions from GitHub repositories (public and private via GitHub API) or manually pasted manifests for Node.js (`package.json`, `package-lock.json`, `pnpm-lock.yaml`) and Python (`requirements.txt`, `pyproject.toml`), extensible via the Open/Closed Principle (OCP).
2. **Public Vulnerability Intelligence:** batch-correlates your SBOM against **OSV.dev** (with accurate SemVer fixed-version resolution), **NVD API 2.0**, **FIRST EPSS**, and **CISA KEV**.
3. **Controlled Active Verification (*8 Non-Destructive Safe Probes*):**
   - `SecurityHeadersProbe`, `HstsTlsProbe`, `CookieSecurityProbe`, `CorsMisconfigProbe`, `ExposedArtifactsProbe`, `ExposedDocsAndMetricsProbe`, `RuntimeFingerprintProbe`, and `SourceMapExposureProbe`.
4. **Inviolable Guardrails & Signed Stateless Ownership:**
   - Mandatory cryptographic ownership verification with deterministic HMAC-SHA256 tokens scoped per user and origin (`/.well-known/security.txt` RFC 9116 `# Brynja-Verification:` with legacy fallback `/.well-known/brynja-verify.txt`, `_brynja` DNS TXT record, or `LOCAL_DEV_SANDBOX` in development).
   - Issues an **AES-256-GCM** signed ownership certificate valid for 7 days with **automatic live renewal** as long as the proof remains published on the domain (and immediate blocking if removed).
   - Pre-flight DNS anti-SSRF guard, strict `GET`/`HEAD` only with header allowlist (`Origin`/`Accept`), rate limiting, and circuit breaker.
5. **Local-First Privacy (Zero Cloud Database):**
   - Scan history, SBOMs, target authorizations, and probe audit trails are stored locally in the browser's **IndexedDB**, strictly isolated per GitHub account (`ownerGithubUserId`).
   - GitHub OAuth sessions are sealed with AES-256-GCM exclusively in an `HttpOnly` session cookie (discarded when closing the browser or clicking **Sign out**).
6. **Executive Reports:** one-click export to **Executive PDF**, **JSON**, **Markdown**, and **CycloneDX 1.5 SBOM**, plus searchable scan history and Dark / Light (warm sepia) themes.

## Project Structure (SOLID)

```text
brynja/
├── public/
│   └── brynja-logo.svg         # Official horizontal logo (Nordic shield + chainmail weave)
├── src/
│   ├── app/                    # Next.js 15 App Router (UI, icon.svg & stateless /api/* Route Handlers)
│   ├── server/                 # SOLID server core (domain, application, infrastructure, http)
│   ├── core/                   # Frontend ports, models, IndexedDB store & local-first gateway
│   └── features/scans/         # Hooks, pure presenters, OCP registries, PDF exporter & UI
├── docs/                       # Architecture & deployment docs (English + pt-BR/)
├── .github/                    # GitHub Actions CI & PR/Issue templates
├── scripts/                    # Main branch protection automation script
├── vercel.json                 # Serverless timeout config (maxDuration=60) for Vercel
├── SECURITY.md                 # Security policy & mandatory guardrails
├── CONTRIBUTING.md             # SOLID + OCP contribution guide
└── LICENSE                     # MIT License
```

## Local Development

```bash
cp .env.example .env.local
# Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and TOKEN_ENCRYPTION_KEY in .env.local
pnpm install
pnpm dev
# Open http://localhost:3000
```

## 1-Click Deploy on Vercel (Free Tier)

1. Import the `brynja` repository on [Vercel](https://vercel.com/new) (**Next.js** is auto-detected).
2. Configure the following Environment Variables in Vercel:
   - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (create a GitHub OAuth App with callback `https://<your-app>.vercel.app/api/integrations/github/callback`)
   - `TOKEN_ENCRYPTION_KEY` (generate with `openssl rand -hex 32`)
   - `ALLOW_LOCAL_LOOPBACK_TARGETS=false`
   - *(Optional)* `NVD_API_KEY` (free NVD key for faster CVSS enrichment)
3. Deploy — done! No cloud database or separate backend server required.

## Documentation

| Document | English | Português (Brasil) |
| --- | --- | --- |
| Overview & Setup | [README.md](./README.md) | [README.pt-BR.md](./README.pt-BR.md) |
| Changelog (Release Notes) | [CHANGELOG.md](./CHANGELOG.md) | [docs/pt-BR/CHANGELOG.md](./docs/pt-BR/CHANGELOG.md) |
| Security Policy & Guardrails | [SECURITY.md](./SECURITY.md) | [docs/pt-BR/SECURITY.md](./docs/pt-BR/SECURITY.md) |
| Contributing Guide | [CONTRIBUTING.md](./CONTRIBUTING.md) | [docs/pt-BR/CONTRIBUTING.md](./docs/pt-BR/CONTRIBUTING.md) |
| Vercel Deploy & Open-Source Governance | [docs/OPEN_SOURCE_RELEASE.md](./docs/OPEN_SOURCE_RELEASE.md) | [docs/pt-BR/OPEN_SOURCE_RELEASE.md](./docs/pt-BR/OPEN_SOURCE_RELEASE.md) |
| Architecture & Product Blueprint | [docs/PLAN.md](./docs/PLAN.md) | [docs/pt-BR/PLAN.md](./docs/pt-BR/PLAN.md) |

## License

Distributed under the [MIT License](./LICENSE).
