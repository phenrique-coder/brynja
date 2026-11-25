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
    stackSummary: 'SCA / SBOM · OSV · NVD · EPSS · CISA KEV · 14 Safe Probes',
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
    kpiCriticalHigh: 'Críticas y Altas',
    kpiConfirmed: 'Confirmadas / Sondas',
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
    kpiCritHigh: 'Con Críticas / Altas',
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
  },
  historyTable: {
    colRepository: 'Repositorio',
    colStatus: 'Estado',
    colDependencies: 'Dependencias',
    colSeverity: 'Severidad',
    colStagingTarget: 'Objetivo Staging',
    colAction: 'Acción',
    viewReport: 'Ver Informe',
    deleteAria: 'Eliminar escaneo {name}',
    deleteTitle: 'Eliminar del historial',
    critShort: 'C',
    highShort: 'A',
    medShort: 'M',
    lowShort: 'B',
    critTitle: '{count} Crítica(s)',
    highTitle: '{count} Alta(s)',
    medTitle: '{count} Media(s)',
    lowTitle: '{count} Baja(s)',
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
    kpiCritical: 'Críticas',
    kpiHigh: 'Altas',
    kpiMedium: 'Medias',
    kpiConfirmed: 'Confirmadas / Sondas',
    tabFindings: 'Vulnerabilidades ({count})',
    tabDependencies: 'Inventario SBOM ({count})',
    tabProbes: 'Safe Probes ({count})',
    tabAudit: 'Auditoría ({count})',
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
    methodWellKnown: 'Archivo /.well-known/brynja-verify.txt',
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
      'responda públicamente mostrando solo tu token. Elige cómo publicas en tu servidor:',
    subtabSsh: 'Por Terminal Remoto (SSH)',
    subtabWeb: 'Sin SSH (Vercel / Proyecto / cPanel)',
    sshStep1Title: 'Paso 1 — Conectar al servidor remoto por terminal',
    sshStep1Body:
      'Abre la terminal de tu equipo (Linux, macOS o PowerShell/WSL en Windows) y conéctate por SSH:',
    sshStep1Label: 'Terminal local → SSH',
    sshStep1Caption:
      "Reemplaza 'usuario' por tu usuario del servidor (ej.: root, ubuntu, deploy) o usa un alias de tu ~/.ssh/config.",
    sshStep2Title:
      'Paso 2 — Crear la carpeta .well-known y guardar el archivo de verificación',
    sshStep2Body:
      'Ya conectado al servidor remoto, ejecuta el comando para crear la carpeta y guardar el token exacto:',
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
      'Usa "location = /.well-known/brynja-verify.txt" (coincidencia exacta): prevalece sobre el proxy_pass a contenedores Docker (ej.: 127.0.0.1:3000) sin entrar en conflicto con Certbot (/.well-known/acme-challenge/).',
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
      'Ejecuta el comando debajo (en el servidor o en tu equipo). Debe mostrar exactamente tu token:',
    sshStep4Label: 'Prueba rápida con curl',
    sshStep4Caption:
      'Salida esperada: {token}. Si aparece exactamente eso, sube y haz clic en "Verificar Propiedad".',
    sshStep5Title:
      'Paso 5 — (Opcional) Revertir todo: eliminar el archivo, la carpeta .well-known y el Paso 3 (Nginx / Apache)',
    sshStep5Body:
      'Cuando quieras dejar el servidor exactamente como estaba antes (o revocar el acceso), sigue estos pasos. Atención: eliminar el archivo impide la renovación automática del certificado a los 7 días.',
    sshStep5RemoveFileLabel:
      '5.1 — Eliminar .well-known/brynja-verify.txt y la carpeta .well-known (si queda vacía)',
    sshStep5RemoveFileCaption:
      'Borra brynja-verify.txt y elimina la carpeta .well-known solo si queda vacía (preservando carpetas como acme-challenge de Certbot/Let’s Encrypt). Ajusta /var/www/html si usaste otra raíz web.',
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
      'Crea el archivo public/.well-known/brynja-verify.txt y pega únicamente el token de abajo.',
    webOptionAStep4:
      'Haz commit/deploy y abre {url} en tu navegador para comprobarlo.',
    webOptionACodeLabel: 'Contenido exacto de brynja-verify.txt',
    webOptionBTitle: 'Opción B — Panel de Hosting (cPanel, Hostinger, FTP)',
    webOptionBStep1:
      'Abre el Administrador de Archivos y entra en la carpeta pública del sitio (normalmente public_html).',
    webOptionBStep2:
      'En los ajustes del administrador, activa Mostrar archivos ocultos (dotfiles).',
    webOptionBStep3:
      'Crea la carpeta .well-known (si no existe) y dentro crea el archivo brynja-verify.txt.',
    webOptionBStep4:
      'Edita el archivo, pega solo el token, guarda y haz clic en Verificar Propiedad en Brynja.',
    webCleanupTitle:
      'Cómo revertir y eliminar .well-known/brynja-verify.txt después (opcional)',
    webCleanupBody:
      'En proyectos web (Next.js/React/Vercel/Netlify), ejecuta el comando en la raíz del proyecto y haz commit/deploy. En cPanel/FTP, borra brynja-verify.txt y elimina la carpeta .well-known si queda vacía.',
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
};
