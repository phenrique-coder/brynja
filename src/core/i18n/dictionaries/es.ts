import type {
  SafeProbeCopy,
  SafeProbeId,
} from '../../catalog/safe-probes.catalog';
import type { Messages } from './pt-BR';

const SAFE_PROBE_ITEMS_ES: Record<SafeProbeId, SafeProbeCopy> = {
  'safe-probe:security-headers': {
    name: 'Cabeceras de Seguridad HTTP y Banners',
    summary:
      'Verifica si la respuesta raíz incluye cabeceras defensivas esenciales contra XSS, clickjacking y MIME sniffing, además de detectar exposición de stack/versión.',
    checks:
      'Inspecciona Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy y banners X-Powered-By / Server correlacionados con el SBOM.',
  },
  'safe-probe:hsts-tls': {
    name: 'Política HSTS en HTTPS',
    summary:
      'Valida en objetivos HTTPS que los navegadores exijan conexiones cifradas durante el período recomendado para prevenir ataques de downgrade HTTP.',
    checks:
      'Ejecuta HEAD / y valida Strict-Transport-Security con max-age ≥ 15.552.000s (180 días). Se omite automáticamente en objetivos HTTP.',
  },
  'safe-probe:csp-permissions': {
    name: 'Directivas CSP, Permissions-Policy y Contenido Mixto',
    summary:
      'Evalúa la fortaleza real de Content-Security-Policy, las restricciones de APIs del navegador y la carga de recursos activos HTTP en páginas HTTPS.',
    checks:
      "Analiza 'unsafe-eval', comodines '*', 'unsafe-inline' sin nonce/hash, frame-ancestors '*', Report-Only sin CSP activa, ausencia de Permissions-Policy y scripts/iframes/CSS http:// en HTTPS.",
  },
  'safe-probe:cookie-security': {
    name: 'Atributos de Seguridad en Cookies (Set-Cookie)',
    summary:
      'Audita las banderas defensivas de las cookies emitidas en la raíz sin almacenar ni mostrar jamás los valores secretos de las cookies.',
    checks:
      'Analiza HttpOnly, Secure (en HTTPS) y SameSite (Lax/Strict o None con Secure), priorizando cookies de sesión y autenticación.',
  },
  'safe-probe:cors-policy': {
    name: 'Política CORS (Cross-Origin Resource Sharing)',
    summary:
      'Detecta configuraciones cross-origin demasiado permisivas que podrían permitir a sitios no confiables leer datos autenticados de la aplicación.',
    checks:
      'Envía GET / con un Origin de prueba no confiable y comprueba reflexión arbitraria de Access-Control-Allow-Origin, comodín "*" con credenciales u origen "null".',
  },
  'safe-probe:cache-security': {
    name: 'Seguridad de Caché HTTP (Cookies y Vary: Origin)',
    summary:
      'Previene fugas de sesiones en CDNs/proxies compartidos y envenenamiento de caché en respuestas CORS dinámicas.',
    checks:
      'Inspecciona GET / buscando Set-Cookie con Cache-Control público/s-maxage (o cookies de sesión sin private/no-store) y Access-Control-Allow-Origin específico sin Vary: Origin.',
  },
  'safe-probe:open-redirect': {
    name: 'Redirección Abierta (Open Redirect)',
    summary:
      'Detecta parámetros de retorno sin validar que redirigen usuarios a dominios externos arbitrarios en campañas de phishing o robo de tokens.',
    checks:
      'Envía GET con redirección manual a /?next=, /?redirect= y /login?next= apuntando al dominio sintético untrusted.brynja.test y verifica respuestas 3xx con Location externo.',
  },
  'safe-probe:exposed-artifacts': {
    name: 'Artefactos Sensibles Expuestos',
    summary:
      'Comprueba si archivos críticos de control de versiones, variables de entorno o manifiestos quedaron expuestos públicamente en la raíz web.',
    checks:
      'Sondea /.git/HEAD, /.env y /package.json mediante HEAD y valida firmas estructurales en los primeros 512 bytes solo si devuelve HTTP 200, sin descargar ni registrar secretos.',
  },
  'safe-probe:exposed-docs-metrics': {
    name: 'Documentación de API, Métricas y security.txt',
    summary:
      'Identifica documentación interna de API o endpoints de observabilidad expuestos por error en producción y detecta el archivo RFC 9116.',
    checks:
      'Comprueba /openapi.json, /swagger, /swagger-ui, /api/docs, /metrics, /actuator/health y /graphql (ignorando HTML catch-all de SPAs), además de /.well-known/security.txt.',
  },
  'safe-probe:backup-config-exposure': {
    name: 'Backups, Configs de Entorno y Diagnósticos',
    summary:
      'Identifica archivos de entorno adicionales, volcados SQL, manifiestos Docker Compose o páginas phpinfo expuestas públicamente.',
    checks:
      'Ejecuta HEAD y valida firmas en los primeros 512 bytes (ignorando HTML de SPAs, sin guardar secretos) para /.env.local, /.env.production, /docker-compose.yml, /backup.sql y /phpinfo.php.',
  },
  'safe-probe:runtime-fingerprint': {
    name: 'Correlación de Bibliotecas en Runtime con CVEs',
    summary:
      'Cruza los assets JavaScript servidos públicamente con los paquetes vulnerables del inventario SBOM para confirmar exposición activa en runtime.',
    checks:
      'Lee hasta 32 KB del HTML inicial (GET /) buscando rutas en <script src> y banners explícitos de versión que coincidan con las CVEs halladas en SCA.',
  },
  'safe-probe:source-maps': {
    name: 'Exposición de Source Maps (.js.map)',
    summary:
      'Detecta mapas de código fuente accesibles públicamente que exponen el código original del cliente en staging o producción.',
    checks:
      'Extrae hasta 3 scripts JS del mismo origen en "/" y comprueba mediante HEAD si sus archivos .js.map devuelven HTTP 200.',
  },
  'safe-probe:debug-error-leakage': {
    name: 'Modo Debug, Stack Traces y Directory Listing',
    summary:
      'Detecta listados automáticos de directorios y páginas de error detalladas que exponen rutas internas, frameworks o depuradores interactivos.',
    checks:
      'Inspecciona GET / para autoindex ("Index of /") y GET /__brynja_probe_nonexistent_404__ para firmas de Django DEBUG, Werkzeug, Node/Express, Laravel Ignition, PHP, Java/Spring y ASP.NET.',
  },
  'safe-probe:sri-integrity': {
    name: 'Subresource Integrity (SRI) en CDNs Externas',
    summary:
      'Verifica si los scripts y hojas de estilo cargados desde CDNs públicas estáticas exigen hashes criptográficos contra alteraciones en la cadena de suministro.',
    checks:
      'Analiza etiquetas <script src> y <link rel="stylesheet"> en el HTML raíz hacia CDNs estáticas (cdnjs, jsDelivr, unpkg, jQuery/Bootstrap) validando el atributo integrity (sha256/384/512).',
  },
  'safe-probe:cross-origin-isolation': {
    name: 'Aislamiento Cross-Origin (COOP, COEP y CORP)',
    summary:
      'Evalúa si el servidor instruye al navegador a aislar ventanas y recursos contra fugas cross-origin y ataques de canal lateral.',
    checks:
      'Inspecciona GET / buscando cabeceras Cross-Origin-Opener-Policy (COOP), Cross-Origin-Resource-Policy (CORP) y Cross-Origin-Embedder-Policy (COEP).',
  },
  'safe-probe:dns-email-posture': {
    name: 'Postura DNS, Anti-Spoofing (SPF/DMARC) y CAA',
    summary:
      'Comprueba pasivamente si el dominio cuenta con protección contra suplantación de correo, emisión indebida de certificados TLS y MTA-STS.',
    checks:
      'Consulta registros DNS TXT (SPF, _dmarc) y CAA del dominio además de GET /.well-known/mta-sts.txt (omitido automáticamente en loopback o IPs).',
  },
  'safe-probe:robots-sitemap-exposure': {
    name: 'Rutas Sensibles en robots.txt y sitemap.xml',
    summary:
      'Identifica rutas administrativas, internas o de staging divulgadas públicamente en archivos de indexación.',
    checks:
      'Lee GET /robots.txt y GET /sitemap.xml (ignorando HTML catch-all de SPAs) buscando patrones como /admin, /internal, /backup y /debug sin rastrearlos.',
  },
  'safe-probe:oauth-graphql-posture': {
    name: 'Metadatos OIDC e Introspección GraphQL',
    summary:
      'Detecta configuraciones débiles en el descubrimiento OpenID Connect e introspección pública de esquemas GraphQL en producción.',
    checks:
      'Inspecciona GET /.well-known/openid-configuration (endpoints http://, alg=none, implicit sin PKCE) y GET /graphql?query=__schema pasivo.',
  },
  'safe-probe:security-txt-rfc9116': {
    name: 'Validación RFC 9116 de security.txt',
    summary:
      'Valida que el canal oficial de divulgación de vulnerabilidades exista, incluya contacto válido y no esté caducado.',
    checks:
      'Consulta GET /.well-known/security.txt (ignorando HTML catch-all) y valida las directivas obligatorias "Contact:" y "Expires:" vigente.',
  },
};

