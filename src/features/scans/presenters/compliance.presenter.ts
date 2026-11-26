import {
  COMPLIANCE_CONTROLS_CATALOG,
  COMPLIANCE_FRAMEWORKS,
  ComplianceControlDefinition,
  ComplianceEvidenceRule,
  ControlAssessmentScope,
} from '@/core/catalog/compliance-frameworks.catalog';
import { Locale } from '@/core/i18n/types';
import {
  CisImplementationGroup,
  ComplianceFrameworkId,
  GrcAssessment,
  GrcControlResponse,
  ProbeFinding,
  ScanReport,
  VulnerabilityFinding,
} from '@/core/models/scan.models';
import {
  XlsxCell,
  XlsxSheetSpec,
  XlsxStyleId,
  buildXlsxWorkbookBytes,
  neutralizeSpreadsheetFormula,
} from '../exporters/xlsx-workbook.builder';

export type ComplianceControlStatus =
  | 'COMPLIANT_EVIDENCE'
  | 'MANUAL_ATTESTED'
  | 'GAP_DETECTED'
  | 'PARTIAL'
  | 'NOT_EVALUATED'
  | 'MANUAL_REQUIRED'
  | 'NOT_APPLICABLE';

export interface ComplianceControlEvaluation {
  controlId: string;
  framework: ComplianceFrameworkId;
  code: string;
  domainKey: string;
  domainLabel: string;
  implementationGroup?: CisImplementationGroup;
  assessmentScope: ControlAssessmentScope;
  title: string;
  description: string;
  guidance: string;
  status: ComplianceControlStatus;
  technicalStatus: ComplianceControlStatus;
  manualResponse: GrcControlResponse | null;
  evidenceSummary: string;
  matchedFindingsCount: number;
  matchedProbeFindingsCount: number;
  technicalSignals: string[];
}

export interface ComplianceDomainBreakdown {
  domainKey: string;
  domainLabel: string;
  total: number;
  compliant: number;
  gaps: number;
  partial: number;
  pending: number;
}

export interface ComplianceScorecardSummary {
  totalControls: number;
  applicableControls: number;
  technicalEvaluatedCount: number;
  compliantCount: number;
  gapCount: number;
  partialCount: number;
  pendingManualOrNotEvaluatedCount: number;
  notApplicableCount: number;
  technicalAdherencePercent: number;
  overallAdherencePercent: number;
}

export interface ComplianceFrameworkScorecard {
  frameworkId: ComplianceFrameworkId;
  frameworkName: string;
  shortName: string;
  version: string;
  description: string;
  summary: ComplianceScorecardSummary;
  domains: ComplianceDomainBreakdown[];
  controls: ComplianceControlEvaluation[];
}

interface TechnicalEvaluationResult {
  status: ComplianceControlStatus;
  evidenceSummary: string;
  matchedFindingsCount: number;
  matchedProbeFindingsCount: number;
  technicalSignals: string[];
}

const IG_ORDER: Record<CisImplementationGroup, number> = {
  IG1: 1,
  IG2: 2,
  IG3: 3,
};

function matchesIgFilter(
  control: ComplianceControlDefinition,
  maxIg?: CisImplementationGroup,
): boolean {
  if (!maxIg || !control.implementationGroup) return true;
  return IG_ORDER[control.implementationGroup] <= IG_ORDER[maxIg];
}

