import type { Locale } from '../i18n/types';
import type {
  CisImplementationGroup,
  ComplianceFrameworkId,
} from '../models/scan.models';
import type { SafeProbeId } from './safe-probes.catalog';

export type ControlAssessmentScope = 'TECHNICAL' | 'HYBRID' | 'ORGANIZATIONAL';

export interface ComplianceEvidenceRule {
  readonly requireSbom?: boolean;
  readonly sbomCheckMode?: 'SCAN_EXECUTED' | 'NO_CRITICAL_HIGH_KEV' | 'NO_KEV_OR_ACTIVE';
  readonly checkCweIds?: readonly string[];
  readonly probeIds?: readonly SafeProbeId[];
  readonly requireAuditTrail?: boolean;
}

export interface ComplianceControlLocaleCopy {
  readonly domainLabel: string;
  readonly title: string;
  readonly description: string;
  readonly guidance: string;
}

export interface ComplianceControlDefinition {
  readonly id: string;
  readonly framework: ComplianceFrameworkId;
  readonly code: string;
  readonly domainKey: string;
  readonly implementationGroup?: CisImplementationGroup;
  readonly assessmentScope: ControlAssessmentScope;
  readonly evidenceRule: ComplianceEvidenceRule;
  readonly copy: Record<Locale, ComplianceControlLocaleCopy>;
}

export interface ComplianceFrameworkMeta {
  readonly id: ComplianceFrameworkId;
  readonly version: string;
  readonly copy: Record<
    Locale,
    {
      name: string;
      shortName: string;
      description: string;
    }
  >;
}

export const COMPLIANCE_FRAMEWORK_IDS: readonly ComplianceFrameworkId[] = [
  'cis-v8',
  'nist-csf-2',
  'owasp-asvs',
  'lgpd-iso27001',
] as const;

export const COMPLIANCE_FRAMEWORKS: Record<
  ComplianceFrameworkId,
  ComplianceFrameworkMeta
> = {
  'cis-v8': {
    id: 'cis-v8',
    version: 'v8.1',
    copy: {
      'pt-BR': {
        name: 'CIS Critical Security Controls v8',
        shortName: 'CIS Controls v8',
        description:
          'Salvaguardas priorizadas em Grupos de Implementação (IG1/IG2/IG3) para inventário de software, configuração segura, vulnerabilidades e segurança de aplicações.',
      },
      en: {
        name: 'CIS Critical Security Controls v8',
        shortName: 'CIS Controls v8',
        description:
          'Prioritized safeguards across Implementation Groups (IG1/IG2/IG3) covering software inventory, secure configuration, vulnerability management, and application security.',
      },
      es: {
        name: 'CIS Critical Security Controls v8',
        shortName: 'CIS Controls v8',
        description:
          'Salvaguardas priorizadas en Grupos de Implementación (IG1/IG2/IG3) para inventario de software, configuración segura, vulnerabilidades y seguridad de aplicaciones.',
      },
    },
  },
  'nist-csf-2': {
    id: 'nist-csf-2',
    version: '2.0',
    copy: {
      'pt-BR': {
        name: 'NIST Cybersecurity Framework (CSF) 2.0',
        shortName: 'NIST CSF 2.0',
        description:
          'Estrutura de governança e gestão de riscos cibernéticos nas 6 funções: Govern, Identify, Protect, Detect, Respond e Recover.',
      },
      en: {
        name: 'NIST Cybersecurity Framework (CSF) 2.0',
        shortName: 'NIST CSF 2.0',
        description:
          'Cybersecurity governance and risk management framework spanning all 6 core functions: Govern, Identify, Protect, Detect, Respond, and Recover.',
      },
      es: {
        name: 'NIST Cybersecurity Framework (CSF) 2.0',
        shortName: 'NIST CSF 2.0',
        description:
          'Marco de gobernanza y gestión de riesgos cibernéticos en sus 6 funciones centrales: Govern, Identify, Protect, Detect, Respond y Recover.',
      },
    },
  },
  'owasp-asvs': {
    id: 'owasp-asvs',
    version: '4.0 / Top 10 (2021)',
    copy: {
      'pt-BR': {
        name: 'OWASP Top 10 & ASVS',
        shortName: 'OWASP ASVS / Top 10',
        description:
          'Requisitos técnicos de verificação de segurança em aplicações web mapeados contra controles de arquitetura, sessão, criptografia, headers e componentes.',
      },
      en: {
        name: 'OWASP Top 10 & ASVS',
        shortName: 'OWASP ASVS / Top 10',
        description:
          'Web application security verification requirements mapped against access control, cryptography, headers, session security, and third-party components.',
      },
      es: {
        name: 'OWASP Top 10 y ASVS',
        shortName: 'OWASP ASVS / Top 10',
        description:
          'Requisitos de verificación de seguridad en aplicaciones web mapeados contra control de acceso, criptografía, cabeceras, sesión y componentes.',
      },
    },
  },
  'lgpd-iso27001': {
    id: 'lgpd-iso27001',
    version: 'Art. 46 · 27001:2022',
    copy: {
      'pt-BR': {
        name: 'LGPD (Art. 46) & ISO/IEC 27001:2022',
        shortName: 'LGPD & ISO 27001',
        description:
          'Medidas técnicas e administrativas de proteção de dados (LGPD) alinhadas aos controles tecnológicos e organizacionais do Anexo A da ISO/IEC 27001:2022.',
      },
      en: {
        name: 'LGPD (Art. 46) & ISO/IEC 27001:2022',
        shortName: 'LGPD & ISO 27001',
        description:
          'Technical and administrative security safeguards under Brazil LGPD aligned with ISO/IEC 27001:2022 Annex A controls.',
      },
      es: {
        name: 'LGPD (Art. 46) e ISO/IEC 27001:2022',
        shortName: 'LGPD & ISO 27001',
        description:
          'Medidas técnicas y administrativas de seguridad bajo la LGPD alineadas con los controles del Anexo A de ISO/IEC 27001:2022.',
      },
    },
  },
};

