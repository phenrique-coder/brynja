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
  | 'AUTHORIZATION_RENEWED'
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
  status: AuthorizationStatus;
  verifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  challengeSeal?: string;
  verificationProof?: string;
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
  createdAt: string;
}

export interface RepositoryFile {
  path: string;
  content: string;
}
