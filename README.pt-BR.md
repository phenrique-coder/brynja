<p align="center">
  <img src="./public/brynja-logo.svg" alt="Brynja — SCA, CVEs e Safe Probes" width="320" />
</p>

<p align="center">
  <strong>Plataforma Web open-source 100% Vercel Serverless + Local-First (IndexedDB) para análise proativa de segurança de aplicações.</strong><br/>
  Zero banco de dados na nuvem · Zero servidor separado · Arquitetura SOLID rigorosa.
</p>

<p align="center">
  <a href="./README.md">English</a> · <strong>Português (Brasil)</strong>
</p>

---

## Por que *Brynja*?

**Brynja** (pronuncia-se *BRÍN-ia*) vem do **nórdico antigo e do islandês** e significa **cota de malha** — a armadura forjada por anéis metálicos entrelaçados que distribuem a força de qualquer impacto sem depender de uma única placa rígida.

Esse conceito traduz exatamente a filosofia de **defesa em profundidade (*defense-in-depth*)** da plataforma:

- **Anéis que se protegem mutuamente:** em vez de depender de uma única verificação isolada, o Brynja entrelaça três camadas complementares — **inventário de dependências (SCA / SBOM)**, **inteligência pública de vulnerabilidades (OSV, NVD, EPSS, CISA KEV)** e **8 sondas ativas não destrutivas (*Safe Probes*)**.
- **Flexibilidade com rigor:** assim como a cota de malha protege sem imobilizar quem a veste, os *guardrails* do Brynja (prova criptográfica de posse, bloqueio anti-SSRF, política estrita `GET`/`HEAD`, *rate limit* e armazenamento local no navegador) garantem segurança real sem exigir infraestrutura pesada ou exposição de segredos em banco na nuvem.
- **O emblema:** o ícone do Brynja combina a silhueta de um escudo nórdico com uma trama geométrica de elos entrelaçados convergindo para um núcleo central, simbolizando as camadas integradas de proteção.

## Principais Recursos

1. **Inventário de Dependências (SCA / SBOM):** extrai bibliotecas e versões de repositórios GitHub (privados e públicos via GitHub API) ou manifestos colados manualmente para Node.js (`package.json`, `package-lock.json`, `pnpm-lock.yaml`) e Python (`requirements.txt`, `pyproject.toml`), extensível via Open/Closed Principle (OCP).
2. **Inteligência Pública de Vulnerabilidades:** cruza o SBOM em lote com **OSV.dev** (com resolução exata da faixa SemVer corrigida), **NVD API 2.0**, **FIRST EPSS** e **CISA KEV**.
3. **Verificação Ativa Controlada (*8 Safe Probes* Não Destrutivas):**
   - `SecurityHeadersProbe`, `HstsTlsProbe`, `CookieSecurityProbe`, `CorsMisconfigProbe`, `ExposedArtifactsProbe`, `ExposedDocsAndMetricsProbe`, `RuntimeFingerprintProbe` e `SourceMapExposureProbe`.
4. **Guardrails Invioláveis & Posse Stateless Assinada:**
   - Verificação criptográfica obrigatória de posse com token determinístico HMAC-SHA256 por usuário e origem (`/.well-known/brynja-verify.txt`, registro `_brynja` DNS TXT ou `LOCAL_DEV_SANDBOX` em desenvolvimento).
   - Emite certificado assinado em **AES-256-GCM** válido por 7 dias com **renovação automática** caso a prova continue publicada no domínio (e bloqueio imediato se removida).
   - Proteção anti-SSRF via DNS, somente `GET`/`HEAD` com allowlist de cabeçalhos (`Origin`/`Accept`), *rate limiting* e *circuit breaker*.
5. **Privacidade Local-First (Zero Banco na Nuvem):**
   - Histórico de varreduras, SBOM, alvos e trilha de auditoria ficam salvos no **IndexedDB do próprio navegador**, isolados por conta GitHub (`ownerGithubUserId`).
   - Sessão GitHub OAuth selada em AES-256-GCM exclusivamente em cookie `HttpOnly` de sessão do navegador (expira ao fechar ou clicar em **Sair**).
6. **Relatórios Executivos:** download em **PDF executivo**, **JSON**, **Markdown** e **SBOM CycloneDX 1.5**, além de histórico pesquisável e temas Dark / Light (sépia).

## Estrutura do Projeto (SOLID)

```text
brynja/
├── public/
│   └── brynja-logo.svg         # Logotipo oficial (escudo nórdico + cota de malha)
├── src/
│   ├── app/                    # Next.js 15 App Router (UI, icon.svg e Route Handlers /api/*)
│   ├── server/                 # Núcleo SOLID server-side (domain, application, infrastructure, http)
│   ├── core/                   # Ports, modelos, IndexedDB store e local-first gateway
│   └── features/scans/         # Hooks, presenters puros, registries OCP, exportador PDF e UI
├── docs/                       # Documentação de arquitetura e deploy (Inglês + pt-BR/)
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

1. Importe o repositório `brynja` na [Vercel](https://vercel.com/new) (framework **Next.js** detectado automaticamente).
2. Configure as variáveis de ambiente na Vercel:
   - `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` (crie um GitHub OAuth App com callback `https://<seu-app>.vercel.app/api/integrations/github/callback`)
   - `TOKEN_ENCRYPTION_KEY` (gere com `openssl rand -hex 32`)
   - `ALLOW_LOCAL_LOOPBACK_TARGETS=false`
   - *(Opcional)* `NVD_API_KEY` (chave gratuita da NVD para enriquecimento CVSS mais rápido)
3. Faça o deploy — pronto! Zero banco de dados e zero servidor adicional necessários.

## Documentação

| Documento | Português (Brasil) | English |
| --- | --- | --- |
| Visão Geral e Configuração | [README.pt-BR.md](./README.pt-BR.md) | [README.md](./README.md) |
| Changelog (Notas de Versão) | [docs/pt-BR/CHANGELOG.md](./docs/pt-BR/CHANGELOG.md) | [CHANGELOG.md](./CHANGELOG.md) |
| Política de Segurança e Guardrails | [docs/pt-BR/SECURITY.md](./docs/pt-BR/SECURITY.md) | [SECURITY.md](./SECURITY.md) |
| Guia de Contribuição | [docs/pt-BR/CONTRIBUTING.md](./docs/pt-BR/CONTRIBUTING.md) | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Deploy na Vercel e Governança | [docs/pt-BR/OPEN_SOURCE_RELEASE.md](./docs/pt-BR/OPEN_SOURCE_RELEASE.md) | [docs/OPEN_SOURCE_RELEASE.md](./docs/OPEN_SOURCE_RELEASE.md) |
| Arquitetura e Plano do Produto | [docs/pt-BR/PLAN.md](./docs/pt-BR/PLAN.md) | [docs/PLAN.md](./docs/PLAN.md) |

## Licença

Distribuído sob a licença [MIT](./LICENSE).