export const COMPLIANCE_CONTROLS_CATALOG: readonly ComplianceControlDefinition[] = [
  // =========================================================================
  // CIS CONTROLS v8
  // =========================================================================
  {
    id: 'cis-v8:2.1',
    framework: 'cis-v8',
    code: 'CIS 2.1',
    domainKey: 'CIS 02',
    implementationGroup: 'IG1',
    assessmentScope: 'TECHNICAL',
    evidenceRule: { requireSbom: true, sbomCheckMode: 'SCAN_EXECUTED' },
    copy: {
      'pt-BR': {
        domainLabel: '02 · Inventário e Controle de Software',
        title: 'Estabelecer e manter inventário de software (SBOM)',
        description:
          'Manter inventário atualizado de bibliotecas, frameworks e componentes de terceiros executados na aplicação.',
        guidance:
          'Garanta que manifestos e lockfiles estejam versionados no repositório e gere SBOM CycloneDX a cada release.',
      },
      en: {
        domainLabel: '02 · Inventory & Control of Software Assets',
        title: 'Establish and maintain a software inventory (SBOM)',
        description:
          'Maintain an up-to-date inventory of third-party libraries, frameworks, and components used by the application.',
        guidance:
          'Keep manifests and lockfiles committed in the repository and generate CycloneDX SBOMs on each release.',
      },
      es: {
        domainLabel: '02 · Inventario y Control de Software',
        title: 'Establecer y mantener inventario de software (SBOM)',
        description:
          'Mantener inventario actualizado de bibliotecas, frameworks y componentes de terceros utilizados en la aplicación.',
        guidance:
          'Asegure que manifiestos y lockfiles estén en el repositorio y genere SBOM CycloneDX en cada entrega.',
      },
    },
  },
  {
    id: 'cis-v8:2.2',
    framework: 'cis-v8',
    code: 'CIS 2.2',
    domainKey: 'CIS 02',
    implementationGroup: 'IG1',
    assessmentScope: 'HYBRID',
    evidenceRule: { requireSbom: true, sbomCheckMode: 'NO_KEV_OR_ACTIVE' },
    copy: {
      'pt-BR': {
        domainLabel: '02 · Inventário e Controle de Software',
        title: 'Garantir software autorizado e com suporte ativo',
        description:
          'Assegurar que dependências e runtimes em uso recebam atualizações de segurança e não contenham pacotes sob exploração ativa.',
        guidance:
          'Substitua frameworks sem suporte (EOL) e ateste periodicamente no processo de governança.',
      },
      en: {
        domainLabel: '02 · Inventory & Control of Software Assets',
        title: 'Ensure authorized software is currently supported',
        description:
          'Verify that dependencies and runtimes remain vendor-supported and free from actively exploited versions.',
        guidance:
          'Replace end-of-life frameworks and attest periodic software lifecycle reviews.',
      },
      es: {
        domainLabel: '02 · Inventario y Control de Software',
        title: 'Garantizar software autorizado y con soporte vigente',
        description:
          'Asegurar que dependencias y runtimes reciban actualizaciones de seguridad sin versiones explotadas activamente.',
        guidance:
          'Reemplace componentes sin soporte (EOL) y documente revisiones periódicas de ciclo de vida.',
      },
    },
  },
  {
    id: 'cis-v8:3.10',
    framework: 'cis-v8',
    code: 'CIS 3.10',
    domainKey: 'CIS 03',
    implementationGroup: 'IG2',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: ['safe-probe:hsts-tls', 'safe-probe:cookie-security', 'safe-probe:csp-permissions'],
    },
    copy: {
      'pt-BR': {
        domainLabel: '03 · Proteção de Dados',
        title: 'Criptografar dados sensíveis em trânsito (HTTPS/HSTS/Cookies)',
        description:
          'Impor transporte cifrado com HSTS adequado, ausência de Mixed Content e flag Secure em cookies de sessão.',
        guidance:
          'Ative Strict-Transport-Security com max-age >= 15552000s, flag Secure em cookies e remova recursos http://.',
      },
      en: {
        domainLabel: '03 · Data Protection',
        title: 'Encrypt sensitive data in transit (HTTPS/HSTS/Cookies)',
        description:
          'Enforce encrypted transport with strict HSTS, zero active Mixed Content, and Secure flags on session cookies.',
        guidance:
          'Enable Strict-Transport-Security with max-age >= 15552000s, set Secure on cookies, and eliminate http:// assets.',
      },
      es: {
        domainLabel: '03 · Protección de Datos',
        title: 'Cifrar datos sensibles en tránsito (HTTPS/HSTS/Cookies)',
        description:
          'Exigir transporte cifrado con HSTS sólido, sin Mixed Content activo y atributo Secure en cookies de sesión.',
        guidance:
          'Habilite Strict-Transport-Security con max-age >= 15552000s, flag Secure en cookies y elimine recursos http://.',
      },
    },
  },
  {
    id: 'cis-v8:4.1',
    framework: 'cis-v8',
    code: 'CIS 4.1',
    domainKey: 'CIS 04',
    implementationGroup: 'IG1',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: [
        'safe-probe:security-headers',
        'safe-probe:csp-permissions',
        'safe-probe:cors-policy',
        'safe-probe:cache-security',
      ],
    },
    copy: {
      'pt-BR': {
        domainLabel: '04 · Configuração Segura',
        title: 'Configuração segura de servidor web e cabeçalhos HTTP',
        description:
          'Aplicar baseline defensivo de cabeçalhos (CSP, X-Frame-Options, XCTO, Permissions-Policy), CORS restrito e cache privado.',
        guidance:
          'Endureça cabeçalhos no proxy reverso/Next.js, restrinja Access-Control-Allow-Origin e adicione Cache-Control: private, no-store.',
      },
      en: {
        domainLabel: '04 · Secure Configuration',
        title: 'Secure configuration of web server and HTTP headers',
        description:
          'Enforce defensive HTTP headers (CSP, X-Frame-Options, XCTO, Permissions-Policy), strict CORS, and safe caching.',
        guidance:
          'Harden reverse-proxy/app headers, restrict Access-Control-Allow-Origin, and use Cache-Control: private, no-store.',
      },
      es: {
        domainLabel: '04 · Configuración Segura',
        title: 'Configuración segura del servidor web y cabeceras HTTP',
        description:
          'Aplicar línea base de cabeceras defensivas (CSP, X-Frame-Options, XCTO, Permissions-Policy), CORS estricto y caché seguro.',
        guidance:
          'Endurezca cabeceras en el proxy/app, restrinja Access-Control-Allow-Origin y aplique Cache-Control: private, no-store.',
      },
    },
  },
  {
    id: 'cis-v8:4.8',
    framework: 'cis-v8',
    code: 'CIS 4.8',
    domainKey: 'CIS 04',
    implementationGroup: 'IG2',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: [
        'safe-probe:exposed-artifacts',
        'safe-probe:exposed-docs-metrics',
        'safe-probe:backup-config-exposure',
        'safe-probe:source-maps',
        'safe-probe:debug-error-leakage',
      ],
    },
    copy: {
      'pt-BR': {
        domainLabel: '04 · Configuração Segura',
        title: 'Remover superfícies, endpoints e artefatos desnecessários',
        description:
          'Bloquear exposição pública de .git, .env, backups, Swagger/metrics, source maps e páginas de debug/autoindex.',
        guidance:
          'Desative modo debug em produção, remova dumps/configs da raiz pública e restrinja /metrics ou /docs por autenticação.',
      },
      en: {
        domainLabel: '04 · Secure Configuration',
        title: 'Uninstall or disable unnecessary exposed services and artifacts',
        description:
          'Block public access to .git, .env, backups, Swagger/metrics, source maps, and verbose debuggers or directory listings.',
        guidance:
          'Disable production debug modes, remove backup/env files from web roots, and protect /metrics or API docs.',
      },
      es: {
        domainLabel: '04 · Configuración Segura',
        title: 'Deshabilitar servicios, rutas y artefactos innecesarios',
        description:
          'Bloquear acceso público a .git, .env, respaldos, Swagger/metrics, source maps y modos debug o listados de directorio.',
        guidance:
          'Desactive modo debug en producción, elimine copias/configs de la raíz pública y proteja /metrics o docs.',
      },
    },
  },
  {
    id: 'cis-v8:6.3',
    framework: 'cis-v8',
    code: 'CIS 6.3 / 6.5',
    domainKey: 'CIS 06',
    implementationGroup: 'IG1',
    assessmentScope: 'ORGANIZATIONAL',
    evidenceRule: {},
    copy: {
      'pt-BR': {
        domainLabel: '06 · Gestão de Controle de Acesso',
        title: 'Exigir MFA para aplicações externas e contas administrativas',
        description:
          'Garantir autenticação multifator (MFA) em painéis administrativos, repositórios GitHub, nuvem e acessos externos.',
        guidance:
          'Exija MFA/WebAuthn para todos os operadores e registre a evidência da política ativa na organização.',
      },
      en: {
        domainLabel: '06 · Access Control Management',
        title: 'Require MFA for externally exposed apps and admin accounts',
        description:
          'Enforce multi-factor authentication (MFA) across admin panels, GitHub orgs, cloud consoles, and remote access.',
        guidance:
          'Require MFA/WebAuthn for all privileged users and document enforcement evidence.',
      },
      es: {
        domainLabel: '06 · Gestión de Control de Acceso',
        title: 'Exigir MFA para aplicaciones externas y cuentas administrativas',
        description:
          'Garantizar autenticación multifactor (MFA) en paneles administrativos, GitHub, nube y accesos remotos.',
        guidance:
          'Exija MFA/WebAuthn a usuarios privilegiados y registre evidencia de aplicación.',
      },
    },
  },
  {
    id: 'cis-v8:7.1',
    framework: 'cis-v8',
    code: 'CIS 7.1',
    domainKey: 'CIS 07',
    implementationGroup: 'IG1',
    assessmentScope: 'TECHNICAL',
    evidenceRule: { requireSbom: true, sbomCheckMode: 'NO_CRITICAL_HIGH_KEV' },
    copy: {
      'pt-BR': {
        domainLabel: '07 · Gestão Contínua de Vulnerabilidades',
        title: 'Processo contínuo de gestão e remediação de vulnerabilidades',
        description:
          'Executar varredura contínua de dependências (OSV/NVD/EPSS/KEV) e remediar falhas Críticas, Altas e KEV dentro do SLA.',
        guidance:
          'Priorize itens P0/P1 do plano de remediação (especialmente CISA KEV) e mantenha varreduras recorrentes no CI.',
      },
      en: {
        domainLabel: '07 · Continuous Vulnerability Management',
        title: 'Establish and maintain a vulnerability management process',
        description:
          'Continuously scan dependencies against OSV/NVD/EPSS/KEV and remediate Critical, High, and KEV findings within SLA.',
        guidance:
          'Prioritize P0/P1 remediation items (especially CISA KEV) and schedule recurring scans.',
      },
      es: {
        domainLabel: '07 · Gestión Continua de Vulnerabilidades',
        title: 'Mantener un proceso continuo de gestión de vulnerabilidades',
        description:
          'Analizar dependencias frente a OSV/NVD/EPSS/KEV y remediar hallazgos Críticos, Altos y KEV dentro del SLA.',
        guidance:
          'Priorice tareas P0/P1 del plan de remediación (especialmente CISA KEV) y ejecute análisis periódicos.',
      },
    },
  },
  {
    id: 'cis-v8:7.5',
    framework: 'cis-v8',
    code: 'CIS 7.5',
    domainKey: 'CIS 07',
    implementationGroup: 'IG2',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: [
        'safe-probe:security-headers',
        'safe-probe:open-redirect',
        'safe-probe:runtime-fingerprint',
      ],
    },
    copy: {
      'pt-BR': {
        domainLabel: '07 · Gestão Contínua de Vulnerabilidades',
        title: 'Varreduras automatizadas de superfície externa (Safe Probes)',
        description:
          'Executar verificações ativas não destrutivas em ambientes autorizados para validar exposição real em runtime.',
        guidance:
          'Vincule o alvo de staging/produção em Alvos & Guardrails para validar continuamente o ambiente em execução.',
      },
      en: {
        domainLabel: '07 · Continuous Vulnerability Management',
        title: 'Perform automated vulnerability scans of external targets',
        description:
          'Run non-destructive active verification on authorized staging/production origins to confirm runtime exposure.',
        guidance:
          'Verify target ownership under Targets & Guardrails and include Safe Probes in recurring scans.',
      },
      es: {
        domainLabel: '07 · Gestión Continua de Vulnerabilidades',
        title: 'Ejecutar escaneos automatizados de activos externos',
        description:
          'Realizar verificaciones activas no destructivas sobre entornos autorizados para confirmar exposición en runtime.',
        guidance:
          'Verifique la propiedad en Objetivos y Guardrails para habilitar Safe Probes en sus análisis.',
      },
    },
  },
  {
    id: 'cis-v8:8.2',
    framework: 'cis-v8',
    code: 'CIS 8.2',
    domainKey: 'CIS 08',
    implementationGroup: 'IG1',
    assessmentScope: 'HYBRID',
    evidenceRule: { requireAuditTrail: true },
    copy: {
      'pt-BR': {
        domainLabel: '08 · Gestão de Logs de Auditoria',
        title: 'Coletar e reter logs de auditoria',
        description:
          'Registrar eventos de auditoria de verificações autorizadas e garantir coleta centralizada de logs de segurança da aplicação.',
        guidance:
          'O Brynja mantém trilha imutável das sondas; complemente atestando retenção de logs de acesso/autenticação na aplicação.',
      },
      en: {
        domainLabel: '08 · Audit Log Management',
        title: 'Collect and retain security audit logs',
        description:
          'Maintain immutable audit logs of authorized probe checks alongside centralized application authentication/access logs.',
        guidance:
          'Brynja records probe audit logs automatically; attest centralized log retention for the target application.',
      },
      es: {
        domainLabel: '08 · Gestión de Registros de Auditoría',
        title: 'Recopilar y retener registros de auditoría',
        description:
          'Registrar eventos de auditoría de verificaciones autorizadas y asegurar recolección centralizada de logs en la app.',
        guidance:
          'Brynja guarda la traza inmutable de sondas; complete atestando retención de logs de acceso de la aplicación.',
      },
    },
  },
  {
    id: 'cis-v8:11.2',
    framework: 'cis-v8',
    code: 'CIS 11.2',
    domainKey: 'CIS 11',
    implementationGroup: 'IG1',
    assessmentScope: 'ORGANIZATIONAL',
    evidenceRule: {},
    copy: {
      'pt-BR': {
        domainLabel: '11 · Recuperação de Dados',
        title: 'Executar backups automatizados e testes de restauração',
        description:
          'Realizar backups automatizados, cifrados e isolados das bases críticas com validação periódica de restore.',
        guidance:
          'Documente periodicidade de backups, isolamento contra ransomware e data do último teste de restauração.',
      },
      en: {
        domainLabel: '11 · Data Recovery',
        title: 'Perform automated backups and restoration testing',
        description:
          'Maintain automated, encrypted, isolated backups of critical data stores with periodic restore drills.',
        guidance:
          'Document backup cadence, immutability/isolation, and date of the most recent restore verification.',
      },
      es: {
        domainLabel: '11 · Recuperación de Datos',
        title: 'Ejecutar copias de seguridad automatizadas y pruebas',
        description:
          'Mantener respaldos automatizados, cifrados y aislados de bases críticas con pruebas periódicas de restauración.',
        guidance:
          'Documente frecuencia de backups, aislamiento y fecha de la última prueba de recuperación.',
      },
    },
  },
  {
    id: 'cis-v8:16.1',
    framework: 'cis-v8',
    code: 'CIS 16.1 / 16.2',
    domainKey: 'CIS 16',
    implementationGroup: 'IG2',
    assessmentScope: 'HYBRID',
    evidenceRule: {
      probeIds: ['safe-probe:exposed-docs-metrics', 'safe-probe:sri-integrity', 'safe-probe:open-redirect'],
    },
    copy: {
      'pt-BR': {
        domainLabel: '16 · Segurança de Software de Aplicação',
        title: 'Ciclo seguro de desenvolvimento e canal de divulgação (security.txt)',
        description:
          'Aplicar verificações de integridade (SRI), validação de redirecionamentos e manter /.well-known/security.txt (RFC 9116).',
        guidance:
          'Publique /.well-known/security.txt, exija SRI em CDNs e valide parâmetros de redirecionamento contra CWE-601.',
      },
      en: {
        domainLabel: '16 · Application Software Security',
        title: 'Secure SDLC and vulnerability disclosure channel (security.txt)',
        description:
          'Enforce Subresource Integrity (SRI), open-redirect protections, and maintain /.well-known/security.txt (RFC 9116).',
        guidance:
          'Publish /.well-known/security.txt, require SRI on external CDNs, and validate redirect parameters against CWE-601.',
      },
      es: {
        domainLabel: '16 · Seguridad de Software de Aplicación',
        title: 'Ciclo de desarrollo seguro y canal de divulgación (security.txt)',
        description:
          'Aplicar integridad SRI, protección contra Open Redirect y mantener /.well-known/security.txt (RFC 9116).',
        guidance:
          'Publique /.well-known/security.txt, exija SRI en CDNs externas y valide redirecciones contra CWE-601.',
      },
    },
  },
  {
    id: 'cis-v8:16.4',
    framework: 'cis-v8',
    code: 'CIS 16.4 / 16.11',
    domainKey: 'CIS 16',
    implementationGroup: 'IG2',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      requireSbom: true,
      sbomCheckMode: 'NO_KEV_OR_ACTIVE',
      checkCweIds: ['CWE-79', 'CWE-89', 'CWE-94', 'CWE-327', 'CWE-502', 'CWE-601'],
      probeIds: ['safe-probe:runtime-fingerprint', 'safe-probe:cookie-security'],
    },
    copy: {
      'pt-BR': {
        domainLabel: '16 · Segurança de Software de Aplicação',
        title: 'Gestão de componentes de terceiros e módulos confiáveis',
        description:
          'Inventariar dependências de terceiros, evitar bibliotecas com CVEs confirmadas em runtime ou CWEs críticas de injeção/criptografia.',
        guidance:
          'Atualize pacotes com CVEs ativas ou CWEs críticas e utilize APIs padrão validadas para sessão e sanitização.',
      },
      en: {
        domainLabel: '16 · Application Software Security',
        title: 'Manage third-party components and vetted security modules',
        description:
          'Inventory third-party libraries and avoid packages with runtime-confirmed CVEs or critical injection/crypto CWEs.',
        guidance:
          'Upgrade packages with active CVEs or critical CWEs and rely on vetted security primitives.',
      },
      es: {
        domainLabel: '16 · Seguridad de Software de Aplicación',
        title: 'Gestionar componentes de terceros y módulos confiables',
        description:
          'Inventariar dependencias de terceros y evitar bibliotecas con CVEs confirmadas en runtime o CWEs críticas.',
        guidance:
          'Actualice paquetes con CVEs activas o CWEs críticas y utilice primitivas estándar de seguridad.',
      },
    },
  },
  {
    id: 'cis-v8:17.1',
    framework: 'cis-v8',
    code: 'CIS 17.1',
    domainKey: 'CIS 17',
    implementationGroup: 'IG1',
    assessmentScope: 'ORGANIZATIONAL',
    evidenceRule: {},
    copy: {
      'pt-BR': {
        domainLabel: '17 · Resposta a Incidentes',
        title: 'Designar responsáveis e plano de resposta a incidentes',
        description:
          'Definir equipe, contatos de escalonamento e runbooks documentados para contenção de incidentes de segurança.',
        guidance:
          'Registre o responsável principal pelo tratamento de incidentes e o link/versão do runbook vigente.',
      },
      en: {
        domainLabel: '17 · Incident Response Management',
        title: 'Designate incident handling personnel and response plan',
        description:
          'Assign primary/backup incident coordinators and maintain documented containment and escalation runbooks.',
        guidance:
          'Record the designated incident response owner and link/reference to the active playbook.',
      },
      es: {
        domainLabel: '17 · Respuesta a Incidentes',
        title: 'Designar responsables y plan de respuesta a incidentes',
        description:
          'Definir responsables, escalamiento y guías documentadas para contención de incidentes de seguridad.',
        guidance:
          'Registre al responsable de respuesta a incidentes y la referencia del plan vigente.',
      },
    },
  },

  // =========================================================================
  // NIST CSF 2.0 (Govern, Identify, Protect, Detect, Respond, Recover)
  // =========================================================================
  {
    id: 'nist-csf-2:GV.OC-03',
    framework: 'nist-csf-2',
    code: 'GV.OC-03',
    domainKey: 'GV',
    assessmentScope: 'ORGANIZATIONAL',
    evidenceRule: {},
    copy: {
      'pt-BR': {
        domainLabel: 'GV · Govern (Governança)',
        title: 'Requisitos legais, regulatórios e contratuais mapeados',
        description:
          'Compreender e gerenciar obrigações legais e contratuais de cibersegurança e privacidade (ex.: LGPD, PCI, clientes).',
        guidance:
          'Documente quais normas aplicam-se ao produto e a frequência de revisão pela liderança.',
      },
      en: {
        domainLabel: 'GV · Govern',
        title: 'Legal, regulatory, and contractual requirements understood',
        description:
          'Identify and manage applicable cybersecurity and privacy obligations across regulations and customer contracts.',
        guidance:
          'Document applicable frameworks/regulations for this application and leadership review cadence.',
      },
      es: {
        domainLabel: 'GV · Govern (Gobernanza)',
        title: 'Requisitos legales, regulatorios y contractuales gestionados',
        description:
          'Identificar y gestionar obligaciones legales, normativas y contractuales de ciberseguridad y privacidad.',
        guidance:
          'Documente las normativas aplicables al sistema y su revisión por la dirección.',
      },
    },
  },
  {
    id: 'nist-csf-2:GV.RM-01',
    framework: 'nist-csf-2',
    code: 'GV.RM-01',
    domainKey: 'GV',
    assessmentScope: 'ORGANIZATIONAL',
    evidenceRule: {},
    copy: {
      'pt-BR': {
        domainLabel: 'GV · Govern (Governança)',
        title: 'Objetivos de gestão de risco e SLAs definidos',
        description:
          'Estabelecer tolerância a risco e janelas formais de correção (ex.: P0 24–48h, P1 7d, P2 30d) alinhadas à diretoria.',
        guidance:
          'Formalize os SLAs de remediação de vulnerabilidades e critérios de aceite de risco.',
      },
      en: {
        domainLabel: 'GV · Govern',
        title: 'Risk management objectives and remediation SLAs agreed',
        description:
          'Establish risk tolerance and formal remediation windows (e.g., P0 24–48h, P1 7d, P2 30d) approved by stakeholders.',
        guidance:
          'Formalize vulnerability remediation SLAs and exception approval governance.',
      },
      es: {
        domainLabel: 'GV · Govern (Gobernanza)',
        title: 'Objetivos de gestión de riesgos y SLAs definidos',
        description:
          'Establecer tolerancia al riesgo y ventanas formales de remediación (P0 24–48h, P1 7d, P2 30d).',
        guidance:
          'Formalice los SLAs de mitigación de vulnerabilidades y flujo de aceptación de riesgo.',
      },
    },
  },
  {
    id: 'nist-csf-2:ID.AM-02',
    framework: 'nist-csf-2',
    code: 'ID.AM-02',
    domainKey: 'ID',
    assessmentScope: 'TECHNICAL',
    evidenceRule: { requireSbom: true, sbomCheckMode: 'SCAN_EXECUTED' },
    copy: {
      'pt-BR': {
        domainLabel: 'ID · Identify (Identificar)',
        title: 'Inventário de software, serviços e bibliotecas mantido',
        description:
          'Manter inventário completo e exportável (SBOM CycloneDX 1.5) de todas as dependências diretas e transitivas.',
        guidance:
          'Execute varredura SCA sobre os lockfiles completos do repositório e arquive o SBOM.',
      },
      en: {
        domainLabel: 'ID · Identify',
        title: 'Inventories of software, services, and libraries maintained',
        description:
          'Maintain a complete, exportable SBOM inventory (CycloneDX 1.5) of direct and transitive dependencies.',
        guidance:
          'Run SCA scans against complete lockfiles and retain CycloneDX SBOM artifacts per release.',
      },
      es: {
        domainLabel: 'ID · Identify (Identificar)',
        title: 'Inventario de software, servicios y bibliotecas mantenido',
        description:
          'Mantener inventario completo y exportable (SBOM CycloneDX 1.5) de dependencias directas y transitivas.',
        guidance:
          'Ejecute análisis SCA sobre lockfiles completos y conserve el artefacto SBOM.',
      },
    },
  },
  {
    id: 'nist-csf-2:ID.RA-01',
    framework: 'nist-csf-2',
    code: 'ID.RA-01',
    domainKey: 'ID',
    assessmentScope: 'TECHNICAL',
    evidenceRule: { requireSbom: true, sbomCheckMode: 'NO_CRITICAL_HIGH_KEV' },
    copy: {
      'pt-BR': {
        domainLabel: 'ID · Identify (Identificar)',
        title: 'Vulnerabilidades identificadas, validadas e registradas',
        description:
          'Correlacionar componentes contra bases públicas (OSV.dev, NVD 2.0, EPSS, CISA KEV) e eliminar achados Críticos/Altos.',
        guidance:
          'Trate todas as vulnerabilidades Críticas, Altas e listadas no catálogo CISA KEV identificadas no scan.',
      },
      en: {
        domainLabel: 'ID · Identify',
        title: 'Vulnerabilities in assets identified, validated, and recorded',
        description:
          'Correlate components against OSV.dev, NVD 2.0, EPSS, and CISA KEV and resolve Critical/High exposures.',
        guidance:
          'Address all Critical, High, and CISA KEV vulnerabilities surfaced in the scan report.',
      },
      es: {
        domainLabel: 'ID · Identify (Identificar)',
        title: 'Vulnerabilidades identificadas, validadas y registradas',
        description:
          'Correlacionar componentes con OSV.dev, NVD 2.0, EPSS y CISA KEV y resolver exposiciones Críticas/Altas.',
        guidance:
          'Resuelva todas las vulnerabilidades Críticas, Altas y de CISA KEV detectadas.',
      },
    },
  },
  {
    id: 'nist-csf-2:ID.RA-05',
    framework: 'nist-csf-2',
    code: 'ID.RA-05 / ID.RA-08',
    domainKey: 'ID',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      requireSbom: true,
      sbomCheckMode: 'NO_KEV_OR_ACTIVE',
      probeIds: ['safe-probe:exposed-docs-metrics', 'safe-probe:runtime-fingerprint'],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'ID · Identify (Identificar)',
        title: 'Priorização por ameaça real (EPSS/KEV) e canal de divulgação',
        description:
          'Utilizar probabilidade de exploração (EPSS/KEV), confirmação em runtime e manter security.txt para recebimento de falhas.',
        guidance:
          'Priorize itens P0 (KEV / confirmados em runtime) e publique /.well-known/security.txt.',
      },
      en: {
        domainLabel: 'ID · Identify',
        title: 'Threat-informed prioritization (EPSS/KEV) & disclosure process',
        description:
          'Use exploitation likelihood (EPSS/KEV), runtime confirmation, and maintain security.txt for vulnerability disclosure.',
        guidance:
          'Resolve P0 KEV/runtime-confirmed items first and publish /.well-known/security.txt.',
      },
      es: {
        domainLabel: 'ID · Identify (Identificar)',
        title: 'Priorización por amenaza (EPSS/KEV) y divulgación coordinada',
        description:
          'Usar probabilidad de explotación (EPSS/KEV), confirmación en runtime y publicar security.txt.',
        guidance:
          'Resuelva primero los elementos P0 (KEV/confirmados) y publique /.well-known/security.txt.',
      },
    },
  },
  {
    id: 'nist-csf-2:PR.DS-02',
    framework: 'nist-csf-2',
    code: 'PR.DS-02',
    domainKey: 'PR',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: [
        'safe-probe:hsts-tls',
        'safe-probe:cookie-security',
        'safe-probe:cors-policy',
        'safe-probe:cache-security',
      ],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'PR · Protect (Proteger)',
        title: 'Proteção da confidencialidade e integridade em trânsito',
        description:
          'Assegurar HSTS, cookies protegidos (HttpOnly/Secure/SameSite), CORS seguro e prevenção de vazamento de sessão em cache.',
        guidance:
          'Configure HSTS, atributos completos em Set-Cookie, política CORS restrita e Cache-Control privado.',
      },
      en: {
        domainLabel: 'PR · Protect',
        title: 'Confidentiality and integrity of data-in-transit protected',
        description:
          'Ensure HSTS enforcement, hardened cookies (HttpOnly/Secure/SameSite), strict CORS, and safe cache policies.',
        guidance:
          'Enforce HSTS, complete Set-Cookie flags, strict CORS allowlists, and private cache headers.',
      },
      es: {
        domainLabel: 'PR · Protect (Proteger)',
        title: 'Confidencialidad e integridad de datos en tránsito protegidas',
        description:
          'Asegurar HSTS, cookies endurecidas (HttpOnly/Secure/SameSite), CORS estricto y caché seguro.',
        guidance:
          'Configure HSTS, flags completos en Set-Cookie, CORS estricto y Cache-Control privado.',
      },
    },
  },
  {
    id: 'nist-csf-2:PR.PS-01',
    framework: 'nist-csf-2',
    code: 'PR.PS-01',
    domainKey: 'PR',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: [
        'safe-probe:security-headers',
        'safe-probe:csp-permissions',
        'safe-probe:exposed-artifacts',
        'safe-probe:backup-config-exposure',
        'safe-probe:debug-error-leakage',
        'safe-probe:source-maps',
      ],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'PR · Protect (Proteger)',
        title: 'Práticas de endurecimento de configuração aplicadas',
        description:
          'Manter cabeçalhos defensivos, CSP sólida e bloquear exposição de arquivos internos, backups, source maps e debug.',
        guidance:
          'Aplique hardening de produção eliminando arquivos sensíveis expostos e fortalecendo CSP/Permissions-Policy.',
      },
      en: {
        domainLabel: 'PR · Protect',
        title: 'Platform security configuration practices established',
        description:
          'Enforce security headers and strict CSP while blocking internal files, backups, source maps, and debug leakage.',
        guidance:
          'Harden production servers to block sensitive paths and strengthen CSP/Permissions-Policy.',
      },
      es: {
        domainLabel: 'PR · Protect (Proteger)',
        title: 'Prácticas de configuración segura de plataforma aplicadas',
        description:
          'Mantener cabeceras defensivas y CSP sólida bloqueando artefactos internos, respaldos, source maps y debug.',
        guidance:
          'Endurezca producción bloqueando rutas sensibles y fortaleciendo CSP/Permissions-Policy.',
      },
    },
  },
  {
    id: 'nist-csf-2:PR.PS-05',
    framework: 'nist-csf-2',
    code: 'PR.PS-05',
    domainKey: 'PR',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: ['safe-probe:sri-integrity', 'safe-probe:open-redirect'],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'PR · Protect (Proteger)',
        title: 'Prevenção de execução não autorizada e redirecionamento seguro',
        description:
          'Exigir validação criptográfica SRI em recursos de CDNs terceiras e impedir redirecionamentos abertos (CWE-601).',
        guidance:
          'Adicione integrity="sha384-..." em tags de CDN e valide destinos de redirect contra allowlist.',
      },
      en: {
        domainLabel: 'PR · Protect',
        title: 'Unauthorized script execution and open redirects prevented',
        description:
          'Require Subresource Integrity (SRI) on third-party CDN assets and block open redirects (CWE-601).',
        guidance:
          'Add integrity hashes on external CDN script/link tags and validate redirect targets.',
      },
      es: {
        domainLabel: 'PR · Protect (Proteger)',
        title: 'Prevención de ejecución no autorizada y redirección segura',
        description:
          'Exigir integridad SRI en recursos de CDNs externas y prevenir redirecciones abiertas (CWE-601).',
        guidance:
          'Agregue atributos integrity en scripts/estilos externos y valide destinos de redirección.',
      },
    },
  },
  {
    id: 'nist-csf-2:DE.CM-09',
    framework: 'nist-csf-2',
    code: 'DE.CM-09',
    domainKey: 'DE',
    assessmentScope: 'HYBRID',
    evidenceRule: {
      probeIds: ['safe-probe:security-headers', 'safe-probe:runtime-fingerprint'],
      requireAuditTrail: true,
    },
    copy: {
      'pt-BR': {
        domainLabel: 'DE · Detect (Detectar)',
        title: 'Monitoramento contínuo de software e ambiente em execução',
        description:
          'Monitorar a postura de segurança do runtime com verificação ativa autorizada e trilha de auditoria verificável.',
        guidance:
          'Execute Safe Probes recorrentes e complemente com alertas/SIEM no ambiente de produção.',
      },
      en: {
        domainLabel: 'DE · Detect',
        title: 'Runtime environments and software monitored continuously',
        description:
          'Monitor runtime security posture via authorized active probes and maintain verifiable audit records.',
        guidance:
          'Schedule recurring Safe Probes and complement with runtime telemetry/SIEM alerting.',
      },
      es: {
        domainLabel: 'DE · Detect (Detectar)',
        title: 'Monitoreo continuo de software y entorno en ejecución',
        description:
          'Monitorear la postura de runtime mediante sondas autorizadas y registros de auditoría verificables.',
        guidance:
          'Ejecute Safe Probes recurrentes y complemente con telemetría/SIEM en producción.',
      },
    },
  },
  {
    id: 'nist-csf-2:RS.MA-01',
    framework: 'nist-csf-2',
    code: 'RS.MA-01',
    domainKey: 'RS',
    assessmentScope: 'ORGANIZATIONAL',
    evidenceRule: {},
    copy: {
      'pt-BR': {
        domainLabel: 'RS · Respond (Responder)',
        title: 'Plano de resposta a incidentes executado e testado',
        description:
          'Coordenar triagem, contenção, comunicação e lições aprendidas diante de incidentes confirmados.',
        guidance:
          'Registre a equipe de resposta, canal de acionamento 24/7 e data do último exercício (tabletop).',
      },
      en: {
        domainLabel: 'RS · Respond',
        title: 'Incident response plan maintained and exercised',
        description:
          'Coordinate triage, containment, stakeholder notification, and post-incident review when events occur.',
        guidance:
          'Document on-call escalation contacts, response SLA, and date of the latest tabletop drill.',
      },
      es: {
        domainLabel: 'RS · Respond (Responder)',
        title: 'Plan de respuesta a incidentes ejecutado y probado',
        description:
          'Coordinar triaje, contención, notificación y lecciones aprendidas ante incidentes confirmados.',
        guidance:
          'Registre contactos de escalamiento y fecha del último simulacro de respuesta.',
      },
    },
  },
  {
    id: 'nist-csf-2:RC.RP-01',
    framework: 'nist-csf-2',
    code: 'RC.RP-01',
    domainKey: 'RC',
    assessmentScope: 'ORGANIZATIONAL',
    evidenceRule: {},
    copy: {
      'pt-BR': {
        domainLabel: 'RC · Recover (Recuperar)',
        title: 'Plano de recuperação e continuidade (RTO/RPO) validado',
        description:
          'Assegurar capacidade de restauração de sistemas e dados dentro das metas definidas de RTO e RPO.',
        guidance:
          'Informe metas de RTO/RPO e evidência de testes periódicos de restauração.',
      },
      en: {
        domainLabel: 'RC · Recover',
        title: 'Recovery plan executed within defined RTO/RPO targets',
        description:
          'Verify ability to restore systems and data cleanly within business continuity RTO and RPO objectives.',
        guidance:
          'Record approved RTO/RPO targets and date of the most recent recovery validation.',
      },
      es: {
        domainLabel: 'RC · Recover (Recuperar)',
        title: 'Plan de recuperación y continuidad (RTO/RPO) validado',
        description:
          'Asegurar capacidad de restauración de sistemas y datos dentro de los objetivos RTO y RPO.',
        guidance:
          'Documente metas RTO/RPO aprobadas y fecha de la última prueba de recuperación.',
      },
    },
  },

  // =========================================================================
  // OWASP TOP 10 (2021) & ASVS 4.0
  // =========================================================================
  {
    id: 'owasp-asvs:A01',
    framework: 'owasp-asvs',
    code: 'A01 / ASVS V4',
    domainKey: 'A01',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: [
        'safe-probe:cors-policy',
        'safe-probe:open-redirect',
        'safe-probe:exposed-artifacts',
        'safe-probe:exposed-docs-metrics',
      ],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'A01 · Quebra de Controle de Acesso',
        title: 'Restrição de CORS, redirecionamentos e artefatos internos',
        description:
          'Prevenir acesso não autorizado a recursos internos, reflexão arbitrária de Origin e open redirects.',
        guidance:
          'Restrinja CORS à allowlist explícita, bloqueie rotas administrativas/artefatos e valide URLs de redirect.',
      },
      en: {
        domainLabel: 'A01 · Broken Access Control',
        title: 'Restrict CORS origins, redirects, and internal artifacts',
        description:
          'Prevent unauthorized exposure of internal paths, arbitrary Origin reflection, and unvalidated redirects.',
        guidance:
          'Enforce explicit CORS allowlists, deny public access to internal files, and validate redirect targets.',
      },
      es: {
        domainLabel: 'A01 · Pérdida de Control de Acceso',
        title: 'Restringir CORS, redirecciones y artefactos internos',
        description:
          'Prevenir acceso no autorizado a rutas internas, reflexión arbitraria de Origin y redirecciones abiertas.',
        guidance:
          'Restrinja CORS a orígenes confiables, bloquee archivos internos y valide destinos de redirección.',
      },
    },
  },
  {
    id: 'owasp-asvs:A02',
    framework: 'owasp-asvs',
    code: 'A02 / ASVS V9',
    domainKey: 'A02',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: ['safe-probe:hsts-tls', 'safe-probe:cookie-security', 'safe-probe:csp-permissions'],
      checkCweIds: ['CWE-319', 'CWE-326', 'CWE-327', 'CWE-523'],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'A02 · Falhas Criptográficas',
        title: 'Segurança de transporte TLS/HSTS, Mixed Content e primitivas criptográficas',
        description:
          'Garantir canal cifrado ponta a ponta com HSTS, cookies Secure e ausência de dependências com CWEs criptográficas fracas.',
        guidance:
          'Ative HSTS forte, corrija recursos Mixed Content http:// e atualize libs com falhas criptográficas.',
      },
      en: {
        domainLabel: 'A02 · Cryptographic Failures',
        title: 'Transport security (TLS/HSTS), Mixed Content & crypto hygiene',
        description:
          'Enforce end-to-end TLS with HSTS, Secure cookie flags, and zero dependencies with weak cryptography CWEs.',
        guidance:
          'Enable strong HSTS, eliminate http:// active content, and upgrade packages with crypto flaws.',
      },
      es: {
        domainLabel: 'A02 · Fallos Criptográficos',
        title: 'Seguridad en transporte TLS/HSTS, Mixed Content y criptografía',
        description:
          'Garantizar canal cifrado con HSTS, flag Secure en cookies y ausencia de dependencias con CWEs criptográficas.',
        guidance:
          'Active HSTS robusto, elimine Mixed Content http:// y actualice librerías con fallos criptográficos.',
      },
    },
  },
  {
    id: 'owasp-asvs:A03',
    framework: 'owasp-asvs',
    code: 'A03 / ASVS V5',
    domainKey: 'A03',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: ['safe-probe:security-headers', 'safe-probe:csp-permissions'],
      checkCweIds: ['CWE-79', 'CWE-89', 'CWE-94', 'CWE-78'],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'A03 · Injeção & Defesa contra XSS',
        title: 'CSP endurecida e ausência de CWEs de injeção/XSS em dependências',
        description:
          'Mitigar execução arbitrária de scripts (XSS/Injection) via Content-Security-Policy sem unsafe-eval e pacotes corrigidos.',
        guidance:
          'Remova unsafe-eval/wildcards da CSP e atualize bibliotecas com CWE-79, CWE-89 ou CWE-94.',
      },
      en: {
        domainLabel: 'A03 · Injection & XSS Defense',
        title: 'Hardened CSP and zero injection/XSS CWEs in dependencies',
        description:
          'Mitigate script/code injection via strict Content-Security-Policy (no unsafe-eval) and patched libraries.',
        guidance:
          'Eliminate unsafe-eval/wildcards in CSP and patch dependencies carrying CWE-79, CWE-89, or CWE-94.',
      },
      es: {
        domainLabel: 'A03 · Inyección y Defensa XSS',
        title: 'CSP endurecida y ausencia de CWEs de inyección/XSS',
        description:
          'Mitigar ejecución de scripts (XSS/Inyección) mediante CSP sin unsafe-eval y dependencias actualizadas.',
        guidance:
          'Elimine unsafe-eval/comodines en CSP y actualice bibliotecas con CWE-79, CWE-89 o CWE-94.',
      },
    },
  },
  {
    id: 'owasp-asvs:A05',
    framework: 'owasp-asvs',
    code: 'A05 / ASVS V14',
    domainKey: 'A05',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: [
        'safe-probe:security-headers',
        'safe-probe:backup-config-exposure',
        'safe-probe:debug-error-leakage',
        'safe-probe:source-maps',
      ],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'A05 · Configuração Incorreta de Segurança',
        title: 'Hardening de headers, erros genéricos e remoção de backups/debug',
        description:
          'Evitar vazamento de stack traces, diretórios abertos, source maps públicos, arquivos .env.local e banners de versão.',
        guidance:
          'Desative autoindex/debug em produção, remova source maps públicos e aplique cabeçalhos de segurança completos.',
      },
      en: {
        domainLabel: 'A05 · Security Misconfiguration',
        title: 'Header hardening, generic errors & no leaked backups/debug',
        description:
          'Prevent stack-trace disclosure, directory indexing, public source maps, .env files, and server banners.',
        guidance:
          'Turn off production debuggers/autoindex, block .js.map exposure, and enforce defensive headers.',
      },
      es: {
        domainLabel: 'A05 · Configuración de Seguridad Incorrecta',
        title: 'Endurecimiento de cabeceras, errores genéricos y sin debug/backups',
        description:
          'Evitar stack traces, listados de directorio, source maps públicos, .env y banners de versión.',
        guidance:
          'Desactive debug/autoindex en producción, retire source maps públicos y configure cabeceras defensivas.',
      },
    },
  },
  {
    id: 'owasp-asvs:A06',
    framework: 'owasp-asvs',
    code: 'A06 / ASVS V14.2',
    domainKey: 'A06',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      requireSbom: true,
      sbomCheckMode: 'NO_CRITICAL_HIGH_KEV',
      probeIds: ['safe-probe:runtime-fingerprint'],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'A06 · Componentes Vulneráveis e Desatualizados',
        title: 'Dependências atualizadas e sem CVEs conhecidas em runtime',
        description:
          'Manter inventário SBOM limpo de CVEs Críticas/Altas/KEV e sem versões vulneráveis servidas no frontend.',
        guidance:
          'Atualize pacotes vulneráveis para as versões corrigidas sugeridas pelo resolvedor SemVer do Brynja.',
      },
      en: {
        domainLabel: 'A06 · Vulnerable & Outdated Components',
        title: 'Up-to-date dependencies without runtime-confirmed CVEs',
        description:
          'Keep the SBOM free of Critical/High/KEV vulnerabilities and prevent vulnerable client libraries from being served.',
        guidance:
          'Upgrade vulnerable dependencies to the SemVer fixed versions identified by Brynja.',
      },
      es: {
        domainLabel: 'A06 · Componentes Vulnerables y Obsoletos',
        title: 'Dependencias actualizadas sin CVEs confirmadas en runtime',
        description:
          'Mantener el SBOM libre de vulnerabilidades Críticas/Altas/KEV y sin librerías vulnerables servidas al cliente.',
        guidance:
          'Actualice los paquetes afectados a las versiones corregidas sugeridas por Brynja.',
      },
    },
  },
  {
    id: 'owasp-asvs:A07',
    framework: 'owasp-asvs',
    code: 'A07 / ASVS V3',
    domainKey: 'A07',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: ['safe-probe:cookie-security', 'safe-probe:cache-security'],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'A07 · Falhas de Identificação e Autenticação',
        title: 'Proteção de cookies de sessão e isolamento de cache',
        description:
          'Proteger identificadores de sessão com HttpOnly, Secure, SameSite e impedir cache compartilhado de respostas com Set-Cookie.',
        guidance:
          'Defina HttpOnly, Secure e SameSite em cookies e adicione Cache-Control: private, no-store em rotas autenticadas.',
      },
      en: {
        domainLabel: 'A07 · Identification & Authentication Failures',
        title: 'Session cookie hardening and cache isolation',
        description:
          'Protect session cookies with HttpOnly, Secure, SameSite and forbid shared caching of Set-Cookie responses.',
        guidance:
          'Set HttpOnly, Secure, and SameSite flags and return Cache-Control: private, no-store alongside session cookies.',
      },
      es: {
        domainLabel: 'A07 · Fallos de Identificación y Autenticación',
        title: 'Endurecimiento de cookies de sesión y aislamiento de caché',
        description:
          'Proteger cookies de sesión con HttpOnly, Secure, SameSite e impedir caché compartido con Set-Cookie.',
        guidance:
          'Configure HttpOnly, Secure y SameSite y agregue Cache-Control: private, no-store.',
      },
    },
  },
  {
    id: 'owasp-asvs:A08',
    framework: 'owasp-asvs',
    code: 'A08 / ASVS V14.2.3',
    domainKey: 'A08',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      requireSbom: true,
      sbomCheckMode: 'SCAN_EXECUTED',
      probeIds: ['safe-probe:sri-integrity'],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'A08 · Falhas de Integridade de Software e Dados',
        title: 'SBOM rastreável e validação SRI em CDNs externas',
        description:
          'Assegurar integridade da cadeia de suprimentos com lockfiles íntegros, SBOM CycloneDX e hashes integrity em scripts de terceiros.',
        guidance:
          'Inclua atributos integrity/crossorigin em CDNs externas ou empacote dependências estáticas na mesma origem.',
      },
      en: {
        domainLabel: 'A08 · Software & Data Integrity Failures',
        title: 'Traceable SBOM and Subresource Integrity (SRI) on CDNs',
        description:
          'Ensure supply-chain integrity using deterministic lockfiles, CycloneDX SBOMs, and SRI hashes on external assets.',
        guidance:
          'Add integrity/crossorigin attributes to third-party CDN tags or self-host static libraries.',
      },
      es: {
        domainLabel: 'A08 · Fallos en la Integridad del Software y Datos',
        title: 'SBOM trazable e integridad SRI en CDNs externas',
        description:
          'Garantizar integridad de cadena de suministro con lockfiles, SBOM CycloneDX y hashes integrity en scripts de terceros.',
        guidance:
          'Añada atributos integrity/crossorigin en CDNs externas o sirva las librerías desde el mismo origen.',
      },
    },
  },

  // =========================================================================
  // LGPD (ART. 46 / 48 / 50) & ISO/IEC 27001:2022 (ANEXO A)
  // =========================================================================
  {
    id: 'lgpd-iso27001:A.8.8',
    framework: 'lgpd-iso27001',
    code: 'ISO A.8.8 / LGPD Art. 46',
    domainKey: 'A.8',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      requireSbom: true,
      sbomCheckMode: 'NO_CRITICAL_HIGH_KEV',
      probeIds: ['safe-probe:runtime-fingerprint'],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'ISO A.8 · Controles Tecnológicos (LGPD Art. 46)',
        title: 'Gestão de vulnerabilidades técnicas em sistemas e dependências',
        description:
          'Obter inteligência oportuna de vulnerabilidades técnicas (OSV/NVD/KEV) e aplicar medidas preventivas de correção.',
        guidance:
          'Mantenha o inventário SBOM monitorado e trate vulnerabilidades Críticas, Altas e KEV sem atrasos.',
      },
      en: {
        domainLabel: 'ISO A.8 · Technological Controls (LGPD Art. 46)',
        title: 'Management of technical vulnerabilities across software assets',
        description:
          'Gather timely technical vulnerability intelligence (OSV/NVD/KEV) and remediate exposures before exploitation.',
        guidance:
          'Monitor SBOM dependencies continuously and remediate Critical, High, and KEV findings.',
      },
      es: {
        domainLabel: 'ISO A.8 · Controles Tecnológicos (LGPD Art. 46)',
        title: 'Gestión de vulnerabilidades técnicas en sistemas y software',
        description:
          'Obtener información oportuna de vulnerabilidades técnicas (OSV/NVD/KEV) y aplicar correcciones preventivas.',
        guidance:
          'Monitoree el SBOM continuamente y mitigue vulnerabilidades Críticas, Altas y KEV.',
      },
    },
  },
  {
    id: 'lgpd-iso27001:A.8.9',
    framework: 'lgpd-iso27001',
    code: 'ISO A.8.9 / LGPD Art. 46',
    domainKey: 'A.8',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: [
        'safe-probe:security-headers',
        'safe-probe:cors-policy',
        'safe-probe:exposed-artifacts',
        'safe-probe:backup-config-exposure',
        'safe-probe:debug-error-leakage',
      ],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'ISO A.8 · Controles Tecnológicos (LGPD Art. 46)',
        title: 'Gerenciamento de configuração segura e proteção contra vazamentos',
        description:
          'Assegurar configurações seguras em serviços web evitando exposição indevida de backups, arquivos .env, debug e CORS aberto.',
        guidance:
          'Bloqueie arquivos internos/dumps, desative stack traces em produção e padronize cabeçalhos de segurança.',
      },
      en: {
        domainLabel: 'ISO A.8 · Technological Controls (LGPD Art. 46)',
        title: 'Secure configuration management & leak prevention',
        description:
          'Maintain hardened production configurations preventing exposure of backups, .env files, verbose errors, and open CORS.',
        guidance:
          'Block sensitive config/backup paths, suppress stack traces, and enforce standard HTTP security headers.',
      },
      es: {
        domainLabel: 'ISO A.8 · Controles Tecnológicos (LGPD Art. 46)',
        title: 'Gestión de configuración segura y prevención de fugas',
        description:
          'Mantener configuraciones seguras evitando exposición de respaldos, .env, modos debug y CORS abierto.',
        guidance:
          'Bloquee archivos internos y dumps, oculte stack traces en producción y aplique cabeceras defensivas.',
      },
    },
  },
  {
    id: 'lgpd-iso27001:A.8.24',
    framework: 'lgpd-iso27001',
    code: 'ISO A.8.24 / LGPD Art. 46',
    domainKey: 'A.8',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      probeIds: ['safe-probe:hsts-tls', 'safe-probe:cookie-security', 'safe-probe:csp-permissions'],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'ISO A.8 · Controles Tecnológicos (LGPD Art. 46)',
        title: 'Uso eficaz de criptografia em trânsito e proteção de sessão',
        description:
          'Proteger dados pessoais em trânsito com HSTS, TLS sem Mixed Content e cookies protegidos contra interceptação.',
        guidance:
          'Imponha HTTPS/HSTS em todas as origens, flag Secure/HttpOnly em cookies e elimine sub-recursos http://.',
      },
      en: {
        domainLabel: 'ISO A.8 · Technological Controls (LGPD Art. 46)',
        title: 'Effective use of cryptography in transit & session protection',
        description:
          'Protect personal data in transit with HSTS, TLS without Mixed Content, and hardened session cookies.',
        guidance:
          'Enforce HTTPS/HSTS across origins, set Secure/HttpOnly cookies, and remove http:// subresources.',
      },
      es: {
        domainLabel: 'ISO A.8 · Controles Tecnológicos (LGPD Art. 46)',
        title: 'Uso eficaz de criptografía en tránsito y protección de sesión',
        description:
          'Proteger datos personales en tránsito con HSTS, TLS sin Mixed Content y cookies endurecidas.',
        guidance:
          'Imponga HTTPS/HSTS, use flags Secure/HttpOnly en cookies y elimine subrecursos http://.',
      },
    },
  },
  {
    id: 'lgpd-iso27001:A.8.25',
    framework: 'lgpd-iso27001',
    code: 'ISO A.8.25 / A.8.28',
    domainKey: 'A.8',
    assessmentScope: 'TECHNICAL',
    evidenceRule: {
      requireSbom: true,
      sbomCheckMode: 'SCAN_EXECUTED',
      probeIds: ['safe-probe:sri-integrity', 'safe-probe:open-redirect', 'safe-probe:source-maps'],
    },
    copy: {
      'pt-BR': {
        domainLabel: 'ISO A.8 · Controles Tecnológicos (LGPD Art. 46)',
        title: 'Ciclo de vida de desenvolvimento seguro (Privacy by Design)',
        description:
          'Incorporar verificação de dependências, SRI em CDNs, bloqueio de open redirects e remoção de source maps em produção.',
        guidance:
          'Integre verificações Brynja antes de cada release para garantir segurança desde a concepção.',
      },
      en: {
        domainLabel: 'ISO A.8 · Technological Controls (LGPD Art. 46)',
        title: 'Secure development life cycle & security by design',
        description:
          'Embed SBOM checks, CDN SRI verification, open-redirect protection, and source map suppression into release gates.',
        guidance:
          'Run Brynja checks before releases to enforce security and privacy by design.',
      },
      es: {
        domainLabel: 'ISO A.8 · Controles Tecnológicos (LGPD Art. 46)',
        title: 'Ciclo de desarrollo seguro (Seguridad desde el Diseño)',
        description:
          'Integrar verificación SBOM, SRI en CDNs, bloqueo de Open Redirect y eliminación de source maps en producción.',
        guidance:
          'Ejecute análisis de Brynja antes de cada despliegue para asegurar protección desde el diseño.',
      },
    },
  },
  {
    id: 'lgpd-iso27001:A.8.15',
    framework: 'lgpd-iso27001',
    code: 'ISO A.8.15',
    domainKey: 'A.8',
    assessmentScope: 'HYBRID',
    evidenceRule: { requireAuditTrail: true },
    copy: {
      'pt-BR': {
        domainLabel: 'ISO A.8 · Controles Tecnológicos (LGPD Art. 46)',
        title: 'Registro de eventos e rastreabilidade de auditoria',
        description:
          'Produzir e proteger trilhas de auditoria para verificações de segurança e operações sensíveis sobre dados.',
        guidance:
          'O Brynja registra a auditoria das sondas localmente; ateste a política de logs de acesso na aplicação.',
      },
      en: {
        domainLabel: 'ISO A.8 · Technological Controls (LGPD Art. 46)',
        title: 'Event logging and audit traceability',
        description:
          'Produce and safeguard audit logs covering security probes as well as application data access events.',
        guidance:
          'Brynja stores probe audit trails locally; attest application access logging and retention controls.',
      },
      es: {
        domainLabel: 'ISO A.8 · Controles Tecnológicos (LGPD Art. 46)',
        title: 'Registro de eventos y trazabilidad de auditoría',
        description:
          'Generar y proteger registros de auditoría para pruebas de seguridad y accesos a datos sensibles.',
        guidance:
          'Brynja registra la auditoría de sondas localmente; ateste la retención de logs de la aplicación.',
      },
    },
  },
  {
    id: 'lgpd-iso27001:A.5.24',
    framework: 'lgpd-iso27001',
    code: 'ISO A.5.24 / LGPD Art. 48',
    domainKey: 'A.5',
    assessmentScope: 'ORGANIZATIONAL',
    evidenceRule: {},
    copy: {
      'pt-BR': {
        domainLabel: 'ISO A.5 · Controles Organizacionais (LGPD Art. 48/50)',
        title: 'Plano de resposta e comunicação de incidentes à ANPD/Titulares',
        description:
          'Manter procedimento formal para comunicar incidentes relevantes à autoridade nacional (ANPD) e titulares no prazo legal.',
        guidance:
          'Documente o fluxo de comunicação com DPO/Encarregado e modelo de notificação de incidentes.',
      },
      en: {
        domainLabel: 'ISO A.5 · Organizational Controls (LGPD Art. 48/50)',
        title: 'Incident management & regulatory breach notification',
        description:
          'Maintain formal procedures to notify the Data Protection Authority (ANPD) and affected users within legal deadlines.',
        guidance:
          'Document DPO escalation workflow and breach notification templates.',
      },
      es: {
        domainLabel: 'ISO A.5 · Controles Organizacionales (LGPD Art. 48/50)',
        title: 'Gestión de incidentes y notificación regulatoria',
        description:
          'Mantener procedimientos formales para notificar incidentes de datos a la autoridad de control y titulares.',
        guidance:
          'Documente el flujo con el DPO y plantillas de comunicación de incidentes.',
      },
    },
  },
  {
    id: 'lgpd-iso27001:A.5.1',
    framework: 'lgpd-iso27001',
    code: 'ISO A.5.1 / LGPD Art. 50',
    domainKey: 'A.5',
    assessmentScope: 'ORGANIZATIONAL',
    evidenceRule: {},
    copy: {
      'pt-BR': {
        domainLabel: 'ISO A.5 · Controles Organizacionais (LGPD Art. 48/50)',
        title: 'Política de segurança, boas práticas e RIPD (DPIA)',
        description:
          'Formalizar políticas aprovadas pela alta direção, programa de governança em privacidade e Relatório de Impacto quando aplicável.',
        guidance:
          'Anexe referência à Política de Segurança da Informação vigente e data da última revisão pelo Encarregado (DPO).',
      },
      en: {
        domainLabel: 'ISO A.5 · Organizational Controls (LGPD Art. 48/50)',
        title: 'Information security policies & Privacy Impact Assessment (DPIA)',
        description:
          'Maintain leadership-approved security policies, privacy governance, and DPIAs for high-risk processing.',
        guidance:
          'Record reference to the active Information Security Policy and latest DPO review date.',
      },
      es: {
        domainLabel: 'ISO A.5 · Controles Organizacionales (LGPD Art. 48/50)',
        title: 'Políticas de seguridad y evaluación de impacto (DPIA)',
        description:
          'Formalizar políticas aprobadas por la dirección, gobernanza de privacidad y evaluaciones de impacto.',
        guidance:
          'Registre referencia a la Política de Seguridad vigente y fecha de revisión por el DPO.',
      },
    },
  },
];
