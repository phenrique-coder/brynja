# Contribuindo com o Brynja

> [English](../../CONTRIBUTING.md) · **Português (Brasil)**

Obrigado pelo interesse em contribuir com o **Brynja**! Este projeto é um aplicativo **Next.js 15 (100% Vercel Serverless + IndexedDB Local-First)** organizado com rigor em **SOLID** e **segurança defensiva**.

## Diretrizes de Arquitetura

- **`src/server/` (Núcleo Server-Side SOLID):** `domain/` (entidades, erros, políticas e *ports*), `application/` (*use cases* SRP e `container.ts`), `infrastructure/` (*adapters* criptográficos, parsers, APIs de CVEs e 8 *Safe Probes*) e `http/` (*helpers* para Route Handlers).
- **`src/app/api/`:** Route Handlers *stateless* finos que validam entrada com Zod, autenticam sessão OAuth e delegam aos *use cases*.
- **`src/core/` e `src/features/` (Frontend SOLID):** `core/` (modelos, *ports*, `IndexedDbBrynjaStore` e `HttpScanGateway`), `features/` (*hooks*, *presenters* puros, *registries* OCP, exportador PDF e UI).

### Como estender via Open/Closed Principle (OCP)

- **Novo parser de dependências:** implemente `IDependencyParser` em `src/server/infrastructure/parsers/` e registre no array `parsers` em `src/server/application/container.ts`.
- **Novo enriquecedor de vulnerabilidades:** implemente `IVulnerabilityEnricher` em `src/server/infrastructure/vuln-intel/` e registre em `enrichers` em `container.ts`.
- **Nova sonda não destrutiva (*Safe Probe*):** implemente `IControlledProbe` em `src/server/infrastructure/pentest/probes/`, utilize exclusivamente `httpClient.executeSafeRequest` (`GET`/`HEAD`) e registre em `probes` em `container.ts`.

## Regras Obrigatórias de Segurança para PRs

PRs serão rejeitados se:

- Enfraquecerem ou contornarem `SafeProbePolicy`, `AuthorizationPolicy`, `OwnershipCertificateService` ou `SsrfDnsGuardService`.
- Adicionarem métodos HTTP diferentes de `GET`/`HEAD`, payloads de exploração, força bruta ou coleta de credenciais/valores sensíveis em `evidence`.
- Persistirem tokens OAuth em banco de dados ou logs.
- Incluírem arquivos `.env`, chaves reais, tokens pessoais ou domínios privados no código ou nos testes.

## Fluxo de Desenvolvimento Local

```bash
cp .env.example .env.local
pnpm install
pnpm typecheck && pnpm test && pnpm build
```
