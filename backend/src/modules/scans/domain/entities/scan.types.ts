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

export type AuditOutcome =
  | 'ALLOWED'
  | 'BLOCKED_UNVERIFIED'
  | 'BLOCKED_SSRF'
  | 'BLOCKED_UNSAFE_METHOD'
  | 'BLOCKED_RATE_LIMIT'
  | 'EXECUTED'
  | 'CIRCUIT_OPEN'
  | 'VERIFICATION_SUCCESS'
  | 'VERIFICATION_FAILED'
  | 'AUTHORIZATION_REVOKED'
  | 'ERROR';

export interface ParsedDependency {
  name: string;
  version: string;
  ecosystem: Ecosystem;
  purl: string;
  sourceFile: string;
  isDirect: boolean;
}

export interface NormalizedAdvisory {
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

export interface TargetAuthorizationEntity {
  id: string;
  ownerGithubUserId: string;
  origin: string;
  hostname: string;
  method: VerificationMethod;
  challengeToken: string;
  tokenHash: string;
  status: AuthorizationStatus;
  verifiedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProbeExecutionContext {
  scanId: string;
  ownerGithubUserId: string;
  authorization: TargetAuthorizationEntity;
  targetUrl: string;
  dependencies: ParsedDependency[];
  advisories: NormalizedAdvisory[];
}

export interface ProbeResult {
  probeId: string;
  title: string;
  severity: SeverityLevel;
  status: ProbeOutcome;
  targetUrl: string;
  evidence: string;
  recommendation: string;
  matchedPackage: string | null;
}

export interface ProbeAuditEntry {
  ownerGithubUserId: string | null;
  scanId: string | null;
  authorizationId: string | null;
  targetUrl: string;
  probeId: string;
  httpMethod: string;
  requestPath: string;
  statusCode: number | null;
  durationMs: number;
  outcome: AuditOutcome;
  details: string;
}

export interface RepositoryFile {
  path: string;
  content: string;
}

export interface ScanSummary {
  id: string;
  ownerGithubUserId: string;
  ownerLogin: string | null;
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
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface ScanReport extends ScanSummary {
  dependencies: Array<ParsedDependency & { id: string }>;
  findings: Array<NormalizedAdvisory & { id: string; dependencyId: string }>;
  probeResults: Array<ProbeResult & { id: string; createdAt: Date }>;
  auditLogs: Array<ProbeAuditEntry & { id: string; createdAt: Date }>;
}
