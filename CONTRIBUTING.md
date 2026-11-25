# Contributing to Brynja

> **English** · [Português (Brasil)](./docs/pt-BR/CONTRIBUTING.md)

Thank you for your interest in contributing to **Brynja**! This project is a unified **Next.js 15 (100% Vercel Serverless + IndexedDB Local-First)** web application structured rigorously around **SOLID** principles and **defensive security**.

## Architecture Guidelines

- **`src/server/` (SOLID Server-Side Core):** `domain/` (pure entities, typed errors, policies, and segregated ports), `application/` (SRP use cases and `container.ts`), `infrastructure/` (cryptographic adapters, dependency parsers, CVE intelligence APIs, and 8 *Safe Probes*), and `http/` (helpers for Route Handlers).
- **`src/app/api/`:** thin stateless Route Handlers that validate input with Zod, authenticate the ephemeral OAuth session cookie, and delegate to use cases.
- **`src/core/` & `src/features/` (SOLID Frontend):** `core/` (models, ports, `IndexedDbBrynjaStore`, and `HttpScanGateway`), `features/` (hooks, pure presenters, OCP registries, executive PDF exporter, and UI components).

### Extending via the Open/Closed Principle (OCP)

- **New dependency parser:** implement `IDependencyParser` in `src/server/infrastructure/parsers/` and register it in the `parsers` array in `src/server/application/container.ts`.
- **New vulnerability enricher:** implement `IVulnerabilityEnricher` in `src/server/infrastructure/vuln-intel/` and register it in `enrichers` in `container.ts`.
- **New non-destructive probe (*Safe Probe*):** implement `IControlledProbe` in `src/server/infrastructure/pentest/probes/`, issue requests exclusively via `httpClient.executeSafeRequest` (`GET`/`HEAD`), and register it in `probes` in `container.ts`.

## Mandatory Security Rules for Pull Requests

Pull requests will be rejected if they:

- Weaken or bypass `SafeProbePolicy`, `AuthorizationPolicy`, `OwnershipCertificateService`, or `SsrfDnsGuardService`.
- Introduce HTTP methods other than `GET`/`HEAD`, exploit payloads, brute-force enumeration, or collection of sensitive secret/cookie values in `evidence`.
- Persist OAuth tokens in any database or logs.
- Commit `.env*` files (other than `.env.example`), real keys, personal tokens, or private domains in code or tests.

## Local Development Workflow

```bash
cp .env.example .env.local
pnpm install
pnpm typecheck && pnpm test && pnpm build
```