function getLocaleCopy(locale: Locale) {
  if (locale === 'en') {
    return {
      organizationalOnly:
        'Organizational/operational safeguard — requires manual attestation in Governance (/governance).',
      noSbomDeps: 'No dependencies were extracted in the SBOM for this scan.',
      sbomReady: (count: number) =>
        `SBOM generated with ${count} tracked package(s).`,
      sbomGaps: (critHigh: number, kev: number) =>
        `${critHigh} Critical/High vulnerability(ies) detected (${kev} in CISA KEV).`,
      sbomClean:
        'Zero Critical, High, or CISA KEV vulnerabilities found across tracked dependencies.',
      cweHits: (count: number, cwes: string[]) =>
        `${count} dependency finding(s) carry matching CWE(s): ${cwes.join(', ')}.`,
      probesNotRun:
        'Active verification skipped (SCA-only scan) — run Safe Probes on an authorized target to evaluate.',
      probesSkippedOnly:
        'Mapped Safe Probes were skipped for this target protocol/environment.',
      probesAborted: (titles: string[]) =>
        `Guardrail aborted probe(s): ${titles.join('; ')}.`,
      probesFindings: (titles: string[]) =>
        `Safe Probe weakness(es) detected: ${titles.join('; ')}.`,
      probesPassed: (count: number) =>
        `${count} Safe Probe(s) passed without weakness findings.`,
      staticGaps: (count: number, titles: string[]) =>
        `${count} static analysis finding(s) detected: ${titles.join('; ')}.`,
      staticClean: 'No secret leaks, IaC misconfigurations, or SAST risks detected in scanned files.',
      auditPresent: (count: number) =>
        `${count} immutable probe audit log event(s) recorded locally.`,
      auditEmpty: 'No probe audit events recorded for this scan.',
      manualCompliant: 'Manually attested as implemented.',
      manualPartial: 'Manually marked as partially implemented.',
      manualNonCompliant: 'Manually marked as non-compliant / gap.',
      manualNa: 'Marked as Not Applicable in Governance assessment.',
    };
  }
  if (locale === 'es') {
    return {
      organizationalOnly:
        'Salvaguarda organizacional/operativa — requiere atestación manual en Gobernanza (/governance).',
      noSbomDeps: 'No se extrajeron dependencias en el SBOM de este escaneo.',
      sbomReady: (count: number) =>
        `SBOM generado con ${count} paquete(s) inventariado(s).`,
      sbomGaps: (critHigh: number, kev: number) =>
        `${critHigh} vulnerabilidad(es) Crítica(s)/Alta(s) detectada(s) (${kev} en CISA KEV).`,
      sbomClean:
        'Cero vulnerabilidades Críticas, Altas o CISA KEV en las dependencias analizadas.',
      cweHits: (count: number, cwes: string[]) =>
        `${count} hallazgo(s) en dependencias con CWE coincidente(s): ${cwes.join(', ')}.`,
      probesNotRun:
        'Verificación activa no ejecutada (solo SCA) — ejecute Safe Probes en un objetivo autorizado.',
      probesSkippedOnly:
        'Las Safe Probes mapeadas fueron omitidas para el protocolo/entorno del objetivo.',
      probesAborted: (titles: string[]) =>
        `Guardrail interrumpió sonda(s): ${titles.join('; ')}.`,
      probesFindings: (titles: string[]) =>
        `Debilidad(es) detectada(s) por Safe Probes: ${titles.join('; ')}.`,
      probesPassed: (count: number) =>
        `${count} Safe Probe(s) aprobada(s) sin hallazgos.`,
      staticGaps: (count: number, titles: string[]) =>
        `${count} hallazgo(s) de análisis estático detectado(s): ${titles.join('; ')}.`,
      staticClean: 'Sin fugas de secretos, fallos IaC ni patrones SAST inseguros en los archivos analizados.',
      auditPresent: (count: number) =>
        `${count} evento(s) de auditoría inmutable registrados localmente.`,
      auditEmpty: 'Sin eventos de auditoría de sondas en este escaneo.',
      manualCompliant: 'Atestado manualmente como implementado.',
      manualPartial: 'Marcado manualmente como parcialmente implementado.',
      manualNonCompliant: 'Marcado manualmente como no conforme / brecha.',
      manualNa: 'Marcado como No Aplicable en la evaluación GRC.',
    };
  }
  return {
    organizationalOnly:
      'Salvaguarda organizacional/operacional — requer atestado manual em Governança (/governance).',
    noSbomDeps: 'Nenhuma dependência foi extraída no SBOM desta varredura.',
    sbomReady: (count: number) =>
      `Inventário SBOM gerado com ${count} biblioteca(s) rastreada(s).`,
    sbomGaps: (critHigh: number, kev: number) =>
      `${critHigh} vulnerabilidade(s) Crítica(s)/Alta(s) detectada(s) (${kev} em CISA KEV).`,
    sbomClean:
      'Nenhuma vulnerabilidade Crítica, Alta ou CISA KEV encontrada nas dependências analisadas.',
    cweHits: (count: number, cwes: string[]) =>
      `${count} achado(s) em dependências possuem CWE(s) associada(s): ${cwes.join(', ')}.`,
    probesNotRun:
      'Verificação ativa não executada (varredura somente SCA) — execute Safe Probes em um alvo autorizado.',
    probesSkippedOnly:
      'As Safe Probes mapeadas foram ignoradas para o protocolo/ambiente deste alvo.',
    probesAborted: (titles: string[]) =>
      `Guardrail interrompeu sonda(s): ${titles.join('; ')}.`,
    probesFindings: (titles: string[]) =>
      `Ponto(s) fraco(s) detectado(s) por Safe Probes: ${titles.join('; ')}.`,
    probesPassed: (count: number) =>
      `${count} Safe Probe(s) aprovada(s) sem falhas detectadas.`,
    staticGaps: (count: number, titles: string[]) =>
      `${count} achado(s) na análise estática detectado(s): ${titles.join('; ')}.`,
    staticClean:
      'Nenhum segredo vazado, falha de IaC/CI ou padrão SAST inseguro detectado.',
    auditPresent: (count: number) =>
      `${count} evento(s) imutável(is) na trilha de auditoria local.`,
    auditEmpty: 'Nenhum evento de trilha de auditoria registrado nesta varredura.',
    manualCompliant: 'Atestado manualmente como implementado.',
    manualPartial: 'Marcado manualmente como parcialmente implementado.',
    manualNonCompliant: 'Marcado manualmente como não conforme / lacuna.',
    manualNa: 'Marcado como Não Aplicável na avaliação de Governança.',
  };
}