export const ES_MESSAGES: Messages = {
  common: {
    loading: 'Cargando...',
    refresh: 'Actualizar',
    cancel: 'Cancelar',
    copy: 'Copiar',
    copied: 'Copiado',
    close: 'Cerrar',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    signInWithGitHub: 'Iniciar sesión con GitHub',
    signInShort: 'Entrar',
    backToDashboard: 'Volver al Panel',
    backToHistory: 'Volver al Historial',
    scaOnly: 'Solo SCA',
    languageSelectorLabel: 'Seleccionar idioma',
  },
  enums: {
    severity: {
      CRITICAL: 'Crítica',
      HIGH: 'Alta',
      MEDIUM: 'Media',
      LOW: 'Baja',
      INFO: 'Info',
    },
    verdict: {
      CONFIRMED_ACTIVE: 'Confirmada en Runtime',
      POTENTIALLY_EXPOSED: 'Potencial / KEV Activa',
      DEPENDENCY_ONLY: 'Solo en el Manifiesto',
    },
    scanStatus: {
      QUEUED: 'En Cola',
      RUNNING: 'En Ejecución',
      COMPLETED: 'Completado',
      FAILED: 'Falló',
    },
    authStatus: {
      PENDING: 'Pendiente',
      VERIFIED: 'Verificado',
      REVOKED: 'Revocado',
    },
    probeOutcome: {
      FINDING: 'Punto Débil',
      PASSED: 'Aprobado',
      SKIPPED: 'Omitido',
      ABORTED: 'Interrumpido (Guardrail)',
    },
    pipelineStage: {
      queued: 'En cola',
      fetching_repository: 'Lectura del repo',
      parsing_dependencies: 'Extracción SBOM',
      querying_vulnerability_intel: 'OSV / NVD / EPSS / KEV',
      running_static_analysis: 'Secretos / IaC / SAST',
      running_safe_probes: 'Safe Probes',
      completed: 'Informe listo',
    },
  },
  nav: {
    dashboard: 'Panel',
    history: 'Historial',
    newScan: 'Nuevo Escaneo',
    authorizations: 'Objetivos y Guardrails',
    audit: 'Auditoría',
    governance: 'Gobernanza',
    mainNavLabel: 'Navegación principal',
    mobileNavLabel: 'Navegación móvil',
    tagline: 'SCA · CVEs · Safe Probes',
  },
  theme: {
    switchToLight: 'Cambiar a tema claro',
    switchToDark: 'Cambiar a tema oscuro',
    tooltipLight: 'Cambiar a modo claro',
    tooltipDark: 'Cambiar a modo oscuro',
  },
  accountMenu: {
    viewProfile: 'Ver perfil en GitHub',
    githubId: 'GitHub ID',
    scopes: 'Permisos',
    ephemeralSession: 'Sesión efímera',
    expiresAt: 'Expira a las {time}',
    activeInTab: 'Activa en esta sesión',
    securityBadge: 'Token OAuth cifrado solo en esta sesión (sin base en la nube)',
    signingOut: 'Cerrando sesión...',
    signOut: 'Salir (Descartar token)',
  },
  authCard: {
    defaultTitle: 'Conecta tu GitHub para iniciar esta sesión',
    dashboardTitle: 'Conecta tu GitHub para acceder a tu panel e historial',
    historyTitle: 'Conecta tu GitHub para consultar tu historial completo',
    newScanTitle: 'Conecta tu GitHub para iniciar un nuevo escaneo',
    authorizationsTitle: 'Conecta tu GitHub para gestionar tus objetivos autorizados',
    auditTitle: 'Conecta tu GitHub para ver tu registro de auditoría',
    governanceTitle: 'Conecta tu GitHub para gestionar tus evaluaciones de cumplimiento (GRC)',
    reportTitle: 'Conecta tu GitHub para abrir este informe',
    description:
      'Para garantizar privacidad y aislamiento multiusuario, Brynja nunca guarda tokens OAuth ni informes en una base de datos en la nube. Al entrar con GitHub, un token efímero se sella en tu navegador y tu historial local (IndexedDB) se carga automáticamente.',
    card1Title: 'Token Efímero',
    card1Body: 'Se descarta al salir o cerrar el navegador.',
    card2Title: 'Historial Local',
    card2Body: 'Tus análisis permanecen aislados en tu cuenta.',
    card3Title: 'Guardrails Activos',
    card3Body: 'Safe probes solo en dominios con propiedad verificada.',
    openSourceLabel: 'Código abierto en GitHub:',
  },
  footer: {
    versionTooltip: 'Ver changelog y novedades de cada versión',
    stackSummary: 'SCA / SBOM · OSV · NVD · EPSS · CISA KEV · 19 Safe Probes',
    linksAria: 'Enlaces del proyecto',
    changelog: 'Changelog',
    repository: 'Repositorio',
    security: 'Seguridad',
    contributing: 'Contribuir',
    license: 'Licencia MIT',
    localFirst: 'Local-First (IndexedDB) · Sin base en la nube',
    defensiveUse: 'Uso estrictamente defensivo y autorizado (GET/HEAD)',
    copyright: '© {year} Brynja Contributors · Open-Source (MIT)',
  },
  dashboard: {
    loading: 'Verificando sesión y cargando panel...',
    badge: 'Pipeline Proactivo con Guardrails No Destructivos',
    title: 'Panel de Vulnerabilidades y Verificación Activa',
    description:
      'Analiza dependencias del repositorio mediante OSV.dev, NVD, EPSS y CISA KEV, y ejecuta sondas controladas únicamente en objetivos con propiedad verificada.',
    authorizeTarget: 'Autorizar Objetivo',
    newScan: 'Nuevo Escaneo',
    kpiScans: 'Escaneos',
    kpiDependencies: 'Dependencias',
    kpiCriticalHigh: 'Críticas y Altas (CVEs)',
    kpiConfirmed: 'Confirmadas / Sondas',
    kpiStaticIssues: 'Código, Secretos e IaC',
    historyTitle: 'Historial de Escaneos',
    historySubtitle:
      'Selecciona una evaluación para inspeccionar SBOM, CVEs, EPSS, Safe Probes y descargar el PDF ejecutivo.',
    viewFullHistory: 'Ver historial completo',
    loadingScans: 'Cargando escaneos...',
    emptyTitle: 'Aún no hay escaneos ejecutados en esta cuenta.',
    emptySubtitle:
      'Inicia un escaneo seleccionando un repositorio de GitHub o cargando los manifiestos de ejemplo.',
    createFirstScan: 'Crear primer escaneo',
  },
  history: {
    loading: 'Cargando historial de escaneos...',
    badge: 'Historial Local (IndexedDB) · Aislado por Cuenta GitHub',
    title: 'Historial de Escaneos',
    description:
      'Consulta todos los análisis previos de dependencias (SBOM/CVEs) y ejecuciones de Safe Probes, filtra por estado o alcance y exporta informes en PDF, JSON, Markdown o CycloneDX.',
    kpiTotal: 'Total de Evaluaciones',
    kpiCompleted: 'Completadas',
    kpiWithProbes: 'Con Safe Probes',
    kpiCritHigh: 'Con Críticas / Altas (CVEs)',
    kpiWithStatic: 'Con Código / IaC',
    searchPlaceholder:
      'Filtrar por repositorio, rama, ecosistema u objetivo staging...',
    filterStatusAria: 'Filtrar por estado',
    allStatuses: 'Todos los estados',
    scopeAll: 'Todas',
    scopeWithProbes: 'Safe Probes',
    scopeScaOnly: 'Solo SCA',
    foundTitle: 'Evaluaciones Encontradas ({count})',
    foundSubtitle:
      'Haz clic en cualquier evaluación para abrir el informe interactivo o descargar el PDF ejecutivo.',
    emptyAccountTitle: 'Aún no hay escaneos ejecutados en esta cuenta.',
    emptyFilterTitle: 'Ningún escaneo coincide con los filtros aplicados.',
    emptyAccountSubtitle:
      'Ejecuta tu primera evaluación para consultar tu historial aquí.',
    emptyFilterSubtitle:
      'Ajusta la búsqueda o los filtros de estado/alcance arriba.',
    importButton: 'Importar SARIF / Trivy / Semgrep',
    importingButton: 'Importando...',
    importSuccess:
      'Informe externo "{name}" importado y guardado localmente en IndexedDB.',
    importErrorFallback: 'No se pudo importar el archivo JSON/SARIF.',
    compareButton: 'Comparar 2 Escaneos',
    diffTitle: 'Comparación entre Escaneos (Diff)',
    diffSubtitle:
      'Compara un escaneo base con uno más reciente para identificar nuevos CVEs, hallazgos resueltos, deltas estáticos y evolución de cumplimiento CIS/NIST.',
    diffBaselineLabel: 'Escaneo Base (anterior)',
    diffCurrentLabel: 'Escaneo Actual (comparado)',
    diffRunButton: 'Comparar Seleccionados',
    diffSameScanError: 'Selecciona dos escaneos distintos para compararlos.',
    diffLoadError: 'Error al cargar los informes para comparación.',
    diffNewVulns: 'Nuevas Vulnerabilidades',
    diffResolvedVulns: 'Resueltas',
    diffPersistentVulns: 'Persistentes',
    diffProbeDelta: 'Delta Safe Probes',
    diffStaticDelta: 'Delta Estático',
    diffCisDelta: 'CIS v8',
    diffNistDelta: 'NIST CSF 2.0',
    diffNoChanges:
      'No hay diferencias de vulnerabilidades ni hallazgos estáticos entre ambos escaneos.',
  },
  historyTable: {
    colRepository: 'Repositorio',
    colStatus: 'Estado',
    colDependencies: 'Dependencias',
    colSeverity: 'Severidad',
    colStagingTarget: 'Objetivo Staging',
    colAction: 'Acción',
    governanceBtn: 'Gobernanza',
    governanceTitle: 'Abrir Gobernanza y Cumplimiento para {name}',
    viewReport: 'Ver Informe',
    deleteAria: 'Eliminar escaneo {name}',
    deleteTitle: 'Eliminar del historial',
    critShort: 'C',
    highShort: 'A',
    medShort: 'M',
    lowShort: 'B',
    probeShort: 'P',
    staticShort: 'E',
    critTitle: '{count} Crítica(s) (CVEs)',
    highTitle: '{count} Alta(s) (CVEs)',
    medTitle: '{count} Media(s) (CVEs)',
    lowTitle: '{count} Baja(s) (CVEs)',
    probeTitle: '{count} Probe(s) con problema(s)',
    staticTitle: '{count} hallazgo(s) en Código, Secretos e IaC',
  },
  newScan: {
    loading: 'Verificando sesión de GitHub...',
    title: 'Nuevo Escaneo de Seguridad',
    description:
      'Elige un repositorio privado o público de tu cuenta de GitHub, ingresa una URL Git pública o pega manifiestos directamente para análisis SCA y verificación activa controlada.',
    loadSample: 'Cargar Ejemplo Vulnerable',
    tabGithub: 'GitHub OAuth',
    tabPublicUrl: 'URL Git Pública',
    tabManifests: 'Pegar Manifiestos',
    checkingGithub: 'Verificando conexión con GitHub...',
    oauthPendingTitle: 'Configuración de GitHub OAuth App pendiente en .env',
    oauthPendingBody:
      'Registra una GitHub OAuth App usando el callback debajo y configura GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET en las variables de entorno (.env.local o Vercel):',
    connectTitle: 'Conectar tu cuenta de GitHub',
    connectSubtitle:
      'Genera un token efímero de sesión para leer manifiestos de repositorios privados y públicos.',
    connectButton: 'Conectar GitHub',
    selectRepoLabel: 'Seleccionar Repositorio ({count})',
    refreshList: 'Actualizar lista',
    filterPlaceholder: 'Filtrar repositorios personales o de organizaciones...',
    noReposFound: 'No se encontraron repositorios.',
    orgBadge: 'Org',
    privateBadge: 'Privado',
    publicBadge: 'Público',
    orgNoticeLead: '¿Falta alguna Organización?',
    orgNoticeBody:
      'En GitHub, las organizaciones bloquean las OAuth Apps por defecto hasta que pulses Grant (o solicites aprobación al admin) en los permisos de la app.',
    grantOrgsButton: 'Habilitar Orgs en GitHub',
    updateOrgScope: 'Actualizar permiso read:org',
    selectedRepoLabel: 'Repositorio Seleccionado',
    selectedRepoPlaceholder: 'https://github.com/usuario/repo-privado',
    branchLabel: 'Rama',
    publicRepoLabel: 'URL del Repositorio Público (HTTPS)',
    publicRepoPlaceholder: 'https://github.com/usuario/proyecto-publico',
    projectIdLabel: 'Identificador del Proyecto',
    projectIdPlaceholder: 'manifest://mi-proyecto',
    primaryFileLabel: 'Archivo Principal',
    manifestContentLabel: 'Contenido de {name}',
    extraRequirementsLabel: 'requirements.txt adicional (opcional)',
    submitting: 'Iniciando escaneo...',
    submitButton: 'Ejecutar Escaneo',
    startErrorFallback: 'No se pudo iniciar el escaneo.',
    enableStaticLabel: 'Incluir Análisis Estático (Secretos, IaC/CI, SAST Ligero y Postura GitHub)',
    enableStaticHint:
      'Inspecciona archivos prioritarios vía GitHub API con enmascaramiento automático de secretos.',
    probesTitle: 'Safe Probes (Opcional)',
    authorizeTargetLink: 'Autorizar objetivo',
    probesDescription:
      'Solo los objetivos con propiedad verificada criptográficamente aparecen debajo. Las sondas ejecutan solo GET/HEAD con rate limit y auditoría.',
    probesNoneOption: 'Solo SCA + CVEs (sin sondas activas)',
    viewProbesCatalog: 'Ver los {count} tipos de Safe Probes abajo',
    probesReadyLink: '{count} Safe Probes listos para este objetivo',
    pipelineTitle: 'Pipeline de Evaluación',
    pipelineSteps: [
      'Inventario SBOM (npm, pnpm, pip, pyproject)',
      'Consulta por lotes en la API pública OSV.dev',
      'Enriquecimiento CVSS/CWE (NVD 2.0)',
      'Probabilidad real (EPSS) + CISA KEV',
      'Safe Probes autorizadas + auditoría local',
    ],
  },
  safeProbesCatalog: {
    title: 'Tipos de Safe Probes Ejecutados',
    subtitle:
      'Sondas activas 100% no destructivas (solo lectura mediante GET/HEAD) que se ejecutan únicamente cuando seleccionas un objetivo con certificado criptográfico de propiedad verificado.',
    countBadge: '{count} probes activos',
    readOnlyBadge: 'Solo GET / HEAD',
    statusActiveForTarget: 'Activos para {origin}',
    statusInactiveHint: 'Se ejecutan al seleccionar un objetivo verificado arriba',
    filterAll: 'Todos ({count})',
    categories: {
      'headers-tls': 'Cabeceras y TLS',
      'cookies-cors': 'Cookies y CORS',
      exposure: 'Exposición',
      runtime: 'Runtime y Código',
    },
    whatItChecksLabel: 'Qué verifica',
    maxSeverityPrefix: 'Hasta {severity}',
    guardrailsNote:
      'Guardrails activos en cada probe: certificado criptográfico de propiedad obligatorio, protección anti-SSRF vía DNS, rate limit + circuit breaker y cero almacenamiento de valores sensibles.',
    items: SAFE_PROBE_ITEMS_ES,
  },
  scanReport: {
    loading: 'Cargando informe...',
    notFound: 'Informe no encontrado.',
    copyIdTitle: 'Copiar ID completo: {id}',
    targetPrefix: 'Objetivo: {host}',
    scaOnlyBadge: 'Solo SCA (sin objetivo staging)',
    exportReportLabel: 'Exportar Informe',
    exportDropdownMenuLabel: 'Opciones de exportación del informe',
    exportOnlyPdfHint:
      'Sin errores detectados — solo el PDF Ejecutivo permanece habilitado.',
    generatingPdf: 'Generando PDF...',
    executivePdf: 'PDF Ejecutivo (Dirección)',
    executivePdfTitle:
      'Informe ejecutivo en PDF para gerencia y dirección con explicación de problemas y plan de soluciones',
    executivePdfMenuHint: 'Para gerencia y dirección (problemas y soluciones)',
    aiJson: 'JSON para IA',
    aiJsonTitle:
      'Descargar JSON estructurado y conciso para modelos de IA enfocado en resolver cada problema',
    aiJsonMenuHint: 'JSON conciso enfocado en corrección para modelos de IA',
    copyAiJsonLabel: 'Copiar JSON para IA',
    copyAiJsonTitle: 'Copiar JSON para IA al portapapeles',
    copyAiJsonMenuHint: 'Copiar directo para pegar en tu chat o agente de IA',
    copiedAiJsonLabel: '¡JSON para IA copiado!',
    otherExportsLabel: 'Otros formatos técnicos',
    disabledNoErrorsBadge: 'Sin errores',
    rawJsonLabel: 'JSON Completo',
    markdownLabel: 'Markdown',
    sbomLabel: 'SBOM (CycloneDX)',
    sarifLabel: 'SARIF 2.1.0',
    spdxLabel: 'SBOM (SPDX 2.3)',
    complianceExcelLabel: 'Excel Cumplimiento (.xlsx)',
    aiAdvisor: {
      badge: 'Inteligencia AppSec (BYOK)',
      title: 'Asesor de Triaje y Reachability con IA (BYOK)',
      subtitle:
        'Usa tu propia clave API (OpenAI, Gemini o endpoint compatible) para priorizar correcciones según imports reales en el código.',
      configureButton: 'Configurar y Generar Plan IA',
      hideConfig: 'Ocultar Configuración',
      providerLabel: 'Proveedor de IA',
      providerOpenAi: 'OpenAI (ChatGPT API)',
      providerGemini: 'Google Gemini API',
      providerCustom: 'Endpoint Compatible (OpenAI API)',
      apiKeyLabel: 'Tu Clave / Token API (BYOK)',
      apiKeyPlaceholder: 'sk-... o AIza...',
      modelLabel: 'Modelo (opcional)',
      endpointLabel: 'URL de Endpoint Personalizado',
      endpointPlaceholder: 'https://api.openai.com/v1/chat/completions',
      securityNotice:
        'Privacidad BYOK: tu clave permanece solo en tu navegador (opt-in) y se envía únicamente por petición, nunca en cookies ni base en la nube. Solo se envían metadatos sanitizados, jamás valores de secretos.',
      saveLocallyLabel: 'Guardar clave solo en este navegador (localStorage)',
      clearSavedKey: 'Limpiar Clave',
      generateButton: 'Generar Plan con IA',
      regenerateButton: 'Regenerar Plan con IA',
      generatingButton: 'Analizando hallazgos...',
      generatedByLabel: 'Generado por {model}',
      stepsCountLabel: '{count} acciones priorizadas',
      summaryTitle: 'Diagnóstico Ejecutivo de la IA',
      reachabilityTitle: 'Dependencias Importadas en Código (Reachability)',
      stepsTitle: 'Pasos Priorizados de Remediación',
      errorMissingKey:
        'Ingresa tu token de OpenAI, Gemini o endpoint compatible antes de generar.',
      errorFallback: 'No se pudo generar el plan con el proveedor de IA.',
    },
    allClearBadge: '100% Aprobado',
    allClearTitle:
      'Escudo Íntegro — ¡Todas las pruebas pasaron sin errores!',
    allClearBodyWithProbes:
      '¡Excelente trabajo! {deps} dependencia(s) analizada(s) y {probes} Safe Probe(s) verificados sin vulnerabilidades ni fallos de seguridad detectados.',
    allClearBodyScaOnly:
      '¡Excelente trabajo! {deps} dependencia(s) analizada(s) en el inventario SBOM sin vulnerabilidades conocidas detectadas.',
    noVulnsCleanState:
      '¡Todo limpio! No se detectaron vulnerabilidades en las {deps} dependencia(s) analizada(s).',
    noVulnsButProbeFindings:
      'No se encontraron vulnerabilidades en dependencias (SCA), pero hay {count} hallazgo(s) en la pestaña Safe Probes.',
    executionError: 'Error de ejecución: {message}',
    kpiDependencies: 'Dependencias',
    kpiCritical: 'Críticas (CVEs)',
    kpiHigh: 'Altas (CVEs)',
    kpiMedium: 'Medias (CVEs)',
    kpiConfirmed: 'Confirmadas / Sondas',
    kpiProbesSublabel: '{count} sonda(s) c/ fallo',
    kpiStatic: 'Código e IaC',
    kpiStaticCritHighSublabel: '{count} Crít/Alta',
    kpiCompliance: 'Cumplimiento',
    tabFindings: 'Vulnerabilidades ({count})',
    tabDependencies: 'Inventario SBOM ({count})',
    tabProbes: 'Safe Probes ({count})',
    tabAudit: 'Auditoría ({count})',
    tabStatic: 'Código, Secretos e IaC ({count})',
    tabCompliance: 'Cumplimiento ({score}%)',
    noStaticFindings:
      'No se detectaron fugas de secretos, fallos IaC/CI ni patrones SAST inseguros en los archivos analizados.',
    staticCategoryAll: 'Todas las categorías',
    staticCategories: {
      SECRET_LEAK: 'Secreto Expuesto',
      IAC_MISCONFIG: 'IaC / Contenedor',
      CI_CD_RISK: 'CI/CD Pipeline',
      SAST_PATTERN: 'SAST Código',
      REPO_POSTURE: 'Postura GitHub',
    },
    searchPlaceholder: 'Buscar paquete, CVE o título...',
    allSeverities: 'Todas las Severidades',
    allVerdicts: 'Todos los Veredictos',
    onlyKev: 'Solo CISA KEV',
    noFindingsFiltered:
      'No se encontraron vulnerabilidades para los filtros aplicados.',
    kevBadge: 'CISA KEV (Explotación Activa)',
    upgradeTo: '→ Actualizar a ≥ {version}',
    sbomColLibrary: 'Biblioteca',
    sbomColVersion: 'Versión',
    sbomColEcosystem: 'Ecosistema',
    sbomColSource: 'Archivo',
    sbomColPurl: 'PURL',
    noProbesExecuted: 'No se ejecutaron sondas activas en este escaneo.',
    evidenceLabel: 'Evidencia:',
    recommendationLabel: 'Recomendación:',
    auditColTimestamp: 'Fecha/Hora',
    auditColOutcome: 'Resultado',
    auditColMethodPath: 'Método / Ruta',
    auditColHttp: 'HTTP',
    auditColDetails: 'Detalles',
    noAuditEvents: 'No hay eventos de sondas registrados para este escaneo.',
  },
  authorizations: {
    loading: 'Cargando objetivos autorizados...',
    badge: 'Cláusula de Seguridad Activa',
    title: 'Objetivos Autorizados y Guardrails',
    description:
      'Ninguna sonda activa se ejecuta sin prueba criptográfica de propiedad del dominio. Todas las comprobaciones son estrictamente GET/HEAD no destructivas, con anti-SSRF, rate limit y auditoría.',
    formTitle: 'Registrar Nuevo Objetivo de Staging',
    targetUrlLabel: 'URL Base del Objetivo',
    targetUrlPlaceholder: 'https://staging.tuempresa.com',
    methodLabel: 'Método de Prueba',
    methodWellKnown: 'Archivo /.well-known/security.txt (RFC 9116)',
    methodDns: 'Registro DNS TXT (_brynja)',
    methodSandbox: 'Sandbox Loopback Local (dev)',
    generateButton: 'Generar Desafío de Propiedad',
    instructionPrefix: 'Instrucción de Verificación:',
    invalidTargetUrl:
      'Ingresa un dominio o URL válido (ej.: tusitio.com o https://staging.tuempresa.com).',
    createErrorFallback: 'Error al crear el desafío.',
    verifyErrorFallback: 'Error al verificar la propiedad del dominio.',
    revokeErrorFallback: 'Error al revocar y eliminar la autorización.',
    guardrailsTitle: 'Guardrails Obligatorios',
    guardrails: [
      'Bloqueo anti-SSRF de redes privadas y metadatos cloud',
      'Solo peticiones GET / HEAD no destructivas',
      'Rate limit por escaneo y circuit breaker ante 429 / 5xx',
      'Certificado firmado (7 días) con renovación automática mientras la prueba siga publicada',
      'Historial y auditoría guardados localmente en el navegador (IndexedDB)',
    ],
    registeredTitle: 'Objetivos Registrados ({count})',
    registeredSubtitle: 'Vinculados exclusivamente a tu cuenta de GitHub.',
    emptyRegistered:
      'Aún no hay objetivos registrados. Genera un desafío a la izquierda para habilitar safe probes.',
    tokenPrefix: 'Token:',
    copyTokenTitle: 'Copiar token',
    howToSetup: 'Cómo configurar',
    verifyOwnership: 'Verificar Propiedad',
    revoke: 'Revocar',
    remove: 'Eliminar',
    removing: 'Eliminando...',
    removePermanently: 'Eliminar permanentemente',
  },
  setupGuide: {
    eyebrow: 'Guía Paso a Paso de Configuración',
    title: 'Cómo demostrar la propiedad de tu dominio (principiantes y SSH)',
    subtitlePrefix:
      'Sigue los pasos debajo para habilitar las sondas seguras en tu sitio.',
    subtitleReady:
      'Los comandos de abajo ya están rellenados con el dominio y token de tu objetivo.',
    subtitleDraftReady:
      'Los comandos de abajo se actualizaron dinámicamente para {origin} con tu token real listo para copiar y ejecutar en la terminal.',
    subtitleResolving:
      'Preparando tu token real de verificación para {origin}...',
    subtitlePlaceholder:
      'Ingresa la URL de tu objetivo arriba o genera un desafío para rellenar automáticamente todos los comandos con tu token real.',
    commandsReadyFor: 'Comandos listos para',
    resolvingTokenFor: 'Preparando token para',
    tokenReadyBadge: 'Token real listo para copiar',
    copyingToken: 'Preparando...',
    copyDnsTokenTitle: 'Copiar valor del token DNS TXT',
    step1Title: 'Genera el código (token)',
    step1Body:
      'Ingresa la URL de tu sitio arriba, elige el método y haz clic en Generar Desafío de Propiedad.',
    step2Title: 'Publica la prueba en tu sitio o DNS',
    step2Body:
      'Elige una opción debajo (terminal SSH remoto, proyecto web/cPanel o panel DNS) y pega el token exacto.',
    step3Title: 'Haz clic en Verificar Propiedad',
    step3Body:
      'Brynja comprueba la prueba y emite un certificado de 7 días (renovado automáticamente mientras el archivo o registro DNS siga publicado).',
    tabWellKnown: 'Archivo /.well-known (Recomendado)',
    tabDns: 'Registro DNS TXT',
    tabSandbox: 'Sandbox Local (dev)',
    wellKnownIntroPrefix: 'El objetivo es que la URL',
    wellKnownIntroSuffix:
      'responda públicamente en formato RFC 9116 (con Contact, Expires y el comentario `# Brynja-Verification` de tu token, acreditando propiedad y cumpliendo la sonda RFC 9116 a la vez). Elige cómo publicas:',
    subtabSsh: 'Por Terminal Remoto (SSH)',
    subtabWeb: 'Sin SSH (Vercel / Proyecto / cPanel)',
    sshStep1Title: 'Paso 1 — Conectar al servidor remoto por terminal',
    sshStep1Body:
      'Abre la terminal de tu equipo (Linux, macOS o PowerShell/WSL en Windows) y conéctate por SSH:',
    sshStep1Label: 'Terminal local → SSH',
    sshStep1Caption:
      "Reemplaza 'usuario' por tu usuario del servidor (ej.: root, ubuntu, deploy) o usa un alias de tu ~/.ssh/config.",
    sshStep2Title:
      'Paso 2 — Crear la carpeta .well-known y guardar security.txt (RFC 9116)',
    sshStep2Body:
      'Ya conectado al servidor remoto, ejecuta el comando para crear la carpeta y generar security.txt con Contact, Expires y el token de Brynja (o agrega la línea `# Brynja-Verification:` si ya tienes uno):',
    sshStep2Label: 'Servidor remoto (Linux / VPS)',
    sshStep2Caption:
      'Si la raíz web de tu sitio no es /var/www/html (ej.: /var/www/misitio/public o /usr/share/nginx/html), cambia la ruta antes de ejecutar.',
    proxySelectorAriaStep3: 'Seleccionar servidor proxy inverso (Paso 3)',
    proxySelectorAriaStep5: 'Seleccionar servidor proxy inverso (Paso 5)',
    proxyNginx: 'Nginx',
    proxyApache: 'Apache',
    sshStep3Title:
      'Paso 3 — (Opcional y común) Si usas proxy inverso (Nginx o Apache)',
    sshStep3BodyBefore:
      'Si tu sitio corre en Node.js, Next.js, Docker o Python detrás de Nginx (',
    sshStep3BodyMiddle:
      '), Nginx puede reenviar la ruta a tu app/contenedor y devolver 404. Primero localiza el archivo activo y agrega este bloque dentro de',
    sshStep3BodyAfter: 'en el archivo activo bajo',
    sshStep3NginxFindActiveLabel:
      'Localizar el archivo Nginx realmente activo para el dominio',
    sshStep3NginxFindActiveCaption:
      'Atención: si en /etc/nginx/sites-enabled/ el archivo aparece SIN flecha (->), es una copia física (no un enlace simbólico de sites-available). Edita ese archivo en sites-enabled/ directamente, siempre dentro del bloque "listen 443 ssl" para HTTPS.',
    sshStep3Label: 'Bloque Nginx (bloque server 443 del archivo activo)',
    sshStep3NginxSnippetCaption:
      'Usa "location = /.well-known/security.txt" (coincidencia exacta): prevalece sobre el proxy_pass a contenedores Docker (ej.: 127.0.0.1:3000) sin entrar en conflicto con Certbot (/.well-known/acme-challenge/).',
    sshStep3ReloadLabel: 'Validar sintaxis y recargar Nginx sin cortes',
    sshStep3ApacheBodyBefore:
      'Si tu sitio corre en Node.js, Next.js, Docker o Python detrás de Apache (',
    sshStep3ApacheBodyMiddle:
      '), Apache puede reenviar la ruta a tu app/contenedor y devolver 404. Primero localiza el archivo activo y agrega este bloque dentro de',
    sshStep3ApacheBodyAfter: 'en el archivo activo bajo',
    sshStep3ApacheBodyOr: 'o',
    sshStep3ApacheFindActiveLabel:
      'Localizar el archivo Apache realmente activo para el dominio',
    sshStep3ApacheFindActiveCaption:
      'Atención: si en /etc/apache2/sites-enabled/ el archivo aparece SIN flecha (->), es una copia física (no un enlace simbólico). Edita ese archivo activo directamente dentro de <VirtualHost *:443>.',
    sshStep3ApacheLabel:
      'Bloque Apache (/etc/apache2/sites-enabled/... o /etc/httpd/conf.d/...)',
    sshStep3ApacheCaption:
      'Importante: coloca "ProxyPass /.well-known/ !" ANTES de "ProxyPass / ...". Si tu proxy usa <Location />, agrega "<Location /.well-known/> ProxyPass ! </Location>" después; si usa mod_rewrite ([P]), añade "RewriteCond %{REQUEST_URI} !^/\\.well-known/".',
    sshStep3ApacheReloadLabel: 'Validar sintaxis y recargar Apache sin cortes',
    sshStep3ApacheReloadCaption:
      'En RHEL, Rocky, Alma, CentOS o Fedora, ejecuta: sudo httpd -t && sudo systemctl reload httpd',
    sshStep3ContainerNoteLead: '¿Tu servidor corre en contenedores Docker?',
    sshStep3ContainerNoteBody:
      'Si la app corre en Docker (ej.: Next.js/Node en 127.0.0.1:3000) detrás de Nginx/Apache en el host, guarda el archivo en /var/www/html/.well-known/ en el host y edita el proxy activo del host. Si el propio proxy inverso corre en un contenedor (Traefik, Caddy, Nginx Proxy Manager), sirve el archivo desde ese contenedor o usa la pestaña "Registro DNS TXT" sin tocar contenedores.',
    sshStep4Title: 'Paso 4 — Comprobar desde la terminal que quedó público',
    sshStep4Body:
      'Ejecuta el comando debajo (en el servidor o en tu equipo). Debe mostrar tu security.txt con Contact, Expires y el token de verificación:',
    sshStep4Label: 'Prueba rápida con curl',
    sshStep4Caption:
      'La salida esperada incluye "# Brynja-Verification: {token}". Si aparece, sube y haz clic en "Verificar Propiedad".',
    sshStep5Title:
      'Paso 5 — (Opcional) Revertir todo: eliminar el archivo, la carpeta .well-known y el Paso 3 (Nginx / Apache)',
    sshStep5Body:
      'Cuando quieras dejar el servidor exactamente como estaba antes (o revocar el acceso), sigue estos pasos. Consejo RFC 9116: para mantener security.txt activo en producción, elimina solo la línea "# Brynja-Verification:" en lugar de borrar todo el archivo. Atención: eliminar el token impide la renovación automática a los 7 días.',
    sshStep5RemoveFileLabel:
      '5.1 — Eliminar .well-known/security.txt y la carpeta .well-known (si queda vacía)',
    sshStep5RemoveFileCaption:
      'Borra security.txt y elimina la carpeta .well-known solo si queda vacía (preservando carpetas como acme-challenge de Certbot/Let’s Encrypt). Ajusta /var/www/html si usaste otra raíz web.',
    sshStep5NginxBodyBefore:
      'Si agregaste el bloque del Paso 3 en Nginx, localiza el archivo de configuración con el comando de abajo, elimina el bloque',
    sshStep5NginxBodyAfter:
      '(solo si no lo usa Certbot/Let’s Encrypt), guarda y recarga Nginx:',
    sshStep5NginxFindLabel: '5.2 — Localizar el bloque en Nginx (Paso 3)',
    sshStep5NginxReloadLabel:
      '5.3 — Validar y recargar Nginx tras quitar el bloque del Paso 3',
    sshStep5ApacheBodyBefore:
      'Si agregaste las directivas del Paso 3 en Apache, localiza el archivo de configuración con el comando de abajo, elimina el bloque',
    sshStep5ApacheBodyAfter:
      '(solo si no lo usa Certbot/Let’s Encrypt), guarda y recarga Apache:',
    sshStep5ApacheFindLabel: '5.2 — Localizar el bloque en Apache (Paso 3)',
    sshStep5ApacheReloadLabel:
      '5.3 — Validar y recargar Apache tras quitar el bloque del Paso 3',
    sshStep5VerifyLabel:
      '5.4 — Confirmar desde la terminal que el archivo fue eliminado',
    sshStep5VerifyCaption:
      'Debe devolver HTTP 404 (o la ruta por defecto de tu app). Para finalizar, haz clic también en "Revocar" en la lista de objetivos de arriba.',
    webOptionATitle:
      'Opción A — Proyecto Web (Next.js, React, Vite, Vercel, Netlify)',
    webOptionAStep1: 'Abre la carpeta public/ en la raíz de tu proyecto.',
    webOptionAStep2:
      'Crea dentro una subcarpeta llamada .well-known (con el punto inicial).',
    webOptionAStep3:
      'Crea (o actualiza) el archivo public/.well-known/security.txt con el formato RFC 9116 de abajo (Contact, Expires y `# Brynja-Verification: <token>`).',
    webOptionAStep4:
      'Haz commit/deploy y abre {url} en tu navegador para comprobarlo.',
    webOptionACodeLabel: 'Contenido recomendado de security.txt (RFC 9116 + prueba)',
    webOptionBTitle: 'Opción B — Panel de Hosting (cPanel, Hostinger, FTP)',
    webOptionBStep1:
      'Abre el Administrador de Archivos y entra en la carpeta pública del sitio (normalmente public_html).',
    webOptionBStep2:
      'En los ajustes del administrador, activa Mostrar archivos ocultos (dotfiles).',
    webOptionBStep3:
      'Crea la carpeta .well-known (si no existe) y crea o edita el archivo security.txt dentro de ella.',
    webOptionBStep4:
      'Pega el contenido RFC 9116 completo (o añade la línea # Brynja-Verification a tu security.txt existente), guarda y haz clic en Verificar Propiedad en Brynja.',
    webCleanupTitle:
      'Cómo revertir y eliminar .well-known/security.txt después (opcional)',
    webCleanupBody:
      'En proyectos web (Next.js/React/Vercel/Netlify), ejecuta el comando en la raíz del proyecto para eliminar el archivo completo (o borra solo la línea # Brynja-Verification para mantener RFC 9116). En cPanel/FTP, elimina el archivo o la línea de verificación.',
    webCleanupCodeLabel: 'Eliminar archivo y carpeta .well-known en proyecto web',
    dnsIntro:
      'Ideal si no tienes acceso a los archivos del servidor pero administras el DNS del dominio (Cloudflare, Route 53, GoDaddy, Vercel DNS). Crea un registro con estos valores:',
    dnsColType: 'Tipo',
    dnsColName: 'Nombre / Host',
    dnsColValue: 'Valor / Contenido',
    dnsColTtl: 'TTL',
    dnsHostAlt: '(o _brynja.{hostname})',
    dnsTtlValue: 'Auto / 300s',
    dnsCheckTitle: 'Comprobar propagación DNS por terminal (opcional)',
    dnsCheckBody:
      'Tras guardar en tu panel DNS (suele propagarse en 1 a 10 minutos), pruébalo desde la terminal antes de pulsar Verificar Propiedad:',
    dnsCheckLabel: 'Terminal (Linux / macOS / Windows)',
    dnsCheckCaption:
      'Cuando la salida muestre "{token}", el DNS ya se propagó y la verificación se aprobará de inmediato.',
    sandboxIntro:
      'Este modo sirve únicamente para probar una aplicación local en tu propia máquina (http://localhost:3000, http://127.0.0.1:8080). Por protección anti-SSRF permanece bloqueado en Vercel.',
    sandboxCodeLabel: 'En tu .env.local (solo desarrollo local)',
    sandboxCodeCaption:
      'Tras guardarlo en .env.local, reinicia el servidor local (pnpm dev), genera el desafío para http://localhost:<puerto> y haz clic en Verificar Propiedad.',
    troubleshootingTitle: 'Solución rápida si falla la verificación',
    tip1Lead: 'Devolvió una página HTML o 404:',
    tip1Body:
      'comprueba que el proxy inverso (Nginx/Apache/Cloudflare/Vercel rewrites) no esté interceptando /.well-known/, redirigiendo (301/302) o devolviendo el index de la app.',
    tip2Lead: 'No borres la prueba tras verificar:',
    tip2Body:
      'mantener el archivo o el registro TXT publicado permite que Brynja renueve tu certificado automáticamente a los 7 días sin reconfigurar.',
    tip3Lead: '¿Quieres revocar el acceso?',
    tip3Body:
      'solo elimina el archivo en tu servidor (o el registro DNS TXT) y pulsa el botón Revocar en la lista de objetivos de arriba.',
    tip4Lead: '¿Editaste sites-available pero sigue dando 404 (ej.: Next.js/Docker)?',
    tip4Body:
      'comprueba si sites-enabled/ tiene una copia física en lugar de enlace simbólico, confirma que el bloque esté en el virtual host HTTPS (puerto 443) y espera ~1s tras el reload antes de probar con curl.',
    placeholderOrigin: 'https://tusitio.com',
    placeholderHost: 'tusitio.com',
    placeholderToken: 'brynja-verify-TU_TOKEN_GENERADO',
    dnsAltComment: '# Alternativa (Windows / Linux / macOS):',
  },
  audit: {
    loading: 'Cargando auditoría...',
    title: 'Registro Inmutable de Auditoría',
    description:
      'Todos los eventos de verificación de propiedad, bloqueos anti-SSRF, rate limiting y ejecución de safe probes de tu cuenta se guardan localmente en el navegador (IndexedDB).',
    kpiTotal: 'Total de Eventos',
    kpiAllowed: 'Autorizados / Ejecutados',
    kpiBlocked: 'Bloqueados por Guardrail',
    colDate: 'Fecha/Hora',
    colOutcome: 'Resultado',
    colTarget: 'Objetivo',
    colProbeMethod: 'Sonda / Método',
    colStatus: 'Estado',
    colDetails: 'Detalles',
    loadingRows: 'Cargando registros...',
    emptyRows: 'Aún no hay eventos registrados.',
  },
  changelog: {
    badge: 'Versión Actual: v{version} · SemVer 2.0.0',
    title: 'Historial de Versiones (Changelog)',
    description:
      'Consulta todas las funcionalidades, mejoras de arquitectura y correcciones de seguridad lanzadas en cada versión de Brynja.',
    ptGithub: 'PT-BR en GitHub',
    enGithub: 'English (CHANGELOG.md)',
    empty: 'Aún no hay versiones registradas en el changelog.',
    latestBadge: 'Más reciente',
    spanishFallbackNote:
      'Las notas detalladas de versión se muestran abajo en inglés (fuente oficial CHANGELOG.md).',
  },
  compliance: {
    tabTitle: 'Scorecard de Cumplimiento y Marcos',
    tabSubtitle:
      'Mapeo automático de la evidencia técnica recopilada en este escaneo (SCA/SBOM, CWE/KEV, Safe Probes y Auditoría) hacia CIS Controls v8, NIST CSF 2.0, OWASP y LGPD/ISO 27001.',
    frameworkSelectorLabel: 'Marco normativo',
    igFilterLabel: 'Grupo CIS',
    igAll: 'Todos (IG1–IG3)',
    statusFilterLabel: 'Filtrar estado',
    allStatuses: 'Todos los estados',
    kpiTechnicalAdherence: 'Adherencia Técnica',
    kpiOverallAdherence: 'Adherencia Global',
    kpiCompliant: 'Conformes',
    kpiGaps: 'Brechas',
    kpiPending: 'Manuales / Pendientes',
    domainBreakdownTitle: 'Cobertura por Dominio / Función',
    scopeTechnical: 'Automático (Técnico)',
    scopeHybrid: 'Híbrido (Técnico + GRC)',
    scopeOrganizational: 'Organizacional (GRC)',
    evidencePrefix: 'Evidencia:',
    guidancePrefix: 'Guía:',
    linkedAssessmentNote:
      'Combinado con la evaluación GRC "{name}" guardada localmente en tu navegador.',
    openGovernanceCta: 'Completar atestaciones en Gobernanza (GRC)',
    emptyFiltered: 'No se encontraron controles para los filtros aplicados.',
    statusLabels: {
      COMPLIANT_EVIDENCE: 'Conforme (Evidencia Técnica)',
      MANUAL_ATTESTED: 'Atestado (GRC)',
      PARTIAL: 'Parcial',
      GAP_DETECTED: 'Brecha Detectada',
      MANUAL_REQUIRED: 'Requiere Atestación Manual',
      NOT_EVALUATED: 'No Evaluado (Solo SCA)',
      NOT_APPLICABLE: 'No Aplicable',
    },
    governance: {
      loading: 'Cargando evaluaciones de gobernanza...',
      badge: 'GRC Local-First (IndexedDB) · Sin Base en la Nube',
      title: 'Gobernanza y Cumplimiento (CIS Controls · NIST CSF 2.0)',
      description:
        'Combina evidencias técnicas automáticas de tus análisis con atestaciones organizacionales de políticas, MFA, respaldos y respuesta a incidentes — todo guardado localmente en tu navegador.',
      newAssessmentBtn: 'Nueva Evaluación GRC',
      defaultAssessmentName: 'Evaluación de Seguridad y Cumplimiento',
      emptyTitle: 'Aún no hay evaluaciones GRC creadas.',
      emptySubtitle:
        'Crea una evaluación vinculada a un informe para prellenar los controles técnicos de CIS Controls v8, NIST CSF 2.0, OWASP y LGPD/ISO 27001.',
      assessmentsListTitle: 'Evaluaciones Guardadas ({count})',
      assessmentNameLabel: 'Nombre de la evaluación / sistema',
      assessmentNamePlaceholder: 'Ej.: Portal Web Producción — Q4',
      linkedScanLabel: 'Escaneo vinculado (evidencia técnica)',
      noLinkedScan: 'Sin escaneo vinculado (solo manual)',
      targetIgLabel: 'Grupo objetivo CIS Controls',
      saveAssessmentBtn: 'Guardar en Navegador',
      savedToast: '¡Evaluación guardada en IndexedDB!',
      deleteBtn: 'Eliminar',
      confirmDeleteBtn: 'Confirmar eliminación',
      cancelBtn: 'Cancelar',
      exportBtn: 'Exportar',
      exportMenuAria: 'Opciones de exportación de evaluación GRC',
      exportAiGapsOption: 'JSON para IA (Brechas)',
      exportAiGapsCountBadge: '{count} fallo(s)',
      exportAiGapsHint:
        'Solo controles con fallos o brechas en los 4 marcos (sin ruido)',
      copyAiGapsOption: 'Copiar JSON para IA',
      copiedAiGapsOption: '¡JSON de brechas copiado!',
      copyAiGapsHint: 'Copiar brechas directo para pegar en chat o agente IA',
      noGapsBadge: 'Sin brechas',
      noGapsHint:
        'Ningún fallo o brecha detectada en esta evaluación — exporta Excel (.xlsx) para el registro completo.',
      exportExcelOption: 'Libro Excel (.xlsx)',
      exportExcelHint:
        'Matriz completa con resumen ejecutivo y hojas para todos los marcos',
      ownerLabel: 'Responsable',
      ownerPlaceholder: 'Ej.: Equipo AppSec / DPO',
      noteLabel: 'Evidencia / Notas GRC',
      notePlaceholder:
        'Ej.: MFA obligatorio con Okta, runbook IR-04 revisado nov/2026...',
      attestationLabel: 'Atestación Manual',
      attestationOptions: {
        UNANSWERED: 'Sin responder',
        COMPLIANT: 'Implementado / Conforme',
        PARTIAL: 'Parcialmente implementado',
        NON_COMPLIANT: 'No conforme (Brecha)',
        NOT_APPLICABLE: 'No aplicable al alcance',
      },
      autoEvidenceBadge: 'Prellenado por escaneo',
      lastUpdated: 'Actualizado el {date}',
      whatIsGovernanceBtn: '¿Qué es gobernanza?',
      guide: {
        modalTitle: 'Guía de Gobernanza y Cumplimiento (GRC)',
        modalSubtitle:
          'Comprende cómo Brynja combina evidencias técnicas automáticas con atestaciones organizacionales en cada marco normativo.',
        closeBtn: 'Cerrar guía',
        tabsAria: 'Temas y marcos de gobernanza',
        keyPillarsTitle: 'Qué cubre en la práctica',
        brynjaMappingTitle: 'Cómo lo evalúa Brynja en tu proyecto',
        cisIgSectionTitle: 'Comprende el "Grupo objetivo CIS Controls" (IG1, IG2 e IG3)',
        cisIgItems: [
          {
            code: 'IG1 · Esencial / PyME',
            subtitle: 'Higiene cibernética básica para equipos pequeños o cargas iniciales',
            summary:
              'Conjunto mínimo indispensable (~56 salvaguardas): inventario básico de dependencias, corrección rápida de CVEs críticos, HTTPS/cookies seguras y prevención de secretos expuestos.',
          },
          {
            code: 'IG2 · Corporativo / SaaS',
            subtitle: 'Estándar recomendado para equipos de ingeniería, APIs y plataformas SaaS',
            summary:
              'Incluye todo IG1 más configuración continua segura, CSP/CORS estrictos, hardening IaC/CI-CD, control de acceso (MFA/IAM) y trazabilidad en auditoría.',
          },
          {
            code: 'IG3 · Alta Madurez',
            subtitle: 'Organizaciones reguladas, entornos financieros o equipos AppSec dedicados',
            summary:
              'Cobertura completa CIS v8: SAST continuo, revisión formal de cadena de suministro (SBOM/OpenSSF Scorecard), pruebas recurrentes y respuesta a incidentes madura.',
          },
        ],
        tabs: {
          overview: {
            tabLabel: 'Visión General (GRC)',
            badge: 'Concepto Clave',
            title: '¿Qué es Gobernanza, Riesgo y Cumplimiento (GRC) en Brynja?',
            intro:
              'Mientras un escaneo detecta vulnerabilidades puntuales, Gobernanza convierte esas señales técnicas en adherencia continua a marcos auditables — todo guardado localmente en tu navegador.',
            pillars: [
              'Adherencia Técnica: calculada automáticamente desde SBOM/CVEs, Safe Probes, análisis Secret/SAST/IaC y registros de auditoría.',
              'Adherencia Global: combina evidencia técnica automática con atestaciones manuales de procesos (MFA corporativo, respaldos, DPO, runbooks de incidentes).',
              'Controles Híbridos: requisitos con parte verificable por software y parte organizacional.',
              'Privacidad Local-First: guardado exclusivamente en IndexedDB por cuenta GitHub, con exportación a Excel (.xlsx) protegida contra inyección de fórmulas.',
            ],
            brynjaMapping:
              'Flujo recomendado: 1) Crea o selecciona una Evaluación GRC; 2) Vincula tu último escaneo; 3) Elige tu Grupo CIS objetivo (IG1/IG2/IG3); 4) Completa las atestaciones organizacionales y guarda en el navegador.',
          },
          'cis-v8': {
            tabLabel: 'CIS Controls v8',
            badge: '18 Controles Prioritarios',
            title: 'CIS Critical Security Controls v8 (v8.1)',
            intro:
              'Marco prescriptivo del Center for Internet Security organizado en tres Grupos de Implementación (IG1, IG2 e IG3) según el tamaño y nivel de riesgo del sistema.',
            pillars: [
              'Control 2 (Inventario de Software): SBOM en 8 ecosistemas enriquecido con licencias SPDX y OpenSSF Scorecard mediante deps.dev.',
              'Controles 4 y 16 (Configuración y AppSec): 19 Safe Probes GET/HEAD no destructivos, SAST ligero, Secret Scanner y análisis Dockerfile/Terraform/Actions.',
              'Control 7 (Gestión Continua de Vulnerabilidades): correlación OSV.dev, NVD, EPSS y CISA KEV priorizando explotación activa.',
              'Controles 6, 8 y 17 (Acceso, Logs e Incidentes): auditoría local combinada con atestaciones MFA/RBAC y respuesta a incidentes.',
            ],
            brynjaMapping:
              'Al cambiar el "Grupo objetivo CIS Controls" (IG1, IG2 o IG3), el scorecard filtra las salvaguardas esperadas para tu nivel de madurez sin generar ruido de controles avanzados cuando estás en IG1.',
          },
          'nist-csf-2': {
            tabLabel: 'NIST CSF 2.0',
            badge: '6 Funciones Core',
            title: 'NIST Cybersecurity Framework (CSF) 2.0',
            intro:
              'Estándar ejecutivo internacional que estructura el riesgo cibernético en 6 funciones continuas.',
            pillars: [
              'Govern (GV — Novedad 2.0): roles, políticas y supervisión organizacional mediante atestaciones GRC.',
              'Identify (ID): inventario SBOM, riesgo CVE/EPSS/KEV y postura del repositorio GitHub.',
              'Protect (PR): TLS/HSTS, banderas de cookies, CSP/CORS, protección de secretos y ramas.',
              'Detect (DE), Respond (RS) y Recover (RC): Safe Probes + auditoría combinados con planes de respuesta y respaldos.',
            ],
            brynjaMapping:
              'Agrupa la cobertura por Función (GV, ID, PR, DE, RS, RC) para facilitar reportes claros ante dirección y auditoría.',
          },
          'owasp-asvs': {
            tabLabel: 'OWASP ASVS / Top 10',
            badge: 'Seguridad de Aplicaciones',
            title: 'OWASP Application Security Verification Standard y Top 10',
            intro:
              'Referencia mundial enfocada en arquitectura web/API y defensa directa contra vulnerabilidades aplicativas reales.',
            pillars: [
              'Sesión y Autenticación (ASVS V3 / A07): auditado mediante CookieSecurityProbe y análisis OAuth/OIDC.',
              'Transporte y Encabezados (ASVS V9 / V14 / A05): HSTS, CSP estricta, Permissions-Policy, COOP/CORP/COEP, CORS y Open Redirect.',
              'Componentes Vulnerables (A06): OSV.dev + huella en runtime y Source Maps.',
              'Inyección, Secretos y SAST (A03 / A02): Secret Scanner enmascarado y reglas estáticas JS/TS, Python y CI/CD.',
            ],
            brynjaMapping:
              'Es el marco con mayor automatización técnica en Brynja (~90%+ controles automáticos), ideal para validar releases antes de producción.',
          },
          'lgpd-iso27001': {
            tabLabel: 'LGPD e ISO 27001',
            badge: 'Privacidad y Norma',
            title: 'LGPD (Ley 13.709/2018) e ISO/IEC 27001:2022',
            intro:
              'Conecta obligaciones legales de protección de datos (LGPD Art. 46, 48 y 50) con controles técnicos (Anexo A.8) y organizacionales (Anexo A.5) de ISO/IEC 27001:2022.',
            pillars: [
              'LGPD Art. 46 e ISO A.8.8 / A.8.9 / A.8.24: salvaguardas técnicas contra brechas, CVEs críticos, cifrado en tránsito y protección contra fuga de secretos.',
              'Privacy by Design (ISO A.8.25 / A.8.28): seguimiento continuo de SBOM y código seguro previo al release.',
              'ISO A.8.15 (Registros de Auditoría): trazabilidad local unida al atestado de política de logs aplicativa.',
              'LGPD Art. 48 y 50 (ISO A.5.24 / A.5.1): evidencia organizacional para notificación a ANPD/titulares, DPIA (RIPD) y DPO.',
            ],
            brynjaMapping:
              'Unifica evidencia técnica automática y atestaciones formales de privacidad en un único libro Excel (.xlsx) listo para auditoría.',
          },
        },
      },
    },
  },
};
