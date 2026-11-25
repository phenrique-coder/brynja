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

## 3. Qualidade Obrigatória antes de Concluir Alterações
- Executar `pnpm typecheck && pnpm test && pnpm build` e confirmar que todos os testes (incluindo guardrails anti-SSRF, certificados e 8 Safe Probes) passam sem erros.

## 4. Versionamento Semântico (SemVer) & Changelog
- Para cada nova funcionalidade (`feat:` → `minor`), correção/ajuste (`fix:` / `perf:` / `security:` → `patch`) ou mudança incompatível (`BREAKING CHANGE` → `major`), seguir a skill `.agents/skills/semantic-versioning/SKILL.md`: incrementar `"version"` em `package.json`, documentar a versão em `CHANGELOG.md` e `docs/pt-BR/CHANGELOG.md` (que alimentam automaticamente `/changelog`, o rodapé e o SBOM CycloneDX) e validar com `node .agents/skills/semantic-versioning/scripts/bump-version.mjs --check` antes de commitar.
