import type {
  PresentationSlide,
  SlideChapterMeta,
} from '../models/presentation.models';

export const PRESENTATION_CHAPTERS: readonly SlideChapterMeta[] = [
  { id: 'vision', label: 'Visão & Valor' },
  { id: 'onboarding', label: 'Acesso & Preparação' },
  { id: 'analysis', label: 'As 4 Camadas de Análise' },
  { id: 'results', label: 'Relatórios, GRC & Auditoria' },
  { id: 'adoption', label: 'Rotina & Piloto 30 Dias' },
];

export const BRYNJA_PRESENTATION_SLIDES: readonly PresentationSlide[] = [
  {
    id: 'cover',
    number: 1,
    chapter: 'vision',
    kicker: 'Apresentação Executiva & Técnica',
    title: 'Brynja — Segurança Proativa de Aplicações',
    subtitle:
      'Da inspeção de código e bibliotecas até conformidade regulatória (LGPD, ISO 27001, CIS v8), sem banco de dados na nuvem e sem risco de derrubar sistemas.',
    analogy:
      'Brynja (pronuncia-se BRIN-ya) significa "cota de malha" em nórdico antigo: centenas de anéis interligados que distribuem o impacto sem engessar quem a veste.',
    visual: 'cover',
    highlights: [
      {
        title: 'Para a Diretoria',
        description:
          'Visibilidade clara de risco de negócio, aderência a normas (LGPD/ISO/CIS) e custo de infraestrutura próximo de zero.',
      },
      {
        title: 'Para a Equipe de TI',
        description:
          'Diagnóstico completo em minutos com correções exatas, testes não destrutivos e fluxo integrado ao GitHub.',
      },
      {
        title: 'Para Privacidade & Compliance',
        description:
          'Arquitetura Local-First: histórico e relatórios ficam no navegador do responsável, jamais armazenados em nuvem externa.',
      },
    ],
    itDetails: {
      summary:
        'Next.js 15 App Router (arquitetura SOLID) · 100% Vercel Serverless + IndexedDB · 8 ecossistemas SCA · Análise Estática · 19 Safe Probes · Motor GRC + BYOK IA.',
      tags: [
        '100% Serverless',
        'Local-First',
        '8 Ecossistemas',
        '19 Safe Probes',
        'GRC Automático',
        'Open-Source MIT',
      ],
    },
    presenterNotes:
      'Boas-vindas! Explique que esta apresentação foi pensada para os dois públicos na sala: vamos mostrar o valor de negócio, privacidade e governança para a Diretoria, e o passo a passo operacional de todas as etapas para a equipe de TI. Dica: você pode usar o botão "Só Executivo" no topo caso queira ocultar os detalhes técnicos em algum momento.',
    estimatedTime: '1 min',
  },
  {
    id: 'problem',
    number: 2,
    chapter: 'vision',
    kicker: 'Por que precisamos agir agora?',
    title: 'O Desafio Atual da Segurança em Aplicações',
    subtitle:
      'Empresas enfrentam hoje um dilema: ficar expostas a falhas conhecidas ou pagar caro por ferramentas complexas que a equipe não consegue operar.',
    visual: 'problem',
    highlights: [
      {
        title: 'Software moderno é feito de peças de terceiros',
        description:
          'Mais de 80% de uma aplicação web vem de bibliotecas externas. Uma falha em uma peça esquecida pode expor toda a empresa.',
      },
      {
        title: 'Custo alto e risco de privacidade na nuvem',
        description:
          'Plataformas corporativas tradicionais cobram por desenvolvedor e exigem enviar código, credenciais e relatórios para servidores externos.',
      },
      {
        title: 'Ruído técnico sem visão executiva',
        description:
          'A TI recebe centenas de alertas técnicos soltos, enquanto a Diretoria precisa saber: "o que é urgente, qual o impacto e estamos aderentes à LGPD?"',
      },
    ],
    itDetails: {
      summary:
        'Unifica o que normalmente exigiria 4–5 ferramentas separadas (SCA/SBOM, Secret Scanner, IaC/SAST, DAST passivo e GRC) sem vendor lock-in e sem custo de banco gerenciado.',
      tags: ['Supply Chain', 'Shadow Secrets', 'Fadiga de Alertas', 'Gap TI ↔ Diretoria'],
    },
    presenterNotes:
      'Contextualize a dor antes de apresentar a ferramenta. Destaque que ataques reais raramente vêm de "hackers de filme": vêm de uma biblioteca desatualizada, um arquivo .env esquecido no servidor ou uma chave vazada no repositório. O Brynja nasce justamente para fechar essas portas antes que virem incidente.',
    estimatedTime: '1,5 min',
  },
  {
    id: 'chainmail',
    number: 3,
    chapter: 'vision',
    kicker: 'Nossa Filosofia',
    title: 'Defesa em Profundidade: Como a Cota de Malha Protege',
    subtitle:
      'Em vez de confiar em uma única verificação isolada, o Brynja cruza quatro camadas complementares em uma única plataforma simples.',
    analogy:
      'Se um exame olha apenas o código e outro olha apenas o site no ar, brechas passam no meio. O Brynja conecta os dois mundos e traduz o resultado em plano de ação.',
    visual: 'chainmail',
    highlights: [
      {
        title: 'Anel 1 — O que o sistema usa (SCA / SBOM)',
        description:
          'Mapeia cada biblioteca instalada e verifica em bases globais se há vulnerabilidades já exploradas por atacantes.',
      },
      {
        title: 'Anel 2 — O que está escrito no repositório',
        description:
          'Procura senhas vazadas, configurações inseguras de servidor/nuvem (Docker, Terraform, CI/CD) e padrões perigosos no código.',
      },
      {
        title: 'Anel 3 — Como o site responde no ar (19 Safe Probes)',
        description:
          'Faz um check-up 100% seguro e somente leitura no endereço publicado (cabeçalhos, cookies, arquivos expostos, DNS).',
      },
      {
        title: 'Anel 4 — Decisão, IA Opcional & Governança',
        description:
          'Converte tudo em prioridade de negócio (P0 a P3), PDF executivo para a Diretoria e matrizes CIS, NIST, OWASP e LGPD.',
      },
    ],
    itDetails: {
      summary:
        'Correlação real entre SBOM e runtime (RuntimeFingerprintProbe eleva CVEs para CONFIRMED_ACTIVE quando a biblioteca vulnerável é detectada no site publicado).',
      tags: ['SCA + SBOM', 'SAST/Secrets/IaC', '19 Safe Probes', 'GRC & BYOK IA'],
    },
    presenterNotes:
      'Use o diagrama dos 4 anéis para mostrar por que o Brynja é diferente de um scanner comum. Ele não entrega apenas uma lista técnica: ele olha o código, olha o site publicado e transforma tudo em decisão gerencial e evidência de conformidade.',
    estimatedTime: '1,5 min',
  },
  {
    id: 'local-first',
    number: 4,
    chapter: 'vision',
    kicker: 'Arquitetura & Privacidade',
    title: 'Zero Banco na Nuvem: Privacidade Local-First & Custo Zero',
    subtitle:
      'Uma das maiores vantagens para a Diretoria e o Jurídico: o Brynja não armazena código, senhas nem relatórios da empresa em nenhum servidor externo.',
    analogy:
      'O servidor do Brynja funciona como um "aparelho de raio-X": processa o exame na hora e devolve o laudo diretamente para o computador do usuário, sem guardar cópia.',
    visual: 'local-first',
    highlights: [
      {
        title: 'Dados ficam no navegador do responsável',
        description:
          'Histórico de varreduras, inventários SBOM, autorizações e avaliações de governança ficam salvos localmente (IndexedDB), isolados por conta GitHub.',
      },
      {
        title: 'Sessão temporária que se apaga sozinha',
        description:
          'O acesso ao GitHub fica criptografado apenas na sessão atual do navegador e é descartado ao clicar em Sair ou fechar o navegador.',
      },
      {
        title: 'Custo de infraestrutura próximo de zero',
        description:
          'Roda 100% serverless (deploy 1-clique na Vercel em plano gratuito), sem servidor dedicado, sem manutenção de banco de dados e sem licenças por usuário.',
      },
    ],
    itDetails: {
      summary:
        'Sessão OAuth selada em cookie HttpOnly AES-256-GCM sem Max-Age/Expires; IndexedDB particionado por ownerGithubUserId com backup/restauração JSON v2 local; Next.js Route Handlers stateless (maxDuration=60).',
      tags: [
        'AES-256-GCM',
        'Cookie HttpOnly Efêmero',
        'IndexedDB Isolado',
        'Vercel Free Tier',
      ],
    },
    presenterNotes:
      'Este slide costuma ganhar imediatamente o apoio da Diretoria, Jurídico e DPO. Reforce: não existe um banco de dados na nuvem acumulando vulnerabilidades dos sistemas da empresa. O risco de vazamento centralizado é eliminado por desenho arquitetural — e o custo de hospedagem é praticamente zero.',
    estimatedTime: '2 min',
  },
  {
    id: 'journey-map',
    number: 5,
    chapter: 'onboarding',
    kicker: 'Visão Panorâmica',
    title: 'Mapa Completo da Plataforma: As 7 Etapas na Prática',
    subtitle:
      'Todo o ciclo — do primeiro login até a entrega do relatório para a Diretoria — segue um fluxo guiado, auditável e fácil de repetir.',
    visual: 'journey-map',
    highlights: [
      {
        title: 'Preparação segura (Etapas 1 a 3)',
        description:
          'Login no GitHub, prova criptográfica de posse do domínio e seleção do projeto/ecossistema em menos de 2 minutos.',
      },
      {
        title: 'Inspeção automática em camadas (Etapa 4)',
        description:
          'Pipeline executa SCA/CVEs, Análise Estática, 19 Safe Probes e (se desejado) Consultor por IA com progresso ao vivo.',
      },
      {
        title: 'Ação, Governança e Melhoria Contínua (Etapas 5 a 7)',
        description:
          'Relatórios por público (PDF, Excel, JSON para IA, SBOM), scorecard GRC, comparação de evolução e trilha de auditoria.',
      },
    ],
    itDetails: {
      summary:
        'Rotas dedicadas: / (Painel), /authorizations, /scans/new, /scans/[id], /governance, /history e /audit — com suporte a 3 idiomas (PT-BR, EN, ES) e temas Claro/Escuro.',
      tags: ['7 Etapas Guiadas', 'Pipeline em Tempo Real', 'PT-BR / EN / ES', 'Dark & Light'],
    },
    presenterNotes:
      'Apresente este slide como o "mapa da viagem". A partir do próximo slide, vamos percorrer cada uma das 7 etapas em detalhe, mostrando exatamente o que a TI faz e o que a Diretoria enxerga ao final.',
    estimatedTime: '1 min',
    demoLink: { label: 'Abrir Painel Inicial (/)', href: '/' },
  },
  {
    id: 'stage-auth',
    number: 6,
    chapter: 'onboarding',
    kicker: 'Etapa 1 de 7',
    title: 'Acesso Seguro com GitHub & Isolamento Multi-Usuário',
    subtitle:
      'A equipe entra com a própria conta GitHub corporativa — sem criar novas senhas — e acessa repositórios pessoais, privados e de Organizações.',
    visual: 'stage-auth',
    highlights: [
      {
        title: 'Zero cadastro de senhas novas',
        description:
          'Usa autenticação oficial do GitHub (OAuth), respeitando exatamente as permissões que o colaborador já possui nos repositórios da empresa.',
      },
      {
        title: 'Suporte completo a Organizações e repos privados',
        description:
          'Lista repositórios da organização e permite escolher qualquer branch (main, homologação, feature) para auditar antes mesmo de publicar.',
      },
      {
        title: 'Também funciona sem conectar repositório',
        description:
          'É possível colar manifestos manualmente (ex.: package.json) ou importar relatórios de ferramentas externas sem expor o código-fonte.',
      },
    ],
    itDetails: {
      summary:
        'GitHub OAuth (escopos repo, read:user, user:email, read:org) com paginação em /user/repos e /orgs/{org}/repos, proteção CSRF via cookie de estado e sessão selada por AES-256-GCM.',
      tags: ['GitHub OAuth', 'Repos Privados & Orgs', 'Modo Manual', 'CSRF Protection'],
    },
    presenterNotes:
      'Explique de forma simples: o Brynja não cria um usuário paralelo nem pede que a TI compartilhe senhas de serviço. Cada analista entra com seu próprio GitHub, vê apenas o que já tem permissão para ver e, ao encerrar o navegador, o token desaparece automaticamente.',
    estimatedTime: '1,5 min',
    demoLink: { label: 'Abrir Painel / Login', href: '/' },
  },
  {
    id: 'stage-authz',
    number: 7,
    chapter: 'onboarding',
    kicker: 'Etapa 2 de 7',
    title: 'Autorização Criptográfica de Domínio (Uso 100% Ético)',
    subtitle:
      'O Brynja NUNCA executa testes ativos em nenhum site sem antes comprovar matematicamente que a empresa é dona daquele endereço.',
    analogy:
      'É como um chaveiro profissional que só abre uma fechadura depois de conferir o documento do proprietário — impedindo uso acidental ou indevido contra terceiros.',
    visual: 'stage-authz',
    highlights: [
      {
        title: 'Dois métodos oficiais de comprovação',
        description:
          'Publicar um código único no arquivo padrão /.well-known/security.txt (RFC 9116) ou adicionar um registro DNS TXT (_brynja) no domínio.',
      },
      {
        title: 'Guia pronto para a equipe de Infra/TI',
        description:
          'A tela gera automaticamente comandos copiáveis (SSH, Nginx, Apache, Docker) e até o passo de limpeza opcional caso queiram remover depois.',
      },
      {
        title: 'Certificado renovável com revogação imediata',
        description:
          'Após validar, gera um certificado criptográfico de 7 dias que se renova automaticamente enquanto a prova estiver no ar — e bloqueia na hora se for removida.',
      },
    ],
    itDetails: {
      summary:
        'Desafio determinístico HMAC-SHA256 por usuário + origem; certificado stateless AES-256-GCM (AUTHORIZATION_TTL_DAYS=7) verificado em tempo real antes de cada execução de Safe Probes + fallback legado /.well-known/brynja-verify.txt.',
      tags: ['HMAC-SHA256', 'RFC 9116 security.txt', 'DNS TXT _brynja', 'Certificado AES-256-GCM'],
    },
    presenterNotes:
      'Este ponto tranquiliza muito a Diretoria e o Jurídico: o Brynja tem trava técnica obrigatória contra uso não autorizado. E para a TI, mostre como o guia em /authorizations já entrega os blocos prontos de Nginx, Apache e Docker — reduzindo a configuração a menos de 3 minutos.',
    estimatedTime: '2 min',
    demoLink: { label: 'Abrir Alvos & Autorizações', href: '/authorizations' },
  },
  {
    id: 'stage-new-scan',
    number: 8,
    chapter: 'onboarding',
    kicker: 'Etapa 3 de 7',
    title: 'Iniciando uma Varredura & 8 Ecossistemas Suportados',
    subtitle:
      'Em uma única tela, o analista seleciona o projeto, marca as camadas desejadas e acompanha tudo de forma transparente — cobrindo as principais linguagens do mercado.',
    visual: 'stage-new-scan',
    highlights: [
      {
        title: 'Configuração modular em 3 cliques',
        description:
          '1) Escolha o repositório e branch (ou cole o manifesto) · 2) Ative análise estática de código/segredos/IaC · 3) Vincule (opcional) uma URL já autorizada.',
      },
      {
        title: '8 ecossistemas de software suportados nativamente',
        description:
          'Node.js/JS/TS, Python, Go, Rust, Java/Kotlin (Maven/Gradle), .NET (C#), PHP e Ruby — além de camadas agnósticas de nuvem, containers e web.',
      },
      {
        title: 'Transparência total antes de rodar',
        description:
          'A própria tela exibe a matriz de linguagens suportadas e o catálogo completo das 19 verificações ativas que serão feitas no alvo.',
      },
    ],
    itDetails: {
      summary:
        'Catálogos canônicos com testes automatizados de paridade 1-para-1 entre backend e UI: npm/pnpm/yarn, PyPI, Go, crates.io, Maven/Gradle, NuGet (*.csproj/packages.lock.json), Packagist e RubyGems.',
      tags: ['8 Ecossistemas SCA', 'SAST Nativo JS/TS & Python', 'Catálogo Transparente', 'Pipeline Ao Vivo'],
    },
    presenterNotes:
      'Destaque para a TI que o Brynja não fica preso a uma única linguagem: mesmo empresas com sistemas legados em .NET, Java ou PHP junto de projetos modernos em Node.js, Python ou Go conseguem centralizar a análise na mesma ferramenta.',
    estimatedTime: '1,5 min',
    demoLink: { label: 'Abrir Nova Varredura', href: '/scans/new' },
  },
  {
    id: 'layer-sca',
    number: 9,
    chapter: 'analysis',
    kicker: 'Etapa 4 · Camada 1 de 4',
    title: 'Inventário de Dependências (SCA/SBOM) & Inteligência Real',
    subtitle:
      'O Brynja monta o "rótulo de ingredientes" exato da aplicação e cruza cada biblioteca em paralelo com 5 bases mundiais de segurança — priorizando o que realmente importa.',
    analogy:
      'Em vez de assustar a equipe com qualquer alerta teórico, mostramos quais peças têm falha crítica, qual a chance real de ataque e se hackers já estão explorando hoje.',
    visual: 'layer-sca',
    highlights: [
      {
        title: 'Leitura precisa de versões travadas (zero falso positivo)',
        description:
          'Prioriza arquivos de trava (lockfiles) para conferir a versão exata em uso e já indica a versão corrigida exata para atualização.',
      },
      {
        title: 'Cruzamento simultâneo com 5 bases globais públicas',
        description:
          'OSV.dev (Google), NVD 2.0 (governo dos EUA/NIST), FIRST EPSS (probabilidade de ataque), CISA KEV (exploração ativa real) e deps.dev (licenças e saúde do pacote).',
      },
      {
        title: 'Alerta jurídico de licenças e saúde de cadeia de suprimentos',
        description:
          'Exibe licenças SPDX (alertando licenças restritivas como GPL/AGPL) e a nota OpenSSF Scorecard de cada biblioteca.',
      },
    ],
    itDetails: {
      summary:
        'AnalyzeScaUseCase com resolução SemVer via OSV.dev querybatch + enriquecimento paralelo (Promise.all) em NVD API 2.0 (CVSS v3/v4 + CWE), FIRST EPSS, CISA KEV e api.deps.dev/v3 com cache em memória.',
      tags: ['OSV.dev', 'NVD NIST 2.0', 'FIRST EPSS', 'CISA KEV', 'deps.dev / OpenSSF'],
    },
    presenterNotes:
      'Explique o valor do CISA KEV e do EPSS para a Diretoria: quando uma vulnerabilidade aparece no catálogo CISA KEV, significa que criminosos já estão explorando aquela brecha ativamente na internet — isso define prioridade máxima (P0) sem achismo.',
    estimatedTime: '2 min',
  },
  {
    id: 'layer-static',
    number: 10,
    chapter: 'analysis',
    kicker: 'Etapa 4 · Camada 2 de 4',
    title: 'Análise Estática: Código, Segredos, Infraestrutura & Postura',
    subtitle:
      'Antes mesmo de o código ir para produção, o Brynja inspeciona o repositório em busca de senhas esquecidas, brechas de nuvem e más práticas de código.',
    visual: 'layer-static',
    highlights: [
      {
        title: 'Caça-Segredos com mascaramento obrigatório',
        description:
          'Identifica chaves AWS, GitHub, Stripe, Google, Slack, senhas de banco e arquivos .env versionados — mascarando o valor para nunca gravar segredos reais.',
      },
      {
        title: 'Auditoria de Infraestrutura (IaC) & Esteira CI/CD',
        description:
          'Verifica Dockerfile (rodando como root, :latest), docker-compose, Terraform (portas abertas 0.0.0.0/0, buckets públicos), Kubernetes e GitHub Actions.',
      },
      {
        title: 'SAST Leve & Higiene do Repositório',
        description:
          'Detecta padrões inseguros em JS/TS e Python (SQL por concatenação, comandos shell, eval) e confere se o repo tem SECURITY.md, Dependabot, CODEOWNERS e branch protegida.',
      },
    ],
    itDetails: {
      summary:
        'POST /api/analyze/static executa SecretScannerAnalyzer (com maskSecretMatch), IacCicdAnalyzer, LightweightSastAnalyzer (JS/TS/Python) e GitHubPostureAnalyzer, mapeando achados diretamente para CIS v8 / OWASP / LGPD.',
      tags: ['Secret Scanner Mascarado', 'Dockerfile / Terraform / K8s', 'GitHub Actions', 'SAST JS/TS & Python'],
    },
    presenterNotes:
      'Reforce um detalhe de segurança importante: quando o Caça-Segredos encontra uma chave vazada, ele mostra apenas o arquivo, a linha e um trecho mascarado — o segredo real nunca é salvo no relatório nem no navegador. Assim a TI sabe exatamente onde revogar a chave sem multiplicar o vazamento.',
    estimatedTime: '2 min',
  },
  {
    id: 'layer-probes',
    number: 11,
    chapter: 'analysis',
    kicker: 'Etapa 4 · Camada 3 de 4',
    title: '19 Safe Probes: Check-up Seguro da Aplicação no Ar',
    subtitle:
      'Para domínios autorizados, o Brynja executa 19 verificações somente leitura que simulam o olhar de um especialista defensivo — sem alterar um único dado do sistema.',
    analogy:
      'É como um check-up médico com estetoscópio e exame de imagem: identifica riscos reais rapidamente, sem nenhuma cirurgia invasiva.',
    visual: 'layer-probes',
    highlights: [
      {
        title: 'Cabeçalhos, Criptografia TLS & DNS de E-mail (5 sondas)',
        description:
          'Verifica HTTPS forçado (HSTS), CSP, Permissions-Policy, isolamento Cross-Origin (COOP/CORP/COEP) e proteção contra e-mails falsos (SPF, DMARC, CAA, MTA-STS).',
      },
      {
        title: 'Cookies, Sessão, CORS & Redirecionamentos (4 sondas)',
        description:
          'Valida proteção contra roubo de sessão (HttpOnly/Secure/SameSite), políticas CORS abertas, vazamento de cache e redirecionamento aberto (Open Redirect).',
      },
      {
        title: 'Exposição de Arquivos, Backups, APIs & Runtime (10 sondas)',
        description:
          'Checa se há .git, .env, backups SQL, phpinfo, Swagger/métricas abertas, GraphQL/OAuth expostos, stack traces, Source Maps, integridade SRI de CDNs e security.txt.',
      },
    ],
    itDetails: {
      summary:
        '19 IControlledProbe registradas no container OCP com memoização de GET / por varredura; RuntimeFingerprintProbe cruza bibliotecas expostas no front-end com o SBOM para confirmar exposição ativa.',
      tags: ['19 Sondas Ativas', '4 Categorias', 'DNS Passivo SPF/DMARC', 'Correlação Runtime ↔ SBOM'],
    },
    presenterNotes:
      'Mostre como os 19 Safe Probes cobrem falhas reais que derrubam empresas todos os dias — como um arquivo .env ou backup.sql acessível pela internet, e-mails corporativos sem DMARC/SPF ou páginas de erro exibindo código interno. E tudo isso sem tocar no banco de dados do sistema.',
    estimatedTime: '2 min',
    demoLink: { label: 'Ver Catálogo dos 19 Safe Probes', href: '/scans/new' },
  },
  {
    id: 'guardrails',
    number: 12,
    chapter: 'analysis',
    kicker: 'Cláusula Pétrea de Segurança',
    title: 'Guardrails Invioláveis: Por que o Brynja Não Derruba Sistemas',
    subtitle:
      'A pergunta número 1 de qualquer equipe de Infraestrutura e Diretoria: "Essa ferramenta pode tirar nosso site do ar ou atacar nossa rede interna?" A resposta técnica é NÃO.',
    visual: 'guardrails',
    highlights: [
      {
        title: 'Somente Leitura Estrita (GET e HEAD)',
        description:
          'O código bloqueia fisicamente qualquer requisição de escrita, alteração, login por força bruta ou envio de formulários.',
      },
      {
        title: 'Escudo Anti-SSRF (Rede Interna Intocável)',
        description:
          'Antes de cada chamada, resolve o DNS e bloqueia automaticamente IPs privados, rede interna corporativa e metadados de nuvem (AWS/GCP/Azure).',
      },
      {
        title: 'Freio de Velocidade & Disjuntor Automático',
        description:
          'Respeita limite suave (máx. 2 req/s e teto de 80 req/varredura). Se o site responder lentidão ou erro (429/5xx), o disjuntor aborta imediatamente.',
      },
    ],
    itDetails: {
      summary:
        'SafeProbePolicy + SsrfDnsGuardService (bloqueia RFC1918, CGNAT, link-local 169.254.169.254 e loopback em produção) + RateLimitedSafeHttpClient (allowlist apenas Origin/Accept, timeout 5s, circuit breaker) + OwnershipCertificateService.',
      tags: ['Apenas GET / HEAD', 'Anti-SSRF DNS Guard', '2 req/s · Máx. 80', 'Circuit Breaker 429/5xx'],
    },
    presenterNotes:
      'Reserve um momento de calma neste slide — ele remove qualquer receio da equipe de Infra/DevOps. Enfatize que essas travas não são "boas práticas opcionais": são políticas invioláveis validadas por testes automatizados a cada versão do Brynja.',
    estimatedTime: '1,5 min',
  },
  {
    id: 'layer-ai',
    number: 13,
    chapter: 'analysis',
    kicker: 'Etapa 4 · Camada 4 de 4 (Opcional)',
    title: 'Consultor AppSec por IA (Modelo BYOK Sob Controle Total)',
    subtitle:
      'Quando a equipe quiser acelerar a triagem, pode conectar sua própria chave de IA (OpenAI, Google Gemini ou servidor interno) para receber um plano de ação inteligente.',
    visual: 'layer-ai',
    highlights: [
      {
        title: '100% Opcional e "Traga Sua Própria Chave" (BYOK)',
        description:
          'A empresa decide se usa ou não, escolhe o provedor (OpenAI, Gemini ou endpoint corporativo) e mantém a chave apenas no navegador do usuário.',
      },
      {
        title: 'Privacidade Preservada: Zero Código Cru ou Segredos',
        description:
          'Envia apenas metadados sanitizados das vulnerabilidades e indícios de alcançabilidade (se o pacote é realmente importado no código) — jamais senhas ou segredos.',
      },
      {
        title: 'Valor Imediato para Diretoria e TI',
        description:
          'Gera um Diagnóstico Executivo em linguagem clara + lista ordenada de passos de correção, já incorporado automaticamente ao PDF Executivo.',
      },
    ],
    itDetails: {
      summary:
        'ByokAgentAdvisorAdapter + POST /api/analyze/advise e /api/analyze/advise/models (descoberta automática de modelos de texto, filtrando imagem/áudio/vídeo, com SsrfDnsGuardService em endpoints customizados) + computeReachabilityHints.',
      tags: ['BYOK OpenAI / Gemini / Custom', 'Reachability Hints', 'Metadados Sanitizados', 'Integrado ao PDF'],
    },
    presenterNotes:
      'Esclareça para a Diretoria que o Brynja funciona 100% sem IA — mas quando a empresa já possui conta corporativa de OpenAI ou Gemini, o modo BYOK transforma achados técnicos em um parecer executivo e priorização cirúrgica em segundos, sem passar por terceiros intermediários.',
    estimatedTime: '1,5 min',
  },
  {
    id: 'stage-reports',
    number: 14,
    chapter: 'results',
    kicker: 'Etapa 5 de 7',
    title: 'Relatórios Inteligentes: Da Diretoria ao Código',
    subtitle:
      'Uma única varredura gera visões e arquivos sob medida para cada pessoa envolvida — sem precisar montar apresentações ou planilhas manuais.',
    visual: 'stage-reports',
    highlights: [
      {
        title: 'Para a Diretoria & Gerência (PDF Executivo)',
        description:
          'Parecer gerencial com classificação P0–P3 e prazos recomendados (SLA), impacto no negócio, plano de soluções, Matriz de Conformidade e Diagnóstico por IA.',
      },
      {
        title: 'Para a Equipe de TI & Agentes de Código',
        description:
          'Abas separadas (CVEs, Código/IaC, Safe Probes), selo "Escudo Íntegro (100% Aprovado)" quando tudo passa, e "JSON para IA" enxuto pronto para colar no copiloto e corrigir.',
      },
      {
        title: 'Para Clientes, Auditores & Supply Chain',
        description:
          'Exportação em 1 clique para padrões internacionais: SBOM CycloneDX 1.5, SPDX 2.3, SARIF 2.1.0, Markdown e JSON completo.',
      },
    ],
    itDetails: {
      summary:
        'RemediationPlanPresenter (P0–P3), ScanPdfExporter (jsPDF), AiRemediationJsonExporter (schema brynja.ai-remediation.v1 com deduplicação SemVer), CycloneDX 1.5, SPDX 2.3 e SARIF 2.1.0.',
      tags: ['PDF Executivo P0–P3', 'JSON para IA (1 clique)', 'CycloneDX & SPDX', 'SARIF 2.1.0'],
    },
    presenterNotes:
      'Este é o slide que conecta os dois mundos da reunião. Para a Diretoria: o PDF Executivo já sai pronto para reunião gerencial, dizendo o que é P0 (imediato) e qual o impacto no negócio. Para a TI: o botão "Copiar JSON para IA" entrega exatamente os comandos e versões para corrigir em minutos.',
    estimatedTime: '2 min',
    demoLink: { label: 'Abrir Histórico de Relatórios', href: '/history' },
  },
  {
    id: 'stage-governance',
    number: 15,
    chapter: 'results',
    kicker: 'Etapa 6 de 7',
    title: 'Governança, Risco & Conformidade (GRC Automático)',
    subtitle:
      'O Brynja traduz automaticamente os resultados técnicos das varreduras para os 4 principais frameworks de segurança e privacidade exigidos pelo mercado.',
    visual: 'stage-governance',
    highlights: [
      {
        title: '4 Frameworks Corporativos Integrados',
        description:
          'CIS Controls v8 (grupos IG1, IG2 e IG3), NIST CSF 2.0, OWASP ASVS / Top 10 e LGPD (Arts. 46, 48 e 50) & ISO/IEC 27001:2022.',
      },
      {
        title: 'Aderência Técnica + Atestados da Empresa',
        description:
          'Combina evidências automáticas das varreduras com controles organizacionais preenchidos pela equipe (políticas, treinamentos, backups), separando nota técnica e global.',
      },
      {
        title: 'Entrega Pronta para Auditoria e Diretoria',
        description:
          'Exporta Planilha Excel (.xlsx) multi-abas estilizada para auditores + JSON exclusivo de lacunas para acelerar a correção + Guia educativo integrado ("O que é governança?").',
      },
    ],
    itDetails: {
      summary:
        'CompliancePresenter + módulo /governance persistido no IndexedDB (grcAssessments); gerador OOXML nativo sem dependências externas (xlsx-workbook.builder.ts) protegido contra formula injection + brynja.ai-governance-gaps.v1.',
      tags: ['CIS v8 (IG1–IG3)', 'NIST CSF 2.0', 'OWASP ASVS', 'LGPD & ISO 27001', 'Excel .xlsx Multi-Abas'],
    },
    presenterNotes:
      'Mostre o valor estratégico para a Diretoria: quando um cliente grande, banco ou auditoria pergunta "como vocês garantem conformidade com LGPD, ISO 27001 ou CIS?", a empresa consegue gerar em 1 clique uma planilha Excel completa com evidências técnicas reais vinculadas a cada controle.',
    estimatedTime: '2 min',
    demoLink: { label: 'Abrir Governança & GRC', href: '/governance' },
  },
  {
    id: 'stage-history-audit',
    number: 16,
    chapter: 'results',
    kicker: 'Etapa 7 de 7',
    title: 'Histórico, Evolução (Scan Diff), Importações & Auditoria',
    subtitle:
      'Segurança não é foto única — é filme. O Brynja acompanha a evolução de cada sistema ao longo do tempo e registra cada verificação realizada.',
    visual: 'stage-history-audit',
    highlights: [
      {
        title: 'Comparador entre Varreduras (Scan Diff)',
        description:
          'Compara duas datas do mesmo sistema e mostra claramente: quantas falhas foram corrigidas, se surgiu alguma nova e quanto subiu a aderência CIS/NIST.',
      },
      {
        title: 'Centralizador de Ferramentas Externas',
        description:
          'Importa relatórios de Trivy, Semgrep, Prowler e SARIF 2.1.0 para consolidar tudo no mesmo histórico local, com opção de Backup & Restauração.',
      },
      {
        title: 'Trilha de Auditoria Imutável Local (/audit)',
        description:
          'Registra data/hora, endereço, método HTTP (GET/HEAD), resposta e certificado usado em cada sonda — garantindo rastreabilidade total para a Infra.',
      },
    ],
    itDetails: {
      summary:
        'computeScanDiff em /history, parseExternalSecurityReport (OASIS SARIF 2.1.0, Trivy JSON, Semgrep JSON, Prowler OCSF/JSON), export/import de LocalBackupBundle v2 e trilha completa em /audit.',
      tags: ['Scan Diff', 'Import Trivy/Semgrep/Prowler', 'Trilha /audit', 'Backup Local'],
    },
    presenterNotes:
      'Destaque o Scan Diff para a Diretoria: ele comprova o retorno do trabalho da equipe de TI! Em vez de apenas dizer "melhoramos a segurança", a TI mostra na tela: "resolvemos 14 vulnerabilidades críticas e nossa aderência CIS v8 subiu de 58% para 89% em 3 semanas".',
    estimatedTime: '1,5 min',
    demoLink: { label: 'Abrir Trilha de Auditoria', href: '/audit' },
  },
  {
    id: 'daily-routine',
    number: 17,
    chapter: 'adoption',
    kicker: 'Na Prática do Dia a Dia',
    title: 'Como a TI e a Diretoria Operam o Brynja na Rotina',
    subtitle:
      'Sem burocracia: a ferramenta se encaixa no ritmo natural de entregas da equipe de TI e nas reuniões de acompanhamento da gestão.',
    visual: 'daily-routine',
    highlights: [
      {
        title: 'Rotina da Equipe de TI (15 min por ciclo)',
        description:
          'Antes de releases importantes ou semanalmente: roda a varredura, usa o Scan Diff para evitar regressões e aplica correções P0/P1 com ajuda dos comandos prontos.',
      },
      {
        title: 'Rotina de Infra & Segurança',
        description:
          'Mantém autorizações ativas nos ambientes de homologação/produção, revisa a trilha /audit e consolida achados externos (Trivy/Semgrep/Prowler).',
      },
      {
        title: 'Rotina da Diretoria & Governança (Mensal)',
        description:
          'Recebe o PDF Executivo + Planilha Excel GRC, acompanha a curva de evolução CIS/LGPD e utiliza o SBOM/relatórios como diferencial comercial com clientes.',
      },
    ],
    itDetails: {
      summary:
        'Fluxo leve sem bloquear deploys de emergência: onboarding de um novo sistema leva ~5 minutos (autorização de domínio + 1ª varredura + linha de base GRC).',
      tags: ['Pré-Release TI', 'Revisão Mensal Diretoria', 'Onboarding em 5 min', 'Evidência para Clientes'],
    },
    presenterNotes:
      'Mostre como o esforço operacional é baixo. Ninguém precisa virar especialista em pentest para usar o Brynja: a TI ganha agilidade com respostas diretas, e a Diretoria ganha previsibilidade mensal sem precisar decifrar termos técnicos.',
    estimatedTime: '1,5 min',
  },
  {
    id: 'pilot-roadmap',
    number: 18,
    chapter: 'adoption',
    kicker: 'Próximos Passos & Aprovação',
    title: 'Plano Sugerido de Piloto (30 Dias) — Risco Zero, Custo Zero',
    subtitle:
      'Proposta prática para validar o Brynja internamente em 4 semanas antes de padronizar para todos os sistemas da empresa.',
    visual: 'pilot-roadmap',
    highlights: [
      {
        title: 'Semana 1 — Setup & 2 a 3 Sistemas Piloto',
        description:
          'Configurar acesso na Vercel (free tier), autorizar os domínios de homologação escolhidos e executar a primeira fotografia completa de segurança.',
      },
      {
        title: 'Semana 2 — Saneamento Rápido (Quick Wins P0/P1)',
        description:
          'Equipe de TI corrige vulnerabilidades críticas/altas, cabeçalhos essenciais e eventuais segredos/configurações — validando o ganho via Scan Diff.',
      },
      {
        title: 'Semanas 3 e 4 — Baseline GRC & Revisão com a Diretoria',
        description:
          'Montar a primeira matriz CIS v8 (IG1) + LGPD/ISO em Excel e apresentar o "antes e depois" para aprovar a expansão para todo o portfólio de sistemas.',
      },
    ],
    itDetails: {
      summary:
        'Pré-requisitos técnicos para iniciar hoje: 1 GitHub OAuth App corporativo, 1 chave AES-256 (TOKEN_ENCRYPTION_KEY), ALLOW_LOCAL_LOOPBACK_TARGETS=false e (opcional) NVD_API_KEY gratuita.',
      tags: ['Piloto 30 Dias', 'Zero Custo de Licença', '2–3 Sistemas Iniciais', 'Antes vs. Depois'],
    },
    presenterNotes:
      'Feche com uma decisão simples e de baixíssimo risco para a mesa: "Podemos aprovar este piloto de 30 dias em 2 ou 3 aplicações prioritárias, sem custo de licença e sem guardar dados em nuvem externa, e voltamos em 4 semanas com o comparativo real de evolução?". Depois abra para perguntas ou faça uma demo ao vivo rápida!',
    estimatedTime: '2 min',
    demoLink: { label: 'Iniciar Demonstração Ao Vivo', href: '/scans/new' },
  },
];
