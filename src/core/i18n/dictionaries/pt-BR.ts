import type {
  SafeProbeCopy,
  SafeProbeId,
} from '../../catalog/safe-probes.catalog';

const SAFE_PROBE_ITEMS_PT_BR: Record<SafeProbeId, SafeProbeCopy> = {
  'safe-probe:security-headers': {
    name: 'Cabeçalhos de Segurança HTTP & Banners',
    summary:
      'Verifica se a resposta raiz inclui cabeçalhos defensivos essenciais contra XSS, clickjacking e MIME sniffing, além de detectar vazamento de stack/versão.',
    checks:
      'Inspeciona Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy e banners X-Powered-By / Server correlacionados ao SBOM.',
  },
  'safe-probe:hsts-tls': {
    name: 'Política HSTS em HTTPS',
    summary:
      'Valida em alvos HTTPS se o navegador é instruído a exigir conexões cifradas por tempo adequado, prevenindo ataques de downgrade para HTTP.',
    checks:
      'Executa HEAD / e verifica Strict-Transport-Security com max-age ≥ 15.552.000s (180 dias). Ignorado automaticamente em alvos HTTP.',
  },
  'safe-probe:csp-permissions': {
    name: 'Diretivas CSP, Permissions-Policy & Mixed Content',
    summary:
      'Avalia a força real da política Content-Security-Policy, a restrição de APIs sensíveis do navegador e o carregamento de recursos ativos inseguros em HTTPS.',
    checks:
      "Analisa 'unsafe-eval', wildcards '*', 'unsafe-inline' sem nonce/hash, frame-ancestors '*', modo Report-Only sem CSP ativa, ausência de Permissions-Policy e scripts/iframes/CSS http:// em páginas HTTPS.",
  },
  'safe-probe:cookie-security': {
    name: 'Flags de Segurança em Cookies (Set-Cookie)',
    summary:
      'Audita os atributos defensivos de cookies emitidos na raiz sem jamais armazenar ou exibir os valores secretos dos cookies.',
    checks:
      'Analisa HttpOnly, Secure (em HTTPS) e SameSite (Lax/Strict ou None com Secure), elevando severidade para cookies de sessão/autenticação.',
  },
  'safe-probe:cors-policy': {
    name: 'Política CORS (Cross-Origin Resource Sharing)',
    summary:
      'Detecta permissões excessivas de acesso cross-origin que poderiam permitir a sites maliciosos ler dados autenticados da aplicação.',
    checks:
      'Envia GET / com Origin de teste não confiável e checa reflexão arbitrária de Access-Control-Allow-Origin, wildcard "*" com credenciais e origem "null".',
  },
  'safe-probe:cache-security': {
    name: 'Segurança de Cache HTTP (Cookies & Vary: Origin)',
    summary:
      'Previne vazamento de sessões em CDNs/proxies compartilhados e envenenamento de cache em respostas CORS dinâmicas.',
    checks:
      'Inspeciona GET / verificando Set-Cookie combinado com Cache-Control público/s-maxage (ou sem private/no-store em cookies de sessão) e Access-Control-Allow-Origin específico sem Vary: Origin.',
  },
  'safe-probe:open-redirect': {
    name: 'Redirecionamento Aberto (Open Redirect)',
    summary:
      'Detecta parâmetros de retorno não validados que redirecionam usuários para domínios externos arbitrários em ataques de phishing ou roubo de tokens.',
    checks:
      'Envia GET com redirect manual para /?next=, /?redirect= e /login?next= apontando ao domínio sintético untrusted.brynja.test e valida se há resposta 3xx com Location externo.',
  },
  'safe-probe:exposed-artifacts': {
    name: 'Artefatos Sensíveis Expostos',
    summary:
      'Verifica se arquivos críticos de controle de versão, variáveis de ambiente ou manifesto ficaram acessíveis publicamente na raiz web.',
    checks:
      'Testa /.git/HEAD, /.env e /package.json via HEAD e valida assinatura estrutural nos primeiros 512 bytes apenas se retornar HTTP 200, sem baixar nem gravar segredos.',
  },
  'safe-probe:exposed-docs-metrics': {
    name: 'Documentação de API, Métricas & security.txt',
    summary:
      'Identifica interfaces internas de API ou telemetria expostas indevidamente em produção e confirma a publicação do canal RFC 9116.',
    checks:
      'Checa /openapi.json, /swagger, /swagger-ui, /api/docs, /metrics, /actuator/health e /graphql (ignorando HTML catch-all de SPAs), além de /.well-known/security.txt.',
  },
  'safe-probe:backup-config-exposure': {
    name: 'Backups, Configs de Ambiente & Diagnósticos',
    summary:
      'Identifica arquivos de ambiente adicionais, dumps de banco de dados, orquestração Docker ou páginas phpinfo acessíveis publicamente.',
    checks:
      'Executa HEAD e valida assinatura nos primeiros 512 bytes (ignorando HTML de SPAs, sem gravar segredos) para /.env.local, /.env.production, /docker-compose.yml, /backup.sql e /phpinfo.php.',
  },
  'safe-probe:runtime-fingerprint': {
    name: 'Correlação de Bibliotecas em Runtime com CVEs',
    summary:
      'Cruza assets JavaScript servidos publicamente com os pacotes vulneráveis do inventário SBOM para confirmar exposição ativa em runtime.',
    checks:
      'Lê até 32 KB do HTML inicial (GET /) buscando referências em <script src> e banners explícitos de versão correspondentes às CVEs encontradas no repositório.',
  },
  'safe-probe:source-maps': {
    name: 'Exposição de Source Maps (.js.map)',
    summary:
      'Detecta mapas de código-fonte acessíveis publicamente que facilitam engenharia reversa da aplicação frontend em staging ou produção.',
    checks:
      'Extrai até 3 scripts JS da mesma origem em "/" e consulta via HEAD se os respectivos arquivos .js.map respondem com HTTP 200.',
  },
  'safe-probe:debug-error-leakage': {
    name: 'Modo Debug, Stack Traces & Directory Listing',
    summary:
      'Detecta listagem automática de diretórios e páginas de erro verbosas que expõem caminhos internos, versões ou debuggers interativos em produção.',
    checks:
      'Inspeciona GET / para autoindex ("Index of /") e GET /__brynja_probe_nonexistent_404__ para assinaturas de Django DEBUG, Werkzeug, Node/Express, Laravel Ignition, PHP, Java/Spring e ASP.NET.',
  },
  'safe-probe:sri-integrity': {
    name: 'Subresource Integrity (SRI) em CDNs Externas',
    summary:
      'Verifica se scripts e folhas de estilo carregados de CDNs públicas estáticas exigem validação criptográfica contra adulteração na cadeia de suprimentos.',
    checks:
      'Analisa tags <script src> e <link rel="stylesheet"> no HTML inicial apontando para CDNs estáticas (cdnjs, jsDelivr, unpkg, jQuery/Bootstrap) verificando o atributo integrity (sha256/384/512).',
  },
};

