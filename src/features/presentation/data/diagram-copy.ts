import type { Locale } from '@/core/i18n/types';

export interface SlideDiagramCopy {
  readonly cover: {
    readonly localFirstBadge: string;
    readonly defensiveBadge: string;
    readonly stats: readonly [
      { value: string; label: string },
      { value: string; label: string },
      { value: string; label: string },
      { value: string; label: string },
    ];
  };
  readonly problem: readonly [
    { stat: string; title: string; desc: string },
    { stat: string; title: string; desc: string },
    { stat: string; title: string; desc: string },
  ];
  readonly chainmail: readonly [
    { ring: string; title: string; subtitle: string },
    { ring: string; title: string; subtitle: string },
    { ring: string; title: string; subtitle: string },
    { ring: string; title: string; subtitle: string },
  ];
  readonly localFirst: {
    readonly browserTitle: string;
    readonly browserDesc: string;
    readonly serverTitle: string;
    readonly serverDesc: string;
    readonly cloudTitle: string;
    readonly cloudHighlight: string;
    readonly cloudDesc: string;
  };
  readonly journeyMap: {
    readonly stepPrefix: string;
    readonly steps: readonly [string, string, string, string, string, string, string];
  };
  readonly stageAuth: readonly [
    { title: string; desc: string; badge: string },
    { title: string; desc: string; badge: string },
    { title: string; desc: string; badge: string },
  ];
  readonly stageAuthz: readonly [
    { step: string; title: string; desc: string },
    { step: string; title: string; desc: string },
    { step: string; title: string; desc: string },
    { step: string; title: string; desc: string },
  ];
  readonly stageNewScan: {
    readonly crossStackPrefix: string;
    readonly crossStackSummary: string;
  };
  readonly layerSca: readonly [string, string, string, string, string];
  readonly layerStatic: readonly [
    { title: string; items: string; note: string },
    { title: string; items: string; note: string },
    { title: string; items: string; note: string },
    { title: string; items: string; note: string },
  ];
  readonly layerProbes: readonly [
    { count: string; title: string; examples: string },
    { count: string; title: string; examples: string },
    { count: string; title: string; examples: string },
    { count: string; title: string; examples: string },
  ];
  readonly guardrails: readonly [
    { title: string; value: string; desc: string },
    { title: string; value: string; desc: string },
    { title: string; value: string; desc: string },
    { title: string; value: string; desc: string },
  ];
  readonly layerAi: readonly [
    { title: string; desc: string },
    { title: string; desc: string },
    { title: string; desc: string },
  ];
  readonly stageReports: readonly [
    { audience: string; format: string; bullets: readonly [string, string, string] },
    { audience: string; format: string; bullets: readonly [string, string, string] },
    { audience: string; format: string; bullets: readonly [string, string, string] },
  ];
  readonly stageGovernance: {
    readonly frameworks: readonly [string, string, string, string];
    readonly excelBanner: string;
    readonly excelSubtext: string;
  };
  readonly stageHistoryAudit: readonly [
    { title: string; desc: string; badge: string },
    { title: string; desc: string; badge: string },
    { title: string; desc: string; badge: string },
  ];
  readonly dailyRoutine: {
    readonly itTitle: string;
    readonly itItems: readonly [
      { tag: string; text: string },
      { tag: string; text: string },
      { tag: string; text: string },
    ];
    readonly boardTitle: string;
    readonly boardItems: readonly [
      { tag: string; text: string },
      { tag: string; text: string },
      { tag: string; text: string },
    ];
  };
  readonly pilotRoadmap: readonly [
    { week: string; title: string; desc: string },
    { week: string; title: string; desc: string },
    { week: string; title: string; desc: string },
    { week: string; title: string; desc: string },
  ];
}

