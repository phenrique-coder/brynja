# Vercel Deployment & Open-Source Governance Guide

> **English** · [Português (Brasil)](./pt-BR/OPEN_SOURCE_RELEASE.md)

## 1. 100% Free-Tier Deployment on Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new) and import the `brynja` repository.
2. Keep **Root Directory** at the repository root (`.`) and Framework Preset as **Next.js** (auto-detected).
3. Under **Environment Variables**, configure:
   - `GITHUB_CLIENT_ID`: Client ID of your production GitHub OAuth App
   - `GITHUB_CLIENT_SECRET`: Client Secret of your production GitHub OAuth App
   - `TOKEN_ENCRYPTION_KEY`: generate a 64-character hex key (`openssl rand -hex 32`)
   - `ALLOW_LOCAL_LOOPBACK_TARGETS`: `false`
   - `AUTHORIZATION_TTL_DAYS`: `7`
   - *(Optional)* `NVD_API_KEY`: free NVD 2.0 API key for faster CVSS enrichment
4. On GitHub (**Settings -> Developer settings -> OAuth Apps**), set your production app's **Authorization callback URL** to:
   - `https://<your-vercel-domain>/api/integrations/github/callback`
   *(Defining `GITHUB_CALLBACK_URL` on Vercel is optional: Brynja automatically derives the HTTPS request origin, though you can set it explicitly when using a custom domain.)*

## 2. Protecting the `main` Branch

```bash
chmod +x scripts/configure-branch-protection.sh
./scripts/configure-branch-protection.sh <your-user>/brynja
```

Required CI status checks enforced on `main`:
- `Guardrails & Secrets Check`
- `Server Core & Safe Probes Tests`
- `UI Tests, Typecheck & Next.js Build`
