import {
  ProbeFinding,
  ScanReport,
  StaticAnalysisFinding,
  VulnerabilityFinding,
} from '@/core/models/scan.models';
import { evaluateComplianceFramework } from './compliance.presenter';

export interface ScanDiffResult {
  baselineId: string;
  currentId: string;
  newFindings: VulnerabilityFinding[];
  resolvedFindings: VulnerabilityFinding[];
  persistentFindingsCount: number;
  newProbeIssues: ProbeFinding[];
  resolvedProbeIssues: ProbeFinding[];
  newStaticFindings: StaticAnalysisFinding[];
  resolvedStaticFindings: StaticAnalysisFinding[];
  cisBaselinePercent: number;
  cisCurrentPercent: number;
  cisDelta: number;
  nistBaselinePercent: number;
  nistCurrentPercent: number;
  nistDelta: number;
}

function vulnKey(f: VulnerabilityFinding): string {
  return `${f.ecosystem}:${f.packageName}@${f.packageVersion}:${f.cveId ?? f.advisoryId}`;
}

function probeIssueKey(p: ProbeFinding): string {
  return `${p.probeId}:${p.title}`;
}

function staticKey(s: StaticAnalysisFinding): string {
  return `${s.ruleId}:${s.filePath}:${s.lineNumber ?? 0}`;
}

export function computeScanDiff(
  baseline: ScanReport,
  current: ScanReport,
): ScanDiffResult {
  const baseVulnMap = new Map(baseline.findings.map((f) => [vulnKey(f), f]));
  const currVulnMap = new Map(current.findings.map((f) => [vulnKey(f), f]));

  const newFindings: VulnerabilityFinding[] = [];
  let persistentFindingsCount = 0;
  for (const [k, f] of currVulnMap.entries()) {
    if (baseVulnMap.has(k)) {
      persistentFindingsCount += 1;
    } else {
      newFindings.push(f);
    }
  }

  const resolvedFindings: VulnerabilityFinding[] = [];
  for (const [k, f] of baseVulnMap.entries()) {
    if (!currVulnMap.has(k)) {
      resolvedFindings.push(f);
    }
  }

  const baseProbes = baseline.probeResults.filter(
    (p) => p.status === 'FINDING' || p.status === 'ABORTED',
  );
  const currProbes = current.probeResults.filter(
    (p) => p.status === 'FINDING' || p.status === 'ABORTED',
  );
  const baseProbeMap = new Map(baseProbes.map((p) => [probeIssueKey(p), p]));
  const currProbeMap = new Map(currProbes.map((p) => [probeIssueKey(p), p]));

  const newProbeIssues = currProbes.filter(
    (p) => !baseProbeMap.has(probeIssueKey(p)),
  );
  const resolvedProbeIssues = baseProbes.filter(
    (p) => !currProbeMap.has(probeIssueKey(p)),
  );

  const baseStatic = (baseline.staticFindings ?? []).filter(
    (s) => s.severity !== 'INFO',
  );
  const currStatic = (current.staticFindings ?? []).filter(
    (s) => s.severity !== 'INFO',
  );
  const baseStaticMap = new Map(baseStatic.map((s) => [staticKey(s), s]));
  const currStaticMap = new Map(currStatic.map((s) => [staticKey(s), s]));

  const newStaticFindings = currStatic.filter(
    (s) => !baseStaticMap.has(staticKey(s)),
  );
  const resolvedStaticFindings = baseStatic.filter(
    (s) => !currStaticMap.has(staticKey(s)),
  );

  const cisBase = evaluateComplianceFramework(baseline, {
    frameworkId: 'cis-v8',
    locale: 'pt-BR',
  }).summary.technicalAdherencePercent;
  const cisCurr = evaluateComplianceFramework(current, {
    frameworkId: 'cis-v8',
    locale: 'pt-BR',
  }).summary.technicalAdherencePercent;

  const nistBase = evaluateComplianceFramework(baseline, {
    frameworkId: 'nist-csf-2',
    locale: 'pt-BR',
  }).summary.technicalAdherencePercent;
  const nistCurr = evaluateComplianceFramework(current, {
    frameworkId: 'nist-csf-2',
    locale: 'pt-BR',
  }).summary.technicalAdherencePercent;

  return {
    baselineId: baseline.id,
    currentId: current.id,
    newFindings,
    resolvedFindings,
    persistentFindingsCount,
    newProbeIssues,
    resolvedProbeIssues,
    newStaticFindings,
    resolvedStaticFindings,
    cisBaselinePercent: cisBase,
    cisCurrentPercent: cisCurr,
    cisDelta: cisCurr - cisBase,
    nistBaselinePercent: nistBase,
    nistCurrentPercent: nistCurr,
    nistDelta: nistCurr - nistBase,
  };
}
