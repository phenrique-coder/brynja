# Política de Segurança — Brynja

> [English](../../SECURITY.md) · **Português (Brasil)**

## Uso Ético e Autorizado

O **Brynja** é uma plataforma estritamente **defensiva** para inventário de dependências (SCA/SBOM), cruzamento de inteligência pública de vulnerabilidades (OSV.dev, NVD, EPSS, CISA KEV) e verificação ativa **não destrutiva** (*Safe Probes*) exclusivamente em ambientes que você possui ou tem autorização explícita para auditar.

É expressamente proibido utilizar este software contra alvos sem autorização formal do proprietário.

## Guardrails Arquiteturais Invioláveis

Todas as releases e contribuições devem preservar os seguintes invariantes:

1. **Verificação Criptográfica de Posse Obrigatória (`OwnershipCertificateService` + `AuthorizationPolicy`):** nenhuma sonda HTTP é disparada sem validação prévia de posse (`/.well-known/security.txt` RFC 9116 `# Brynja-Verification:` com fallback legado `/.well-known/brynja-verify.txt`, registro `_brynja` DNS TXT ou loopback local em dev). Certificados assinados em AES-256-GCM têm validade limitada (padrão 7 dias) e só se renovam automaticamente se a prova ao vivo ainda estiver publicada no domínio.
2. **Proteção Anti-SSRF (`SsrfDnsGuardService`):** resolução DNS prévia bloqueando endereços privados (RFC1918), CGNAT, link-local / cloud metadata (`169.254.169.254`) e loopback em produção (`ALLOW_LOCAL_LOOPBACK_TARGETS=false`).
3. **Política Estrita Não Destrutiva (`SafeProbePolicy`):**
   - Apenas métodos HTTP `GET` e `HEAD`.
   - Allowlist estrita de cabeçalhos de requisição (`Origin` e `Accept` apenas).
   - Proibição de payloads de exploração, escrita/mutação, força bruta ou *flooding*.
4. **Rate Limiting, Timeout e Circuit Breaker:** limitação de taxa por scan, teto máximo de requisições e abertura imediata de *circuit breaker* em respostas `429` ou falhas `5xx` repetidas.
5. **Privacidade Local-First & Zero Persistência de Tokens OAuth:**
   - Tokens GitHub OAuth nunca são salvos em banco de dados; trafegam selados em AES-256-GCM exclusivamente em cookie `HttpOnly` de sessão do navegador.
   - Histórico de varreduras, SBOM e trilha de auditoria ficam salvos localmente no navegador do usuário (**IndexedDB**), isolados por `ownerGithubUserId`.

## Reportando Vulnerabilidades no Brynja

Se você identificar uma vulnerabilidade de segurança no próprio Brynja:

- **Não abra uma issue pública** contendo detalhes exploráveis.
- Utilize a aba **Security -> Advisories -> Report a vulnerability** do repositório no GitHub (Private Vulnerability Reporting).
- Inclua passos claros de reprodução, impacto estimado e sugestão de mitigação.