export const PT_BR_MESSAGES = {
  common: {
    loading: 'Carregando...',
    refresh: 'Atualizar',
    cancel: 'Cancelar',
    copy: 'Copiar',
    copied: 'Copiado',
    close: 'Fechar',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
    signInWithGitHub: 'Entrar com GitHub',
    signInShort: 'Entrar',
    backToDashboard: 'Voltar ao Painel',
    backToHistory: 'Voltar ao Histórico',
    scaOnly: 'Somente SCA',
    languageSelectorLabel: 'Selecionar idioma',
  },
  enums: {
    severity: {
      CRITICAL: 'Crítica',
      HIGH: 'Alta',
      MEDIUM: 'Média',
      LOW: 'Baixa',
      INFO: 'Info',
    },
    verdict: {
      CONFIRMED_ACTIVE: 'Confirmada em Runtime',
      POTENTIALLY_EXPOSED: 'Potencial / KEV Ativa',
      DEPENDENCY_ONLY: 'Apenas no Manifesto',
    },
    scanStatus: {
      QUEUED: 'Na Fila',
      RUNNING: 'Em Execução',
      COMPLETED: 'Concluído',
      FAILED: 'Falhou',
    },
    authStatus: {
      PENDING: 'Pendente',
      VERIFIED: 'Verificado',
      REVOKED: 'Revogado',
    },
    probeOutcome: {
      FINDING: 'Ponto Fraco',
      PASSED: 'Aprovado',
      SKIPPED: 'Ignorado',
      ABORTED: 'Interrompido (Guardrail)',
    },
    pipelineStage: {
      queued: 'Na fila',
      fetching_repository: 'Leitura do repositório',
      parsing_dependencies: 'Extração SBOM',
      querying_vulnerability_intel: 'OSV / NVD / EPSS / KEV',
      running_safe_probes: 'Safe Probes',
      completed: 'Relatório concluído',
    },
  },
  nav: {
    dashboard: 'Painel',
    history: 'Histórico',
    newScan: 'Nova Varredura',
    authorizations: 'Alvos & Guardrails',
    audit: 'Auditoria',
    mainNavLabel: 'Navegação principal',
    mobileNavLabel: 'Navegação mobile',
    tagline: 'SCA · CVEs · Safe Probes',
  },
  theme: {
    switchToLight: 'Alternar para tema claro',
    switchToDark: 'Alternar para tema escuro',
    tooltipLight: 'Mudar para modo claro',
    tooltipDark: 'Mudar para modo escuro',
  },
  accountMenu: {
    viewProfile: 'Ver perfil no GitHub',
    githubId: 'GitHub ID',
    scopes: 'Escopos',
    ephemeralSession: 'Sessão efêmera',
    expiresAt: 'Expira às {time}',
    activeInTab: 'Ativa na aba',
    securityBadge: 'Token OAuth cifrado só nesta sessão (sem gravação no banco)',
    signingOut: 'Encerrando...',
    signOut: 'Sair (Descartar token)',
  },
  authCard: {
    defaultTitle: 'Conecte seu GitHub para iniciar esta sessão',
    dashboardTitle: 'Conecte seu GitHub para acessar seu painel e histórico',
    historyTitle: 'Conecte seu GitHub para acessar o histórico completo de varreduras',
    newScanTitle: 'Conecte seu GitHub para iniciar uma nova varredura',
    authorizationsTitle: 'Conecte seu GitHub para gerenciar seus alvos autorizados',
    auditTitle: 'Conecte seu GitHub para visualizar sua trilha de auditoria',
    reportTitle: 'Conecte seu GitHub para abrir este relatório',
    description:
      'Para garantir privacidade e isolamento multi-usuário, o Brynja não salva tokens OAuth nem relatórios em banco na nuvem. Ao entrar com seu GitHub, um token efêmero é selado na sessão do navegador e seu histórico local (IndexedDB) é carregado automaticamente.',
    card1Title: 'Token Efêmero',
    card1Body: 'Descartado ao sair ou fechar o navegador.',
    card2Title: 'Histórico Salvo',
    card2Body: 'Suas varreduras ficam isoladas na sua conta.',
    card3Title: 'Guardrails Ativos',
    card3Body: 'Safe probes só em alvos com posse verificada.',
    openSourceLabel: 'Código aberto no GitHub:',
  },
  footer: {
    versionTooltip: 'Ver changelog e novidades de cada versão',
    stackSummary: 'SCA / SBOM · OSV · NVD · EPSS · CISA KEV · 14 Safe Probes',
    linksAria: 'Links do projeto',
    changelog: 'Changelog',
    repository: 'Repositório',
    security: 'Segurança',
    contributing: 'Contribuir',
    license: 'Licença MIT',
    localFirst: 'Local-First (IndexedDB) · Zero banco na nuvem',
    defensiveUse: 'Uso estritamente defensivo e autorizado (GET/HEAD)',
    copyright: '© {year} Brynja Contributors · Open-Source (MIT)',
  },
  dashboard: {
    loading: 'Verificando sessão e carregando painel...',
    badge: 'Pipeline Proativo com Guardrails Não Destrutivos',
    title: 'Painel de Vulnerabilidades & Verificação Ativa',
    description:
      'Analise bibliotecas do repositório via OSV.dev, NVD, EPSS e CISA KEV, e execute sondas controladas somente em alvos com posse verificada.',
    authorizeTarget: 'Autorizar Alvo',
    newScan: 'Nova Varredura',
    kpiScans: 'Varreduras',
    kpiDependencies: 'Dependências',
    kpiCriticalHigh: 'Críticas & Altas',
    kpiConfirmed: 'Confirmadas / Sondas',
    historyTitle: 'Histórico de Varreduras',
    historySubtitle:
      'Selecione uma avaliação para inspecionar SBOM, CVEs, EPSS, Safe Probes e baixar o PDF.',
    viewFullHistory: 'Ver histórico completo',
    loadingScans: 'Carregando varreduras...',
    emptyTitle: 'Nenhuma varredura executada nesta conta ainda.',
    emptySubtitle:
      'Inicie uma varredura selecionando um repositório GitHub ou manifestos de exemplo.',
    createFirstScan: 'Criar primeira varredura',
  },
  history: {
    loading: 'Carregando histórico de varreduras...',
    badge: 'Histórico Local (IndexedDB) · Isolado por Conta GitHub',
    title: 'Histórico de Varreduras',
    description:
      'Consulte todas as análises anteriores de dependências (SBOM/CVEs) e execuções de Safe Probes, filtre por status ou escopo e exporte relatórios em PDF, JSON, Markdown ou CycloneDX.',
    kpiTotal: 'Total de Avaliações',
    kpiCompleted: 'Concluídas',
    kpiWithProbes: 'Com Safe Probes',
    kpiCritHigh: 'Com Críticas / Altas',
    searchPlaceholder:
      'Filtrar por repositório, branch, ecossistema ou alvo staging...',
    filterStatusAria: 'Filtrar por status',
    allStatuses: 'Todos os status',
    scopeAll: 'Todas',
    scopeWithProbes: 'Safe Probes',
    scopeScaOnly: 'Somente SCA',
    foundTitle: 'Avaliações Encontradas ({count})',
    foundSubtitle:
      'Clique em qualquer avaliação para abrir o relatório interativo ou baixar o PDF executivo.',
    emptyAccountTitle: 'Nenhuma varredura executada nesta conta ainda.',
    emptyFilterTitle: 'Nenhuma varredura corresponde aos filtros aplicados.',
    emptyAccountSubtitle:
      'Inicie sua primeira avaliação para visualizar o histórico aqui.',
    emptyFilterSubtitle:
      'Ajuste a busca ou os filtros de status/escopo acima.',
  },
  historyTable: {
    colRepository: 'Repositório',
    colStatus: 'Status',
    colDependencies: 'Dependências',
    colSeverity: 'Severidade',
    colStagingTarget: 'Alvo Staging',
    colAction: 'Ação',
    viewReport: 'Ver Relatório',
    deleteAria: 'Excluir varredura {name}',
    deleteTitle: 'Remover do histórico',
    critShort: 'C',
    highShort: 'A',
    medShort: 'M',
    lowShort: 'B',
    critTitle: '{count} Crítica(s)',
    highTitle: '{count} Alta(s)',
    medTitle: '{count} Média(s)',
    lowTitle: '{count} Baixa(s)',
  },
  newScan: {
    loading: 'Verificando sessão GitHub...',
    title: 'Nova Varredura de Segurança',
    description:
      'Escolha um repositório privado/público da sua conta GitHub, informe uma URL Git pública ou envie manifestos diretamente para análise SCA e verificação ativa controlada.',
    loadSample: 'Carregar Exemplo Vulnerável',
    tabGithub: 'GitHub OAuth',
    tabPublicUrl: 'URL Git Pública',
    tabManifests: 'Colar Manifestos',
    checkingGithub: 'Verificando status da conexão GitHub...',
    oauthPendingTitle: 'Configuração do GitHub OAuth / App pendente no .env',
    oauthPendingBody:
      'Cadastre um OAuth App no GitHub usando o callback abaixo e preencha GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET nas variáveis de ambiente (.env.local ou Vercel):',
    connectTitle: 'Conectar sua conta GitHub',
    connectSubtitle:
      'Gera token efêmero de sessão para leitura de manifestos em repositórios privados e públicos.',
    connectButton: 'Conectar GitHub',
    selectRepoLabel: 'Selecionar Repositório ({count})',
    refreshList: 'Atualizar lista',
    filterPlaceholder: 'Filtrar repositórios pessoais ou de organizações...',
    noReposFound: 'Nenhum repositório encontrado.',
    orgBadge: 'Org',
    privateBadge: 'Privado',
    publicBadge: 'Público',
    orgNoticeLead: 'Faltou alguma Organização?',
    orgNoticeBody:
      'No GitHub, organizações bloqueiam OAuth Apps por padrão até você clicar em Grant (ou pedir aprovação do admin) nas permissões do app.',
    grantOrgsButton: 'Liberar Orgs no GitHub',
    updateOrgScope: 'Atualizar escopo read:org',
    selectedRepoLabel: 'Repositório Selecionado',
    selectedRepoPlaceholder: 'https://github.com/usuario/repo-privado',
    branchLabel: 'Branch',
    publicRepoLabel: 'URL do Repositório Público (HTTPS)',
    publicRepoPlaceholder: 'https://github.com/usuario/projeto-publico',
    projectIdLabel: 'Identificador do Projeto',
    projectIdPlaceholder: 'manifest://meu-projeto',
    primaryFileLabel: 'Arquivo Principal',
    manifestContentLabel: 'Conteúdo de {name}',
    extraRequirementsLabel: 'requirements.txt adicional (opcional)',
    submitting: 'Iniciando varredura...',
    submitButton: 'Executar Varredura',
    startErrorFallback: 'Não foi possível iniciar a varredura.',
    probesTitle: 'Safe Probes (Opcional)',
    authorizeTargetLink: 'Autorizar alvo',
    probesDescription:
      'Apenas alvos com posse criptográfica verificada aparecem abaixo. Sondas executam exclusivamente GET/HEAD com rate limit e auditoria.',
    probesNoneOption: 'Somente SCA + CVEs (sem sondas)',
    viewProbesCatalog: 'Ver os {count} tipos de Safe Probes abaixo',
    probesReadyLink: '{count} Safe Probes prontos para este alvo',
    pipelineTitle: 'Pipeline da Avaliação',
    pipelineSteps: [
      'Inventário SBOM (npm, pnpm, pip, pyproject)',
      'Consulta em lote na API pública OSV.dev',
      'Enriquecimento CVSS/CWE (NVD 2.0)',
      'Probabilidade real (EPSS) + CISA KEV',
      'Safe Probes autorizados + trilha imutável',
    ],
  },
  safeProbesCatalog: {
    title: 'Tipos de Safe Probes Executados',
    subtitle:
      'Sondas ativas 100% não destrutivas (somente leitura via GET/HEAD) disparadas apenas quando você seleciona um alvo com posse criptográfica verificada.',
    countBadge: '{count} probes ativos',
    readOnlyBadge: 'Somente GET / HEAD',
    statusActiveForTarget: 'Ativos para {origin}',
    statusInactiveHint: 'Executados ao selecionar um alvo verificado acima',
    filterAll: 'Todos ({count})',
    categories: {
      'headers-tls': 'Cabeçalhos & TLS',
      'cookies-cors': 'Cookies & CORS',
      exposure: 'Exposição',
      runtime: 'Runtime & Código',
    },
    whatItChecksLabel: 'O que verifica',
    maxSeverityPrefix: 'Até {severity}',
    guardrailsNote:
      'Guardrails ativos em todos os probes: certificado criptográfico de posse obrigatório, bloqueio anti-SSRF via DNS, rate limit + circuit breaker e zero gravação de valores sensíveis.',
    items: SAFE_PROBE_ITEMS_PT_BR,
  },
  scanReport: {
    loading: 'Carregando relatório...',
    notFound: 'Relatório não encontrado.',
    copyIdTitle: 'Copiar ID completo: {id}',
    targetPrefix: 'Alvo: {host}',
    scaOnlyBadge: 'Somente SCA (sem alvo staging)',
    exportReportLabel: 'Exportar Relatório',
    exportDropdownMenuLabel: 'Opções de exportação do relatório',
    exportOnlyPdfHint:
      'Nenhum erro encontrado — apenas o PDF Executivo permanece habilitado.',
    generatingPdf: 'Gerando PDF...',
    executivePdf: 'PDF Executivo (Gerência)',
    executivePdfTitle:
      'Relatório executivo em PDF para gerência e diretoria com apresentação dos problemas e plano de soluções',
    executivePdfMenuHint: 'Para gerência e diretoria (problemas e soluções)',
    aiJson: 'JSON para IA',
    aiJsonTitle:
      'Baixar JSON estruturado e conciso para modelos de IA focado na resolução direta dos problemas',
    aiJsonMenuHint: 'JSON conciso focado na correção por modelos de IA',
    copyAiJsonLabel: 'Copiar JSON para IA',
    copyAiJsonTitle: 'Copiar JSON para IA para a área de transferência',
    copyAiJsonMenuHint: 'Copiar direto para colar no chat ou agente de IA',
    copiedAiJsonLabel: 'JSON para IA copiado!',
    otherExportsLabel: 'Outros formatos técnicos',
    disabledNoErrorsBadge: 'Sem erros',
    rawJsonLabel: 'JSON Completo',
    markdownLabel: 'Markdown',
    sbomLabel: 'SBOM (CycloneDX)',
    allClearBadge: '100% Aprovado',
    allClearTitle:
      'Escudo Íntegro — Todos os testes passaram sem nenhum erro!',
    allClearBodyWithProbes:
      'Excelente trabalho! {deps} dependência(s) analisada(s) e {probes} Safe Probe(s) verificados sem nenhuma vulnerabilidade ou falha de segurança detectada.',
    allClearBodyScaOnly:
      'Excelente trabalho! {deps} dependência(s) analisada(s) no inventário SBOM sem nenhuma vulnerabilidade conhecida detectada.',
    noVulnsCleanState:
      'Tudo limpo! Nenhuma vulnerabilidade foi detectada nas {deps} dependência(s) analisada(s).',
    noVulnsButProbeFindings:
      'Nenhuma vulnerabilidade de dependência (SCA) encontrada, mas há {count} ponto(s) de atenção na aba Safe Probes.',
    executionError: 'Erro na execução: {message}',
    kpiDependencies: 'Dependências',
    kpiCritical: 'Críticas',
    kpiHigh: 'Altas',
    kpiMedium: 'Médias',
    kpiConfirmed: 'Confirmadas / Sondas',
    tabFindings: 'Vulnerabilidades ({count})',
    tabDependencies: 'Inventário SBOM ({count})',
    tabProbes: 'Safe Probes ({count})',
    tabAudit: 'Auditoria ({count})',
    searchPlaceholder: 'Buscar pacote, CVE ou título...',
    allSeverities: 'Todas Severidades',
    allVerdicts: 'Todos Vereditos',
    onlyKev: 'Apenas CISA KEV',
    noFindingsFiltered:
      'Nenhuma vulnerabilidade encontrada para os filtros aplicados.',
    kevBadge: 'CISA KEV (Exploração Ativa)',
    upgradeTo: '→ Atualizar para ≥ {version}',
    sbomColLibrary: 'Biblioteca',
    sbomColVersion: 'Versão',
    sbomColEcosystem: 'Ecossistema',
    sbomColSource: 'Origem',
    sbomColPurl: 'PURL',
    noProbesExecuted: 'Nenhuma sonda ativa foi executada nesta varredura.',
    evidenceLabel: 'Evidência:',
    recommendationLabel: 'Recomendação:',
    auditColTimestamp: 'Timestamp',
    auditColOutcome: 'Desfecho',
    auditColMethodPath: 'Método / Path',
    auditColHttp: 'HTTP',
    auditColDetails: 'Detalhes',
    noAuditEvents: 'Nenhum evento de sonda registrado para este scan.',
  },
  authorizations: {
    loading: 'Carregando alvos autorizados...',
    badge: 'Cláusula de Segurança Ativa',
    title: 'Alvos Autorizados & Guardrails',
    description:
      'Nenhuma sonda ativa é executada sem comprovação criptográfica de posse do domínio. Todas as verificações são estritamente GET/HEAD não destrutivas, com proteção anti-SSRF, rate limit e auditoria.',
    formTitle: 'Registrar Novo Alvo de Staging',
    targetUrlLabel: 'URL Base do Alvo',
    targetUrlPlaceholder: 'https://staging.suaempresa.com',
    methodLabel: 'Método de Prova',
    methodWellKnown: 'Arquivo /.well-known/brynja-verify.txt',
    methodDns: 'Registro DNS TXT (_brynja)',
    methodSandbox: 'Sandbox Loopback Local (dev)',
    generateButton: 'Gerar Desafio de Posse',
    instructionPrefix: 'Instrução de Verificação:',
    invalidTargetUrl:
      'Informe um domínio ou URL válido (ex.: seusite.com.br ou https://staging.suaempresa.com).',
    createErrorFallback: 'Erro ao criar desafio.',
    verifyErrorFallback: 'Falha na verificação de posse.',
    revokeErrorFallback: 'Falha ao revogar e remover autorização.',
    guardrailsTitle: 'Guardrails Obrigatórios',
    guardrails: [
      'Bloqueio SSRF de redes privadas e metadata cloud',
      'Somente requisições GET / HEAD não destrutivas',
      'Rate limit por scan e circuit breaker em 429 / 5xx',
      'Certificado assinado (7 dias) com renovação automática se a prova continuar publicada',
      'Histórico e trilha salvos localmente no navegador (IndexedDB)',
    ],
    registeredTitle: 'Alvos Registrados ({count})',
    registeredSubtitle: 'Vinculados exclusivamente à sua conta GitHub.',
    emptyRegistered:
      'Nenhum alvo registrado ainda. Gere um desafio ao lado para habilitar safe probes.',
    tokenPrefix: 'Token:',
    copyTokenTitle: 'Copiar token',
    howToSetup: 'Como configurar',
    verifyOwnership: 'Verificar Posse',
    revoke: 'Revogar',
    remove: 'Remover',
    removing: 'Removendo...',
    removePermanently: 'Remover permanentemente',
  },
  setupGuide: {
    eyebrow: 'Guia Passo a Passo de Configuração',
    title: 'Como comprovar a posse do seu domínio (iniciantes e terminal SSH)',
    subtitlePrefix:
      'Siga as etapas abaixo para liberar as sondas seguras no seu site.',
    subtitleReady:
      'Os comandos abaixo já estão preenchidos com o domínio e o token do seu alvo.',
    subtitleDraftReady:
      'Os comandos abaixo foram atualizados dinamicamente para {origin} com o seu token real pronto para copiar e rodar no terminal.',
    subtitleResolving:
      'Preparando o token real de verificação para {origin}...',
    subtitlePlaceholder:
      'Digite a URL do seu alvo acima ou gere um desafio para preencher automaticamente todos os comandos com o seu token real.',
    commandsReadyFor: 'Comandos prontos para',
    resolvingTokenFor: 'Preparando token para',
    tokenReadyBadge: 'Token real pronto para copiar',
    copyingToken: 'Preparando...',
    copyDnsTokenTitle: 'Copiar valor do token DNS TXT',
    step1Title: 'Gere o código (token)',
    step1Body:
      'Informe a URL do seu site acima, escolha o método e clique em Gerar Desafio de Posse.',
    step2Title: 'Publique a prova no site ou DNS',
    step2Body:
      'Escolha a opção abaixo (SSH no terminal, projeto web/cPanel ou painel DNS) e cole o token exatamente como foi gerado.',
    step3Title: 'Clique em Verificar Posse',
    step3Body:
      'O Brynja lê a prova e emite um certificado de 7 dias (renovado automaticamente enquanto o arquivo ou DNS permanecer ativo).',
    tabWellKnown: 'Arquivo /.well-known (Recomendado)',
    tabDns: 'Registro DNS TXT',
    tabSandbox: 'Sandbox Local (dev)',
    wellKnownIntroPrefix: 'O objetivo é deixar o endereço',
    wellKnownIntroSuffix:
      'acessível mostrando somente o seu token. Escolha como você publica no seu servidor:',
    subtabSsh: 'Via Terminal Remoto (SSH)',
    subtabWeb: 'Sem SSH (Vercel / Projeto / cPanel)',
    sshStep1Title: 'Passo 1 — Conectar ao servidor remoto pelo terminal',
    sshStep1Body:
      'Abra o terminal do seu computador (Linux, macOS ou PowerShell/WSL no Windows) e acesse o servidor via SSH:',
    sshStep1Label: 'Terminal local → SSH',
    sshStep1Caption:
      "Substitua 'usuario' pelo seu usuário do servidor (ex.: root, ubuntu, deploy) ou use o apelido configurado no seu ~/.ssh/config.",
    sshStep2Title:
      'Passo 2 — Criar a pasta .well-known e gravar o arquivo de verificação',
    sshStep2Body:
      'Já conectado no servidor remoto, execute o comando abaixo para criar a pasta e salvar o token sem espaços extras:',
    sshStep2Label: 'Servidor remoto (Linux / VPS)',
    sshStep2Caption:
      'Se o diretório raiz do seu site não for /var/www/html (ex.: /var/www/meusite/public ou /usr/share/nginx/html), troque o caminho antes de executar.',
    proxySelectorAriaStep3: 'Selecionar servidor de proxy reverso (Passo 3)',
    proxySelectorAriaStep5: 'Selecionar servidor de proxy reverso (Passo 5)',
    proxyNginx: 'Nginx',
    proxyApache: 'Apache',
    sshStep3Title:
      'Passo 3 — (Opcional, mas comum) Se você usa proxy reverso (Nginx ou Apache)',
    sshStep3BodyBefore:
      'Se o seu site roda em Node.js, Next.js, Docker ou Python atrás do Nginx (',
    sshStep3BodyMiddle:
      '), o Nginx pode enviar a rota para a aplicação/container e devolver 404. Primeiro localize o arquivo realmente ativo e adicione este bloco dentro de',
    sshStep3BodyAfter: 'no arquivo ativo em',
    sshStep3NginxFindActiveLabel:
      'Localizar o arquivo Nginx realmente ativo para o domínio',
    sshStep3NginxFindActiveCaption:
      'Atenção: se em /etc/nginx/sites-enabled/ o arquivo aparecer SEM seta (->), ele é uma cópia física (não um symlink de sites-available). Edite esse arquivo em sites-enabled/ diretamente — sempre no bloco "listen 443 ssl" quando usar HTTPS.',
    sshStep3Label: 'Trecho Nginx (bloco server 443 do arquivo ativo)',
    sshStep3NginxSnippetCaption:
      'Usa "location = /.well-known/brynja-verify.txt" (match exato): vence o proxy_pass de containers Docker (ex.: 127.0.0.1:3000) sem conflitar com o Certbot (/.well-known/acme-challenge/).',
    sshStep3ReloadLabel: 'Validar sintaxe e recarregar o Nginx sem downtime',
    sshStep3ApacheBodyBefore:
      'Se o seu site roda em Node.js, Next.js, Docker ou Python atrás do Apache (',
    sshStep3ApacheBodyMiddle:
      '), o Apache pode enviar a rota para a aplicação/container e devolver 404. Primeiro localize o arquivo ativo e adicione este bloco dentro de',
    sshStep3ApacheBodyAfter: 'no arquivo ativo em',
    sshStep3ApacheBodyOr: 'ou',
    sshStep3ApacheFindActiveLabel:
      'Localizar o arquivo Apache realmente ativo para o domínio',
    sshStep3ApacheFindActiveCaption:
      'Atenção: se em /etc/apache2/sites-enabled/ o arquivo aparecer SEM seta (->), ele é uma cópia física (não um symlink de sites-available). Edite esse arquivo ativo diretamente dentro do <VirtualHost *:443>.',
    sshStep3ApacheLabel:
      'Trecho Apache (/etc/apache2/sites-enabled/... ou /etc/httpd/conf.d/...)',
    sshStep3ApacheCaption:
      'Importante: coloque "ProxyPass /.well-known/ !" ANTES de "ProxyPass / ...". Se o proxy usar <Location />, adicione "<Location /.well-known/> ProxyPass ! </Location>" depois dele; se usar mod_rewrite ([P]), inclua "RewriteCond %{REQUEST_URI} !^/\\.well-known/".',
    sshStep3ApacheReloadLabel:
      'Validar sintaxe e recarregar o Apache sem downtime',
    sshStep3ApacheReloadCaption:
      'No RHEL, Rocky, Alma, CentOS ou Fedora, use: sudo httpd -t && sudo systemctl reload httpd',
    sshStep3ContainerNoteLead: 'Servidor rodando em containers Docker?',
    sshStep3ContainerNoteBody:
      'Se apenas a aplicação roda em Docker (ex.: Next.js/Node em 127.0.0.1:3000) atrás do Nginx/Apache no host, grave o arquivo em /var/www/html/.well-known/ no host e edite o arquivo ativo do proxy do host. Se o próprio proxy reverso rodar dentro de um container (Traefik, Caddy, Nginx Proxy Manager), publique o arquivo no proxy do container ou use a aba "Registro DNS TXT" sem alterar containers.',
    sshStep4Title: 'Passo 4 — Testar pelo terminal se o arquivo ficou público',
    sshStep4Body:
      'Rode o comando abaixo (no servidor ou no seu computador). Ele deve imprimir exatamente o seu token na tela:',
    sshStep4Label: 'Teste rápido via curl',
    sshStep4Caption:
      'Resultado esperado: {token}. Se apareceu exatamente isso, suba a página e clique em "Verificar Posse"!',
    sshStep5Title:
      'Passo 5 — (Opcional) Reverter tudo: remover o arquivo, a pasta .well-known e o Passo 3 (Nginx / Apache)',
    sshStep5Body:
      'Quando quiser voltar o servidor exatamente ao estado anterior (ou revogar o acesso), siga a sequência abaixo. Atenção: remover o arquivo impede a renovação automática do certificado após 7 dias.',
    sshStep5RemoveFileLabel:
      '5.1 — Remover .well-known/brynja-verify.txt e a pasta .well-known (se vazia)',
    sshStep5RemoveFileCaption:
      'Apaga o arquivo brynja-verify.txt e remove a pasta .well-known apenas se ela ficar vazia (preservando pastas existentes como acme-challenge do Certbot/Let’s Encrypt). Ajuste /var/www/html se tiver usado outro diretório raiz.',
    sshStep5NginxBodyBefore:
      'Se você adicionou o bloco do Passo 3 no Nginx, localize o arquivo de configuração com o comando abaixo, remova o bloco',
    sshStep5NginxBodyAfter:
      '(somente se ele não for usado pelo Certbot/Let’s Encrypt), salve e recarregue o Nginx:',
    sshStep5NginxFindLabel: '5.2 — Localizar o bloco no Nginx (Passo 3)',
    sshStep5NginxReloadLabel:
      '5.3 — Validar e recarregar o Nginx após remover o bloco do Passo 3',
    sshStep5ApacheBodyBefore:
      'Se você adicionou as diretivas do Passo 3 no Apache, localize o arquivo de configuração com o comando abaixo, remova o bloco',
    sshStep5ApacheBodyAfter:
      '(somente se ele não for usado pelo Certbot/Let’s Encrypt), salve e recarregue o Apache:',
    sshStep5ApacheFindLabel: '5.2 — Localizar o bloco no Apache (Passo 3)',
    sshStep5ApacheReloadLabel:
      '5.3 — Validar e recarregar o Apache após remover o bloco do Passo 3',
    sshStep5VerifyLabel:
      '5.4 — Confirmar pelo terminal que o arquivo foi removido',
    sshStep5VerifyCaption:
      'Deve retornar HTTP 404 (ou a rota padrão da aplicação). Para finalizar, clique também em "Revogar" na lista de alvos acima.',
    webOptionATitle:
      'Opção A — Projeto Web (Next.js, React, Vite, Vercel, Netlify)',
    webOptionAStep1: 'Abra a pasta public/ na raiz do seu projeto.',
    webOptionAStep2:
      'Crie dentro dela uma subpasta chamada exatamente .well-known (com o ponto na frente).',
    webOptionAStep3:
      'Crie o arquivo public/.well-known/brynja-verify.txt e cole somente o token abaixo dentro dele.',
    webOptionAStep4:
      'Faça o commit/deploy e abra {url} no navegador para conferir.',
    webOptionACodeLabel: 'Conteúdo exato do arquivo brynja-verify.txt',
    webOptionBTitle: 'Opção B — Painel de Hospedagem (cPanel, Hostinger, FTP)',
    webOptionBStep1:
      'Acesse o Gerenciador de Arquivos e entre na pasta pública do site (normalmente public_html).',
    webOptionBStep2:
      'Nas configurações do gerenciador, marque a opção Mostrar arquivos ocultos (dotfiles).',
    webOptionBStep3:
      'Crie a pasta .well-known (se ainda não existir) e crie dentro dela o arquivo brynja-verify.txt.',
    webOptionBStep4:
      'Edite o arquivo, cole apenas o token, salve e clique em Verificar Posse aqui no Brynja.',
    webCleanupTitle:
      'Como reverter e remover .well-known/brynja-verify.txt depois (opcional)',
    webCleanupBody:
      'Em projetos web (Next.js/React/Vercel/Netlify), rode o comando abaixo na raiz do projeto e faça commit/deploy. No cPanel/FTP, apague brynja-verify.txt e remova a pasta .well-known se ela ficar vazia.',
    webCleanupCodeLabel: 'Remover arquivo e pasta .well-known no projeto web',
    dnsIntro:
      'Ideal se você não tem acesso aos arquivos do servidor web, mas controla o painel de DNS do domínio (Cloudflare, Registro.br, GoDaddy, Route 53, Vercel DNS). Crie um registro com os valores abaixo:',
    dnsColType: 'Tipo',
    dnsColName: 'Nome / Host',
    dnsColValue: 'Valor / Conteúdo',
    dnsColTtl: 'TTL',
    dnsHostAlt: '(ou _brynja.{hostname})',
    dnsTtlValue: 'Auto / 300s',
    dnsCheckTitle: 'Conferir propagação DNS pelo terminal (opcional)',
    dnsCheckBody:
      'Após salvar no painel DNS (costuma propagar em 1 a 10 minutos), você pode testar pelo terminal antes de clicar em Verificar Posse:',
    dnsCheckLabel: 'Terminal (Linux / macOS / Windows)',
    dnsCheckCaption:
      'Quando a saída exibir "{token}", o DNS já propagou e a verificação será aprovada imediatamente.',
    sandboxIntro:
      'Este modo serve apenas para testar uma aplicação rodando localmente na sua própria máquina (http://localhost:3000, http://127.0.0.1:8080). Por proteção anti-SSRF, ele permanece bloqueado na versão hospedada na Vercel.',
    sandboxCodeLabel: 'No seu .env.local (apenas desenvolvimento local)',
    sandboxCodeCaption:
      'Depois de salvar no .env.local, reinicie o servidor local (pnpm dev), gere o desafio para http://localhost:<porta> e clique em Verificar Posse.',
    troubleshootingTitle: 'Dicas rápidas se a verificação falhar',
    tip1Lead: 'Retornou página HTML ou 404:',
    tip1Body:
      'verifique se o proxy reverso (Nginx/Apache/Cloudflare/Vercel rewrites) não está capturando /.well-known/, redirecionando (301/302) ou devolvendo o index da aplicação.',
    tip2Lead: 'Não apague a prova depois de verificar:',
    tip2Body:
      'manter o arquivo ou o registro TXT publicado permite que o Brynja renove seu certificado automaticamente após 7 dias sem precisar reconfigurar.',
    tip3Lead: 'Quer revogar o acesso?',
    tip3Body:
      'basta apagar o arquivo no servidor (ou o registro DNS TXT) e clicar no botão Revogar na lista de alvos acima.',
    tip4Lead: 'Editou sites-available mas continua 404 (ex.: Next.js/Docker)?',
    tip4Body:
      'verifique se sites-enabled/ tem uma cópia física em vez de symlink, se o bloco foi inserido no virtual host HTTPS (porta 443) e aguarde ~1s após o reload antes de testar com curl.',
    placeholderOrigin: 'https://seusite.com.br',
    placeholderHost: 'seusite.com.br',
    placeholderToken: 'brynja-verify-SEU_TOKEN_GERADO_ACIMA',
    dnsAltComment: '# Alternativa (Windows / Linux / macOS):',
  },
  audit: {
    loading: 'Carregando trilha de auditoria...',
    title: 'Trilha Imutável de Auditoria',
    description:
      'Todos os eventos de verificação de posse, bloqueios anti-SSRF, rate limiting e execução de safe probes da sua conta ficam registrados localmente no navegador (IndexedDB).',
    kpiTotal: 'Total de Eventos',
    kpiAllowed: 'Autorizados / Executados',
    kpiBlocked: 'Bloqueados por Guardrail',
    colDate: 'Data/Hora',
    colOutcome: 'Desfecho',
    colTarget: 'Alvo',
    colProbeMethod: 'Sonda / Método',
    colStatus: 'Status',
    colDetails: 'Detalhes',
    loadingRows: 'Carregando logs...',
    emptyRows: 'Nenhum evento registrado até o momento.',
  },
  changelog: {
    badge: 'Versão Atual: v{version} · SemVer 2.0.0',
    title: 'Histórico de Versões (Changelog)',
    description:
      'Acompanhe todas as funcionalidades, melhorias de arquitetura e correções de segurança entregues em cada versão do Brynja.',
    ptGithub: 'PT-BR no GitHub',
    enGithub: 'English (CHANGELOG.md)',
    empty: 'Nenhuma versão registrada no changelog ainda.',
    latestBadge: 'Mais recente',
    spanishFallbackNote:
      'As notas técnicas abaixo estão exibidas em inglês (fonte oficial CHANGELOG.md).',
  },
};

export type Messages = typeof PT_BR_MESSAGES;
