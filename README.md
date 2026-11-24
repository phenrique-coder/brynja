# VereditoSec

Plataforma Web open-source de **análise proativa de segurança de aplicações**, construída com **`frontend/`** (Next.js 15 App Router + Tailwind + SOLID) e **`backend/`** (NestJS 11 + Prisma/PostgreSQL + SOLID) em pastas independentes.

## Principais Recursos

1. **Inventário de Dependências (SCA / SBOM):** extrai bibliotecas e versões de repositórios públicos/privados (GitHub OAuth, URL Git pública ou upload manual de manifestos) para Node.js (`package.json`, `package-lock.json`, `pnpm-lock.yaml`) e Python (`requirements.txt`, `pyproject.toml`), extensível via Open/Closed Principle (OCP).
2. **Inteligência Pública de Vulnerabilidades:** cruza o SBOM em lote com **OSV.dev** (com resolução exata da faixa SemVer corrigida), **NVD API 2.0**, **FIRST EPSS** e **CISA KEV**, com cache em PostgreSQL.
3. **Verificação Ativa Controlada (*8 Safe Probes* Não Destrutivas):**
   - `SecurityHeadersProbe`: cabeçalhos defensivos HTTP e vazamento de banners (`Server`/`X-Powered-By`).
   - `HstsTlsProbe`: presença e `max-age` mínimo de `Strict-Transport-Security` em HTTPS.
   - `CookieSecurityProbe`: auditoria de flags `HttpOnly`, `Secure` e `SameSite` em `Set-Cookie` (sem persistir valores).
   - `CorsMisconfigProbe`: detecção de reflexão de origem arbitrária e `Access-Control-Allow-Credentials`.
   - `ExposedArtifactsProbe`: verificação `HEAD`/`GET` limitada de `/.git/HEAD`, `/.env` e `/package.json`.
   - `ExposedDocsAndMetricsProbe`: detecção de `/openapi.json`, `/swagger`, `/swagger-ui`, `/api/docs`, `/metrics`, `/actuator/health`, `/graphql` e reconhecimento de `/.well-known/security.txt`.
   - `RuntimeFingerprintProbe`: correlação precisa de bibliotecas vulneráveis do SBOM expostas em runtime.
   - `SourceMapExposureProbe`: detecção de `.js.map` públicos via `HEAD`.
4. **Guardrails Invioláveis:** verificação criptográfica obrigatória de posse do domínio (`WELL_KNOWN_FILE`, `DNS_TXT`, `LOCAL_DEV_SANDBOX`), proteção anti-SSRF via DNS, somente `GET`/`HEAD` com allowlist de cabeçalhos, *rate limiting*, *circuit breaker* e trilha de auditoria imutável (`probe_audit_logs`).
5. **Multi-Usuário sem Persistência de Tokens:** isolamento de histórico por conta GitHub (`owner_github_user_id`), com token OAuth selado via AES-256-GCM exclusivamente em cookie `HttpOnly` de sessão do navegador.
6. **Relatórios Executivos & Exportação:** download em **PDF executivo**, **JSON**, **Markdown** e **SBOM CycloneDX 1.5**, além de histórico completo pesquisável e temas Dark / Light (sépia).

## Estrutura do Projeto

```text
veredito-sec/
├── frontend/                   # Next.js 15 App Router + Tailwind + SOLID
├── backend/                    # NestJS 11 Modular + Prisma/PostgreSQL + SOLID
├── .github/                    # GitHub Actions CI + templates de PR/Issue
├── scripts/                    # Automação de branch protection na main
├── docs/                       # Plano arquitetural e guia de release open-source
├── SECURITY.md                 # Política de segurança e guardrails obrigatórios
├── CONTRIBUTING.md             # Guia de contribuição SOLID + OCP
├── LICENSE                     # Licença MIT
└── docker-compose.yml          # PostgreSQL 16
```

## Início Rápido

```bash
# 1. Configurar variáveis e subir PostgreSQL (porta 5434)
cp .env.example .env
cp .env.example backend/.env
docker compose up -d postgres

# 2. Backend (porta 3001)
cd backend
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm start:dev

# 3. Frontend (porta 3000) em outro terminal
cd frontend
pnpm install
pnpm dev
```

## Segurança, Contribuição e Licença

- Leia [SECURITY.md](./SECURITY.md) antes de executar ou contribuir com sondas.
- Confira [CONTRIBUTING.md](./CONTRIBUTING.md) para estender parsers, enriquecedores e sondas via SOLID.
- Veja [docs/OPEN_SOURCE_RELEASE.md](./docs/OPEN_SOURCE_RELEASE.md) para publicar e proteger a branch `main`.
- Distribuído sob a licença [MIT](./LICENSE).
