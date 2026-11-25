# Arquitetura e Plano do Produto — Brynja (`brynja`)

> [English](../PLAN.md) · **Português (Brasil)**

## Visão do Produto

Plataforma Web open-source **100% Vercel Serverless + Local-First (IndexedDB)** para análise proativa de segurança em aplicações. O usuário seleciona um repositório GitHub (ou cola manifestos de dependências) e, opcionalmente, vincula uma URL de *staging* com posse comprovada criptograficamente para executar:

1. **Análise de Dependências (SCA / SBOM):** leitura de manifestos e *lockfiles* para mapear bibliotecas de terceiros e versões exatas (`npm`/`pnpm`, `pip`/`pyproject.toml`, extensível a novos ecossistemas via OCP).
2. **Consulta a APIs Públicas de Vulnerabilidades:**
   - **OSV.dev** (`https://api.osv.dev/v1/querybatch`) — consulta em lote por pacote/versão/ecossistema com resolução exata da faixa SemVer corrigida.
   - **NVD API 2.0 (NIST)** (`https://services.nvd.nist.gov/rest/json/cves/2.0`) — enriquecimento com CVSS e CWE.
   - **FIRST EPSS** (`https://api.first.org/data/v1/epss`) — probabilidade real de exploração.
   - **CISA KEV** (`https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`) — confirmação de exploração ativa conhecida.
3. **Verificação Ativa Controlada (*8 Safe Probes* Não Destrutivas):** verificações estritamente somente leitura (`GET`/`HEAD`) condicionadas a:
   - Desafios determinísticos HMAC-SHA256 por usuário e origem (`/.well-known/brynja-verify.txt`, registro DNS `TXT` `_brynja` ou sandbox loopback em desenvolvimento) selados em certificados AES-256-GCM de 7 dias com renovação automática ao vivo.
   - Proteção anti-SSRF via DNS, allowlist de cabeçalhos (`Origin`/`Accept`), *rate limiting*, *timeout* e *circuit breaker*.
   - Trilha de auditoria local-first salva no navegador do usuário (`IndexedDB`) junto ao histórico de varreduras e SBOMs, isolada por `ownerGithubUserId`.
4. **Extensibilidade para Agentes de IA:** porta arquitetural `IAgentAdvisorPort` desacoplada para futura análise de alcançabilidade e recomendações assistidas por agentes.

## Arquitetura SOLID Unificada (Next.js 15 App Router)

- **Núcleo Server-Side (`src/server/`):**
  - `src/server/domain/`: entidades puras, erros tipados, políticas de segurança (`SafeProbePolicy`, `AuthorizationPolicy`) e *ports* segregadas sem acoplamento a framework.
  - `src/server/application/`: *use cases* de responsabilidade única (`AnalyzeRepositoryScaUseCase`, `TargetAuthorizationUseCase`, `RunSafeProbesUseCase`) e composition root OCP (`container.ts`).
  - `src/server/infrastructure/`: adaptadores plugáveis (cifra AES-256-GCM, sessão efêmera, serviço de certificados de posse, parsers, clientes OSV/NVD/EPSS/KEV, SSRF DNS Guard, cliente HTTP com *rate limiter* e 8 *Safe Probes*).
  - `src/server/http/`: helpers *stateless* e validação Zod para Route Handlers.
- **API Stateless (`src/app/api/`):** Route Handlers finos no Next.js (`maxDuration = 60` nas rotas de análise) delegando diretamente aos *use cases*, sem banco de dados na nuvem.
- **Frontend & Núcleo Local-First (`src/core/` e `src/features/scans/`):**
  - `src/core/ports/`, `src/core/storage/brynja-indexeddb.store.ts` e `src/core/gateways/`: Inversão de Dependência (DIP) e isolamento multi-usuário local no navegador via IndexedDB.
  - `src/features/scans/`: *presenters* puros, *hooks* focados, *registries* OCP, exportadores executivos PDF/JSON/Markdown/CycloneDX e componentes acessíveis com suporte a temas Dark/Light.
