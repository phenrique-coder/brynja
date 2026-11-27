import {
  Ecosystem,
  NormalizedAdvisory,
  ParsedDependency,
  ProbeAuditEntry,
  ProbeExecutionContext,
  ProbeResult,
  RepositoryFile,
  RepositoryPostureSignals,
  StaticAnalysisFinding,
  TargetAuthorizationEntity,
} from '../entities/scan.types';

// --- Parsers (OCP) ---
export interface IDependencyParser {
  readonly ecosystem: Ecosystem;
  supports(filePath: string): boolean;
  parse(filePath: string, content: string): ParsedDependency[];
}

// --- Repository Fetcher (OCP) ---
export interface RepositoryFetchContext {
  repositoryUrl: string;
  branch: string;
  accessToken?: string | null;
}

export interface IRepositoryFetcher {
  supports(context: RepositoryFetchContext): boolean;
  fetchManifestFiles(context: RepositoryFetchContext): Promise<RepositoryFile[]>;
  fetchStaticFiles?(context: RepositoryFetchContext): Promise<{
    files: RepositoryFile[];
    posture: RepositoryPostureSignals | null;
    truncated: boolean;
  }>;
}

// --- Lightweight Static Analysis (OCP) ---
export interface IStaticAnalyzer {
  readonly id: string;
  supports(filePath: string): boolean;
  analyze(files: RepositoryFile[]): Promise<StaticAnalysisFinding[]>;
}

// --- Vulnerability Intel & Cache (ISP + OCP) ---
export interface IVulnerabilityCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
}

export interface VulnerabilityLookupResult {
  advisories: NormalizedAdvisory[];
  warnings: string[];
}

export interface IVulnerabilityProvider {
  readonly name: string;
  lookupBatch(
    dependencies: ParsedDependency[],
  ): Promise<VulnerabilityLookupResult>;
}

export interface IVulnerabilityEnricher {
  readonly name: string;
  enrich(
    advisories: NormalizedAdvisory[],
  ): Promise<{ advisories: NormalizedAdvisory[]; warnings: string[] }>;
}

export interface IDependencyEnricher {
  readonly name: string;
  enrichDependencies(
    dependencies: ParsedDependency[],
  ): Promise<{ dependencies: ParsedDependency[]; warnings: string[] }>;
}

// --- Controlled Safe Probes & Guardrails (ISP + OCP) ---
export interface SafeHttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  setCookies?: string[];
  bodySnippet: string;
  durationMs: number;
}

export interface SafeHttpRequest {
  scanId: string;
  ownerGithubUserId?: string | null;
  authorizationId: string;
  probeId: string;
  targetOrigin: string;
  path: string;
  method: 'GET' | 'HEAD';
  headers?: Record<string, string>;
  maxBodyBytes?: number;
}

export interface IRateLimitedHttpClient {
  executeSafeRequest(request: SafeHttpRequest): Promise<SafeHttpResponse>;
}

export interface IControlledProbe {
  readonly id: string;
  readonly title: string;
  run(
    context: ProbeExecutionContext,
    httpClient: IRateLimitedHttpClient,
  ): Promise<ProbeResult[]>;
}

export interface IProbeAuditLogger {
  log(entry: Omit<ProbeAuditEntry, 'id' | 'createdAt'>): Promise<void>;
  getEntries(): ProbeAuditEntry[];
}

export interface OwnershipVerificationOutcome {
  verified: boolean;
  reason: string;
}

export interface IDomainOwnershipVerifier {
  verify(
    authorization: TargetAuthorizationEntity,
  ): Promise<OwnershipVerificationOutcome>;
}

// --- Crypto & GitHub OAuth ---
export interface EncryptedPayload {
  encryptedToken: string;
  iv: string;
  authTag: string;
}

export interface ITokenCipher {
  encrypt(plaintext: string): EncryptedPayload;
  decrypt(payload: EncryptedPayload): string;
  deriveHmacHex(purpose: string, data: string, length?: number): string;
}

export interface GitHubUserProfile {
  id: string;
  login: string;
  name?: string | null;
  email?: string | null;
  verifiedEmails?: string[];
  avatarUrl: string | null;
  profileUrl?: string | null;
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

export interface EphemeralGitHubSession {
  githubUserId: string;
  login: string;
  name?: string | null;
  email?: string | null;
  verifiedEmails?: string[];
  avatarUrl: string | null;
  profileUrl?: string | null;
  accessToken: string;
  scopes?: string;
  issuedAt: number;
  expiresAt: number;
}

export interface ISessionTokenCodec {
  seal(session: EphemeralGitHubSession): string;
  unseal(token: string | undefined | null): EphemeralGitHubSession | null;
}

export interface GitHubOAuthConfigSummary {
  configured: boolean;
  callbackUrl: string;
  scopes: string;
  oauthAppSettingsUrl?: string | null;
}

export interface GitHubTokenExchangeResult {
  accessToken: string;
  scope: string;
}

export interface IGitHubOAuthClient {
  isConfigured(): boolean;
  getConfigSummary(requestOrigin?: string): GitHubOAuthConfigSummary;
  buildAuthorizeUrl(state: string, requestOrigin?: string): string;
  exchangeCodeForToken(
    code: string,
    requestOrigin?: string,
  ): Promise<GitHubTokenExchangeResult>;
  fetchAuthenticatedUser(accessToken: string): Promise<GitHubUserProfile>;
  fetchVerifiedEmails?(accessToken: string): Promise<string[]>;
  listRepositories(accessToken: string): Promise<GitHubRepoSummary[]>;
}

// --- AI Agents Extension Port (BYOK / Reachability) ---
export type AiProviderType = 'openai' | 'gemini' | 'custom';

export interface AiModelOption {
  id: string;
  label?: string;
}

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

export interface IAgentAdvisorPort {
  readonly enabled: boolean;
  adviseOnFindings(
    advisories: NormalizedAdvisory[],
    probeResults: ProbeResult[],
  ): Promise<AgentRemediationPlan | null>;
}
