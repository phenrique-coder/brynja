export type Ecosystem = 'npm' | 'PyPI';

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
  verifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAuthorizationResponse {
  authorization: TargetAuthorization;
  instructions: string;
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

export interface ScanReport extends ScanSummary {
  dependencies: ScanDependency[];
  findings: VulnerabilityFinding[];
  probeResults: ProbeFinding[];
  auditLogs: ProbeAuditEntry[];
}

export interface CreateScanPayload {
  repositoryUrl: string;
  branch?: string;
  targetUrl?: string | null;
  authorizationId?: string | null;
  manifestFiles?: Array<{ path: string; content: string }>;
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
}

export interface GitHubRepoSummary {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
}
