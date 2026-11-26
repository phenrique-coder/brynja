import { COMPLIANCE_FRAMEWORK_IDS } from '@/core/catalog/compliance-frameworks.catalog';
import { ControlAssessmentScope } from '@/core/catalog/compliance-frameworks.catalog';
import { Locale } from '@/core/i18n/types';
import {
  CisImplementationGroup,
  ComplianceFrameworkId,
  GrcAssessment,
  ScanReport,
} from '@/core/models/scan.models';
import { ExportedReportFile } from '@/core/ports/scan-gateway.port';
import {
  ComplianceControlEvaluation,
  ComplianceFrameworkScorecard,
  evaluateComplianceFramework,
  resolveComplianceSlug,
} from '../presenters/compliance.presenter';
import { formatRepositoryDisplay } from '../presenters/scan.presenter';

export type AiGovernanceGapOrigin =
  | 'TECHNICAL_SCAN'
  | 'MANUAL_ATTESTATION'
  | 'BOTH';

export interface AiGovernanceGapItem {
  frameworkId: ComplianceFrameworkId;
  framework: string;
  controlId: string;
  code: string;
  domain: string;
  implementationGroup?: CisImplementationGroup;
  scope: ControlAssessmentScope;
  status: 'GAP_DETECTED' | 'PARTIAL';
  origin: AiGovernanceGapOrigin;
  title: string;
  evidenceSummary: string;
  guidance: string;
  owner?: string;
  manualNotes?: string;
  technicalSignals?: string[];
}

export interface AiGovernanceGapsJsonPayload {
  schema: 'brynja.ai-governance-gaps.v1';
  instructions: string;
  context: {
    assessmentName: string;
    targetIg: CisImplementationGroup;
    repository?: string;
    linkedScanId?: string;
    targetUrl?: string;
  };
  summary: {
    totalGaps: number;
    byStatus: {
      gapDetected: number;
      partial: number;
    };
    byFramework: Record<ComplianceFrameworkId, number>;
    overallAdherencePercent: Record<ComplianceFrameworkId, number>;
  };
  gaps: AiGovernanceGapItem[];
}

function isActionableGovernanceFailure(
  ctrl: ComplianceControlEvaluation,
): ctrl is ComplianceControlEvaluation & { status: 'GAP_DETECTED' | 'PARTIAL' } {
  if (ctrl.status === 'GAP_DETECTED') return true;
  // Include PARTIAL only when explicitly attested as PARTIAL by the user (exclude untouched HYBRID/unscanned controls)
  return (
    ctrl.status === 'PARTIAL' && ctrl.manualResponse?.status === 'PARTIAL'
  );
}

function resolveGapOrigin(
  ctrl: ComplianceControlEvaluation,
): AiGovernanceGapOrigin {
  const hasTechnicalFailure = ctrl.technicalStatus === 'GAP_DETECTED';
  const hasManualFailure =
    ctrl.manualResponse?.status === 'NON_COMPLIANT' ||
    ctrl.manualResponse?.status === 'PARTIAL';

  if (hasTechnicalFailure && hasManualFailure) return 'BOTH';
  if (hasTechnicalFailure) return 'TECHNICAL_SCAN';
  return 'MANUAL_ATTESTATION';
}

function toAiGovernanceGapItem(
  scorecard: ComplianceFrameworkScorecard,
  ctrl: ComplianceControlEvaluation & { status: 'GAP_DETECTED' | 'PARTIAL' },
): AiGovernanceGapItem {
  const owner = ctrl.manualResponse?.ownerName.trim() ?? '';
  const manualNotes = ctrl.manualResponse?.evidenceNote.trim() ?? '';

  return {
    frameworkId: scorecard.frameworkId,
    framework: scorecard.shortName,
    controlId: ctrl.controlId,
    code: ctrl.code,
    domain: ctrl.domainLabel,
    ...(ctrl.implementationGroup
      ? { implementationGroup: ctrl.implementationGroup }
      : {}),
    scope: ctrl.assessmentScope,
    status: ctrl.status,
    origin: resolveGapOrigin(ctrl),
    title: ctrl.title,
    evidenceSummary: ctrl.evidenceSummary,
    guidance: ctrl.guidance,
    ...(owner ? { owner } : {}),
    ...(manualNotes ? { manualNotes } : {}),
    ...(ctrl.technicalSignals.length > 0
      ? { technicalSignals: ctrl.technicalSignals }
      : {}),
  };
}