function matchProbeByBaseId(
  probeResults: ProbeFinding[],
  baseId: string,
): ProbeFinding[] {
  return probeResults.filter(
    (p) => p.probeId === baseId || p.probeId.startsWith(`${baseId}:`),
  );
}

function findMatchingCweFindings(
  findings: VulnerabilityFinding[],
  targetCwes: readonly string[],
): VulnerabilityFinding[] {
  const targetSet = new Set(targetCwes.map((c) => c.toUpperCase()));
  return findings.filter((f) =>
    f.cweIds.some((cwe) => targetSet.has(cwe.toUpperCase())),
  );
}

function evaluateTechnicalRule(
  control: ComplianceControlDefinition,
  report: ScanReport | null,
  locale: Locale,
): TechnicalEvaluationResult {
  const t = getLocaleCopy(locale);

  if (control.assessmentScope === 'ORGANIZATIONAL') {
    return {
      status: 'MANUAL_REQUIRED',
      evidenceSummary: t.organizationalOnly,
      matchedFindingsCount: 0,
      matchedProbeFindingsCount: 0,
      technicalSignals: [],
    };
  }

  if (!report) {
    return {
      status: 'NOT_EVALUATED',
      evidenceSummary: t.probesNotRun,
      matchedFindingsCount: 0,
      matchedProbeFindingsCount: 0,
      technicalSignals: [],
    };
  }

  const rule: ComplianceEvidenceRule = control.evidenceRule;
  const notes: string[] = [];
  const signals: string[] = [];
  let hasGap = false;
  let hasPass = false;
  let hasNotEvaluated = false;
  let matchedFindingsCount = 0;
  let matchedProbeFindingsCount = 0;

  const pushBlockingVulnSignals = (blocking: VulnerabilityFinding[]) => {
    for (const f of blocking.slice(0, 8)) {
      const flags = [
        f.isKnownExploited ? 'KEV' : null,
        f.verdict === 'CONFIRMED_ACTIVE' ? 'ACTIVE' : null,
      ]
        .filter(Boolean)
        .join(',');
      const ref = f.cveId ?? f.advisoryId;
      const upgrade = f.fixedVersion ? ` -> ${f.fixedVersion}` : '';
      signals.push(
        `${ref} (${f.packageName}@${f.packageVersion}${upgrade})${flags ? ` [${flags}]` : ''}`,
      );
    }
    if (blocking.length > 8) {
      signals.push(`+${blocking.length - 8} more blocking dependency finding(s)`);
    }
  };

  if (rule.requireSbom) {
    if (report.totalDependencies === 0) {
      hasNotEvaluated = true;
      notes.push(t.noSbomDeps);
    } else if (rule.sbomCheckMode === 'SCAN_EXECUTED') {
      hasPass = true;
      notes.push(t.sbomReady(report.totalDependencies));
    } else if (rule.sbomCheckMode === 'NO_CRITICAL_HIGH_KEV') {
      const blocking = report.findings.filter(
        (f) =>
          f.severity === 'CRITICAL' ||
          f.severity === 'HIGH' ||
          f.isKnownExploited,
      );
      const kevCount = blocking.filter((f) => f.isKnownExploited).length;
      if (blocking.length > 0) {
        hasGap = true;
        matchedFindingsCount += blocking.length;
        notes.push(t.sbomGaps(blocking.length, kevCount));
        pushBlockingVulnSignals(blocking);
      } else {
        hasPass = true;
        notes.push(t.sbomClean);
      }
    } else if (rule.sbomCheckMode === 'NO_KEV_OR_ACTIVE') {
      const blocking = report.findings.filter(
        (f) =>
          f.isKnownExploited ||
          f.verdict === 'CONFIRMED_ACTIVE' ||
          f.severity === 'CRITICAL',
      );
      const kevCount = blocking.filter((f) => f.isKnownExploited).length;
      if (blocking.length > 0) {
        hasGap = true;
        matchedFindingsCount += blocking.length;
        notes.push(t.sbomGaps(blocking.length, kevCount));
        pushBlockingVulnSignals(blocking);
      } else {
        hasPass = true;
        notes.push(t.sbomClean);
      }
    }
  }

  if (rule.checkCweIds && rule.checkCweIds.length > 0) {
    const cweMatches = findMatchingCweFindings(
      report.findings,
      rule.checkCweIds,
    );
    if (cweMatches.length > 0) {
      hasGap = true;
      matchedFindingsCount += cweMatches.length;
      const upperTargetCwes = new Set(
        rule.checkCweIds.map((c) => c.toUpperCase()),
      );
      const foundCwes = Array.from(
        new Set(
          cweMatches.flatMap((f) =>
            f.cweIds.filter((c) => upperTargetCwes.has(c.toUpperCase())),
          ),
        ),
      );
      notes.push(t.cweHits(cweMatches.length, foundCwes));
      for (const f of cweMatches.slice(0, 6)) {
        const hitCwes = f.cweIds
          .filter((c) => upperTargetCwes.has(c.toUpperCase()))
          .join(',');
        signals.push(
          `[${hitCwes}] ${f.cveId ?? f.advisoryId} (${f.packageName}@${f.packageVersion})`,
        );
      }
    }
  }

  if (rule.probeIds && rule.probeIds.length > 0) {
    if (report.probeResults.length === 0) {
      hasNotEvaluated = true;
      notes.push(t.probesNotRun);
    } else {
      const relevantProbes = rule.probeIds.flatMap((id) =>
        matchProbeByBaseId(report.probeResults, id),
      );
      const probeFindings = relevantProbes.filter((p) => p.status === 'FINDING');
      const probeAborted = relevantProbes.filter((p) => p.status === 'ABORTED');
      const probePassed = relevantProbes.filter((p) => p.status === 'PASSED');

      if (probeFindings.length > 0) {
        hasGap = true;
        matchedProbeFindingsCount += probeFindings.length;
        notes.push(t.probesFindings(probeFindings.map((p) => p.title)));
        for (const p of probeFindings) {
          const shortEv =
            p.evidence.length > 140
              ? `${p.evidence.slice(0, 137)}...`
              : p.evidence;
          signals.push(`[FINDING] ${p.probeId}: ${p.title} — ${shortEv}`);
        }
      }
      if (probeAborted.length > 0) {
        hasGap = true;
        matchedProbeFindingsCount += probeAborted.length;
        notes.push(t.probesAborted(probeAborted.map((p) => p.title)));
        for (const p of probeAborted) {
          signals.push(`[ABORTED] ${p.probeId}: ${p.title}`);
        }
      }
      if (probeFindings.length === 0 && probeAborted.length === 0) {
        if (probePassed.length > 0) {
          hasPass = true;
          notes.push(t.probesPassed(probePassed.length));
        } else {
          hasNotEvaluated = true;
          notes.push(t.probesSkippedOnly);
        }
      }
    }
  }

  if (rule.requireAuditTrail) {
    if (report.auditLogs.length > 0) {
      hasPass = true;
      notes.push(t.auditPresent(report.auditLogs.length));
    } else {
      hasNotEvaluated = true;
      notes.push(t.auditEmpty);
    }
  }

  if (rule.staticCategories && rule.staticCategories.length > 0) {
    const allStatic = report.staticFindings ?? [];
    const matchedStatic = allStatic.filter(
      (s) =>
        rule.staticCategories!.includes(s.category) && s.severity !== 'INFO',
    );
    if (matchedStatic.length > 0) {
      hasGap = true;
      matchedFindingsCount += matchedStatic.length;
      notes.push(
        t.staticGaps(
          matchedStatic.length,
          matchedStatic.slice(0, 3).map((s) => s.title),
        ),
      );
      for (const s of matchedStatic.slice(0, 8)) {
        const loc = s.lineNumber ? `${s.filePath}:${s.lineNumber}` : s.filePath;
        signals.push(`[${s.severity}] ${loc} — ${s.ruleId}: ${s.title}`);
      }
      if (matchedStatic.length > 8) {
        signals.push(`+${matchedStatic.length - 8} more static finding(s)`);
      }
    } else if (report.staticFindings !== undefined) {
      hasPass = true;
      notes.push(t.staticClean);
    }
  }

  let status: ComplianceControlStatus;
  if (hasGap) {
    status = 'GAP_DETECTED';
  } else if (hasPass && hasNotEvaluated) {
    status = 'PARTIAL';
  } else if (hasPass) {
    status =
      control.assessmentScope === 'HYBRID' ? 'PARTIAL' : 'COMPLIANT_EVIDENCE';
  } else {
    status = 'NOT_EVALUATED';
  }

  return {
    status,
    evidenceSummary: notes.join(' '),
    matchedFindingsCount,
    matchedProbeFindingsCount,
    technicalSignals: Array.from(new Set(signals)).slice(0, 12),
  };
}

