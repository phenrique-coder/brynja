---
name: public-vuln-apis
description: >-
  Use this skill when integrating or maintaining public vulnerability intelligence
  APIs (OSV.dev, NVD API 2.0, FIRST EPSS, CISA KEV) and normalizing advisories.
---

# Public Vulnerability Intelligence APIs

## Fontes Suportadas

1. **OSV.dev (`POST https://api.osv.dev/v1/querybatch`)**
   - Entrada: `{ queries: [{ package: { name, ecosystem }, version }] }` (`npm`, `PyPI`, etc.).
   - Seguir com `GET https://api.osv.dev/v1/vulns/<id>` quando precisar de detalhes completos (`affected`, `fixed`, `aliases`).
2. **NVD API 2.0 (`GET https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=...`)**
   - Enriquecimento com vetor CVSS v3.1/v4 e CWE.
   - Respeitar cache local/PostgreSQL e throttling; usar header `apiKey` se `NVD_API_KEY` estiver configurado.
3. **FIRST EPSS (`GET https://api.first.org/data/v1/epss?cve=...`)**
   - Retorna probabilidade (`epss`) e percentil (`percentile`) de exploração nos próximos 30 dias.
4. **CISA KEV (`GET https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`)**
   - Cachear catálogo em memória/PostgreSQL (TTL configurável) para marcar `isKnownExploited = true`.

## Resiliência
- Nunca falhe o scan inteiro se um enriquecedor secundário (NVD/EPSS/KEV) estiver indisponível ou lento; degrade graciosamente registrando aviso no relatório.
