# Guia de Publicação Open-Source e Proteção da Branch `main`

Este guia descreve como publicar o **VereditoSec** como repositório público no GitHub com segurança, histórico limpo e proteção obrigatória na branch `main`.

## 1. O que já foi preparado neste repositório

- **Dados pessoais anonimizados:** todas as fixtures de teste usam `octocat/demo-app`, `octocat/demo-platform` e `staging.example.com`.
- **Nenhum segredo versionado:** `.gitignore` bloqueia `.env`, `.env.local` e logs; o job `guardrails-check` do CI impede commits futuros de `.env`.
- **Governança open-source:** [LICENSE](../LICENSE) (MIT), [SECURITY.md](../SECURITY.md), [CONTRIBUTING.md](../CONTRIBUTING.md), templates de PR e Issue em `.github/`.
- **CI Automatizado:** [.github/workflows/ci.yml](../.github/workflows/ci.yml) executando `guardrails-check`, `backend` (com PostgreSQL 16 real) e `frontend`.
- **Script de proteção da branch `main`:** [scripts/configure-branch-protection.sh](../scripts/configure-branch-protection.sh).

## 2. Opcional — Histórico Inicial Limpo (Squash antes do primeiro push público)

Se você quiser que o histórico público comece com um único commit limpo (sem commits anteriores de desenvolvimento local):

```bash
git checkout --orphan main-public
git add -A
git commit -m "chore: initial public release of VereditoSec"
git branch -M main-public main
```

> Execute isso **somente antes** do primeiro `git push` para o repositório público.

## 3. Criar o repositório público e enviar o código

```bash
gh repo create veredito-sec --public --source=. --remote=origin --push
```

## 4. Ativar Proteção da Branch `main`

Após o primeiro workflow do GitHub Actions rodar na `main`, execute:

```bash
chmod +x scripts/configure-branch-protection.sh
./scripts/configure-branch-protection.sh <seu-usuario>/veredito-sec
```

Isso bloqueia *force-push*, bloqueia deleção da `main`, exige Pull Request com ao menos 1 aprovação sua, descarta aprovações antigas quando novos commits chegam, exige resolução de comentários e obriga todos os 3 checks de CI (`Guardrails & Secrets Check`, `Backend` e `Frontend`) verdes antes do merge.

## 5. Configurações extras recomendadas no GitHub

1. **Settings -> Security -> Code security:** ative **Private vulnerability reporting**, **Dependabot alerts** e **Secret scanning**.
2. **GitHub OAuth App de Produção:** ao subir para o servidor Oracle, crie um GitHub OAuth App separado com `Authorization callback URL` apontando para `https://seu-dominio/api/integrations/github/callback` e gere uma nova `TOKEN_ENCRYPTION_KEY` de 32 bytes (`openssl rand -hex 32`).