function combineTechnicalAndManualStatus(
  technical: TechnicalEvaluationResult,
  control: ComplianceControlDefinition,
  manual: GrcControlResponse | null,
  locale: Locale,
): { status: ComplianceControlStatus; evidenceSummary: string } {
  const t = getLocaleCopy(locale);

  if (!manual || manual.status === 'UNANSWERED') {
    return {
      status: technical.status,
      evidenceSummary: technical.evidenceSummary,
    };
  }

  if (manual.status === 'NOT_APPLICABLE') {
    return {
      status: 'NOT_APPLICABLE',
      evidenceSummary: manual.evidenceNote.trim() || t.manualNa,
    };
  }

  if (manual.status === 'NON_COMPLIANT') {
    return {
      status: 'GAP_DETECTED',
      evidenceSummary: manual.evidenceNote.trim()
        ? `${t.manualNonCompliant} (${manual.evidenceNote.trim()})`
        : t.manualNonCompliant,
    };
  }

  // Technical gap overrides manual optimistic attestation on TECHNICAL/HYBRID controls
  if (technical.status === 'GAP_DETECTED') {
    return {
      status: 'GAP_DETECTED',
      evidenceSummary: technical.evidenceSummary,
    };
  }

  if (manual.status === 'PARTIAL') {
    return {
      status: 'PARTIAL',
      evidenceSummary: manual.evidenceNote.trim()
        ? `${technical.evidenceSummary} ${t.manualPartial}: ${manual.evidenceNote.trim()}`
        : `${technical.evidenceSummary} ${t.manualPartial}`,
    };
  }

  // manual.status === 'COMPLIANT'
  if (control.assessmentScope === 'ORGANIZATIONAL') {
    return {
      status: 'MANUAL_ATTESTED',
      evidenceSummary: manual.evidenceNote.trim() || t.manualCompliant,
    };
  }

  // HYBRID or TECHNICAL without technical gap
  const combinedNote = manual.evidenceNote.trim()
    ? `${technical.evidenceSummary} ${t.manualCompliant} (${manual.evidenceNote.trim()})`
    : `${technical.evidenceSummary} ${t.manualCompliant}`;
  return {
    status:
      technical.status === 'COMPLIANT_EVIDENCE'
        ? 'COMPLIANT_EVIDENCE'
        : 'MANUAL_ATTESTED',
    evidenceSummary: combinedNote.trim(),
  };
}

