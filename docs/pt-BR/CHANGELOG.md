# Changelog

> [English](../../CHANGELOG.md) · **Português (Brasil)**

Todas as alterações relevantes do **Brynja** são documentadas neste arquivo.

O formato segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [Versionamento Semântico 2.0.0 (SemVer)](https://semver.org/lang/pt-BR/).

## [1.23.0] - 2026-11-27

### Adicionado
- Adicionada a **Apresentação Executiva & Técnica** interativa (`/presentation`) com 19 slides ponta a ponta (capa keynote dedicada + 18 slides detalhando todas as etapas do Brynja: proposta de valor, arquitetura Local-First custo zero, login GitHub, autorização criptográfica de domínio, 8 ecossistemas SCA, 4 camadas de análise, 19 Safe Probes, guardrails invioláveis, Consultor IA BYOK, relatórios/exportações, Governança GRC, Scan Diff/trilha de auditoria, rotina diária e plano sugerido de piloto de 30 dias).
- Adicionados controles completos de palco em `PresentationDeckView`: alternador ao vivo de foco (**Diretoria + TI** vs **Só Executivo**), roteiro de fala ocultável do apresentador (`N`), índice visual de slides (`G`), atalhos de demonstração ao vivo abrindo telas reais em nova aba, modo palco em tela cheia (`F`), navegação por teclado e exportação limpa para PDF em paisagem (1 slide por página).
- Adicionado controle de acesso server-side *fail-closed* via variável de ambiente `PRESENTATION_ALLOWED_USERS` (`presentation-access.policy.ts` + `resolvePresentationAccess`), cruzando o `@login` e os e-mails verificados da conta GitHub autenticada (escopo OAuth `user:email` selado exclusivamente no cookie efêmero AES-256-GCM `HttpOnly`), com atalho discreto **Apresentação Executiva** em `UserAccountMenu` visível somente para usuários autorizados.

### Corrigido
- Removido o atributo redundante `nonce` da tag externa de mesma origem `<script src="/theme-init.js" />` em `src/app/layout.tsx` (já permitida por `script-src 'self'`), eliminando o erro de hidratação do React 19 causado pela remoção de `nonce` no DOM pelos navegadores e preservando a injeção dinâmica de `nonce` CSP nos scripts inline do Next.js.

## [1.22.0] - 2026-11-27

### Adicionado
- Adicionado catálogo canônico único de ecossistemas suportados (`src/core/catalog/ecosystems.catalog.ts`) sincronizado 1-para-1 com `createRegisteredDependencyParsers()` (`src/server/application/container.ts`) e validado por teste automatizado de paridade (`ecosystems-catalog.spec.tsx`).
- Adicionada a matriz interativa **Ecossistemas, Manifestos & Linguagens Suportadas** (`SupportedEcosystemsSection` em `/scans/new#ecosystems-catalog`) e a barra compacta **Ecossistemas suportados** (`SupportedEcosystemsBar` no Painel inicial `/`) exibindo todos os 8 ecossistemas SCA (`npm`, `PyPI`, `Go`, `crates.io`, `Maven`, `NuGet`, `Packagist`, `RubyGems`), suporte SAST/Reachability nativo em JS/TS e Python e camadas agnósticas (IaC/CI-CD, Segredos/Postura, 19 Safe Probes e importação SARIF/Trivy/Semgrep/Prowler) nos 3 idiomas (PT-BR, EN e ES).
- Adicionada a opção `*.csproj` (`App.csproj`) no seletor manual de manifestos em `NewScanView` e atualizados os textos do pipeline e rodapé.

## [1.21.0] - 2026-11-26

### Adicionado
- Adicionado `.github/dependabot.yml` para atualizações automáticas semanais de `npm` e GitHub Actions (resolvendo `posture:missing-dependency-automation` / CIS 7.4).
- Adicionados cabeçalhos HTTP defensivos em `next.config.ts` e política CSP com *nonce* criptográfico em `src/middleware.ts` (`Content-Security-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e remoção de `X-Powered-By`).
- Movida a inicialização imediata de tema para `public/theme-init.js`, eliminando `dangerouslySetInnerHTML` em `src/app/layout.tsx` (`sast:react-dangerously-set-inner-html`).

### Corrigido
- Atualizada a dependência `next` em `package.json` para `^15.5.29` e aprimorado `AnalyzeScaUseCase` para priorizar versões exatas travadas em lockfiles (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, etc.) preservando `isDirect`, evitando falsos positivos de faixas `^`/`~`.
- Paralelizado o enriquecimento de vulnerabilidades (`NVD`, `FIRST EPSS` e `CISA KEV` via `Promise.all`) com *budget* serverless mais enxuto (`8.5s` no NVD) para evitar estouro de timeout na Vercel.
- Adicionado timeout de cliente (`65s`) e recuperação automática de varreduras órfãs presas em `RUNNING` (`> 2 min`) no `HttpScanGateway`, evitando telas travadas indefinidamente no `IndexedDB`.

## [1.20.0] - 2026-11-26

### Adicionado
- Adicionado endpoint autenticado de descoberta de modelos BYOK (`POST /api/analyze/advise/models` via `ByokAgentAdvisorAdapter.listModels` com proteção anti-SSRF) para OpenAI, Google Gemini e endpoints compatíveis, filtrando automaticamente modelos de geração de imagem (Nano Banana / gpt-image), TTS/áudio, vídeo, embeddings e modalidades não textuais.
- Atualizado o painel `AiAdvisorPanel` para liberar automaticamente um seletor com os modelos disponíveis na chave informada (com fallback curado, atualização sob demanda e entrada manual personalizada em PT-BR, EN e ES), definindo **Gemini 3.8 Flash (`gemini-3.8-flash`)** como padrão do provedor Gemini.

## [1.19.0] - 2026-11-26

### Adicionado
- Adicionado o botão direto **"Governança"** em cada linha de `ScanHistoryTable` (no Painel inicial e em `/history`), abrindo `/governance?scanId=<id>` diretamente ao lado de **"Ver Relatório"**.

### Corrigido
- Aprimorado o carregamento profundo em `/governance` (`GovernanceView`) via `?scanId=<id>` para aguardar `useScanList` e `getScanReport`, preencher automaticamente o nome/repositório mesmo fora das 50 varreduras recentes, garantir a seleção no `<select>` e exibir o resultado já avaliado sem piscar estados vazios.

## [1.18.0] - 2026-11-26

### Adicionado
- Adicionado exportador JSON dedicado e sem ruído para IA na Governança (`brynja.ai-governance-gaps.v1` em `ai-governance-gaps-json.exporter.ts`, `buildGovernanceAiGapsPayload` e `buildGovernanceAiGapsFile`), exportando exclusivamente os pontos de falha (`GAP_DETECTED` e controles atestados manualmente como `PARTIAL` em CIS Controls v8, NIST CSF 2.0, OWASP ASVS / Top 10 e LGPD & ISO 27001) separado do JSON técnico de `/scans` (`brynja.ai-remediation.v1`).
- Adicionado campo `technicalSignals` em `compliance.presenter.ts` com referências técnicas objetivas (CVEs bloqueadores, Safe Probes com falha e regras estáticas sem expor segredos) para enriquecer os controles em falha.

### Alterado
- Atualizado o botão **"Exportar"** em `/governance` (`GovernanceView`) para um menu dropdown com **JSON para IA (Lacunas)**, **Copiar JSON para IA** e **Planilha Excel (.xlsx)** (desabilitando os itens de IA automaticamente quando não houver falhas), com helpers compartilhados em `export-helpers.ts` reutilizados com `ScanReportView`.
- Reorganizado o layout de `/governance` colocando a seleção de avaliações e os campos de configuração em uma barra horizontal acima dos resultados (empilhada no mobile), liberando 100% da largura da tela para os painéis e controles.

## [1.17.0] - 2026-11-26

### Adicionado
- Adicionado gerador nativo de planilhas **Excel (`.xlsx`)** OOXML sem dependências externas (`xlsx-workbook.builder.ts` e `buildComplianceMatrixExcel`) exportando pasta multi-abas (`Resumo GRC`, `CIS Controls v8`, `NIST CSF 2.0`, `OWASP ASVS`, `LGPD & ISO 27001`) com cabeçalhos estilizados, cores por status, larguras automáticas e proteção contra *formula injection*.

### Alterado
- Atualizada a tela `/governance` (`GovernanceView`) movendo o botão **"O que é governança?"** para o canto superior direito do card de cabeçalho (`PageHeader` `topActions`), migrada a exportação de conformidade de CSV para Excel (`.xlsx` via `ComplianceExcelReportExporter`) e simplificado o texto do botão para **"Exportar"**.

## [1.16.0] - 2026-11-26

### Adicionado
- Adicionado o botão **"O que é governança?"** e o modal educativo com abas (`GovernanceGuideModal`) em `/governance` (`GovernanceView`) explicando a diferença entre aderência técnica e global, **CIS Controls v8** (incluindo grupos **IG1 / IG2 / IG3**), **NIST CSF 2.0**, **OWASP ASVS / Top 10** e **LGPD & ISO/IEC 27001:2022** em PT-BR, EN e ES.

## [1.15.0] - 2026-11-26

### Adicionado
- Adicionados indicadores executivos separados para **Código, Segredos & IaC** (`staticIssuesCount`, `staticCriticalHighCount`) e **Conformidade (CIS v8)** no Painel principal, Histórico (`/history`), coluna Severidade (badge dedicado `E:` + segmento na barra proporcional), Relatório (`/scans/[id]`) e PDF Executivo — mantendo `Críticas / Altas / Médias` exclusivos para CVEs de dependências e recalculando automaticamente inclusive para varreduras já salvas no `IndexedDB`.
- Incluído o **Diagnóstico Executivo por IA** (`aiRemediationPlan`: resumo, indícios de *reachability* e passos priorizados) tanto no **PDF Executivo** (`scan-pdf.exporter.ts`) quanto no **JSON para IA** (`aiDiagnosis` em `ai-remediation-json.exporter.ts`).

### Alterado
- Padronizada a verificação de posse `WELL_KNOWN_FILE` para o arquivo RFC 9116 `/.well-known/security.txt` (`Contact:`, `Expires:` e comentário `# Brynja-Verification: <token>`) no `DomainOwnershipVerifierAdapter`, `TargetAuthorizationUseCase`, `RunSafeProbesUseCase`, guia `/authorizations` (`OwnershipSetupGuide` + trechos Nginx/Apache), traduções PT-BR/EN/ES e documentação de segurança — mantendo fallback automático legado para `/.well-known/brynja-verify.txt`.
- Aprimorado o visual do painel `AiAdvisorPanel` com card callout de diagnóstico, chips de *reachability*, cards numerados de ação com destaque monospace para caminhos de arquivo/cabeçalhos e substituição do termo `"Copilot"` no badge por **`Inteligência AppSec (BYOK)`** (PT-BR/ES) / **`AppSec AI Advisor (BYOK)`** (EN).

## [1.14.0] - 2026-11-26

### Adicionado
- Adicionado **Consultor de Triagem & Reachability por IA (BYOK)** configurável pelo usuário (`ByokAgentAdvisorAdapter`, `AnalyzeAdviseUseCase`, rota `POST /api/analyze/advise` com `maxDuration = 60` e painel `AiAdvisorPanel` em `/scans/[id]`):
  - Suporta **OpenAI**, **Google Gemini** e **endpoints customizados compatíveis com OpenAI**, com validação obrigatória de URLs externas pelo `SsrfDnsGuardService`.
  - Mantém a chave BYOK estritamente no navegador (opt-in em `localStorage`, nunca em cookies ou banco na nuvem) e envia somente metadados sanitizados e indícios de *reachability* (`computeReachabilityHints`), jamais segredos crus.
- Adicionada **Ingestão de Relatórios Externos** (`parseExternalSecurityReport` e ação **Importar SARIF / Trivy / Semgrep** em `/history`) convertendo arquivos **OASIS SARIF 2.1.0**, **Trivy JSON**, **Semgrep JSON** e **Prowler OCSF/JSON** para o histórico local no `IndexedDB`.
- Adicionados **Exportadores Corporativos** em `REPORT_EXPORTERS`: **SARIF 2.1.0** (`SarifReportExporter`), **SBOM SPDX 2.3** (`SpdxSbomExporter`) e **Matriz de Conformidade CSV** (`ComplianceCsvReportExporter`).
- Adicionado **Comparador entre Varreduras (Scan Diff)** em `/history` (`computeScanDiff`) exibindo CVEs novos/resolvidos/persistentes, deltas de Safe Probes e achados estáticos e evolução de aderência CIS v8 / NIST CSF 2.0.

## [1.13.0] - 2026-11-26

### Adicionado
- Adicionada análise estática leve para Vercel Serverless de **Código, Segredos, IaC/CI-CD & Postura GitHub** (`src/server/infrastructure/static-analysis/` e rota `POST /api/analyze/static` com `maxDuration = 60`):
  - `SecretScannerAnalyzer`: detecta chaves AWS/GitHub/Stripe/Google/Slack, credenciais em strings de banco, blocos de chave privada e arquivos `.env*` versionados com **mascaramento automático obrigatório** (`maskSecretMatch`), sem jamais gravar segredos reais em relatórios ou `IndexedDB`.
  - `IacCicdAnalyzer`: audita `Dockerfile` (CIS Docker Benchmark `:latest`, `USER root`, `curl | sh`), `docker-compose.yml` (`privileged`, `docker.sock`), Terraform (`0.0.0.0/0`, storage sem criptografia/ACL pública), manifests Kubernetes e workflows GitHub Actions (`pull_request_target`, `write-all`, actions sem SHA e script injection `${{ github.event.* }}`).
  - `LightweightSastAnalyzer`: regras SAST em JS/TS e Python ignorando comentários (`eval`/`new Function`, `dangerouslySetInnerHTML`, comandos shell interpolados, TLS desabilitado, SQL por concatenação e desserialização insegura em Python).
  - `GitHubPostureAnalyzer`: avalia higiene de cadeia de suprimentos do repositório (`SECURITY.md`, Dependabot/Renovate, `CODEOWNERS` e proteção da branch padrão).
- Adicionada a aba **Código, Segredos & IaC** (`staticFindings`) em `/scans/[id]` (`ScanReportView`), controle opcional em `/scans/new`, mapeamento automático nos scorecards CIS/NIST/OWASP/LGPD e inclusão no PDF Executivo e JSON para IA.

## [1.12.0] - 2026-11-26

### Adicionado
- Ampliação da suíte de Safe Probes não destrutivos de **14 para 19 sondas** (`GET`/`HEAD` somente leitura + DNS passivo), sincronizadas com `/scans/new` (`safe-probes.catalog.ts`), dicionários PT-BR/EN/ES, regras de conformidade e planos de remediação no PDF Executivo / JSON para IA:
  - `safe-probe:cross-origin-isolation`: verifica `Cross-Origin-Opener-Policy` (COOP), `Cross-Origin-Resource-Policy` (CORP) e `Cross-Origin-Embedder-Policy` (COEP) em `GET /`.
  - `safe-probe:dns-email-posture`: consulta passivamente registros DNS `TXT` (`SPF`, `_dmarc`), `CAA` e `GET /.well-known/mta-sts.txt` (ignorado em loopback/IP literal).
  - `safe-probe:robots-sitemap-exposure`: inspeciona `GET /robots.txt` e `GET /sitemap.xml` (ignorando HTML catch-all de SPAs) procurando divulgação de rotas administrativas/internas.
  - `safe-probe:oauth-graphql-posture`: audita `GET /.well-known/openid-configuration` (endpoints `http://`, `alg=none`, fluxo implicit sem PKCE) e introspecção GraphQL passiva via `GET /graphql?query=__schema`.
  - `safe-probe:security-txt-rfc9116`: valida `GET /.well-known/security.txt` quanto aos campos obrigatórios `Contact:` e `Expires:` futuro (RFC 9116).

### Alterado
- Adicionada memoização por varredura em `RateLimitedSafeHttpClient` para requisições `GET`/`HEAD` sem cabeçalhos customizados (reaproveitando `GET /` entre sondas) e ajustado `SAFE_PROBE_MAX_REQUESTS_PER_SCAN` padrão de `60` para `80`, preservando `SAFE_PROBE_MAX_RPS=2`, guarda anti-SSRF e circuit breaker.

## [1.11.0] - 2026-11-26

### Adicionado
- Expansão do parser SCA/SBOM de 2 para **8 ecossistemas compatíveis com OSV.dev**: suporte a **Yarn** (`yarn.lock`), **Go** (`go.mod`, `go.sum`), **Rust** (`Cargo.toml`, `Cargo.lock`), **Java/Kotlin Maven & Gradle** (`pom.xml`, `gradle.lockfile`), **.NET NuGet** (`packages.lock.json`, `*.csproj`), **PHP Packagist** (`composer.json`, `composer.lock`) e **RubyGems** (`Gemfile.lock`), incluindo comandos de atualização por ecossistema, `/scans/new` e `/api/analyze/sca`.
- Adicionado o enriquecedor `DepsDevDependencyEnricher` (`src/server/infrastructure/vuln-intel/deps-dev-enricher.adapter.ts`) consultando `api.deps.dev/v3` em paralelo ao OSV.dev (cache de 6h, *fail-open*) para exibir **licenças SPDX** e notas do **OpenSSF Scorecard** na tabela SBOM, com alertas para licenças restritivas (`GPL`/`AGPL`) e pontuação crítica.

## [1.10.0] - 2026-11-26

### Adicionado
- Adicionado o **Motor Automático de Conformidade & Governança** (`src/core/catalog/compliance-frameworks.catalog.ts` e `src/features/scans/presenters/compliance.presenter.ts`) mapeando inventário SCA/SBOM, achados CWE/KEV, Safe Probes e trilha de auditoria para **CIS Controls v8 (IG1/IG2/IG3)**, **NIST CSF 2.0**, **OWASP ASVS / Top 10** e **LGPD (Art. 46/48/50) & ISO/IEC 27001:2022**.
- Adicionada a aba **Conformidade** (`ComplianceScorecardTab`) em `/scans/[id]` (`ScanReportView`) com seletor de frameworks, filtros de Grupo de Implementação CIS (`IG1`–`IG3`) e status, barras de cobertura por domínio e métricas de aderência técnica.
- Adicionado o módulo local-first de **Governança & Conformidade (GRC)** em `/governance` (`GovernanceView`, com acesso pela `Navbar`), combinando evidências técnicas automáticas das varreduras com atestados organizacionais manuais, exportação de matriz CSV protegida contra *formula injection* e persistência isolada no `IndexedDB`.
- Adicionada a seção **Matriz de Conformidade** no **PDF Executivo** (`scan-pdf.exporter.ts`) resumindo a aderência técnica e as principais lacunas nos quatro frameworks.

### Alterado
- Atualizada a persistência local no navegador (`IndexedDbBrynjaStore`) da versão de schema `DB_VERSION = 1` para `DB_VERSION = 2`, adicionando o *object store* `grcAssessments` isolado por `ownerGithubUserId` e `LocalBackupBundle` v2 retrocompatível com backups v1.

## [1.9.0] - 2026-11-26

### Adicionado
- Adicionado o badge de Safe Probes com problemas (`P:<qtd>`) e seu segmento proporcional em violeta (`bg-violet-500`) na barra gráfica da coluna **Severidade** na tabela de histórico (`ScanHistoryTable` em `/history` e `/`) sempre que a avaliação possuir ocorrências em Safe Probes (`FINDING` ou `ABORTED`), com tooltips traduzidos em PT-BR, EN e ES.
- Adicionado o campo `probeIssuesCount` em `ScanSummary` e os helpers compartilhados `countProbeIssues` / `resolveScanProbeIssuesCount` (`src/core/models/scan.models.ts`), permitindo que `HttpScanGateway.summarizeReport` calcule automaticamente a contagem inclusive para varreduras antigas já salvas no `IndexedDB` do navegador.

## [1.8.0] - 2026-11-25

### Adicionado
- Ampliação da suíte de Safe Probes não destrutivos de **8 para 14 sondas** (`GET`/`HEAD` somente leitura), totalmente sincronizadas com `/scans/new`, dicionários PT-BR/EN/ES e planos de remediação no PDF Executivo / JSON para IA.
- `safe-probe:csp-permissions`: audita a força das diretivas CSP (`'unsafe-eval'`, `*`/`http:`/`data:`, `'unsafe-inline'` sem nonce/hash, `frame-ancestors *`, `Report-Only` sem CSP ativa), `Permissions-Policy` e conteúdo misto ativo (`http://`) em páginas HTTPS.
- `safe-probe:cache-security`: detecta `Set-Cookie` em respostas cacheáveis publicamente (`public`/`s-maxage`), cookies de sessão sem `private`/`no-store` e `Access-Control-Allow-Origin` dinâmico sem `Vary: Origin`.
- `safe-probe:open-redirect`: verifica `/?next=`, `/?redirect=` e `/login?next=` com redirecionamento manual usando o domínio sintético `untrusted.brynja.test` para identificar redirecionamentos abertos `3xx` (CWE-601).
- `safe-probe:backup-config-exposure`: checagem `HEAD`-first com validação estrutural nos primeiros 512 bytes (ignorando HTML de SPAs e sem gravar segredos) para `/.env.local`, `/.env.production`, `/docker-compose.yml`, `/backup.sql` e `/phpinfo.php`.
- `safe-probe:debug-error-leakage`: detecta listagem de diretórios (`Index of /`) na raiz e modo debug/stack traces verbosos em rota sintética 404 (Django `DEBUG=True`, Werkzeug, Node/Express, Laravel Ignition/Whoops, PHP, Java/Spring e ASP.NET).
- `safe-probe:sri-integrity`: valida Subresource Integrity (`integrity="sha256|384|512-..."`) em tags `<script>` e `<link rel="stylesheet">` carregadas de CDNs públicas estáticas (`cdnjs`, `jsDelivr`, `unpkg`, jQuery/Bootstrap).

### Alterado
- Tela `/changelog` (`ChangelogView`) atualizada para exibir apenas a versão mais recente expandida por padrão e recolher as versões anteriores em um accordion acessível para uma leitura mais concisa.
- Limite padrão `SAFE_PROBE_MAX_REQUESTS_PER_SCAN` ajustado de `40` para `60` (mantendo `SAFE_PROBE_MAX_RPS=2`, bloqueio anti-SSRF e circuit breaker) para comportar os 14 Safe Probes inclusive em SPAs com rotas catch-all.

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