const PT_BR_DIAGRAM_COPY: SlideDiagramCopy = {
  cover: {
    localFirstBadge: 'Local-First · Zero Banco na Nuvem',
    defensiveBadge: 'Uso 100% Defensivo',
    stats: [
      { value: '8', label: 'Ecossistemas SCA' },
      { value: '19', label: 'Safe Probes' },
      { value: '4', label: 'Frameworks GRC' },
      { value: 'R$ 0', label: 'Custo de Banco' },
    ],
  },
  problem: [
    {
      stat: '+80%',
      title: 'Código de Terceiros',
      desc: 'Sistemas modernos dependem de dezenas ou centenas de bibliotecas externas invisíveis sem inventário.',
    },
    {
      stat: 'Alto Custo',
      title: 'Licenças & Exposição',
      desc: 'Ferramentas SaaS tradicionais cobram caro por usuário e armazenam vulnerabilidades da empresa fora de casa.',
    },
    {
      stat: 'Ruído',
      title: 'Fosso TI ↔ Diretoria',
      desc: 'Listas técnicas extensas sem prioridade de negócio dificultam aprovar correções e responder auditorias.',
    },
  ],
  chainmail: [
    { ring: 'Anel 01', title: 'Peças & CVEs', subtitle: 'SCA / SBOM + 5 Bases' },
    { ring: 'Anel 02', title: 'Código & Nuvem', subtitle: 'Segredos, IaC & SAST' },
    { ring: 'Anel 03', title: 'Site no Ar', subtitle: '19 Safe Probes GET/HEAD' },
    { ring: 'Anel 04', title: 'Decisão & GRC', subtitle: 'PDF, IA BYOK & LGPD' },
  ],
  localFirst: {
    browserTitle: '1. Seu Navegador',
    browserDesc:
      'Guarda localmente o histórico, SBOMs, autorizações e avaliações GRC — isolados pela sua conta GitHub.',
    serverTitle: '2. Motor Stateless (Vercel)',
    serverDesc:
      'Processa a análise sob demanda na memória, devolve o resultado e descarta tudo imediatamente.',
    cloudTitle: '3. Banco na Nuvem',
    cloudHighlight: 'NÃO EXISTE (Zero armazenamento externo)',
    cloudDesc:
      'Sem custo de banco, sem retenção de tokens e sem risco de vazamento centralizado de vulnerabilidades.',
  },
  journeyMap: {
    stepPrefix: 'ETAPA',
    steps: [
      'Login GitHub',
      'Autorizar Domínio',
      'Configurar Scan',
      '4 Camadas',
      'Relatórios',
      'Governança GRC',
      'Diff & Auditoria',
    ],
  },
  stageAuth: [
    {
      title: '1. Entrar com GitHub',
      desc: 'Usa a conta já existente do colaborador — respeitando repos privados e Organizações.',
      badge: 'Sem senha extra',
    },
    {
      title: '2. Sessão Criptografada',
      desc: 'Token temporário selado na sessão do navegador. Fechou ou saiu, o acesso se encerra.',
      badge: 'Efêmera',
    },
    {
      title: '3. Espaço Isolado',
      desc: 'Cada conta enxerga apenas seu histórico e autorizações, mesmo em computadores compartilhados.',
      badge: 'Multi-usuário',
    },
  ],
  stageAuthz: [
    { step: 'Passo 1', title: 'Informar URL', desc: 'Ex.: staging.empresa.com.br' },
    {
      step: 'Passo 2',
      title: 'Publicar Prova',
      desc: 'security.txt (RFC 9116) ou DNS TXT _brynja',
    },
    {
      step: 'Passo 3',
      title: 'Validar Posse',
      desc: 'Brynja confere o código único no servidor',
    },
    {
      step: 'Passo 4',
      title: 'Certificado 7 Dias',
      desc: 'Renova ao vivo ou bloqueia se a prova sair',
    },
  ],
  stageNewScan: {
    crossStackPrefix: '+ Camadas válidas para qualquer stack:',
    crossStackSummary:
      'Docker · Terraform · Kubernetes · GitHub Actions · Segredos · 19 Safe Probes · Import SARIF/Trivy/Semgrep/Prowler',
  },
  layerSca: [
    'Identifica falhas por versão exata e qual versão corrige',
    'Nota oficial de gravidade (CVSS) e categoria da fraqueza',
    'Probabilidade estatística real de ataque nos próximos 30 dias',
    'Alerta vermelho: já está sendo explorada por criminosos hoje',
    'Licença jurídica (SPDX) e nota de saúde OpenSSF Scorecard',
  ],
  layerStatic: [
    {
      title: 'Segredos Vazados',
      items: 'Chaves AWS, GitHub, Stripe, senhas de BD e .env',
      note: 'Sempre mascarado',
    },
    {
      title: 'Infra & CI/CD (IaC)',
      items: 'Dockerfile, Compose, Terraform, K8s e GitHub Actions',
      note: 'CIS Benchmark',
    },
    {
      title: 'SAST Leve',
      items: 'SQL concatenado, shell interpolado, eval, TLS desligado',
      note: 'JS/TS & Python',
    },
    {
      title: 'Postura do Repo',
      items: 'SECURITY.md, Dependabot/Renovate, CODEOWNERS e branch',
      note: 'Higiene contínua',
    },
  ],
  layerProbes: [
    {
      count: '5 Sondas',
      title: 'Cabeçalhos, TLS & DNS',
      examples:
        'Security Headers · HSTS · CSP & Permissions · COOP/CORP/COEP · SPF/DMARC/CAA',
    },
    {
      count: '4 Sondas',
      title: 'Cookies, CORS & Cache',
      examples:
        'HttpOnly/Secure/SameSite · Política CORS · Cache de Sessão · Open Redirect',
    },
    {
      count: '5 Sondas',
      title: 'Exposição Indevida',
      examples:
        '.git / .env · Backups / phpinfo · Swagger & Métricas · Robots/Sitemap · OAuth/GraphQL',
    },
    {
      count: '5 Sondas',
      title: 'Runtime & Integridade',
      examples:
        'Fingerprint ↔ SBOM · Source Maps · Stack Traces/Debug · SRI em CDNs · security.txt',
    },
  ],
  guardrails: [
    {
      title: 'Posse Obrigatória',
      value: '100% Verificado',
      desc: 'Nenhuma sonda roda sem certificado criptográfico válido do dono.',
    },
    {
      title: 'Zero Escrita / Ataque',
      value: 'Só GET & HEAD',
      desc: 'Sem POST/DELETE, sem força bruta e sem payloads destrutivos.',
    },
    {
      title: 'Escudo Anti-SSRF',
      value: 'Rede Bloqueada',
      desc: 'DNS prévio impede acessar IPs internos ou metadados de nuvem.',
    },
    {
      title: 'Freio & Disjuntor',
      value: '2 req/s · Máx 80',
      desc: 'Aborta automaticamente ao detectar 429 ou erros 5xx no servidor.',
    },
  ],
  layerAi: [
    {
      title: 'Chave da Empresa (BYOK)',
      desc: 'OpenAI, Google Gemini ou endpoint interno compatível. A chave fica apenas no navegador — com descoberta automática de modelos.',
    },
    {
      title: 'Filtro de Privacidade',
      desc: 'Envia somente nomes de vulnerabilidades sanitizados e indícios de uso real (reachability). Nenhum segredo ou código completo sai.',
    },
    {
      title: 'Saída Acionável',
      desc: 'Resumo executivo pronto para a Diretoria + passos numerados de correção para a TI, salvos junto ao PDF Executivo.',
    },
  ],
  stageReports: [
    {
      audience: 'Diretoria & Gerência',
      format: 'PDF Executivo',
      bullets: [
        'Parecer Executivo com SLA (P0 a P3)',
        'Impacto de negócio em linguagem clara',
        'Matriz de Conformidade + Diagnóstico IA',
      ],
    },
    {
      audience: 'Equipe de TI & Devs',
      format: 'JSON para IA + Abas',
      bullets: [
        'Comandos exatos de atualização por pacote',
        'JSON enxuto pronto para colar no copiloto',
        'Selo "Escudo Íntegro" quando 100% limpo',
      ],
    },
    {
      audience: 'Clientes & Auditoria',
      format: 'SBOM & Padrões',
      bullets: [
        'SBOM CycloneDX 1.5 e SPDX 2.3',
        'SARIF 2.1.0 para pipelines/GitHub',
        'Markdown e JSON técnico completo',
      ],
    },
  ],
  stageGovernance: {
    frameworks: [
      'Grupos IG1 (essencial), IG2 e IG3',
      'Govern, Identify, Protect, Detect, Respond',
      'Controles práticos de segurança web',
      'Arts. 46, 48, 50 e controles Anexo A',
    ],
    excelBanner:
      'Exportação nativa em Excel (.xlsx) com 5 abas prontas para auditoria',
    excelSubtext: '+ JSON de Lacunas para IA + Guia educativo integrado',
  },
  stageHistoryAudit: [
    {
      title: 'Comparador (Scan Diff)',
      desc: 'Mostra lado a lado o que foi resolvido, o que é novo e quanto a aderência CIS/NIST subiu entre duas datas.',
      badge: 'Evolução Comprovada',
    },
    {
      title: 'Importador Externo',
      desc: 'Centraliza arquivos JSON de Trivy, Semgrep, Prowler e SARIF 2.1.0 no mesmo histórico + Backup local.',
      badge: 'Hub Único',
    },
    {
      title: 'Trilha de Auditoria (/audit)',
      desc: 'Log de cada requisição HTTP das sondas com data/hora, caminho, status e certificado utilizado.',
      badge: '100% Rastreável',
    },
  ],
  dailyRoutine: {
    itTitle: 'Cadência da Equipe de TI',
    itItems: [
      { tag: 'Dia 1', text: 'Autorizar staging e rodar linha de base do projeto.' },
      {
        tag: 'Semanal',
        text: 'Rodar varredura pré-release, conferir Scan Diff e corrigir itens P0/P1.',
      },
      {
        tag: 'Mensal',
        text: 'Revisar postura de repositórios e atualizar atestados GRC.',
      },
    ],
    boardTitle: 'Cadência da Diretoria & Compliance',
    boardItems: [
      {
        tag: 'Mensal',
        text: 'Ler PDF Executivo (5 min): verificar pendências P0/P1 e riscos de negócio.',
      },
      {
        tag: 'Trimestral',
        text: 'Revisar planilha Excel GRC (CIS v8 / LGPD / ISO 27001) e evolução de aderência.',
      },
      {
        tag: 'Sob Demanda',
        text: 'Entregar SBOM e evidências de conformidade em auditorias ou contratos B2B.',
      },
    ],
  },
  pilotRoadmap: [
    {
      week: 'Semana 1',
      title: 'Setup & Piloto',
      desc: 'Deploy na Vercel, autorização de 2–3 sistemas de homologação e 1ª varredura.',
    },
    {
      week: 'Semana 2',
      title: 'Quick Wins P0/P1',
      desc: 'TI aplica correções prioritárias (bibliotecas, cabeçalhos, segredos/IaC).',
    },
    {
      week: 'Semana 3',
      title: 'Linha de Base GRC',
      desc: 'Primeira matriz CIS v8 (IG1) + LGPD/ISO 27001 em Excel para gestão.',
    },
    {
      week: 'Semana 4',
      title: 'Antes × Depois',
      desc: 'Revisão executiva com Scan Diff para aprovar escala para toda a TI.',
    },
  ],
};