export interface EvaluateComplianceOptions {
  frameworkId: ComplianceFrameworkId;
  locale?: Locale;
  maxCisIg?: CisImplementationGroup;
  assessment?: GrcAssessment | null;
}

export function evaluateComplianceFramework(
  report: ScanReport | null,
  options: EvaluateComplianceOptions,
): ComplianceFrameworkScorecard {
  const locale = options.locale ?? 'pt-BR';
  const meta = COMPLIANCE_FRAMEWORKS[options.frameworkId];
  const frameworkCopy = meta.copy[locale];

  const definitions = COMPLIANCE_CONTROLS_CATALOG.filter(
    (c) =>
      c.framework === options.frameworkId &&
      (options.frameworkId !== 'cis-v8' ||
        matchesIgFilter(c, options.maxCisIg)),
  );

  const controls: ComplianceControlEvaluation[] = definitions.map((def) => {
    const copy = def.copy[locale];
    const technical = evaluateTechnicalRule(def, report, locale);
    const manual = options.assessment?.responses[def.id] ?? null;
    const combined = combineTechnicalAndManualStatus(
      technical,
      def,
      manual,
      locale,
    );

    return {
      controlId: def.id,
      framework: def.framework,
      code: def.code,
      domainKey: def.domainKey,
      domainLabel: copy.domainLabel,
      implementationGroup: def.implementationGroup,
      assessmentScope: def.assessmentScope,
      title: copy.title,
      description: copy.description,
      guidance: copy.guidance,
      status: combined.status,
      technicalStatus: technical.status,
      manualResponse: manual,
      evidenceSummary: combined.evidenceSummary,
      matchedFindingsCount: technical.matchedFindingsCount,
      matchedProbeFindingsCount: technical.matchedProbeFindingsCount,
      technicalSignals: technical.technicalSignals,
    };
  });

  const domainMap = new Map<string, ComplianceDomainBreakdown>();
  for (const ctrl of controls) {
    let bucket = domainMap.get(ctrl.domainKey);
    if (!bucket) {
      bucket = {
        domainKey: ctrl.domainKey,
        domainLabel: ctrl.domainLabel,
        total: 0,
        compliant: 0,
        gaps: 0,
        partial: 0,
        pending: 0,
      };
      domainMap.set(ctrl.domainKey, bucket);
    }
    if (ctrl.status === 'NOT_APPLICABLE') continue;
    bucket.total += 1;
    if (
      ctrl.status === 'COMPLIANT_EVIDENCE' ||
      ctrl.status === 'MANUAL_ATTESTED'
    ) {
      bucket.compliant += 1;
    } else if (ctrl.status === 'GAP_DETECTED') {
      bucket.gaps += 1;
    } else if (ctrl.status === 'PARTIAL') {
      bucket.partial += 1;
    } else {
      bucket.pending += 1;
    }
  }

  const notApplicableCount = controls.filter(
    (c) => c.status === 'NOT_APPLICABLE',
  ).length;
  const applicable = controls.filter((c) => c.status !== 'NOT_APPLICABLE');

  const compliantCount = applicable.filter(
    (c) =>
      c.status === 'COMPLIANT_EVIDENCE' || c.status === 'MANUAL_ATTESTED',
  ).length;
  const gapCount = applicable.filter((c) => c.status === 'GAP_DETECTED').length;
  const partialCount = applicable.filter((c) => c.status === 'PARTIAL').length;
  const pendingManualOrNotEvaluatedCount = applicable.filter(
    (c) => c.status === 'MANUAL_REQUIRED' || c.status === 'NOT_EVALUATED',
  ).length;

  const technicalControls = applicable.filter(
    (c) =>
      c.assessmentScope !== 'ORGANIZATIONAL' &&
      c.technicalStatus !== 'NOT_EVALUATED',
  );
  const technicalPassing = technicalControls.filter(
    (c) =>
      c.technicalStatus === 'COMPLIANT_EVIDENCE' ||
      c.technicalStatus === 'PARTIAL',
  ).length;
  const technicalWeighted = technicalControls.reduce((sum, c) => {
    if (c.technicalStatus === 'COMPLIANT_EVIDENCE') return sum + 1;
    if (c.technicalStatus === 'PARTIAL') return sum + 0.5;
    return sum;
  }, 0);

  const technicalAdherencePercent =
    technicalControls.length > 0
      ? Math.round((technicalWeighted / technicalControls.length) * 100)
      : 0;

  const overallWeighted = compliantCount + partialCount * 0.5;
  const overallAdherencePercent =
    applicable.length > 0
      ? Math.round((overallWeighted / applicable.length) * 100)
      : 0;

  return {
    frameworkId: options.frameworkId,
    frameworkName: frameworkCopy.name,
    shortName: frameworkCopy.shortName,
    version: meta.version,
    description: frameworkCopy.description,
    summary: {
      totalControls: controls.length,
      applicableControls: applicable.length,
      technicalEvaluatedCount: technicalControls.length,
      compliantCount,
      gapCount,
      partialCount,
      pendingManualOrNotEvaluatedCount,
      notApplicableCount,
      technicalAdherencePercent,
      overallAdherencePercent,
    },
    domains: Array.from(domainMap.values()),
    controls,
  };
}

