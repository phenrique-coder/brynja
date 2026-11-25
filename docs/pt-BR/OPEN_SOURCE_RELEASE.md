# Guia de Deploy na Vercel e Governança Open-Source

> [English](../OPEN_SOURCE_RELEASE.md) · **Português (Brasil)**

## 1. Deploy 100% Gratuito na Vercel

1. Acesse [https://vercel.com/new](https://vercel.com/new) e importe o repositório `brynja`.
2. Deixe **Root Directory** na raiz (`.`) e Framework **Next.js** (auto-detectado).
3. Em **Environment Variables**, configure:
   - `GITHUB_CLIENT_ID`: Client ID do seu GitHub OAuth App de produção
   - `GITHUB_CLIENT_SECRET`: Client Secret do seu GitHub OAuth App de produção
   - `TOKEN_ENCRYPTION_KEY`: gere uma nova chave de 64 caracteres hex (`openssl rand -hex 32`)
   - `ALLOW_LOCAL_LOOPBACK_TARGETS`: `false`
   - `AUTHORIZATION_TTL_DAYS`: `7`
   - *(Opcional)* `NVD_API_KEY`: chave gratuita da NVD 2.0
4. No GitHub (**Settings -> Developer settings -> OAuth Apps**), configure o **Authorization callback URL** do app de produção para:
   - `https://<seu-dominio-vercel>/api/integrations/github/callback`
   *(Não é obrigatório definir `GITHUB_CALLBACK_URL` na Vercel: a aplicação detecta automaticamente a origem da requisição HTTPS, mas você pode defini-la explicitamente se usar domínio customizado.)*

## 2. Proteção da Branch `main`

```bash
chmod +x scripts/configure-branch-protection.sh
./scripts/configure-branch-protection.sh <seu-usuario>/brynja
```

Checks obrigatórios configurados:
- `Guardrails & Secrets Check`
- `Server Core & Safe Probes Tests`
- `UI Tests, Typecheck & Next.js Build`
