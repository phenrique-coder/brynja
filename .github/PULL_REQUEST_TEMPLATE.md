## Summary of Changes

Concisely describe what changed and why.

## Type of Change

- [ ] New non-destructive *Safe Probe*
- [ ] New dependency parser / ecosystem (OCP)
- [ ] UI/UX or report export improvement
- [ ] Bug fix / false positive fix
- [ ] Documentation / CI / Infrastructure

## Mandatory Security & Guardrails Checklist

- [ ] Does not weaken cryptographic ownership verification (`OwnershipCertificateService` / `AuthorizationPolicy`).
- [ ] Does not weaken anti-SSRF protection (`SsrfDnsGuardService`).
- [ ] Probes exclusively use `GET` / `HEAD` via `IRateLimitedHttpClient` (header allowlist `Origin`/`Accept`), with no destructive payloads or sensitive secret/cookie values captured in `evidence`.
- [ ] No OAuth tokens are persisted in any database or logs.
- [ ] No `.env*` files (other than `.env.example`), real secrets, or private domains/users are included in the diff or tests.

## Technical & Validation Checklist

- [ ] SOLID architecture respected (`src/server/` layers and `src/core/` + `src/features/` separation).
- [ ] `pnpm typecheck && pnpm test && pnpm build` executed successfully.
