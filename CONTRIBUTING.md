# Contribuindo com o VereditoSec

Obrigado pelo interesse em contribuir com o **VereditoSec**! Este projeto mantém padrões rigorosos de arquitetura **SOLID** e **segurança defensiva**.

## Diretrizes de Arquitetura

O repositório é dividido em duas aplicações independentes:

- **`backend/` (NestJS + Prisma + PostgreSQL):** siga a separação `domain/` (entidades, erros, políticas e *ports*), `application/` (*use cases* SRP), `infrastructure/` (*adapters* de banco, APIs e sondas) e `presentation/` (*controllers* e DTOs Zod).
- **`frontend/` (Next.js App Router + Tailwind):** siga `core/` (modelos, *ports* e *gateways* injetáveis) e `features/` (*hooks*, *presenters* puros, *registries* OCP, *exporters* e componentes UI).

### Como estender via Open/Closed Principle (OCP)

- **Novo parser de dependências** (ex.: `go.mod`, `Cargo.toml`, `composer.json`): implemente `IDependencyParser` em `backend/src/modules/scans/infrastructure/parsers/` e registre no multi-provider `DEPENDENCY_PARSERS_PORT` em `scans.module.ts`.
- **Novo enriquecedor de vulnerabilidades:** implemente `IVulnerabilityEnricher` em `backend/src/modules/scans/infrastructure/vuln-intel/` e registre em `VULNERABILITY_ENRICHERS_PORT`.
- **Nova sonda não destrutiva (*Safe Probe*):** implemente `IControlledProbe` em `backend/src/modules/scans/infrastructure/pentest/probes/`, utilize exclusivamente `httpClient.executeSafeRequest` (`GET`/`HEAD`) e registre em `CONTROLLED_PROBES_PORT`.

## Regras Obrigatórias de Segurança para PRs

PRs serão **rejeitados automaticamente** se:

- Enfraquecerem ou contornarem `SafeProbePolicy`, `AuthorizationPolicy` ou `SsrfDnsGuardService`.
- Adicionarem métodos HTTP diferentes de `GET`/`HEAD`, payloads de exploração, força bruta ou coleta de credenciais/valores sensíveis em `evidence`.
- Persistirem tokens OAuth ou credenciais de usuários em banco de dados ou logs.
- Incluírem arquivos `.env`, chaves reais, tokens pessoais ou domínios privados em código ou fixtures de teste.

## Fluxo de Desenvolvimento Local

```bash
# 1. Subir PostgreSQL de desenvolvimento
cp .env.example .env
docker compose up -d postgres

# 2. Backend: typecheck, testes e build
cd backend
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm typecheck && pnpm test && pnpm build

# 3. Frontend: typecheck, testes e build
cd ../frontend
pnpm install
pnpm typecheck && pnpm test && pnpm build
```

## Checklist antes de abrir Pull Request

- [ ] Código segue SOLID (`AGENTS.md`) com responsabilidade única e dependências por interface.
- [ ] Todos os testes de `backend/` e `frontend/` passam localmente.
- [ ] Novos recursos ou correções possuem testes unitários cobrindo casos felizes e bordas/falsos positivos.
- [ ] Nenhum dado pessoal, domínio privado ou segredo está presente no diff.
