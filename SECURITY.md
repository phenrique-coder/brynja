# Security Policy — Brynja

> **English** · [Português (Brasil)](./docs/pt-BR/SECURITY.md)

## Ethical and Authorized Use

**Brynja** is a strictly **defensive** platform for dependency inventory (SCA/SBOM), public vulnerability intelligence correlation (OSV.dev, NVD, EPSS, CISA KEV), and **non-destructive** active verification (*Safe Probes*) exclusively targeting environments that you own or have explicit written authorization to audit.

Using this software against targets without formal authorization from the asset owner is strictly prohibited.

## Inviolable Architectural Guardrails

Every release and contribution must preserve the following security invariants:

1. **Mandatory Cryptographic Ownership Verification (`OwnershipCertificateService` + `AuthorizationPolicy`):** no HTTP probe is ever dispatched without prior ownership verification (`/.well-known/security.txt` RFC 9116 `# Brynja-Verification:` with legacy fallback `/.well-known/brynja-verify.txt`, `_brynja` DNS TXT record, or local loopback sandbox in development). AES-256-GCM signed certificates carry a bounded validity window (default 7 days) and only renew automatically if the live proof is still published on the target domain.
2. **Anti-SSRF Protection (`SsrfDnsGuardService`):** pre-flight DNS resolution blocking private networks (RFC1918), CGNAT, link-local / cloud metadata (`169.254.169.254`), and loopback in production (`ALLOW_LOCAL_LOOPBACK_TARGETS=false`).
3. **Strict Non-Destructive Policy (`SafeProbePolicy`):**
   - Only `GET` and `HEAD` HTTP methods are permitted.
   - Strict request header allowlist (`Origin` and `Accept` only).
   - No exploit payloads, write/mutation requests, brute-force enumeration, or flooding.
4. **Rate Limiting, Timeout, and Circuit Breaker:** per-scan rate limit, maximum request cap, strict timeout, and immediate circuit breaker trip on HTTP `429` or repeated `5xx` failures.
5. **Local-First Privacy & Zero Persistence of OAuth Tokens:**
   - GitHub OAuth tokens are never stored in any database; they travel sealed with AES-256-GCM exclusively inside an `HttpOnly` browser session cookie.
   - Scan history, SBOMs, authorizations, and probe audit trails are stored locally in the user's browser (**IndexedDB**), isolated by `ownerGithubUserId`.

## Reporting Vulnerabilities in Brynja

If you discover a security vulnerability in Brynja itself:

- **Do not open a public issue** containing exploitable details.
- Use the repository's **Security -> Advisories -> Report a vulnerability** workflow on GitHub (Private Vulnerability Reporting).
- Include clear reproduction steps, estimated impact, and suggested mitigation.