const EN_DIAGRAM_COPY: SlideDiagramCopy = {
  cover: {
    localFirstBadge: 'Local-First · Zero Cloud Database',
    defensiveBadge: '100% Defensive Use',
    stats: [
      { value: '8', label: 'SCA Ecosystems' },
      { value: '19', label: 'Safe Probes' },
      { value: '4', label: 'GRC Frameworks' },
      { value: '$0', label: 'Database Cost' },
    ],
  },
  problem: [
    {
      stat: '80%+',
      title: 'Third-Party Code',
      desc: 'Modern apps rely on dozens or hundreds of external packages invisible without an inventory.',
    },
    {
      stat: 'High Cost',
      title: 'Licenses & Exposure',
      desc: 'Traditional SaaS tools charge per seat and store your company vulnerabilities off-site.',
    },
    {
      stat: 'Noise',
      title: 'IT ↔ Board Gap',
      desc: 'Long raw alert lists without business priority slow down fixes and audit responses.',
    },
  ],
  chainmail: [
    { ring: 'Ring 01', title: 'Packages & CVEs', subtitle: 'SCA / SBOM + 5 Feeds' },
    { ring: 'Ring 02', title: 'Code & Cloud', subtitle: 'Secrets, IaC & SAST' },
    { ring: 'Ring 03', title: 'Live Website', subtitle: '19 Safe Probes GET/HEAD' },
    { ring: 'Ring 04', title: 'Decision & GRC', subtitle: 'PDF, BYOK AI & LGPD' },
  ],
  localFirst: {
    browserTitle: '1. Your Browser',
    browserDesc:
      'Stores scan history, SBOMs, authorizations, and GRC assessments locally — isolated per GitHub account.',
    serverTitle: '2. Stateless Engine (Vercel)',
    serverDesc:
      'Processes each scan on demand in memory, returns results, and discards everything immediately.',
    cloudTitle: '3. Cloud Database',
    cloudHighlight: 'DOES NOT EXIST (Zero external storage)',
    cloudDesc:
      'No database cost, no stored OAuth tokens, and zero risk of centralized vulnerability leaks.',
  },
  journeyMap: {
    stepPrefix: 'STAGE',
    steps: [
      'GitHub Sign-In',
      'Verify Domain',
      'Configure Scan',
      '4 Layers',
      'Reports',
      'GRC Governance',
      'Diff & Audit',
    ],
  },
  stageAuth: [
    {
      title: '1. Sign in with GitHub',
      desc: 'Uses each engineer’s existing account — respecting private and Organization repositories.',
      badge: 'No extra password',
    },
    {
      title: '2. Encrypted Session',
      desc: 'Temporary token sealed inside the browser session. Sign out or close, and access ends.',
      badge: 'Ephemeral',
    },
    {
      title: '3. Isolated Space',
      desc: 'Every account sees only its own history and authorizations, even on shared workstations.',
      badge: 'Multi-user',
    },
  ],
  stageAuthz: [
    { step: 'Step 1', title: 'Enter URL', desc: 'e.g. staging.company.com' },
    {
      step: 'Step 2',
      title: 'Publish Proof',
      desc: 'security.txt (RFC 9116) or _brynja DNS TXT',
    },
    {
      step: 'Step 3',
      title: 'Verify Ownership',
      desc: 'Brynja checks the unique token live on your server',
    },
    {
      step: 'Step 4',
      title: '7-Day Certificate',
      desc: 'Renews live or blocks immediately if proof is removed',
    },
  ],
  stageNewScan: {
    crossStackPrefix: '+ Layers that work on every stack:',
    crossStackSummary:
      'Docker · Terraform · Kubernetes · GitHub Actions · Secrets · 19 Safe Probes · SARIF/Trivy/Semgrep/Prowler Import',
  },
  layerSca: [
    'Matches exact pinned versions and identifies the exact fixed release',
    'Official severity score (CVSS) and weakness classification (CWE)',
    'Statistical real-world exploitation probability over the next 30 days',
    'Red alert: actively exploited in the wild by attackers today',
    'SPDX legal license and OpenSSF Scorecard project health rating',
  ],
  layerStatic: [
    {
      title: 'Leaked Secrets',
      items: 'AWS, GitHub, Stripe keys, DB passwords & .env files',
      note: 'Always masked',
    },
    {
      title: 'Infra & CI/CD (IaC)',
      items: 'Dockerfile, Compose, Terraform, K8s & GitHub Actions',
      note: 'CIS Benchmark',
    },
    {
      title: 'Lightweight SAST',
      items: 'Concatenated SQL, shell interpolation, eval, TLS off',
      note: 'JS/TS & Python',
    },
    {
      title: 'Repo Posture',
      items: 'SECURITY.md, Dependabot/Renovate, CODEOWNERS & branch',
      note: 'Continuous hygiene',
    },
  ],
  layerProbes: [
    {
      count: '5 Probes',
      title: 'Headers, TLS & DNS',
      examples:
        'Security Headers · HSTS · CSP & Permissions · COOP/CORP/COEP · SPF/DMARC/CAA',
    },
    {
      count: '4 Probes',
      title: 'Cookies, CORS & Cache',
      examples:
        'HttpOnly/Secure/SameSite · CORS Policy · Session Caching · Open Redirect',
    },
    {
      count: '5 Probes',
      title: 'Unintended Exposure',
      examples:
        '.git / .env · Backups / phpinfo · Swagger & Metrics · Robots/Sitemap · OAuth/GraphQL',
    },
    {
      count: '5 Probes',
      title: 'Runtime & Integrity',
      examples:
        'Fingerprint ↔ SBOM · Source Maps · Stack Traces/Debug · CDN SRI · security.txt',
    },
  ],
  guardrails: [
    {
      title: 'Mandatory Ownership',
      value: '100% Verified',
      desc: 'No probe runs without a valid cryptographic certificate from the owner.',
    },
    {
      title: 'Zero Writes / Attacks',
      value: 'GET & HEAD Only',
      desc: 'No POST/DELETE, no brute force, and zero destructive payloads.',
    },
    {
      title: 'Anti-SSRF Shield',
      value: 'LAN Blocked',
      desc: 'Pre-flight DNS blocks internal IPs and cloud metadata endpoints.',
    },
    {
      title: 'Rate Limit & Breaker',
      value: '2 req/s · Max 80',
      desc: 'Aborts automatically on HTTP 429 or repeated 5xx responses.',
    },
  ],
  layerAi: [
    {
      title: 'Company Key (BYOK)',
      desc: 'OpenAI, Google Gemini, or compatible internal endpoint. Key stays in the browser — with live text-model discovery.',
    },
    {
      title: 'Privacy Filter',
      desc: 'Sends only sanitized vulnerability metadata and reachability hints. Never sends secrets or raw source files.',
    },
    {
      title: 'Actionable Output',
      desc: 'Executive summary ready for Leadership + numbered remediation steps for IT, embedded in the Executive PDF.',
    },
  ],
  stageReports: [
    {
      audience: 'Leadership & Board',
      format: 'Executive PDF',
      bullets: [
        'Executive briefing with P0–P3 SLAs',
        'Plain-language business risk impact',
        'Compliance Matrix + AI Diagnosis',
      ],
    },
    {
      audience: 'IT Team & Engineers',
      format: 'AI JSON + Tabs',
      bullets: [
        'Exact upgrade commands per package',
        'Noise-free JSON ready for coding copilots',
        '"Intact Shield" badge when 100% clean',
      ],
    },
    {
      audience: 'Clients & Auditors',
      format: 'SBOM & Standards',
      bullets: [
        'CycloneDX 1.5 and SPDX 2.3 SBOMs',
        'SARIF 2.1.0 for CI/CD & GitHub',
        'Markdown and complete technical JSON',
      ],
    },
  ],
  stageGovernance: {
    frameworks: [
      'Groups IG1 (essential), IG2 & IG3',
      'Govern, Identify, Protect, Detect, Respond',
      'Practical web security controls',
      'LGPD Arts. 46/48/50 & ISO Annex A',
    ],
    excelBanner:
      'Native Excel (.xlsx) export with 5 audit-ready worksheets',
    excelSubtext: '+ Failures-only AI Gaps JSON + built-in educational guide',
  },
  stageHistoryAudit: [
    {
      title: 'Comparator (Scan Diff)',
      desc: 'Shows side by side what was fixed, what is new, and how CIS/NIST compliance grew between two dates.',
      badge: 'Proven Progress',
    },
    {
      title: 'External Importer',
      desc: 'Consolidates Trivy, Semgrep, Prowler, and SARIF 2.1.0 JSON files in one local history + Backup.',
      badge: 'Unified Hub',
    },
    {
      title: 'Audit Trail (/audit)',
      desc: 'Logs every probe HTTP request with timestamp, path, status code, and certificate used.',
      badge: '100% Traceable',
    },
  ],
  dailyRoutine: {
    itTitle: 'IT Team Cadence',
    itItems: [
      { tag: 'Day 1', text: 'Authorize staging URL and capture project baseline.' },
      {
        tag: 'Weekly',
        text: 'Run pre-release scan, check Scan Diff, and resolve P0/P1 items.',
      },
      {
        tag: 'Monthly',
        text: 'Review repository posture and refresh GRC attestations.',
      },
    ],
    boardTitle: 'Leadership & Compliance Cadence',
    boardItems: [
      {
        tag: 'Monthly',
        text: 'Read Executive PDF (5 min): review P0/P1 priorities and business risks.',
      },
      {
        tag: 'Quarterly',
        text: 'Review GRC Excel matrix (CIS v8 / LGPD / ISO 27001) and adherence trend.',
      },
      {
        tag: 'On Demand',
        text: 'Deliver SBOM and compliance evidence for audits or B2B contracts.',
      },
    ],
  },
  pilotRoadmap: [
    {
      week: 'Week 1',
      title: 'Setup & Pilot',
      desc: 'Deploy on Vercel, authorize 2–3 staging systems, and run initial baseline.',
    },
    {
      week: 'Week 2',
      title: 'P0/P1 Quick Wins',
      desc: 'IT resolves top-priority findings (dependencies, headers, secrets/IaC).',
    },
    {
      week: 'Week 3',
      title: 'GRC Baseline',
      desc: 'Build first CIS v8 (IG1) + LGPD/ISO 27001 Excel workbook for leadership.',
    },
    {
      week: 'Week 4',
      title: 'Before vs. After',
      desc: 'Executive Scan Diff review to approve rollout across all IT projects.',
    },
  ],
};

