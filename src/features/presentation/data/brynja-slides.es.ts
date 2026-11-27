import type {
  LocalizedPresentationDeck,
  PresentationSlide,
  SlideChapterMeta,
} from '../models/presentation.models';

export const PRESENTATION_CHAPTERS_ES: readonly SlideChapterMeta[] = [
  { id: 'vision', label: 'Visión y Valor' },
  { id: 'onboarding', label: 'Acceso y Preparación' },
  { id: 'analysis', label: 'Las 4 Capas de Análisis' },
  { id: 'results', label: 'Informes, GRC y Auditoría' },
  { id: 'adoption', label: 'Rutina y Piloto 30 Días' },
];

export const BRYNJA_PRESENTATION_SLIDES_ES: readonly PresentationSlide[] = [
  {
    id: 'hero-cover',
    number: 1,
    chapter: 'vision',
    isHeroCover: true,
    kicker: 'Presentación Ejecutiva y Técnica · Equipo de TI y Dirección',
    title: 'Brynja',
    subtitle:
      'Plataforma Proactiva de Seguridad en Aplicaciones — desde la inspección de código y dependencias hasta la verificación activa segura y el cumplimiento normativo.',
    visual: 'hero-cover',
    highlights: [
      {
        title: 'Local-First y Coste Cero',
        description: 'Sin base de datos en la nube',
      },
      {
        title: '8 Ecosistemas SCA',
        description: 'OSV · NVD · EPSS · CISA KEV',
      },
      {
        title: '19 Safe Probes',
        description: 'Solo lectura (GET / HEAD)',
      },
      {
        title: 'Gobernanza GRC',
        description: 'CIS v8 · NIST · OWASP · LGPD',
      },
    ],
    itDetails: {
      summary:
        'Next.js 15 App Router (SOLID) · Vercel Serverless · IndexedDB aislado por cuenta GitHub · Guardrails anti-SSRF y certificados AES-256-GCM.',
      tags: ['100% Serverless', 'Local-First', 'Open-Source MIT', 'Defensivo'],
    },
    presenterNotes:
      'Diapositiva de apertura mientras todos entran a la sala o llamada. Presenta el nombre Brynja ("armadura de malla" en nórdico antiguo) y adelanta la agenda: en unos 25 minutos veremos el valor de negocio, la privacidad Local-First, las 7 etapas prácticas de la plataforma y una propuesta de piloto de 30 días sin coste.',
    estimatedTime: '0,5 min',
  },
  {
    id: 'cover',
    number: 2,
    chapter: 'vision',
    kicker: 'Visión General de la Plataforma',
    title: '¿Por qué Brynja? Seguridad en Capas sin Fricción',
    subtitle:
      'Desde la inspección de código y bibliotecas hasta el cumplimiento normativo (LGPD, ISO 27001, CIS v8), sin base de datos en la nube y sin riesgo de interrumpir sistemas.',
    analogy:
      'Brynja (pronunciado BRIN-ya) significa "armadura de malla" en nórdico antiguo: cientos de anillos entrelazados que distribuyen el impacto sin inmovilizar a quien la lleva.',
    visual: 'cover',
    highlights: [
      {
        title: 'Para la Dirección',
        description:
          'Visibilidad clara del riesgo de negocio, alineación normativa (LGPD/ISO/CIS) y coste de infraestructura cercano a cero.',
      },
      {
        title: 'Para el Equipo de TI',
        description:
          'Diagnóstico completo en minutos con versiones exactas de corrección, pruebas no destructivas y flujo integrado con GitHub.',
      },
      {
        title: 'Para Privacidad y Cumplimiento',
        description:
          'Arquitectura Local-First: historial e informes permanecen en el navegador del responsable, jamás almacenados en nubes externas.',
      },
    ],
    itDetails: {
      summary:
        'Next.js 15 App Router (arquitectura SOLID) · 100% Vercel Serverless + IndexedDB · 8 ecosistemas SCA · Análisis Estático · 19 Safe Probes · Motor GRC + IA BYOK.',
      tags: [
        '100% Serverless',
        'Local-First',
        '8 Ecosistemas',
        '19 Safe Probes',
        'GRC Automático',
        'Open-Source MIT',
      ],
    },
    presenterNotes:
      '¡Bienvenidos! Explica que esta presentación está diseñada para ambos públicos: valor de negocio, privacidad y gobernanza para Dirección, junto al flujo operativo paso a paso para TI. Consejo: usa el botón "Solo Ejecutivo" arriba para ocultar los bloques técnicos en directo cuando convenga.',
    estimatedTime: '1 min',
  },
  {
    id: 'problem',
    number: 3,
    chapter: 'vision',
    kicker: '¿Por qué actuar ahora?',
    title: 'El Desafío Actual de la Seguridad en Aplicaciones',
    subtitle:
      'Hoy las empresas enfrentan un dilema: quedar expuestas a fallos conocidos o pagar licencias elevadas por herramientas complejas que el equipo no consigue operar.',
    visual: 'problem',
    highlights: [
      {
        title: 'El software moderno se construye con piezas de terceros',
        description:
          'Más del 80% de una aplicación web depende de bibliotecas externas. Una brecha en un paquete olvidado puede exponer a toda la empresa.',
      },
      {
        title: 'Costes elevados y exposición de privacidad en la nube',
        description:
          'Las plataformas corporativas tradicionales cobran por desarrollador y exigen subir código, credenciales e informes a servidores externos.',
      },
      {
        title: 'Ruido técnico sin visión ejecutiva',
        description:
          'TI recibe cientos de alertas técnicas sueltas mientras Dirección necesita respuestas claras: "¿qué es urgente, cuál es el impacto y cumplimos con la normativa?"',
      },
    ],
    itDetails: {
      summary:
        'Unifica lo que normalmente exige 4–5 herramientas separadas (SCA/SBOM, Secret Scanner, IaC/SAST, DAST pasivo y GRC) sin vendor lock-in ni costes de base de datos gestionada.',
      tags: ['Supply Chain', 'Shadow Secrets', 'Fatiga de Alertas', 'Brecha TI ↔ Dirección'],
    },
    presenterNotes:
      'Contextualiza el problema antes de mostrar la plataforma. Destaca que los incidentes reales rara vez vienen de ataques sofisticados: vienen de una librería desactualizada, un archivo .env olvidado en el servidor o una clave filtrada en el repositorio.',
    estimatedTime: '1,5 min',
  },
  {
    id: 'chainmail',
    number: 4,
    chapter: 'vision',
    kicker: 'Nuestra Filosofía',
    title: 'Defensa en Profundidad: Cómo Protege la Armadura de Malla',
    subtitle:
      'En lugar de confiar en una sola verificación aislada, Brynja entrelaza cuatro capas complementarias en una única plataforma sencilla.',
    analogy:
      'Si una revisión solo mira el código y otra solo mira la web publicada, las brechas se cuelan en medio. Brynja conecta ambos mundos y los traduce en un plan de acción.',
    visual: 'chainmail',
    highlights: [
      {
        title: 'Anillo 1 — Qué usa el sistema (SCA / SBOM)',
        description:
          'Mapea cada biblioteca instalada y consulta bases globales para detectar vulnerabilidades ya explotadas activamente.',
      },
      {
        title: 'Anillo 2 — Qué está escrito en el repositorio',
        description:
          'Busca secretos filtrados, configuraciones inseguras de contenedores/nube (Docker, Terraform, CI/CD) y patrones peligrosos en el código.',
      },
      {
        title: 'Anillo 3 — Cómo responde el sitio publicado (19 Safe Probes)',
        description:
          'Realiza un chequeo 100% seguro y de solo lectura sobre la URL publicada (cabeceras, cookies, archivos expuestos, DNS).',
      },
      {
        title: 'Anillo 4 — Decisión, IA Opcional y Gobernanza',
        description:
          'Convierte todo en prioridades de negocio (P0–P3), PDF ejecutivo para Dirección y matrices CIS, NIST, OWASP y LGPD.',
      },
    ],
    itDetails: {
      summary:
        'Correlación real entre SBOM y runtime (RuntimeFingerprintProbe eleva los CVE a CONFIRMED_ACTIVE cuando se detecta la librería vulnerable en el sitio publicado).',
      tags: ['SCA + SBOM', 'SAST/Secretos/IaC', '19 Safe Probes', 'GRC e IA BYOK'],
    },
    presenterNotes:
      'Apóyate en el diagrama de los 4 anillos para mostrar por qué Brynja se diferencia de un escáner común: inspecciona el código, valida el sitio en vivo y traduce todo en decisiones ejecutivas y evidencia de cumplimiento.',
    estimatedTime: '1,5 min',
  },
  {
    id: 'local-first',
    number: 5,
    chapter: 'vision',
    kicker: 'Arquitectura y Privacidad',
    title: 'Sin Base en la Nube: Privacidad Local-First y Coste Cero',
    subtitle:
      'Una de las mayores ventajas para Dirección y Legal: Brynja nunca almacena código, contraseñas ni informes de la empresa en servidores externos.',
    analogy:
      'El servidor de Brynja funciona como un aparato de rayos X: procesa el examen al instante y entrega el resultado directo al equipo del usuario sin guardar copia.',
    visual: 'local-first',
    highlights: [
      {
        title: 'Los datos permanecen en el navegador del responsable',
        description:
          'Historial de análisis, inventarios SBOM, autorizaciones y evaluaciones GRC se guardan localmente (IndexedDB), aislados por cuenta de GitHub.',
      },
      {
        title: 'Sesión temporal que se borra sola',
        description:
          'El acceso a GitHub se cifra solo en la sesión activa del navegador y se descarta al cerrar sesión o cerrar el navegador.',
      },
      {
        title: 'Coste de infraestructura cercano a cero',
        description:
          'Funciona 100% serverless (despliegue en 1 clic en Vercel free tier), sin servidor dedicado, sin mantenimiento de BD y sin licencias por usuario.',
      },
    ],
    itDetails: {
      summary:
        'Sesión OAuth sellada en cookie HttpOnly AES-256-GCM sin Max-Age/Expires; IndexedDB particionado por ownerGithubUserId con backup/restauración JSON v2 local; Route Handlers stateless en Next.js (maxDuration=60).',
      tags: [
        'AES-256-GCM',
        'Cookie HttpOnly Efímera',
        'IndexedDB Aislado',
        'Vercel Free Tier',
      ],
    },
    presenterNotes:
      'Esta diapositiva suele ganar de inmediato el respaldo de Dirección, Legal y DPO. Subraya que no existe una base de datos en la nube acumulando vulnerabilidades de la empresa: el riesgo de fuga centralizada se elimina por diseño y a coste prácticamente cero.',
    estimatedTime: '2 min',
  },
  {
    id: 'journey-map',
    number: 6,
    chapter: 'onboarding',
    kicker: 'Visión Panorámica',
    title: 'Mapa Completo de la Plataforma: Las 7 Etapas en la Práctica',
    subtitle:
      'Todo el ciclo — desde el primer inicio de sesión hasta entregar el informe a Dirección — sigue un flujo guiado, auditable y repetible.',
    visual: 'journey-map',
    highlights: [
      {
        title: 'Preparación segura (Etapas 1 a 3)',
        description:
          'Acceso con GitHub, prueba criptográfica de propiedad del dominio y selección del proyecto/ecosistema en menos de 2 minutos.',
      },
      {
        title: 'Inspección automática en capas (Etapa 4)',
        description:
          'El pipeline ejecuta SCA/CVEs, Análisis Estático, 19 Safe Probes y (opcionalmente) Consultor IA con progreso en tiempo real.',
      },
      {
        title: 'Acción, Gobernanza y Mejora Continua (Etapas 5 a 7)',
        description:
          'Informes por perfil (PDF, Excel, JSON para IA, SBOM), scorecard GRC, comparador de evolución y registro de auditoría.',
      },
    ],
    itDetails: {
      summary:
        'Rutas dedicadas: / (Panel), /authorizations, /scans/new, /scans/[id], /governance, /history y /audit — en 3 idiomas (PT-BR, EN, ES) con temas Claro y Oscuro.',
      tags: ['7 Etapas Guiadas', 'Pipeline en Vivo', 'PT-BR / EN / ES', 'Claro y Oscuro'],
    },
    presenterNotes:
      'Presenta esta vista como el mapa completo del recorrido. A partir de la siguiente diapositiva recorreremos cada una de las 7 etapas mostrando qué hace TI y qué recibe Dirección.',
    estimatedTime: '1 min',
    demoLink: { label: 'Abrir Panel Inicial (/)', href: '/' },
  },
  {
    id: 'stage-auth',
    number: 7,
    chapter: 'onboarding',
    kicker: 'Etapa 1 de 7',
    title: 'Acceso Seguro con GitHub y Aislamiento Multiusuario',
    subtitle:
      'El equipo entra con su cuenta corporativa de GitHub — sin crear nuevas contraseñas — accediendo a repositorios personales, privados y de Organizaciones.',
    visual: 'stage-auth',
    highlights: [
      {
        title: 'Sin nuevas contraseñas que gestionar',
        description:
          'Usa autenticación oficial de GitHub (OAuth), respetando exactamente los permisos que cada colaborador ya tiene.',
      },
      {
        title: 'Soporte completo para Organizaciones y repos privados',
        description:
          'Lista repositorios de la organización y permite elegir cualquier rama (main, staging, feature) para auditar antes de publicar.',
      },
      {
        title: 'También funciona sin conectar repositorios',
        description:
          'Se pueden pegar manifiestos manualmente (ej. package.json) o importar informes externos sin exponer el código fuente.',
      },
    ],
    itDetails: {
      summary:
        'GitHub OAuth (permisos repo, read:user, user:email, read:org) con paginación en /user/repos y /orgs/{org}/repos, protección CSRF mediante cookie de estado y sesión sellada en AES-256-GCM.',
      tags: ['GitHub OAuth', 'Repos Privados y Orgs', 'Modo Manual', 'Protección CSRF'],
    },
    presenterNotes:
      'Explícalo de forma directa: Brynja no crea usuarios paralelos ni pide compartir credenciales de servicio. Cada analista usa su propia cuenta GitHub, ve solo lo que le corresponde y el token desaparece al cerrar sesión.',
    estimatedTime: '1,5 min',
    demoLink: { label: 'Abrir Panel / Acceso', href: '/' },
  },
  {
    id: 'stage-authz',
    number: 8,
    chapter: 'onboarding',
    kicker: 'Etapa 2 de 7',
    title: 'Autorización Criptográfica de Dominio (Uso 100% Ético)',
    subtitle:
      'Brynja NUNCA ejecuta pruebas activas en ningún sitio sin antes demostrar matemáticamente que la empresa es propietaria de ese dominio.',
    analogy:
      'Como un cerrajero profesional que comprueba la propiedad antes de tocar una cerradura — evitando pruebas accidentales o indebidas contra terceros.',
    visual: 'stage-authz',
    highlights: [
      {
        title: 'Dos métodos oficiales de verificación',
        description:
          'Publicar un código único en el archivo RFC 9116 /.well-known/security.txt o añadir un registro DNS TXT (_brynja) en el dominio.',
      },
      {
        title: 'Guía lista para el equipo de Infraestructura / TI',
        description:
          'Genera automáticamente fragmentos copiables (SSH, Nginx, Apache, Docker) e incluso el paso opcional de limpieza posterior.',
      },
      {
        title: 'Certificado renovable con revocación inmediata',
        description:
          'Emite un certificado firmado de 7 días que se renueva en vivo mientras la prueba siga publicada — y bloquea al instante si se retira.',
      },
    ],
    itDetails: {
      summary:
        'Desafío determinista HMAC-SHA256 por usuario + origen; certificado stateless AES-256-GCM (AUTHORIZATION_TTL_DAYS=7) verificado en vivo antes de cada ejecución de Safe Probes + respaldo /.well-known/brynja-verify.txt.',
      tags: ['HMAC-SHA256', 'RFC 9116 security.txt', 'DNS TXT _brynja', 'Certificado AES-256-GCM'],
    },
    presenterNotes:
      'Este punto aporta total tranquilidad a Dirección y Legal: el uso no autorizado está bloqueado criptográficamente en el código. Para TI, muestra cómo /authorizations entrega bloques listos para Nginx, Apache y Docker en menos de 3 minutos.',
    estimatedTime: '2 min',
    demoLink: { label: 'Abrir Objetivos y Guardrails', href: '/authorizations' },
  },
  {
    id: 'stage-new-scan',
    number: 9,
    chapter: 'onboarding',
    kicker: 'Etapa 3 de 7',
    title: 'Iniciando un Escaneo y 8 Ecosistemas Soportados',
    subtitle:
      'En una sola pantalla el analista selecciona el proyecto, activa las capas deseadas y visualiza con total transparencia las principales tecnologías soportadas.',
    visual: 'stage-new-scan',
    highlights: [
      {
        title: 'Configuración modular en 3 clics',
        description:
          '1) Elegir repositorio y rama (o pegar manifiesto) · 2) Activar análisis estático de código/secretos/IaC · 3) Vincular (opcional) una URL autorizada.',
      },
      {
        title: '8 ecosistemas de software soportados de forma nativa',
        description:
          'Node.js/JS/TS, Python, Go, Rust, Java/Kotlin (Maven/Gradle), .NET (C#), PHP y Ruby — más capas agnósticas de nube, contenedores y web.',
      },
      {
        title: 'Transparencia total antes de ejecutar',
        description:
          'La propia pantalla muestra la matriz de lenguajes soportados y el catálogo completo de las 19 comprobaciones activas que se ejecutarán.',
      },
    ],
    itDetails: {
      summary:
        'Catálogos canónicos validados con pruebas automáticas de paridad 1-a-1 entre servidor y UI: npm/pnpm/yarn, PyPI, Go, crates.io, Maven/Gradle, NuGet (*.csproj/packages.lock.json), Packagist y RubyGems.',
      tags: ['8 Ecosistemas SCA', 'SAST Nativo JS/TS y Python', 'Catálogo Transparente', 'Pipeline en Vivo'],
    },
    presenterNotes:
      'Subraya para TI que Brynja no depende de una sola tecnología: empresas con sistemas legados en .NET, Java o PHP junto a proyectos en Node.js, Python o Go pueden unificar todo en la misma plataforma.',
    estimatedTime: '1,5 min',
    demoLink: { label: 'Abrir Nuevo Escaneo', href: '/scans/new' },
  },
  {
    id: 'layer-sca',
    number: 10,
    chapter: 'analysis',
    kicker: 'Etapa 4 · Capa 1 de 4',
    title: 'Inventario de Dependencias (SCA/SBOM) e Inteligencia Real',
    subtitle:
      'Brynja construye la "etiqueta de ingredientes" exacta de la aplicación y cruza cada biblioteca en paralelo contra 5 bases mundiales — priorizando lo verdaderamente crítico.',
    analogy:
      'En lugar de abrumar al equipo con alertas teóricas, destacamos qué piezas tienen fallos críticos, la probabilidad real de ataque y cuáles ya explotan hoy los atacantes.',
    visual: 'layer-sca',
    highlights: [
      {
        title: 'Lectura exacta de lockfiles (cero ruido falso)',
        description:
          'Prioriza archivos de bloqueo para comprobar la versión exacta instalada e indica la versión exacta corregida para actualizar.',
      },
      {
        title: 'Consulta simultánea en 5 bases públicas globales',
        description:
          'OSV.dev (Google), NVD 2.0 (NIST EE. UU.), FIRST EPSS (probabilidad de explotación), CISA KEV (explotación activa real) y deps.dev (licencias y salud).',
      },
      {
        title: 'Alertas legales de licencias y salud de cadena de suministro',
        description:
          'Muestra licencias SPDX (alertando licencias restrictivas GPL/AGPL) junto con la puntuación OpenSSF Scorecard de cada paquete.',
      },
    ],
    itDetails: {
      summary:
        'AnalyzeScaUseCase con resolución SemVer vía OSV.dev querybatch + enriquecimiento paralelo (Promise.all) en NVD API 2.0 (CVSS v3/v4 + CWE), FIRST EPSS, CISA KEV y api.deps.dev/v3 con caché en memoria.',
      tags: ['OSV.dev', 'NVD NIST 2.0', 'FIRST EPSS', 'CISA KEV', 'deps.dev / OpenSSF'],
    },
    presenterNotes:
      'Explica CISA KEV y EPSS a Dirección: cuando un CVE figura en el catálogo CISA KEV, significa que los atacantes ya están explotando esa brecha activamente en internet hoy — definiendo una prioridad P0 indiscutible.',
    estimatedTime: '2 min',
  },
  {
    id: 'layer-static',
    number: 11,
    chapter: 'analysis',
    kicker: 'Etapa 4 · Capa 2 de 4',
    title: 'Análisis Estático: Código, Secretos, Infraestructura y Postura',
    subtitle:
      'Antes de que el código llegue a producción, Brynja inspecciona el repositorio buscando credenciales olvidadas, configuraciones inseguras y patrones riesgosos.',
    visual: 'layer-static',
    highlights: [
      {
        title: 'Buscador de Secretos con enmascaramiento obligatorio',
        description:
          'Detecta claves de AWS, GitHub, Stripe, Google y Slack, contraseñas de BD y archivos .env versionados — siempre enmascarando los valores reales.',
      },
      {
        title: 'Auditoría de Infraestructura (IaC) y CI/CD',
        description:
          'Audita Dockerfiles (usuario root, :latest), docker-compose, Terraform (puertos 0.0.0.0/0, buckets públicos), Kubernetes y GitHub Actions.',
      },
      {
        title: 'SAST Ligero e Higiene del Repositorio',
        description:
          'Detecta patrones inseguros en JS/TS y Python (SQL concatenado, shell interpolado, eval) y verifica SECURITY.md, Dependabot, CODEOWNERS y protección de rama.',
      },
    ],
    itDetails: {
      summary:
        'POST /api/analyze/static ejecuta SecretScannerAnalyzer (con maskSecretMatch), IacCicdAnalyzer, LightweightSastAnalyzer (JS/TS/Python) y GitHubPostureAnalyzer, mapeando hallazgos a CIS v8 / OWASP / LGPD.',
      tags: ['Secret Scanner Enmascarado', 'Dockerfile / Terraform / K8s', 'GitHub Actions', 'SAST JS/TS y Python'],
    },
    presenterNotes:
      'Resalta esta salvaguarda de privacidad: cuando se detecta una clave filtrada, solo se muestra el archivo, la línea y un fragmento enmascarado — el secreto real jamás se guarda en informes ni en el navegador.',
    estimatedTime: '2 min',
  },
  {
    id: 'layer-probes',
    number: 12,
    chapter: 'analysis',
    kicker: 'Etapa 4 · Capa 3 de 4',
    title: '19 Safe Probes: Chequeo Seguro de la Aplicación Publicada',
    subtitle:
      'Para dominios verificados, Brynja ejecuta 19 comprobaciones de solo lectura que simulan el análisis de un especialista defensivo — sin alterar un solo dato.',
    analogy:
      'Como un chequeo médico con estetoscopio e imagen: identifica riesgos reales con rapidez, sin ninguna cirugía invasiva.',
    visual: 'layer-probes',
    highlights: [
      {
        title: 'Cabeceras, Cifrado TLS y DNS de Correo (5 sondas)',
        description:
          'Valida HTTPS forzado (HSTS), CSP, Permissions-Policy, aislamiento Cross-Origin (COOP/CORP/COEP) y protección antisuplantación de correo (SPF, DMARC, CAA, MTA-STS).',
      },
      {
        title: 'Cookies, Sesión, CORS y Redirecciones (4 sondas)',
        description:
          'Verifica protección de sesiones (HttpOnly/Secure/SameSite), políticas CORS abiertas, fugas de caché y redirección abierta (Open Redirect).',
      },
      {
        title: 'Exposición de Archivos, Backups, APIs y Runtime (10 sondas)',
        description:
          'Comprueba .git, .env, backups SQL, phpinfo, Swagger/métricas abiertas, GraphQL/OAuth, stack traces, Source Maps, integridad SRI en CDNs y security.txt.',
      },
    ],
    itDetails: {
      summary:
        '19 IControlledProbe registradas vía contenedor OCP con memoización de GET / por escaneo; RuntimeFingerprintProbe correlaciona librerías expuestas en frontend con el SBOM para confirmar exposición activa.',
      tags: ['19 Sondas Activas', '4 Categorías', 'DNS Pasivo SPF/DMARC', 'Correlación Runtime ↔ SBOM'],
    },
    presenterNotes:
      'Muestra cómo los 19 Safe Probes detectan descuidos reales que provocan brechas a diario — como un .env o backup.sql público, correos sin DMARC/SPF o trazas de error detalladas — sin tocar nunca la base de datos.',
    estimatedTime: '2 min',
    demoLink: { label: 'Ver Catálogo de 19 Safe Probes', href: '/scans/new' },
  },
  {
    id: 'guardrails',
    number: 13,
    chapter: 'analysis',
    kicker: 'Cláusula Pétrea de Seguridad',
    title: 'Guardrails Inviolables: Por Qué Brynja No Tumba Sistemas',
    subtitle:
      'La pregunta número 1 de Infraestructura y Dirección: "¿Puede esta herramienta tumbar nuestra web o sondear nuestra red interna?" La respuesta técnica es NO.',
    visual: 'guardrails',
    highlights: [
      {
        title: 'Solo Lectura Estricta (GET y HEAD)',
        description:
          'El código bloquea físicamente cualquier petición de escritura, mutación, fuerza bruta o envío de formularios.',
      },
      {
        title: 'Escudo Anti-SSRF (Red Interna Intocable)',
        description:
          'Resuelve el DNS previamente y bloquea direcciones IP privadas, redes corporativas internas y metadatos de nube (AWS/GCP/Azure).',
      },
      {
        title: 'Límite de Velocidad y Disyuntor Automático',
        description:
          'Mantiene un ritmo suave (máx. 2 req/s, tope de 80 req/escaneo). Si el servidor indica saturación o error (429/5xx), aborta de inmediato.',
      },
    ],
    itDetails: {
      summary:
        'SafeProbePolicy + SsrfDnsGuardService (bloquea RFC1918, CGNAT, link-local 169.254.169.254 y loopback en producción) + RateLimitedSafeHttpClient (allowlist solo Origin/Accept, timeout 5s, circuit breaker) + OwnershipCertificateService.',
      tags: ['Solo GET / HEAD', 'Guardia Anti-SSRF', '2 req/s · Máx. 80', 'Circuit Breaker 429/5xx'],
    },
    presenterNotes:
      'Dedica un momento sereno a esta diapositiva para despejar cualquier inquietud de Infraestructura y DevOps. Estas barreras no son recomendaciones opcionales: son invariantes verificadas con pruebas automáticas en cada versión.',
    estimatedTime: '1,5 min',
  },
  {
    id: 'layer-ai',
    number: 14,
    chapter: 'analysis',
    kicker: 'Etapa 4 · Capa 4 de 4 (Opcional)',
    title: 'Consultor AppSec por IA (Modelo BYOK Bajo Control Total)',
    subtitle:
      'Cuando el equipo desee acelerar el triaje, puede conectar su propia clave de IA (OpenAI, Google Gemini o endpoint corporativo) para obtener un plan priorizado.',
    visual: 'layer-ai',
    highlights: [
      {
        title: '100% Opcional y "Trae Tu Propia Clave" (BYOK)',
        description:
          'La empresa decide si activarlo, elige el proveedor (OpenAI, Gemini o servidor propio) y mantiene la clave exclusivamente en el navegador.',
      },
      {
        title: 'Privacidad Preservada: Cero Código Crudo ni Secretos',
        description:
          'Solo envía metadatos sanitizados de vulnerabilidades e indicios de alcanzabilidad (si el paquete se importa realmente) — jamás secretos.',
      },
      {
        title: 'Valor Inmediato para Dirección y TI',
        description:
          'Genera un Diagnóstico Ejecutivo claro más pasos numerados de corrección, integrados automáticamente en el PDF Ejecutivo.',
      },
    ],
    itDetails: {
      summary:
        'ByokAgentAdvisorAdapter + POST /api/analyze/advise y /api/analyze/advise/models (descubrimiento automático de modelos de texto excluyendo imagen/audio/vídeo, con SsrfDnsGuardService en endpoints propios) + computeReachabilityHints.',
      tags: ['BYOK OpenAI / Gemini / Custom', 'Reachability Hints', 'Metadatos Sanitizados', 'Integrado en PDF'],
    },
    presenterNotes:
      'Aclara a Dirección que Brynja funciona 100% sin IA — pero si la empresa ya dispone de cuenta corporativa en OpenAI o Gemini, el modo BYOK convierte hallazgos técnicos en diagnóstico ejecutivo y plan de acción en segundos sin intermediarios.',
    estimatedTime: '1,5 min',
  },
  {
    id: 'stage-reports',
    number: 15,
    chapter: 'results',
    kicker: 'Etapa 5 de 7',
    title: 'Informes Inteligentes: De la Dirección al Código',
    subtitle:
      'Un solo escaneo genera vistas y exportaciones a medida para cada perfil — eliminando hojas de cálculo y presentaciones manuales.',
    visual: 'stage-reports',
    highlights: [
      {
        title: 'Para Dirección y Gerencia (PDF Ejecutivo)',
        description:
          'Dictamen ejecutivo con prioridades P0–P3 y plazos SLA, impacto en el negocio, plan de soluciones, Matriz de Cumplimiento y Diagnóstico IA.',
      },
      {
        title: 'Para el Equipo de TI y Asistentes de Código',
        description:
          'Pestañas separadas (CVEs, Código/IaC, Safe Probes), sello "Escudo Íntegro (100% Aprobado)" cuando todo pasa, y "JSON para IA" en 1 clic listo para copilotos.',
      },
      {
        title: 'Para Clientes, Auditores y Supply Chain',
        description:
          'Exportación en 1 clic a estándares globales: SBOM CycloneDX 1.5, SPDX 2.3, SARIF 2.1.0, Markdown y JSON técnico completo.',
      },
    ],
    itDetails: {
      summary:
        'RemediationPlanPresenter (P0–P3), ScanPdfExporter (jsPDF), AiRemediationJsonExporter (esquema brynja.ai-remediation.v1 con deduplicación SemVer), CycloneDX 1.5, SPDX 2.3 y SARIF 2.1.0.',
      tags: ['PDF Ejecutivo P0–P3', 'JSON para IA (1 clic)', 'CycloneDX y SPDX', 'SARIF 2.1.0'],
    },
    presenterNotes:
      'Esta diapositiva conecta a ambos públicos. Para Dirección: el PDF Ejecutivo sale listo para comité con prioridades P0 e impacto de negocio. Para TI: "Copiar JSON para IA" entrega comandos exactos de actualización en minutos.',
    estimatedTime: '2 min',
    demoLink: { label: 'Abrir Historial de Informes', href: '/history' },
  },
  {
    id: 'stage-governance',
    number: 16,
    chapter: 'results',
    kicker: 'Etapa 6 de 7',
    title: 'Gobernanza, Riesgo y Cumplimiento (GRC Automático)',
    subtitle:
      'Brynja traduce automáticamente las evidencias técnicas de los escaneos a los 4 principales marcos de seguridad y privacidad exigidos por el mercado.',
    visual: 'stage-governance',
    highlights: [
      {
        title: '4 Marcos Corporativos Integrados',
        description:
          'CIS Controls v8 (grupos IG1, IG2 e IG3), NIST CSF 2.0, OWASP ASVS / Top 10 y LGPD (Arts. 46, 48 y 50) e ISO/IEC 27001:2022.',
      },
      {
        title: 'Adherencia Técnica + Declaraciones de la Empresa',
        description:
          'Combina evidencias automáticas con controles organizativos (políticas, formación, backups), diferenciando claramente nota técnica y global.',
      },
      {
        title: 'Entrega Lista para Auditoría y Dirección',
        description:
          'Exporta libros Excel (.xlsx) multipestaña con formato profesional + JSON exclusivo de brechas para IA + guía educativa integrada ("¿Qué es gobernanza?").',
      },
    ],
    itDetails: {
      summary:
        'CompliancePresenter + módulo /governance guardado en IndexedDB (grcAssessments); generador OOXML nativo sin dependencias externas (xlsx-workbook.builder.ts) protegido contra formula injection + brynja.ai-governance-gaps.v1.',
      tags: ['CIS v8 (IG1–IG3)', 'NIST CSF 2.0', 'OWASP ASVS', 'LGPD e ISO 27001', 'Excel .xlsx Multipestaña'],
    },
    presenterNotes:
      'Muestra el valor estratégico para Dirección: cuando un gran cliente, banco o auditoría pregunta cómo evidencian LGPD, ISO 27001 o CIS, el equipo genera en 1 clic un Excel completo respaldado por evidencias técnicas reales.',
    estimatedTime: '2 min',
    demoLink: { label: 'Abrir Gobernanza y GRC', href: '/governance' },
  },
  {
    id: 'stage-history-audit',
    number: 17,
    chapter: 'results',
    kicker: 'Etapa 7 de 7',
    title: 'Historial, Evolución (Scan Diff), Importaciones y Auditoría',
    subtitle:
      'La seguridad no es una foto fija, es una película. Brynja mide la evolución de cada sistema en el tiempo y registra cada comprobación ejecutada.',
    visual: 'stage-history-audit',
    highlights: [
      {
        title: 'Comparador entre Escaneos (Scan Diff)',
        description:
          'Compara dos fechas lado a lado demostrando resultados: cuántas fallas se resolvieron, si apareció alguna nueva y cuánto subió CIS/NIST.',
      },
      {
        title: 'Centralizador de Herramientas Externas',
        description:
          'Importa informes de Trivy, Semgrep, Prowler y SARIF 2.1.0 al mismo historial local, con Backup y Restauración.',
      },
      {
        title: 'Registro de Auditoría Local Inmutable (/audit)',
        description:
          'Registra fecha/hora, URL, método HTTP (GET/HEAD), código de respuesta y certificado usado en cada sonda — trazabilidad total para Infra.',
      },
    ],
    itDetails: {
      summary:
        'computeScanDiff en /history, parseExternalSecurityReport (OASIS SARIF 2.1.0, Trivy JSON, Semgrep JSON, Prowler OCSF/JSON), export/import de LocalBackupBundle v2 y registro completo en /audit.',
      tags: ['Scan Diff', 'Import Trivy/Semgrep/Prowler', 'Registro /audit', 'Backup Local'],
    },
    presenterNotes:
      'Destaca Scan Diff para Dirección: demuestra objetivamente el retorno del trabajo de TI — "resolvimos 14 vulnerabilidades críticas y subimos la adherencia CIS v8 del 58% al 89% en 3 semanas".',
    estimatedTime: '1,5 min',
    demoLink: { label: 'Abrir Registro de Auditoría', href: '/audit' },
  },
  {
    id: 'daily-routine',
    number: 18,
    chapter: 'adoption',
    kicker: 'En la Operación Diaria',
    title: 'Cómo Operan Brynja TI y Dirección en la Rutina',
    subtitle:
      'Sin burocracia: la herramienta encaja de forma natural en el ritmo de entregas de TI y en las revisiones mensuales de la Dirección.',
    visual: 'daily-routine',
    highlights: [
      {
        title: 'Rutina del Equipo de TI (15 min por ciclo)',
        description:
          'Semanalmente o antes de cada release: ejecutar escaneo, revisar Scan Diff para evitar regresiones y corregir P0/P1 con comandos directos.',
      },
      {
        title: 'Rutina de Infraestructura y Seguridad',
        description:
          'Mantener autorizaciones activas en staging/producción, revisar el registro /audit y consolidar hallazgos externos (Trivy/Semgrep/Prowler).',
      },
      {
        title: 'Rutina de Dirección y Gobernanza (Mensual)',
        description:
          'Recibir el PDF Ejecutivo + Excel GRC, seguir la curva de mejora CIS/LGPD y usar SBOM/informes como diferenciador comercial B2B.',
      },
    ],
    itDetails: {
      summary:
        'Flujo ágil que nunca bloquea despliegues de emergencia: incorporar una nueva aplicación toma ~5 minutos (autorización de dominio + escaneo base + vínculo GRC).',
      tags: ['Pre-Release TI', 'Revisión Mensual Dirección', 'Onboarding en 5 min', 'Evidencia para Clientes'],
    },
    presenterNotes:
      'Destaca el bajísimo esfuerzo operativo: nadie necesita ser especialista en pentest para operar Brynja. TI gana agilidad con soluciones claras y Dirección gana previsibilidad mensual sin jerga técnica.',
    estimatedTime: '1,5 min',
  },
  {
    id: 'pilot-roadmap',
    number: 19,
    chapter: 'adoption',
    kicker: 'Próximos Pasos y Aprobación',
    title: 'Plan de Piloto Sugerido (30 Días) — Riesgo Cero, Coste Cero',
    subtitle:
      'Propuesta práctica de 4 semanas para validar Brynja internamente antes de estandarizarlo en todas las aplicaciones de la empresa.',
    visual: 'pilot-roadmap',
    highlights: [
      {
        title: 'Semana 1 — Setup y 2–3 Sistemas Piloto',
        description:
          'Desplegar en Vercel (free tier), autorizar los dominios de staging elegidos y capturar la primera línea base completa.',
      },
      {
        title: 'Semana 2 — Saneamiento Rápido (Quick Wins P0/P1)',
        description:
          'TI corrige vulnerabilidades críticas/altas, cabeceras esenciales y posibles secretos/IaC — validando mejoras con Scan Diff.',
      },
      {
        title: 'Semanas 3 y 4 — Línea Base GRC y Revisión con Dirección',
        description:
          'Generar la primera matriz CIS v8 (IG1) + LGPD/ISO en Excel y presentar el "antes y después" para aprobar la expansión a toda TI.',
      },
    ],
    itDetails: {
      summary:
        'Prerrequisitos técnicos para empezar hoy: 1 GitHub OAuth App corporativa, 1 clave AES-256 (TOKEN_ENCRYPTION_KEY), ALLOW_LOCAL_LOOPBACK_TARGETS=false y NVD_API_KEY gratuita opcional.',
      tags: ['Piloto 30 Días', 'Coste Cero Licencia', '2–3 Sistemas Iniciales', 'Antes vs. Después'],
    },
    presenterNotes:
      'Cierra con una decisión sencilla y sin riesgo: "¿Aprobamos este piloto de 30 días en 2 o 3 aplicaciones prioritarias, sin coste de licencia ni datos en la nube, y volvemos en 4 semanas con el comparativo real de evolución?". Luego abre ronda de preguntas o demostración en vivo.',
    estimatedTime: '2 min',
    demoLink: { label: 'Iniciar Demostración en Vivo', href: '/scans/new' },
  },
];

export const ES_PRESENTATION_DECK: LocalizedPresentationDeck = {
  chapters: PRESENTATION_CHAPTERS_ES,
  slides: BRYNJA_PRESENTATION_SLIDES_ES,
};
