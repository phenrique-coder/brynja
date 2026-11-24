## Resumo das Alterações

Descreva de forma objetiva o que foi alterado e por quê.

## Tipo de Mudança

- [ ] Nova sonda segura (*Safe Probe* não destrutiva)
- [ ] Novo parser de dependências / ecossistema (OCP)
- [ ] Melhoria de UI/UX ou exportação de relatório
- [ ] Correção de bug / falso positivo
- [ ] Documentação / CI / Infraestrutura

## Checklist Obrigatório de Segurança & Guardrails

- [ ] Não enfraquece verificação criptográfica de posse (`AuthorizationPolicy`).
- [ ] Não enfraquece proteção anti-SSRF (`SsrfDnsGuardService`).
- [ ] Sondas utilizam exclusivamente `GET` / `HEAD` via `IRateLimitedHttpClient`, sem payloads destrutivos nem persistência de valores sensíveis (ex.: tokens/cookies).
- [ ] Nenhum token OAuth é salvo em banco de dados.
- [ ] Nenhum arquivo `.env`, segredo real ou domínio/usuário privado foi incluído no diff ou nos testes.

## Checklist Técnico & Validação

- [ ] Arquitetura SOLID respeitada (`domain` / `application` / `infrastructure` / `presentation` no backend; `core` / `features` no frontend).
- [ ] `cd backend && pnpm typecheck && pnpm test && pnpm build` executado com sucesso.
- [ ] `cd frontend && pnpm typecheck && pnpm test && pnpm build` executado com sucesso.
