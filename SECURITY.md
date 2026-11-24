# Política de Segurança — VereditoSec

## Uso Ético e Autorizado

O **VereditoSec** é uma plataforma estritamente **defensiva** para inventário de dependências (SCA/SBOM), cruzamento de inteligência pública de vulnerabilidades (OSV.dev, NVD, EPSS, CISA KEV) e verificação ativa **não destrutiva** (*Safe Probes*) exclusivamente em ambientes que você possui ou tem autorização explícita para auditar.

É expressamente proibido utilizar este software contra alvos sem autorização formal do proprietário.

## Guardrails Arquiteturais Invioláveis

Todas as releases e contribuições devem preservar os seguintes invariantes:

1. **Verificação Criptográfica de Posse Obrigatória (`TargetAuthorization`):** nenhuma sonda HTTP é disparada sem validação prévia de posse (`/.well-known/vereditosec-verify.txt`, registro `_vereditosec` DNS TXT ou loopback local explicitamente habilitado).
2. **Proteção Anti-SSRF (`SsrfDnsGuardService`):** resolução DNS prévia bloqueando endereços privados (RFC1918), CGNAT, link-local / cloud metadata (`169.254.169.254`) e loopback em produção.
3. **Política Estrita Não Destrutiva (`SafeProbePolicy`):**
   - Apenas métodos HTTP `GET` e `HEAD`.
   - Allowlist estrita de cabeçalhos de requisição (`Origin` e `Accept` apenas).
   - Proibição de payloads de exploração, escrita/mutação, força bruta ou *flooding*.
4. **Rate Limiting, Timeout e Circuit Breaker:** limitação de taxa por scan, teto máximo de requisições e abertura imediata de *circuit breaker* em respostas `429` ou falhas `5xx` repetidas.
5. **Trilha de Auditoria Imutável (`probe_audit_logs`):** toda autorização, revogação e requisição HTTP emitida é registrada em PostgreSQL.
6. **Zero Persistência de Tokens OAuth:** tokens de sessão GitHub OAuth nunca são gravados em banco de dados; trafegam selados em AES-256-GCM exclusivamente em cookie `HttpOnly` de sessão do navegador.

## Reportando Vulnerabilidades no VereditoSec

Se você identificar uma vulnerabilidade de segurança no próprio VereditoSec (por exemplo, bypass de SSRF, quebra de isolamento multi-usuário, XSS ou vazamento de sessão):

- **Não abra uma issue pública** contendo detalhes exploráveis.
- Utilize a aba **Security -> Advisories -> Report a vulnerability** do repositório no GitHub (GitHub Private Vulnerability Reporting).
- Inclua passos claros de reprodução, impacto estimado e, se possível, sugestão de mitigação.

Nosso objetivo é responder ao relato inicial em até **72 horas** e publicar a correção de forma coordenada.
