import {
  AgentRemediationPlan,
  Ecosystem,
  ScanReport,
  SeverityLevel,
} from '@/core/models/scan.models';
import {
  ExportedReportFile,
  IReportExporter,
} from '@/core/ports/scan-gateway.port';
import {
  buildRemediationPlan,
  RemediationItem,
  RemediationKind,
  RemediationPriority,
} from '../presenters/remediation-plan.presenter';
import { formatRepositoryDisplay } from '../presenters/scan.presenter';

export interface AiRemediationTask {
  id: string;
  priority: RemediationPriority;
  kind: RemediationKind;
  severity: SeverityLevel;
  where: string;
  problem: string;
  action: string;
  verify: string;
  package?: string;
  ecosystem?: Ecosystem;
  currentVersion?: string;
  targetVersion?: string | null;
  dependencyScope?: 'direct' | 'transitive';
  cves?: string[];
  flags?: Array<'CISA_KEV' | 'CONFIRMED_RUNTIME'>;
  command?: string;
  probeId?: string;
  evidence?: string;
}

export interface AiRemediationJsonPayload {
  schema: 'brynja.ai-remediation.v1';
  instructions: string;
  context: {
    repository: string;
    branch: string;
    targetUrl?: string;
    ecosystems: string[];
    overallRisk: SeverityLevel;
  };
  summary: {
    totalTasks: number;
    byPriority: Record<RemediationPriority, number>;
    dependencyUpgrades: number;
    runtimeHardening: number;
    staticCodeIssues?: number;
  };
  aiDiagnosis?: AgentRemediationPlan;
  tasks: AiRemediationTask[];
}

function toAiTask(item: RemediationItem): AiRemediationTask {
  const base: AiRemediationTask = {
    id: item.id,
    priority: item.priority,
    kind: item.kind,
    severity: item.severity,
    where: item.where,
    problem: item.problemSummary,
    action: item.solutionAction,
    verify: item.verificationStep,
  };

  if (item.kind === 'dependency') {
    if (item.packageName) base.package = item.packageName;
    if (item.ecosystem) base.ecosystem = item.ecosystem;
    if (item.currentVersion) base.currentVersion = item.currentVersion;
    base.targetVersion = item.targetVersion ?? null;
    if (typeof item.isDirect === 'boolean') {
      base.dependencyScope = item.isDirect ? 'direct' : 'transitive';
    }
    if (item.cves && item.cves.length > 0) base.cves = item.cves;

    const flags: Array<'CISA_KEV' | 'CONFIRMED_RUNTIME'> = [];
    if (item.isKnownExploited) flags.push('CISA_KEV');
    if (item.isConfirmedRuntime) flags.push('CONFIRMED_RUNTIME');
    if (flags.length > 0) base.flags = flags;

    if (item.command) base.command = item.command;
    if (item.evidence) base.evidence = item.evidence;
  } else {
    if (item.probeId) base.probeId = item.probeId;
    if (item.evidence) base.evidence = item.evidence;
  }

  return base;
}

/**
 * Produces a concise, token-efficient JSON payload engineered specifically for AI coding
 * models (LLMs/agents) to resolve security issues directly without report bloat.
 */
export function buildAiRemediationPayload(
  report: ScanReport,
): AiRemediationJsonPayload {
  const plan = buildRemediationPlan(report);
  const repoDisplay = formatRepositoryDisplay(report.repositoryUrl);

  return {
    schema: 'brynja.ai-remediation.v1',
    instructions:
      'Fix tasks in priority order (P0 -> P3). Apply the minimal safe change for each task, avoid unrelated refactors, and run each task verify step after applying fixes.',
    context: {
      repository: repoDisplay.displayName,
      branch: report.branch,
      ...(report.targetUrl ? { targetUrl: report.targetUrl } : {}),
      ecosystems: report.ecosystems,
      overallRisk: plan.overallRisk.severity,
    },
    summary: {
      totalTasks: plan.counts.total,
      byPriority: {
        P0: plan.counts.p0,
        P1: plan.counts.p1,
        P2: plan.counts.p2,
        P3: plan.counts.p3,
      },
      dependencyUpgrades: plan.counts.dependency,
      runtimeHardening: plan.counts.runtimeConfig,
      ...(plan.counts.staticCode > 0
        ? { staticCodeIssues: plan.counts.staticCode }
        : {}),
    },
    ...(report.aiRemediationPlan
      ? { aiDiagnosis: report.aiRemediationPlan }
      : {}),
    tasks: plan.items.map(toAiTask),
  };
}

export class AiRemediationJsonExporter implements IReportExporter {
  readonly format = 'ai-json';
  readonly label = 'Exportar JSON para IA';

  export(report: ScanReport): ExportedReportFile {
    const payload = buildAiRemediationPayload(report);
    return {
      filename: `brynja-ai-fix-${report.id.slice(0, 8)}.json`,
      mimeType: 'application/json',
      content: JSON.stringify(payload, null, 2),
    };
  }
}
