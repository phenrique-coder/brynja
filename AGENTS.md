# Brynja — Regras Permanentes do Workspace

## 1. Arquitetura SOLID (100% Vercel Serverless + Local-First)
- O projeto é uma aplicação **Next.js 15 App Router** unificada na raiz (deploy 1-clique na Vercel, zero banco na nuvem), dividida rigidamente por camadas SOLID:
  - `src/server/domain/`: entidades puras, erros tipados, políticas (`SafeProbePolicy`, `AuthorizationPolicy`) e *ports* segregadas.
  - `src/server/application/`: *use cases* SRP e composition root (`container.ts`) com registries OCP (parsers, enriquecedores e 8 Safe Probes).
  - `src/server/infrastructure/`: adaptadores (AES-256-GCM, sessão efêmera, certificados assinados de posse, GitHub API, OSV/NVD/EPSS/KEV, SSRF DNS Guard e Safe Probes).
  - `src/core/` & `src/features/`: *ports* de frontend, armazenamento local no navegador (`IndexedDB` isolado por `ownerGithubUserId`), *presenters* puros, exportador PDF e UI.

## 2. Cláusula Pétrea de Segurança (Safe Probes & Privacidade)
- **NUNCA** executar sondas sem certificado criptográfico válido (`OwnershipCertificateService` + `AuthorizationPolicy`) pertencente ao usuário GitHub autenticado.
- **NUNCA** enfraquecer o bloqueio anti-SSRF (`SsrfDnsGuardService`) nem permitir métodos diferentes de `GET` e `HEAD` ou cabeçalhos fora da allowlist (`Origin`/`Accept`).
- **NUNCA** adicionar payloads destrutivos, escrita/mutação, força bruta ou persistência de valores sensíveis em `evidence`.
- **NUNCA** gravar tokens OAuth em banco de dados; manter sessão exclusivamente em cookie `HttpOnly` selado sem `Max-Age`/`Expires`.
- **NUNCA** commitar `.env`, `.env.local` ou segredos reais.

## 3. Sincronização Obrigatória do Catálogo de Safe Probes (`/scans/new`)
- Sempre que um novo Safe Probe for adicionado, renomeado ou removido em `src/server/infrastructure/pentest/probes/` e `createRegisteredSafeProbes()` (`src/server/application/container.ts`), **ATUALIZAR OBRIGATORIAMENTE**:
  1. `src/core/catalog/safe-probes.catalog.ts` (`SAFE_PROBE_IDS` e `SAFE_PROBES_CATALOG_MAP`: categoria, métodos `GET`/`HEAD`, alvos/cabeçalhos inspecionados e severidade máxima).
  2. As explicações traduzidas (`name`, `summary`, `checks`) nos 3 dicionários i18n (`src/core/i18n/dictionaries/pt-BR.ts`, `en.ts` e `es.ts`), exibidos automaticamente na tela `/scans/new` por `SafeProbesCatalogSection`.
  3. Validar a paridade 1-para-1 executando `pnpm typecheck && pnpm test` (`src/features/scans/__tests__/safe-probes-catalog.spec.tsx` bloqueia qualquer divergência entre o registry do servidor e a tela `/scans/new`).

## 4. Qualidade Obrigatória antes de Concluir Alterações
- Executar `pnpm typecheck && pnpm test && pnpm build` e confirmar que todos os testes (incluindo guardrails anti-SSRF, certificados, Safe Probes e paridade do catálogo em `/scans/new`) passam sem erros.

## 5. Versionamento Semântico (SemVer) & Changelog
- Para cada nova funcionalidade (`feat:` → `minor`), correção/ajuste (`fix:` / `perf:` / `security:` → `patch`) ou mudança incompatível (`BREAKING CHANGE` → `major`), seguir a skill `.agents/skills/semantic-versioning/SKILL.md`: incrementar `"version"` em `package.json`, documentar a versão em `CHANGELOG.md` e `docs/pt-BR/CHANGELOG.md` (que alimentam automaticamente `/changelog`, o rodapé e o SBOM CycloneDX) e validar com `node .agents/skills/semantic-versioning/scripts/bump-version.mjs --check` antes de commitar.
