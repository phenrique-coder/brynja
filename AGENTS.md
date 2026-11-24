# Regras do Workspace — VereditoSec

Estas diretrizes aplicam-se a todos os agentes trabalhando no repositório `veredito-sec`.
O projeto separa `frontend/` (Next.js App Router) e `backend/` (NestJS Modular) em projetos independentes.

## 1. Arquitetura e Princípios SOLID (Obrigatórios)

### Frontend (`frontend/` — Next.js App Router)
- **SRP:** Arquivos dentro de `src/app/` (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`) apenas orquestram rotas e composição de UI. Nunca coloque `fetch` direto, parse de dados ou regras de negócio dentro de páginas ou componentes visuais.
- **OCP:** Mapeamentos de severidade, tipos de achado e exportadores devem usar *Strategy/Registry Maps* extensíveis em vez de `switch` espalhados.
- **LSP:** Variantes de componentes UI e implementações de `IScanReader` / `IScanCreator` / `IReportExporter` devem respeitar integralmente os contratos base.
- **ISP:** Defina props e *ports* enxutos por caso de uso; nenhum componente deve receber objetos gigantes se usa apenas 2 ou 3 campos.
- **DIP:** Views e hooks dependem apenas de abstrações em `src/core/ports/` injetadas via Provider/Context, permitindo substituição por implementações mock em testes.

### Backend (`backend/` — NestJS Modular)
- **SRP:** Controllers apenas validam DTOs e delegam para UseCases em `application/`. Cada UseCase executa um único caso de uso.
- **OCP:** Parsers de dependências (`IDependencyParser`), provedores de inteligência (`IVulnerabilityProvider`) e sondas (`IControlledProbe`) devem ser registrados em *registries* / multi-providers sem editar o orquestrador central.
- **LSP:** Todas as implementações de adapters devem respeitar pré/pós-condições, tipos normalizados e erros de domínio esperados.
- **ISP:** Segregue tokens de injeção granulares (leitura vs. escrita, verificação de posse vs. execução de sonda).
- **DIP:** Camadas `domain/` e `application/` nunca importam `@nestjs/*`, `prisma`, `axios` ou drivers concretos; toda dependência externa entra via *ports* conectadas nos módulos NestJS.

## 2. Guardrails Obrigatórios de Segurança (Cláusula Pétrea)

1. **Proibição de Testes Destrutivos:** O módulo de verificação ativa só pode executar **Safe Probes** estritamente não destrutivos (`GET` ou `HEAD` somente leitura, detecção de headers, assinaturas expostas e arquivos públicos acidentais). Nunca implemente payloads de exploração destrutiva, escrita remota, força bruta ou fuzzing agressivo.
2. **Autorização Explícita Antes de Qualquer Sonda:** `RunSafeProbesUseCase` e o executor de sondas **devem** exigir um registro `TargetAuthorization` válido e verificado (`/.well-known/vereditosec-verify.txt`, registro DNS `TXT`, ou loopback local apenas quando `ALLOW_LOCAL_LOOPBACK_TARGETS=true`).
3. **Proteção SSRF + Rate Limit + Circuit Breaker:** Toda URL alvo passa por validação de esquema (`http:`/`https:`) e resolução de IP bloqueando faixas privadas/metadata (exceto loopback autorizado em dev). Toda execução respeita `SAFE_PROBE_MAX_RPS`, timeout curto e interrupção em `429`/`5xx`.
4. **Auditoria Imutável:** Toda tentativa de verificação de domínio e toda requisição de sonda devem gerar registro persistido em `probe_audit_logs` no PostgreSQL.

## 3. Qualidade e Verificação

- Sempre execute testes unitários, lint, typecheck e build em `frontend/` e `backend/` antes de concluir alterações.
- Mantenha contratos DTO alinhados explicitamente entre `backend/src/modules/scans/presentation/dto/` e `frontend/src/core/models/`.