/**
 * Produces a concise, zero-bloat JSON payload containing ONLY failing Governance controls
 * (GAP_DETECTED and explicitly attested PARTIAL) across CIS v8, NIST CSF 2.0, OWASP, and LGPD/ISO 27001.
 */
export function buildGovernanceAiGapsPayload(
  report: ScanReport | null,
  locale: Locale,
  assessment?: GrcAssessment | null,
): AiGovernanceGapsJsonPayload {
  const scorecards = COMPLIANCE_FRAMEWORK_IDS.map((frameworkId) =>
    evaluateComplianceFramework(report, {
      frameworkId,
      locale,
      maxCisIg: frameworkId === 'cis-v8' ? assessment?.targetIg : undefined,
      assessment,
    }),
  );

  const byFramework: Record<ComplianceFrameworkId, number> = {
    'cis-v8': 0,
    'nist-csf-2': 0,
    'owasp-asvs': 0,
    'lgpd-iso27001': 0,
  };
  const overallAdherencePercent: Record<ComplianceFrameworkId, number> = {
    'cis-v8': 0,
    'nist-csf-2': 0,
    'owasp-asvs': 0,
    'lgpd-iso27001': 0,
  };

  const unsortedGaps: AiGovernanceGapItem[] = [];
  let gapDetected = 0;
  let partial = 0;

  for (const sc of scorecards) {
    overallAdherencePercent[sc.frameworkId] =
      sc.summary.overallAdherencePercent;

    for (const ctrl of sc.controls) {
      if (!isActionableGovernanceFailure(ctrl)) continue;

      byFramework[sc.frameworkId] += 1;
      if (ctrl.status === 'GAP_DETECTED') {
        gapDetected += 1;
      } else {
        partial += 1;
      }
      unsortedGaps.push(toAiGovernanceGapItem(sc, ctrl));
    }
  }

  const gaps = unsortedGaps.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'GAP_DETECTED' ? -1 : 1;
    }
    return (
      (b.technicalSignals?.length ?? 0) - (a.technicalSignals?.length ?? 0)
    );
  });

  const repoDisplay =
    assessment?.repositoryUrl || report?.repositoryUrl
      ? formatRepositoryDisplay(
          assessment?.repositoryUrl ?? report!.repositoryUrl,
        ).displayName
      : undefined;

  return {
    schema: 'brynja.ai-governance-gaps.v1',
    instructions:
      'Analyze only the failing Governance & Compliance controls listed in gaps across CIS Controls v8, NIST CSF 2.0, OWASP ASVS, and LGPD/ISO 27001. Prioritize GAP_DETECTED items and technicalSignals first, then address PARTIAL and organizational gaps with concrete policies, technical hardening steps, owner assignments, and verification evidence.',
    context: {
      assessmentName:
        assessment?.name ||
        (repoDisplay
          ? `GRC — ${repoDisplay}`
          : 'Governance & Compliance Assessment'),
      targetIg: assessment?.targetIg ?? 'IG2',
      ...(repoDisplay ? { repository: repoDisplay } : {}),
      ...(report ? { linkedScanId: report.id.slice(0, 8) } : {}),
      ...(report?.targetUrl ? { targetUrl: report.targetUrl } : {}),
    },
    summary: {
      totalGaps: gaps.length,
      byStatus: { gapDetected, partial },
      byFramework,
      overallAdherencePercent,
    },
    gaps,
  };
}

export function buildGovernanceAiGapsFile(
  report: ScanReport | null,
  locale: Locale,
  assessment?: GrcAssessment | null,
): ExportedReportFile {
  const payload = buildGovernanceAiGapsPayload(report, locale, assessment);
  const slug = resolveComplianceSlug(report, assessment);

  return {
    filename: `brynja-ai-governance-gaps-${slug || 'matrix'}.json`,
    mimeType: 'application/json',
    content: JSON.stringify(payload, null, 2),
  };
}
