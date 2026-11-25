# Plano Arquitetural — Brynja (`brynja`)

## Visão do Produto

Plataforma Web (Painel) para análise automatizada de segurança em aplicações: o usuário informa um repositório de código (e, opcionalmente, uma URL de ambiente de *staging* devidamente autorizada) e a plataforma executa:

1. **Análise de Dependências (SCA):** Leitura de manifestos e *lockfiles* para mapear bibliotecas de terceiros e versões exatas (`npm`/`pnpm`, `pip`/`pyproject.toml`, extensível a novos ecossistemas).
2. **Consulta a APIs Públicas de Vulnerabilidades:**
   - **OSV.dev** (`https://api.osv.dev/v1/querybatch`) — consulta em lote por pacote/versão/ecossistema.
   - **NVD API 2.0 (NIST)** (`https://services.nvd.nist.gov/rest/json/cves/2.0`) — enriquecimento com CVSS e CWE.
   - **FIRST EPSS** (`https://api.first.org/data/v1/epss`) — probabilidade real de exploração.
   - **CISA KEV** (`https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`) — confirmação de exploração ativa conhecida.
3. **Testes de Penetração Controlados (*Safe Probes*):** Verificações estritamente não destrutivas (`GET`/`HEAD`) condicionadas a:
   - Comprovação explícita de posse/autorização do domínio (`/.well-known/brynja-verify.txt`, DNS `TXT` `_brynja` ou sandbox loopback em desenvolvimento).
   - Proteção contra SSRF, *rate limiting*, *timeout* e *circuit breaker*.
   - Registro imutável em `probe_audit_logs` no PostgreSQL.
4. **Feature Futura de Agentes de IA:** Porta arquitetural `IAgentAdvisorPort` preparada no backend para análise de alcançabilidade e recomendações assistidas por agentes.

## Arquitetura SOLID em Pastas Separadas

- **Frontend (`frontend/` — Next.js App Router):**
  - `src/app/`: apenas roteamento, layouts e composição (Server Components + Client Components isolados).
  - `src/core/ports/` e `src/core/gateways/`: inversão de dependência para comunicação com a API REST do backend.
  - `src/features/scans/`: componentes puros, hooks focados, presenters e registries extensíveis (OCP).
- **Backend (`backend/` — NestJS Modular):**
  - `src/modules/scans/domain/`: entidades puras, políticas de segurança (`SafeProbePolicy`, `AuthorizationPolicy`) e *ports* sem acoplamento a framework/ORM.
  - `src/modules/scans/application/`: *use cases* de responsabilidade única (`TriggerScanUseCase`, `VerifyTargetOwnershipUseCase`, `RunSafeProbesUseCase`, `GetScanReportUseCase`).
  - `src/modules/scans/infrastructure/`: *adapters* plugáveis (parsers, clients OSV/NVD/EPSS/KEV, executor de *safe probes* com *rate limiter*, Prisma PostgreSQL).
  - `src/modules/scans/presentation/`: *controllers* finos com DTOs validados.
  - `src/modules/ai-agents/`: porta `IAgentAdvisorPort` preparada para a feature futura de agentes.
