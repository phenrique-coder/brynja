# VereditoSec

Plataforma Web open-source **100% Vercel Serverless + Local-First (IndexedDB)** de análise proativa de segurança para aplicações — **zero banco de dados na nuvem e zero servidor separado**, seguindo arquitetura **SOLID**.

## Principais Recursos

1. **Inventário de Dependências (SCA / SBOM):** extrai bibliotecas e versões de repositórios GitHub (privados e públicos via GitHub API) ou manifestos colados manualmente para Node.js (`package.json`, `package-lock.json`, `pnpm-lock.yaml`) e Python (`requirements.txt`, `pyproject.toml`), extensível via Open/Closed Principle (OCP).
2. **Inteligência Pública de Vulnerabilidades:** cruza o SBOM em lote com **OSV.dev** (com resolução exata da faixa SemVer corrigida), **NVD API 2.0**, **FIRST EPSS** e **CISA KEV**.
3. **Verificação Ativa Controlada (*8 Safe Probes* Não Destrutivas):**
   - `SecurityHeadersProbe`, `HstsTlsProbe`, `CookieSecurityProbe`, `CorsMisconfigProbe`, `ExposedArtifactsProbe`, `ExposedDocsAndMetricsProbe`, `RuntimeFingerprintProbe` e `SourceMapExposureProbe`.
4. **Guardrails Invioláveis & Posse Stateless Assinada:**
   - Verificação criptográfica obrigatória de posse (`/.well-known/vereditosec-verify.txt`, registro `_vereditosec` DNS TXT ou `LOCAL_DEV_SANDBOX` em desenvolvimento).
   - Emite certificado assinado em **AES-256-GCM** válido por 7 dias com **renovação automática** caso a prova continue publicada no domínio (e bloqueio imediato se removida).
   - Proteção anti-SSRF via DNS, somente `GET`/`HEAD` com allowlist de cabeçalhos (`Origin`/`Accept`), *rate limiting* e *circuit breaker*.
5. **Privacidade Local-First (Zero Banco na Nuvem):**
   - Histórico de varreduras, SBOM, alvos e trilha de auditoria ficam salvos no **IndexedDB do próprio navegador**, isolados por conta GitHub (`ownerGithubUserId`).
   - Sessão GitHub OAuth selada em AES-256-GCM exclusivamente em cookie `HttpOnly` de sessão do navegador (expira ao fechar ou clicar em **Sair**).
6. **Relatórios Executivos:** download em **PDF executivo**, **JSON**, **Markdown** e **SBOM CycloneDX 1.5**, além de histórico pesquisável e temas Dark / Light (sépia).

## Estrutura do Projeto (SOLID)

```text
veredito-sec/
├── src/
│   ├── app/                    # Next.js 15 App Router (UI + Route Handlers /api/*)
│   ├── server/                 # Núcleo SOLID server-side (domain, application, infrastructure)
│   ├── core/                   # Ports, modelos, IndexedDB store e local-first gateway
│   └── features/scans/         # Hooks, presenters, registries OCP, exportador PDF e UI
├── .github/                    # GitHub Actions CI + templates de PR/Issue
├── scripts/                    # Automação de branch protection na main
├── vercel.json                 # Configuração de timeout (maxDuration=60) para Vercel
├── SECURITY.md                 # Política de segurança e guardrails obrigatórios
├── CONTRIBUTING.md             # Guia de contribuição SOLID + OCP
└── LICENSE                     # Licença MIT
```

## Desenvolvimento Local

```bash
cp .env.example .env.local
# Preencha GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET e TOKEN_ENCRYPTION_KEY em .env.local
pnpm install
pnpm dev
# Acesse http://localhost:3000
```

## Deploy em 1 Clique na Vercel (Plano Gratuito)

1. Importe o repositório `veredito-sec` na [Vercel](https://vercel.com/new) (framework **Next.js** detectado automaticamente).
2. Configure as variáveis de ambiente na Vercel:
   - `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` (crie um GitHub OAuth App com callback `https://<seu-app>.vercel.app/api/integrations/github/callback`)
   - `TOKEN_ENCRYPTION_KEY` (gere com `openssl rand -hex 32`)
   - `ALLOW_LOCAL_LOOPBACK_TARGETS=false`
   - *(Opcional)* `NVD_API_KEY` (chave gratuita da NVD para enriquecimento CVSS mais rápido)
3. Faça o deploy — pronto! Zero banco de dados e zero servidor adicional necessários.

## Segurança, Contribuição e Licença

- Leia [SECURITY.md](./SECURITY.md) e [CONTRIBUTING.md](./CONTRIBUTING.md).
- Distribuído sob a licença [MIT](./LICENSE).