function escapeCsvCell(value: string): string {
  return `"${neutralizeSpreadsheetFormula(value).replace(/"/g, '""')}"`;
}

export function resolveComplianceSlug(
  report: ScanReport | null,
  assessment?: GrcAssessment | null,
): string {
  return (assessment?.name || report?.id.slice(0, 8) || 'brynja')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

function statusToXlsxStyle(status: ComplianceControlStatus): XlsxStyleId {
  if (status === 'COMPLIANT_EVIDENCE' || status === 'MANUAL_ATTESTED') return 2;
  if (status === 'GAP_DETECTED') return 3;
  if (status === 'PARTIAL') return 4;
  return 5;
}

export function buildComplianceMatrixExcel(
  report: ScanReport | null,
  locale: Locale,
  assessment?: GrcAssessment | null,
): {
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
  textPreview: string;
} {
  const frameworks: ComplianceFrameworkId[] = [
    'cis-v8',
    'nist-csf-2',
    'owasp-asvs',
    'lgpd-iso27001',
  ];

  const scorecards = frameworks.map((frameworkId) =>
    evaluateComplianceFramework(report, {
      frameworkId,
      locale,
      maxCisIg: frameworkId === 'cis-v8' ? assessment?.targetIg : undefined,
      assessment,
    }),
  );

  const summaryRows: XlsxCell[][] = [
    [
      { value: 'Brynja GRC · Matriz de Governança & Conformidade', style: 1 },
      { value: assessment?.name ?? 'Relatório de Varredura', style: 1 },
      { value: report ? `Scan ${report.id.slice(0, 8)}` : 'Manual', style: 1 },
      { value: assessment ? `Escopo ${assessment.targetIg}` : 'IG1–IG3', style: 1 },
      { value: new Date().toISOString().slice(0, 10), style: 1 },
      { value: '', style: 1 },
      { value: '', style: 1 },
    ],
    [
      { value: 'Framework', style: 1 },
      { value: 'Versão', style: 1 },
      { value: 'Aderência Técnica (%)', style: 1 },
      { value: 'Aderência Global (%)', style: 1 },
      { value: 'Conformes', style: 1 },
      { value: 'Lacunas', style: 1 },
      { value: 'Manuais / Pendentes', style: 1 },
    ],
    ...scorecards.map((sc) => [
      { value: sc.shortName },
      { value: sc.version },
      { value: sc.summary.technicalAdherencePercent },
      { value: sc.summary.overallAdherencePercent },
      { value: sc.summary.compliantCount, style: 2 as XlsxStyleId },
      { value: sc.summary.gapCount, style: (sc.summary.gapCount > 0 ? 3 : 2) as XlsxStyleId },
      { value: sc.summary.pendingManualOrNotEvaluatedCount },
    ]),
  ];

  const headerLabels = [
    'Control ID',
    'Code',
    'IG',
    'Domain',
    'Scope',
    'Title',
    'Final Status',
    'Technical Status',
    'Manual Attestation',
    'Owner',
    'Evidence Summary',
    'Manual Notes',
    'Guidance',
  ];

  const sheets: XlsxSheetSpec[] = [
    { name: 'Resumo GRC', rows: summaryRows },
    ...scorecards.map((sc) => ({
      name: sc.shortName,
      rows: [
        headerLabels.map((h) => ({ value: h, style: 1 as XlsxStyleId })),
        ...sc.controls.map((c) => [
          { value: c.controlId },
          { value: c.code },
          { value: c.implementationGroup ?? '-' },
          { value: c.domainLabel },
          { value: c.assessmentScope },
          { value: c.title },
          { value: c.status, style: statusToXlsxStyle(c.status) },
          { value: c.technicalStatus },
          { value: c.manualResponse?.status ?? 'UNANSWERED' },
          { value: c.manualResponse?.ownerName ?? '' },
          { value: c.evidenceSummary },
          { value: c.manualResponse?.evidenceNote ?? '' },
          { value: c.guidance },
        ]),
      ],
    })),
  ];

  const bytes = buildXlsxWorkbookBytes(sheets);
  const slug = resolveComplianceSlug(report, assessment);
  const textPreview = scorecards
    .map(
      (sc) =>
        `${sc.shortName} (${sc.version}): ${sc.summary.technicalAdherencePercent}% técnico / ${sc.summary.overallAdherencePercent}% global`,
    )
    .join('\n');

  return {
    filename: `brynja-compliance-${slug || 'matrix'}.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    bytes,
    textPreview,
  };
}

export function buildComplianceMatrixCsv(
  report: ScanReport | null,
  locale: Locale,
  assessment?: GrcAssessment | null,
): { filename: string; content: string } {
  const frameworks: ComplianceFrameworkId[] = [
    'cis-v8',
    'nist-csf-2',
    'owasp-asvs',
    'lgpd-iso27001',
  ];

  const header = [
    'Framework',
    'Control ID',
    'Code',
    'IG',
    'Domain',
    'Scope',
    'Title',
    'Final Status',
    'Technical Status',
    'Manual Attestation',
    'Owner',
    'Evidence Summary',
    'Manual Notes',
    'Guidance',
  ];

  const rows: string[] = [header.map(escapeCsvCell).join(',')];

  for (const frameworkId of frameworks) {
    const scorecard = evaluateComplianceFramework(report, {
      frameworkId,
      locale,
      maxCisIg: assessment?.targetIg,
      assessment,
    });

    for (const c of scorecard.controls) {
      rows.push(
        [
          scorecard.shortName,
          c.controlId,
          c.code,
          c.implementationGroup ?? '-',
          c.domainLabel,
          c.assessmentScope,
          c.title,
          c.status,
          c.technicalStatus,
          c.manualResponse?.status ?? 'UNANSWERED',
          c.manualResponse?.ownerName ?? '',
          c.evidenceSummary,
          c.manualResponse?.evidenceNote ?? '',
          c.guidance,
        ]
          .map(escapeCsvCell)
          .join(','),
      );
    }
  }

  const slug = (assessment?.name || report?.id.slice(0, 8) || 'brynja')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  return {
    filename: `brynja-compliance-${slug || 'matrix'}.csv`,
    content: `\uFEFF${rows.join('\n')}`,
  };
}
