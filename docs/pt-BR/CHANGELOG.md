# Changelog

> [English](../../CHANGELOG.md) · **Português (Brasil)**

Todas as alterações relevantes do **Brynja** são documentadas neste arquivo.

O formato segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [Versionamento Semântico 2.0.0 (SemVer)](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2026-11-25

### Adicionado
- Rodapé global em todas as telas exibindo a versão dinâmica (`v1.1.0`), resumo técnico, postura de privacidade *Local-First* e atalhos para Changelog, Repositório, Segurança, Contribuição e Licença MIT.
- Página pública `/changelog` integrada à aplicação para consultar o que mudou em cada versão sem precisar fazer login.
- Skill de Versionamento Semântico (`.agents/skills/semantic-versioning`) com script `bump-version.mjs` garantindo incremento SemVer e atualização obrigatória do changelog a cada feature ou correção.
- Guia detalhado de configuração de posse para iniciantes e acesso remoto via terminal SSH (`OwnershipSetupGuide`) em `/authorizations`, com comandos copiáveis, bloco pronto de proxy reverso Nginx e teste de propagação DNS.
- Suporte completo a repositórios de Organizações no GitHub (escopo `read:org`, paginação de `/user/repos` + busca em `/user/orgs` → `/orgs/{org}/repos`, badge `Org` e atalho para liberar organizações no GitHub).
- Rótulos por origem nos links de referência das vulnerabilidades (`GitHub Advisory`, `GitHub Commit`, `NVD (NIST)`, `OSV.dev`, etc.) e novo cabeçalho em duas zonas no relatório de varredura com barra dedicada de exportação.
- Seletor de tema Claro/Escuro em estilo medieval heráldico e ícone PNG `512×512` (`src/app/icon.png`).

### Alterado
- Exportador SBOM CycloneDX 1.5 agora lê a versão da aplicação dinamicamente do `package.json`.
- Ações "Ver perfil no GitHub" e "Sair" centralizadas no menu do usuário e link do repositório open-source adicionado na página inicial.

### Corrigido
- Eliminado o glitch visual ao alternar entre páginas da barra superior sem estar logado, usando estado de sessão compartilhado no `GatewayProvider` e guards de carregamento em todas as telas.
- Enriquecedor NVD API 2.0 endurecido com retentativa automática em falhas transitórias de rede/`5xx`, cabeçalhos `Accept`/`User-Agent`, suporte a CVSS v4.0, espaçamento de requisições e circuit breaker.
- Leitor de repositórios GitHub aprimorado com resolução de branch via `/branches/{branch}`, fallback automático para a Contents API em repositórios grandes/truncados e mensagens de erro detalhadas por status HTTP (`401`/`403`/SAML/`404`/`409`).

## [1.0.0] - 2026-11-24

### Adicionado
- Lançamento unificado **100% Vercel Serverless + Local-First (`IndexedDB`)** em Next.js 15 App Router com arquitetura SOLID rigorosa e identidade visual nórdica **Brynja** (escudo + cota de malha).
- Parsers SCA/SBOM para Node.js (`package.json`, `package-lock.json`, `pnpm-lock.yaml`) e Python (`requirements.txt`, `pyproject.toml`) correlacionados com OSV.dev, NVD 2.0, FIRST EPSS e CISA KEV.
- 8 *Safe Probes* não destrutivas (apenas `GET`/`HEAD`) protegidas por desafios determinísticos HMAC-SHA256 (`/.well-known/brynja-verify.txt`, DNS TXT `_brynja` ou sandbox local dev), certificados AES-256-GCM de 7 dias com renovação automática, bloqueio anti-SSRF via DNS, rate limit e circuit breaker.
- Exportação em PDF executivo, JSON, Markdown e SBOM CycloneDX 1.5, histórico pesquisável e documentação open-source bilíngue (Inglês + Português).

### Segurança
- Sessão GitHub OAuth efêmera selada em AES-256-GCM exclusivamente em cookie `HttpOnly` (zero persistência em banco na nuvem) e isolamento multi-usuário no `IndexedDB` por `ownerGithubUserId`.