const ES_DIAGRAM_COPY: SlideDiagramCopy = {
  cover: {
    localFirstBadge: 'Local-First · Sin Base en la Nube',
    defensiveBadge: 'Uso 100% Defensivo',
    stats: [
      { value: '8', label: 'Ecosistemas SCA' },
      { value: '19', label: 'Safe Probes' },
      { value: '4', label: 'Marcos GRC' },
      { value: '$0', label: 'Coste de BD' },
    ],
  },
  problem: [
    {
      stat: '+80%',
      title: 'Código de Terceros',
      desc: 'Las apps modernas dependen de decenas o cientos de librerías externas invisibles sin inventario.',
    },
    {
      stat: 'Alto Coste',
      title: 'Licencias y Exposición',
      desc: 'Las herramientas SaaS cobran por usuario y almacenan las vulnerabilidades fuera de la empresa.',
    },
    {
      stat: 'Ruido',
      title: 'Brecha TI ↔ Dirección',
      desc: 'Listas técnicas extensas sin prioridad de negocio dificultan aprobar cambios y auditorías.',
    },
  ],
  chainmail: [
    { ring: 'Anillo 01', title: 'Piezas y CVEs', subtitle: 'SCA / SBOM + 5 Bases' },
    { ring: 'Anillo 02', title: 'Código y Nube', subtitle: 'Secretos, IaC y SAST' },
    { ring: 'Anillo 03', title: 'Sitio en Vivo', subtitle: '19 Safe Probes GET/HEAD' },
    { ring: 'Anillo 04', title: 'Decisión y GRC', subtitle: 'PDF, IA BYOK y LGPD' },
  ],
  localFirst: {
    browserTitle: '1. Tu Navegador',
    browserDesc:
      'Guarda localmente el historial, SBOMs, autorizaciones y evaluaciones GRC — aislados por tu cuenta GitHub.',
    serverTitle: '2. Motor Stateless (Vercel)',
    serverDesc:
      'Procesa el análisis bajo demanda en memoria, devuelve el resultado y descarta todo al instante.',
    cloudTitle: '3. Base en la Nube',
    cloudHighlight: 'NO EXISTE (Cero almacenamiento externo)',
    cloudDesc:
      'Sin coste de base de datos, sin retención de tokens y sin riesgo de fuga centralizada.',
  },
  journeyMap: {
    stepPrefix: 'ETAPA',
    steps: [
      'Acceso GitHub',
      'Autorizar Dominio',
      'Configurar Scan',
      '4 Capas',
      'Informes',
      'Gobernanza GRC',
      'Diff y Auditoría',
    ],
  },
  stageAuth: [
    {
      title: '1. Entrar con GitHub',
      desc: 'Usa la cuenta existente del colaborador — respetando repos privados y Organizaciones.',
      badge: 'Sin clave extra',
    },
    {
      title: '2. Sesión Cifrada',
      desc: 'Token temporal sellado en la sesión del navegador. Al salir o cerrar, el acceso termina.',
      badge: 'Efímera',
    },
    {
      title: '3. Espacio Aislado',
      desc: 'Cada cuenta ve únicamente su historial y autorizaciones, incluso en equipos compartidos.',
      badge: 'Multiusuario',
    },
  ],
  stageAuthz: [
    { step: 'Paso 1', title: 'Indicar URL', desc: 'Ej.: staging.empresa.com' },
    {
      step: 'Paso 2',
      title: 'Publicar Prueba',
      desc: 'security.txt (RFC 9116) o DNS TXT _brynja',
    },
    {
      step: 'Paso 3',
      title: 'Validar Propiedad',
      desc: 'Brynja verifica el código único en el servidor',
    },
    {
      step: 'Paso 4',
      title: 'Certificado 7 Días',
      desc: 'Se renueva en vivo o bloquea si se retira la prueba',
    },
  ],
  stageNewScan: {
    crossStackPrefix: '+ Capas válidas para cualquier stack:',
    crossStackSummary:
      'Docker · Terraform · Kubernetes · GitHub Actions · Secretos · 19 Safe Probes · Importación SARIF/Trivy/Semgrep/Prowler',
  },
  layerSca: [
    'Detecta fallos por versión exacta e indica la versión corregida',
    'Puntuación oficial de gravedad (CVSS) y categoría de debilidad',
    'Probabilidad estadística real de ataque en los próximos 30 días',
    'Alerta roja: ya está siendo explotada activamente por atacantes hoy',
    'Licencia legal (SPDX) y nota de salud OpenSSF Scorecard',
  ],
  layerStatic: [
    {
      title: 'Secretos Filtrados',
      items: 'Claves AWS, GitHub, Stripe, contraseñas de BD y .env',
      note: 'Siempre enmascarado',
    },
    {
      title: 'Infra y CI/CD (IaC)',
      items: 'Dockerfile, Compose, Terraform, K8s y GitHub Actions',
      note: 'CIS Benchmark',
    },
    {
      title: 'SAST Ligero',
      items: 'SQL concatenado, shell interpolado, eval, TLS desactivado',
      note: 'JS/TS y Python',
    },
    {
      title: 'Postura del Repo',
      items: 'SECURITY.md, Dependabot/Renovate, CODEOWNERS y rama',
      note: 'Higiene continua',
    },
  ],
  layerProbes: [
    {
      count: '5 Sondas',
      title: 'Cabeceras, TLS y DNS',
      examples:
        'Security Headers · HSTS · CSP y Permissions · COOP/CORP/COEP · SPF/DMARC/CAA',
    },
    {
      count: '4 Sondas',
      title: 'Cookies, CORS y Caché',
      examples:
        'HttpOnly/Secure/SameSite · Política CORS · Caché de Sesión · Open Redirect',
    },
    {
      count: '5 Sondas',
      title: 'Exposición Indebida',
      examples:
        '.git / .env · Backups / phpinfo · Swagger y Métricas · Robots/Sitemap · OAuth/GraphQL',
    },
    {
      count: '5 Sondas',
      title: 'Runtime e Integridad',
      examples:
        'Fingerprint ↔ SBOM · Source Maps · Stack Traces/Debug · SRI en CDNs · security.txt',
    },
  ],
  guardrails: [
    {
      title: 'Propiedad Obligatoria',
      value: '100% Verificado',
      desc: 'Ninguna sonda se ejecuta sin certificado criptográfico válido del dueño.',
    },
    {
      title: 'Cero Escritura / Ataque',
      value: 'Solo GET y HEAD',
      desc: 'Sin POST/DELETE, sin fuerza bruta y sin payloads destructivos.',
    },
    {
      title: 'Escudo Anti-SSRF',
      value: 'Red Bloqueada',
      desc: 'DNS previo impide acceder a IPs internas o metadatos de nube.',
    },
    {
      title: 'Freno y Disyuntor',
      value: '2 req/s · Máx 80',
      desc: 'Aborta automáticamente al detectar 429 o errores 5xx en el servidor.',
    },
  ],
  layerAi: [
    {
      title: 'Clave de la Empresa (BYOK)',
      desc: 'OpenAI, Google Gemini o endpoint interno compatible. La clave queda solo en el navegador — con descubrimiento de modelos.',
    },
    {
      title: 'Filtro de Privacidad',
      desc: 'Envía únicamente metadatos sanitizados e indicios de uso real (reachability). Jamás salen secretos ni código completo.',
    },
    {
      title: 'Salida Accionable',
      desc: 'Resumen ejecutivo listo para Dirección + pasos numerados de corrección para TI, incluidos en el PDF Ejecutivo.',
    },
  ],
  stageReports: [
    {
      audience: 'Dirección y Gerencia',
      format: 'PDF Ejecutivo',
      bullets: [
        'Dictamen Ejecutivo con SLA (P0 a P3)',
        'Impacto de negocio en lenguaje claro',
        'Matriz de Cumplimiento + Diagnóstico IA',
      ],
    },
    {
      audience: 'Equipo de TI y Devs',
      format: 'JSON para IA + Pestañas',
      bullets: [
        'Comandos exactos de actualización por paquete',
        'JSON limpio listo para pegar en el copiloto',
        'Sello "Escudo Íntegro" cuando está 100% limpio',
      ],
    },
    {
      audience: 'Clientes y Auditoría',
      format: 'SBOM y Estándares',
      bullets: [
        'SBOM CycloneDX 1.5 y SPDX 2.3',
        'SARIF 2.1.0 para pipelines/GitHub',
        'Markdown y JSON técnico completo',
      ],
    },
  ],
  stageGovernance: {
    frameworks: [
      'Grupos IG1 (esencial), IG2 e IG3',
      'Govern, Identify, Protect, Detect, Respond',
      'Controles prácticos de seguridad web',
      'Arts. 46, 48, 50 y controles Anexo A',
    ],
    excelBanner:
      'Exportación nativa en Excel (.xlsx) con 5 hojas listas para auditoría',
    excelSubtext: '+ JSON de Brechas para IA + Guía educativa integrada',
  },
  stageHistoryAudit: [
    {
      title: 'Comparador (Scan Diff)',
      desc: 'Muestra lado a lado qué se resolvió, qué es nuevo y cuánto subió la adherencia CIS/NIST entre dos fechas.',
      badge: 'Evolución Probada',
    },
    {
      title: 'Importador Externo',
      desc: 'Centraliza archivos JSON de Trivy, Semgrep, Prowler y SARIF 2.1.0 en el mismo historial + Backup local.',
      badge: 'Hub Único',
    },
    {
      title: 'Auditoría (/audit)',
      desc: 'Registro de cada petición HTTP de las sondas con fecha/hora, ruta, estado y certificado utilizado.',
      badge: '100% Trazable',
    },
  ],
  dailyRoutine: {
    itTitle: 'Cadencia del Equipo de TI',
    itItems: [
      { tag: 'Día 1', text: 'Autorizar staging y generar la línea base del proyecto.' },
      {
        tag: 'Semanal',
        text: 'Ejecutar escaneo pre-release, revisar Scan Diff y corregir P0/P1.',
      },
      {
        tag: 'Mensual',
        text: 'Revisar postura de repositorios y actualizar declaraciones GRC.',
      },
    ],
    boardTitle: 'Cadencia de Dirección y Cumplimiento',
    boardItems: [
      {
        tag: 'Mensual',
        text: 'Leer PDF Ejecutivo (5 min): revisar prioridades P0/P1 y riesgos de negocio.',
      },
      {
        tag: 'Trimestral',
        text: 'Revisar Excel GRC (CIS v8 / LGPD / ISO 27001) y evolución de cumplimiento.',
      },
      {
        tag: 'Bajo Demanda',
        text: 'Entregar SBOM y evidencias de cumplimiento en auditorías o contratos B2B.',
      },
    ],
  },
  pilotRoadmap: [
    {
      week: 'Semana 1',
      title: 'Setup y Piloto',
      desc: 'Despliegue en Vercel, autorización de 2–3 sistemas de staging y 1.er escaneo.',
    },
    {
      week: 'Semana 2',
      title: 'Quick Wins P0/P1',
      desc: 'TI aplica correcciones prioritarias (dependencias, cabeceras, secretos/IaC).',
    },
    {
      week: 'Semana 3',
      title: 'Línea Base GRC',
      desc: 'Primera matriz CIS v8 (IG1) + LGPD/ISO 27001 en Excel para gestión.',
    },
    {
      week: 'Semana 4',
      title: 'Antes × Después',
      desc: 'Revisión ejecutiva con Scan Diff para aprobar la expansión a toda TI.',
    },
  ],
};

export const DIAGRAM_COPY_BY_LOCALE: Record<Locale, SlideDiagramCopy> = {
  'pt-BR': PT_BR_DIAGRAM_COPY,
  en: EN_DIAGRAM_COPY,
  es: ES_DIAGRAM_COPY,
};
