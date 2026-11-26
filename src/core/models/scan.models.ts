export const SUPPORTED_ECOSYSTEMS = [
  'npm',
  'PyPI',
  'Go',
  'crates.io',
  'Maven',
  'NuGet',
  'Packagist',
  'RubyGems',
] as const;

export type Ecosystem = (typeof SUPPORTED_ECOSYSTEMS)[number];

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type FindingVerdict =
  | 'CONFIRMED_ACTIVE'
  | 'POTENTIALLY_EXPOSED'
  | 'DEPENDENCY_ONLY';

export type VerificationMethod =
  | 'WELL_KNOWN_FILE'
  | 'DNS_TXT'
  | 'LOCAL_DEV_SANDBOX';

export type AuthorizationStatus = 'PENDING' | 'VERIFIED' | 'REVOKED';

export type ScanStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type ProbeOutcome = 'PASSED' | 'FINDING' | 'SKIPPED' | 'ABORTED';

export interface TargetAuthorization {
  id: string;
  origin: string;
  hostname: string;
  method: VerificationMethod;
  status: AuthorizationStatus;
  challengeToken?: string;
  challengeSeal?: string;
  verificationProof?: string;
  verifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ComplianceFrameworkId =
  | 'cis-v8'
  | 'nist-csf-2'
  | 'owasp-asvs'
  | 'lgpd-iso27001';

export type CisImplementationGroup = 'IG1' | 'IG2' | 'IG3';

export type GrcManualAttestationStatus =
  | 'UNANSWERED'
  | 'COMPLIANT'
  | 'PARTIAL'
  | 'NON_COMPLIANT'
  | 'NOT_APPLICABLE';

export interface GrcControlResponse {
  controlId: string;
  status: GrcManualAttestationStatus;
  ownerName: string;
  evidenceNote: string;
  updatedAt: string;
}

export interface GrcAssessment {
  id: string;
  name: string;
  repositoryUrl: string | null;
  linkedScanId: string | null;
  targetIg: CisImplementationGroup;
  responses: Record<string, GrcControlResponse>;
  createdAt: string;
  updatedAt: string;
}

export interface LocalBackupBundle {
  version: 1 | 2;
  exportedAt: string;
  ownerGithubUserId: string;
  scans: ScanReport[];
  authorizations: TargetAuthorization[];
  auditLogs: ProbeAuditEntry[];
  grcAssessments?: GrcAssessment[];
}

export interface CreateAuthorizationResponse {
  authorization: TargetAuthorization;
  instructions: string;
}

export interface ChallengeTokenPreview {
  origin: string;
  hostname: string;
  challengeToken: string;
}

export interface ScanSummary {
  id: string;
  ownerLogin?: string | null;
  repositoryUrl: string;
  branch: string;
  targetUrl: string | null;
  authorizationId: string | null;
  status: ScanStatus;
  currentStage: string;
  ecosystems: string[];
  totalDependencies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  confirmedActiveCount: number;
  probeIssuesCount?: number;
  staticIssuesCount?: number;
  staticCriticalHighCount?: number;
  warnings: string[];
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ScanDependency {
  id: string;
  name: string;
  version: string;
  ecosystem: Ecosystem;
  purl: string;
  sourceFile: string;
  isDirect: boolean;
  license?: string | null;
  openssfScore?: number | null;
}

export interface VulnerabilityFinding {
  id: string;
  dependencyId: string;
  advisoryId: string;
  cveId: string | null;
  packageName: string;
  packageVersion: string;
  ecosystem: Ecosystem;
  title: string;
  description: string;
  severity: SeverityLevel;
  cvssScore: number | null;
  cvssVector: string | null;
  cweIds: string[];
  epssScore: number | null;
  epssPercentile: number | null;
  isKnownExploited: boolean;
  fixedVersion: string | null;
  references: string[];
  verdict: FindingVerdict;
  source: string;
}

export interface ProbeFinding {
  id: string;
  probeId: string;
  title: string;
  severity: SeverityLevel;
  status: ProbeOutcome;
  targetUrl: string;
  evidence: string;
  recommendation: string;
  matchedPackage: string | null;
  createdAt: string;
}

export interface ProbeAuditEntry {
  id: string;
  scanId: string | null;
  authorizationId: string | null;
  targetUrl: string;
  probeId: string;
  httpMethod: string;
  requestPath: string;
  statusCode: number | null;
  durationMs: number;
  outcome: string;
  details: string;
  createdAt: string;
}

export type StaticFindingCategory =
  | 'SECRET_LEAK'
  | 'IAC_MISCONFIG'
  | 'CI_CD_RISK'
  | 'SAST_PATTERN'
  | 'REPO_POSTURE';

export interface StaticAnalysisFinding {
  id: string;
  ruleId: string;
  category: StaticFindingCategory;
  severity: SeverityLevel;
  title: string;
  description: string;
  filePath: string;
  lineNumber: number | null;
  maskedSnippet: string | null;
  cweIds: string[];
  recommendation: string;
}

export type AiProviderType = 'openai' | 'gemini' | 'custom';

export interface ByokAiConfig {
  provider: AiProviderType;
  apiKey: string;
  model?: string;
  endpointUrl?: string;
}

export interface AgentRemediationPlan {
  summary: string;
  prioritizedSteps: string[];
  reachabilityHits?: string[];
  generatedBy: string;
}

export interface ScanReport extends ScanSummary {
  dependencies: ScanDependency[];
  findings: VulnerabilityFinding[];
  probeResults: ProbeFinding[];
  auditLogs: ProbeAuditEntry[];
  staticFindings?: StaticAnalysisFinding[];
  aiRemediationPlan?: AgentRemediationPlan | null;
}

export interface CreateScanPayload {
  repositoryUrl: string;
  branch?: string;
  targetUrl?: string | null;
  authorizationId?: string | null;
  manifestFiles?: Array<{ path: string; content: string }>;
  enableStaticAnalysis?: boolean;
}

export interface GitHubIntegrationStatus {
  configured: boolean;
  connected: boolean;
  githubUserId: string | null;
  login: string | null;
  name?: string | null;
  avatarUrl: string | null;
  profileUrl?: string | null;
  sessionExpiresAt?: number | null;
  callbackUrl: string;
  scopes: string;
  oauthAppSettingsUrl?: string | null;
}

export interface GitHubRepoSummary {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
  ownerLogin?: string;
  ownerType?: 'User' | 'Organization';
}

/**
 * Counts Safe Probe entries that reported a weakness (`FINDING`) or guardrail/runtime failure (`ABORTED`).
 */
export function countProbeIssues(
  probeResults: ReadonlyArray<Pick<ProbeFinding, 'status'>>,
): number {
  return probeResults.filter(
    (p) => p.status === 'FINDING' || p.status === 'ABORTED',
  ).length;
}

/**
 * Resolves the number of Safe Probe issues from a summary or full report,
 * supporting legacy locally stored reports created before `probeIssuesCount` existed.
 */
export function resolveScanProbeIssuesCount(
  scan: Pick<ScanSummary, 'probeIssuesCount'> & {
    probeResults?: ReadonlyArray<Pick<ProbeFinding, 'status'>>;
  },
): number {
  if (Array.isArray(scan.probeResults)) {
    return countProbeIssues(scan.probeResults);
  }
  return typeof scan.probeIssuesCount === 'number' ? scan.probeIssuesCount : 0;
}

/**
 * Counts static analysis findings (Code, Secrets, IaC/CI-CD & GitHub Posture).
 */
export function countStaticIssues(
  staticFindings: ReadonlyArray<Pick<StaticAnalysisFinding, 'severity'>>,
): number {
  return staticFindings.length;
}

/**
 * Resolves the total static analysis findings count from a summary or full report,
 * supporting legacy locally stored reports created before `staticIssuesCount` existed.
 */
export function resolveScanStaticIssuesCount(
  scan: Pick<ScanSummary, 'staticIssuesCount'> & {
    staticFindings?: ReadonlyArray<Pick<StaticAnalysisFinding, 'severity'>>;
  },
): number {
  if (Array.isArray(scan.staticFindings)) {
    return countStaticIssues(scan.staticFindings);
  }
  return typeof scan.staticIssuesCount === 'number' ? scan.staticIssuesCount : 0;
}

/**
 * Resolves Critical/High static findings count from a summary or full report.
 */
export function resolveScanStaticCritHighCount(
  scan: Pick<ScanSummary, 'staticCriticalHighCount'> & {
    staticFindings?: ReadonlyArray<Pick<StaticAnalysisFinding, 'severity'>>;
  },
): number {
  if (Array.isArray(scan.staticFindings)) {
    return scan.staticFindings.filter(
      (s) => s.severity === 'CRITICAL' || s.severity === 'HIGH',
    ).length;
  }
  return typeof scan.staticCriticalHighCount === 'number'
    ? scan.staticCriticalHighCount
    : 0;
}
