# Changelog

> [English](../../CHANGELOG.md) · **Português (Brasil)**

Todas as alterações relevantes do **Brynja** são documentadas neste arquivo.

O formato segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [Versionamento Semântico 2.0.0 (SemVer)](https://semver.org/lang/pt-BR/).

## [1.7.1] - 2026-11-25

### Corrigido
- Corrigido o card **Escudo Íntegro (100% Aprovado)** em `/scans/[id]` (`ScanReportView`) que exibia fundo claro no tema dark com texto ilegível, substituindo os modificadores de opacidade `/12` e `/8` não suportados pelo Tailwind CSS v3 (`dark:from-emerald-500/12 dark:via-teal-500/8 dark:to-cyan-500/8`) por utilitários válidos `/15` e `/10` (`dark:from-emerald-500/15 dark:via-teal-500/10 dark:to-cyan-500/10`).

## [1.7.0] - 2026-11-25

### Adicionado
- Menu dropdown **Exportar Relatório** posicionado no canto direito do cabeçalho de `/scans/[id]` (`ScanReportView`), reunindo todas as opções na ordem **PDF Executivo (Gerência)** primeiro, seguido de **JSON para IA** (download + cópia em 1 clique) e demais formatos técnicos (`JSON Completo`, `Markdown`, `SBOM CycloneDX`), com fechamento por tecla `Escape` e clique externo.
- Banner celebratório **Escudo Íntegro (100% Aprovado)** e estado limpo positivo na aba de vulnerabilidades (`isScanAllClear`) quando todas as verificações SCA e Safe Probes passam sem nenhum erro, vulnerabilidade ou achado, traduzido em PT-BR, EN e ES.

### Alterado
- Quando a varredura conclui sem nenhum erro (`isScanAllClear`), as opções não-PDF do menu de exportação (`JSON para IA`, `Copiar JSON para IA`, `JSON Completo`, `Markdown` e `SBOM`) ficam automaticamente desabilitadas com aviso contextual, mantendo apenas o **PDF Executivo (Gerência)** habilitado.

## [1.6.1] - 2026-11-25

### Corrigido
- Aprimorado o guia de proxy reverso em `/authorizations` (`OwnershipSetupGuide` + `ownership-guide.presenter.ts`) para cenários reais com Linux, Docker e Certbot (PT-BR, EN e ES): novo comando copiável para descobrir o arquivo realmente ativo em `/etc/nginx/sites-enabled/` ou `/etc/apache2/sites-enabled/` (alertando sobre cópias físicas sem symlink e bloco HTTPS porta 443), atualização do trecho Nginx para correspondência exata (`location = /.well-known/brynja-verify.txt`) evitando conflitos com `acme-challenge` do Certbot e vencendo o `proxy_pass` de containers, ampliação da busca de reversão no Passo 5 para `sites-enabled/` e orientações dedicadas para aplicações e proxies em containers Docker.

## [1.6.0] - 2026-11-25

### Adicionado
- Exportação **JSON para IA** concisa e estruturada (`AiRemediationJsonExporter`, schema `brynja.ai-remediation.v1`, arquivo `brynja-ai-fix-<id>.json`) voltada para modelos de IA resolverem os problemas diretamente: consolida múltiplos CVEs por pacote em uma única ação mirando a maior versão corrigida SemVer com comando exato do gerenciador (`pnpm`/`npm`/`pip`), unifica confirmações de runtime-fingerprint no pacote correspondente, remove ruído (dependências limpas, probes aprovados e logs brutos) e oferece download e cópia em 1 clique na barra de `/scans/[id]`.
- Planejador puro compartilhado de remediação (`src/features/scans/presenters/remediation-plan.presenter.ts`) com priorização `P0`–`P3` por SLA, explicação de impacto no negócio, ações diretas de correção e critérios de validação.
- Evolução do **PDF Executivo (Gerência e Diretoria)** (`scan-pdf.exporter.ts`): novo card **Parecer Executivo para Gerência e Diretoria** com contagem `P0`–`P3` e **Seção 01 — Apresentação dos Problemas e Plano de Soluções** com cartões estruturados exibindo a explanação de cada problema e seu impacto de negócio junto da solução recomendada e critério de validação.

### Corrigido
- Validação do campo de URL alvo em `/authorizations` e no backend (`AuthorizationsView`, `SafeProbePolicy.parseAndValidateTargetUrl`, `/api/authorizations/challenge`, `/api/authorizations/preview`) agora aceita domínios sem protocolo (ex.: `prenora.com.br`) e adiciona `https://` automaticamente por baixo dos panos (ou `http://` para loopback local), eliminando o bloqueio nativo do `type="url"` e mantendo a rejeição de hosts inválidos, protocolos não HTTP e credenciais embutidas.

## [1.5.0] - 2026-11-25

### Adicionado
- Seletor sincronizado **Nginx / Apache** no guia SSH de `/authorizations` (`OwnershipSetupGuide` + `ownership-guide.presenter.ts`), alternando automaticamente os snippets do Passo 3 e do Passo 5 (reversão) nos idiomas PT-BR, EN e ES.
- Snippets copiáveis de proxy reverso para **Apache (`apache2` / `httpd`)** em `/.well-known/brynja-verify.txt` (`ProxyPass /.well-known/ !`, `Alias /.well-known/`, `<Directory>` com `Options -Indexes`, `AllowOverride None`, `Require all granted` e `ForceType text/plain`), comandos de validação/recarga para Debian/Ubuntu e RHEL/Rocky/Alma/CentOS/Fedora, localização de reversão em `/etc/apache2/` e `/etc/httpd/`, dicas para `<Location />`, `mod_rewrite` e redirecionamentos (`301/302`), além de testes automatizados.

## [1.4.0] - 2026-11-25

### Adicionado
- Catálogo interativo de Safe Probes (`SafeProbesCatalogSection`) na tela `/scans/new` detalhando todos os 8 Safe Probes não destrutivos (Cabeçalhos HTTP, HSTS, Cookies, CORS, Artefatos Expostos, Docs/Métricas & `security.txt`, Correlação de Bibliotecas em Runtime e Source Maps), com filtros por categoria, badges de método (`GET`/`HEAD`), rotas/cabeçalhos inspecionados, severidade máxima, indicador do alvo selecionado e atalho direto a partir do card lateral.
- Catálogo único tipado (`src/core/catalog/safe-probes.catalog.ts`) com checagem exaustiva em tempo de compilação nos 3 dicionários i18n (PT-BR, EN e ES) e teste automatizado de paridade 1-para-1 (`safe-probes-catalog.spec.tsx`) contra `createRegisteredSafeProbes()` (`src/server/application/container.ts`), garantindo que qualquer novo probe adicionado ao backend seja obrigatoriamente refletido em `/scans/new`.
- Regras permanentes atualizadas em `AGENTS.md` e `.agents/skills/controlled-pentest-guardrails/SKILL.md` exigindo a atualização do catálogo e traduções a cada novo Safe Probe implementado.

## [1.3.1] - 2026-11-25

### Adicionado
- Passo 5 opcional de reversão em `/authorizations` (`OwnershipSetupGuide`) com comandos copiáveis para remover com segurança `.well-known/brynja-verify.txt` e a pasta `.well-known` somente quando vazia (preservando arquivos do Certbot/Let’s Encrypt), localizar e desfazer o bloco Nginx do Passo 3, validar/recarregar o Nginx e confirmar a remoção via `curl -i` (além do comando de limpeza na aba sem SSH), traduzido em PT-BR, EN e ES.

## [1.3.0] - 2026-11-25

### Adicionado
- Snippets de terminal dinâmicos em `/authorizations` (`OwnershipSetupGuide` + `ownership-guide.presenter.ts`) que se atualizam em tempo real conforme a URL inserida para o alvo (SSH, criação de `/.well-known/brynja-verify.txt`, `curl`, conteúdo do arquivo web e tabela/comandos DNS TXT).
- Endpoint autenticado stateless `POST /api/authorizations/preview` e caso de uso `TargetAuthorizationUseCase.previewChallengeToken` para derivar o token determinístico HMAC exato do usuário/origem em tempo real, sem poluir o armazenamento local (`IndexedDB`).
- Garantia de cópia pronta para o terminal em `/authorizations`: ao clicar em Copiar, o token real é resolvido imediatamente (mesmo antes do término do debounce de digitação), além de novo botão de cópia rápida para o valor DNS TXT.
- Testes automatizados de unidade e componentes (`dynamic-ownership-snippets.spec.tsx` e `guardrails-and-certificates.spec.ts`) validando parsing seguro de URLs, atualização dinâmica de snippets, resolução sob demanda ao copiar e paridade do preview determinístico.

## [1.2.0] - 2026-11-25

### Adicionado
- Suporte completo a múltiplos idiomas em toda a aplicação: **Português (`pt-BR`)**, **Inglês (`en`)** e **Espanhol (`es`)**.
- Seletor de idioma com bandeiras SVG nítidas (`LanguageSwitcher`) posicionado ao lado do seletor de tema Claro/Escuro na barra superior, com menu acessível (`role="menu"` / `menuitemradio`), fechamento por tecla `Escape` e bandeiras do Brasil, Estados Unidos e Espanha.
- `I18nProvider` com persistência em `localStorage` (`brynja-locale`), detecção automática do idioma do navegador, sincronização dinâmica de `<html lang>` e formatação localizada de datas e horários.
- Página `/changelog` responsiva ao idioma selecionado (alternando entre as notas em Português e Inglês) e links de Segurança e Contribuição no rodapé adaptados ao idioma ativo.
- Suíte de testes unitários (`i18n-switcher.spec.tsx`) cobrindo alternância PT/EN/ES em tempo real, persistência em `localStorage`, detecção de idioma do navegador e interpolação de templates.

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
