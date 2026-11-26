import {
  ChallengeTokenPreview,
  CreateAuthorizationResponse,
  CreateScanPayload,
  GitHubIntegrationStatus,
  GitHubRepoSummary,
  GrcAssessment,
  LocalBackupBundle,
  ProbeAuditEntry,
  ProbeFinding,
  ScanDependency,
  ScanReport,
  ScanSummary,
  TargetAuthorization,
  VerificationMethod,
  VulnerabilityFinding,
  countProbeIssues,
} from '../models/scan.models';
import { IBrynjaGateway, IGrcAssessmentPort } from '../ports/scan-gateway.port';
import {
  ILocalBrynjaStore,
  IndexedDbBrynjaStore,
} from '../storage/brynja-indexeddb.store';

export class GatewayHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
  ) {
    super(message);
    this.name = 'GatewayHttpError';
  }
}

interface ScaApiResponse {
  ecosystems: string[];
  dependencies: ScanDependency[];
  findings: VulnerabilityFinding[];
  warnings: string[];
}

interface ProbesApiResponse {
  probeResults: ProbeFinding[];
  auditLogs: ProbeAuditEntry[];
  matchedPackages: string[];
  renewedAuthorization?: TargetAuthorization;
}

interface VerifyAuthorizationApiResponse {
  authorization: TargetAuthorization;
  auditLogs: ProbeAuditEntry[];
}

function makeUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function summarizeReport(report: ScanReport): ScanSummary {
  const {
    dependencies: _d,
    findings: _f,
    probeResults,
    auditLogs: _a,
    ...summary
  } = report;
  return {
    ...summary,
    probeIssuesCount: Array.isArray(probeResults)
      ? countProbeIssues(probeResults)
      : (summary.probeIssuesCount ?? 0),
  };
}

export class HttpScanGateway implements IBrynjaGateway, IGrcAssessmentPort {
  private cachedOwner: { githubUserId: string; login: string | null } | null =
    null;

  constructor(
    private readonly baseUrl: string = '/api',
    private readonly store: ILocalBrynjaStore = new IndexedDbBrynjaStore(),
  ) {}

  async listScans(limit = 25): Promise<ScanSummary[]> {
    const owner = await this.requireOwner();
    const reports = await this.store.listScans(owner.githubUserId, limit);
    return reports.map(summarizeReport);
  }

  async getScanReport(id: string): Promise<ScanReport> {
    const owner = await this.requireOwner();
    const report = await this.store.getScan(owner.githubUserId, id);
    if (!report) {
      throw new GatewayHttpError(
        404,
        'SCAN_NOT_FOUND',
        'Relatório não encontrado no histórico local deste navegador.',
      );
    }
    return report;
  }

  async deleteScan(id: string): Promise<void> {
    const owner = await this.requireOwner();
    await this.store.deleteScan(owner.githubUserId, id);
  }

  async createScan(payload: CreateScanPayload): Promise<ScanSummary> {
    const owner = await this.requireOwner();
    const branch = payload.branch?.trim() || 'main';
    let targetOrigin: string | null = null;
    let verifiedAuth: TargetAuthorization | null = null;

    if (payload.targetUrl) {
      let parsedOrigin: string;
      try {
        parsedOrigin = new URL(payload.targetUrl.trim()).origin;
      } catch {
        throw new GatewayHttpError(
          400,
          'INVALID_TARGET_URL',
          `URL alvo inválida: "${payload.targetUrl}"`,
        );
      }
      targetOrigin = parsedOrigin;

      const allAuths = await this.store.listAuthorizations(owner.githubUserId);
      verifiedAuth =
        (payload.authorizationId
          ? allAuths.find((a) => a.id === payload.authorizationId)
          : allAuths.find((a) => a.origin === parsedOrigin)) ?? null;

      if (
        !verifiedAuth ||
        verifiedAuth.status !== 'VERIFIED' ||
        !verifiedAuth.verificationProof
      ) {
        throw new GatewayHttpError(
          403,
          'TARGET_NOT_AUTHORIZED',
          `Nenhuma autorização verificada encontrada para "${parsedOrigin}". Verifique a posse em Alvos & Guardrails antes de executar sondas.`,
        );
      }
    }

    const now = new Date().toISOString();
    const scanId = makeUuid();
    const initialReport: ScanReport = {
      id: scanId,
      ownerLogin: owner.login,
      repositoryUrl: payload.repositoryUrl.trim(),
      branch,
      targetUrl: targetOrigin,
      authorizationId: verifiedAuth?.id ?? null,
      status: 'RUNNING',
      currentStage: 'fetching_repository',
      ecosystems: [],
      totalDependencies: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      confirmedActiveCount: 0,
      probeIssuesCount: 0,
      warnings: [],
      errorMessage: null,
      startedAt: now,
      completedAt: null,
      createdAt: now,
      dependencies: [],
      findings: [],
      probeResults: [],
      auditLogs: [],
    };

    await this.store.putScan(owner.githubUserId, initialReport);

    // Run stateless serverless analysis pipeline asynchronously so the UI shows live stage progress
    void this.runPipeline(
      owner.githubUserId,
      initialReport,
      payload,
      verifiedAuth,
    );

    return summarizeReport(initialReport);
  }

  async listAuthorizations(): Promise<TargetAuthorization[]> {
    const owner = await this.requireOwner();
    return this.store.listAuthorizations(owner.githubUserId);
  }

  async previewChallengeToken(
    targetUrl: string,
  ): Promise<ChallengeTokenPreview> {
    await this.requireOwner();
    return this.request<ChallengeTokenPreview>('/authorizations/preview', {
      method: 'POST',
      body: JSON.stringify({ targetUrl }),
    });
  }

  async createAuthorization(
    targetUrl: string,
    method: VerificationMethod,
  ): Promise<CreateAuthorizationResponse> {
    const owner = await this.requireOwner();
    const res = await this.request<CreateAuthorizationResponse>(
      '/authorizations/challenge',
      {
        method: 'POST',
        body: JSON.stringify({ targetUrl, method }),
      },
    );
    await this.store.putAuthorization(owner.githubUserId, res.authorization);
    return res;
  }

  async verifyAuthorization(id: string): Promise<TargetAuthorization> {
    const owner = await this.requireOwner();
    const existing = await this.store.getAuthorization(owner.githubUserId, id);
    if (!existing?.challengeSeal) {
      throw new GatewayHttpError(
        404,
        'AUTHORIZATION_NOT_FOUND',
        'Desafio de autorização não encontrado no navegador. Gere um novo desafio.',
      );
    }

    const res = await this.request<VerifyAuthorizationApiResponse>(
      '/authorizations/verify',
      {
        method: 'POST',
        body: JSON.stringify({ challengeSeal: existing.challengeSeal }),
      },
    );

    await this.store.putAuthorization(owner.githubUserId, res.authorization);
    await this.store.appendAuditLogs(owner.githubUserId, res.auditLogs ?? []);
    return res.authorization;
  }

  async revokeAuthorization(id: string): Promise<void> {
    const owner = await this.requireOwner();
    const existing = await this.store.getAuthorization(owner.githubUserId, id);
    if (existing) {
      await this.store.appendAuditLogs(owner.githubUserId, [
        {
          id: makeUuid(),
          scanId: null,
          authorizationId: null,
          targetUrl: existing.origin,
          probeId: 'guardrail:authorization-revoke',
          httpMethod: 'DELETE',
          requestPath: '/',
          statusCode: null,
          durationMs: 0,
          outcome: 'AUTHORIZATION_REVOKED',
          details: `Autorização ${existing.id} (${existing.origin}) revogada e removida permanentemente do navegador.`,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    await this.store.deleteAuthorization(owner.githubUserId, id);
  }

  async listAuditLogs(scanId?: string): Promise<ProbeAuditEntry[]> {
    const owner = await this.requireOwner();
    return this.store.listAuditLogs(owner.githubUserId, scanId);
  }

  async getGitHubStatus(): Promise<GitHubIntegrationStatus> {
    const status = await this.request<GitHubIntegrationStatus>(
      '/integrations/github/status',
    );
    if (status.connected && status.githubUserId) {
      this.cachedOwner = {
        githubUserId: status.githubUserId,
        login: status.login,
      };
    } else {
      this.cachedOwner = null;
    }
    return status;
  }

  async listGitHubRepos(): Promise<GitHubRepoSummary[]> {
    return this.request<GitHubRepoSummary[]>('/integrations/github/repos');
  }

  async disconnectGitHub(): Promise<void> {
    this.cachedOwner = null;
    await this.request<{ disconnected: boolean }>(
      '/integrations/github/disconnect',
      { method: 'POST' },
    );
  }

  getGitHubConnectUrl(returnTo = '/'): string {
    return `${this.baseUrl}/integrations/github/connect?returnTo=${encodeURIComponent(returnTo)}`;
  }

  async exportLocalBackup(): Promise<LocalBackupBundle> {
    const owner = await this.requireOwner();
    return this.store.exportBackup(owner.githubUserId);
  }

  async importLocalBackup(bundle: LocalBackupBundle): Promise<void> {
    const owner = await this.requireOwner();
    await this.store.importBackup(owner.githubUserId, bundle);
  }

  async listGrcAssessments(): Promise<GrcAssessment[]> {
    const owner = await this.requireOwner();
    return this.store.listGrcAssessments(owner.githubUserId);
  }

  async getGrcAssessment(id: string): Promise<GrcAssessment | null> {
    const owner = await this.requireOwner();
    return this.store.getGrcAssessment(owner.githubUserId, id);
  }

  async saveGrcAssessment(assessment: GrcAssessment): Promise<GrcAssessment> {
    const owner = await this.requireOwner();
    const now = new Date().toISOString();
    const normalized: GrcAssessment = {
      ...assessment,
      id: assessment.id || makeUuid(),
      createdAt: assessment.createdAt || now,
      updatedAt: now,
    };
    await this.store.putGrcAssessment(owner.githubUserId, normalized);
    return normalized;
  }

  async deleteGrcAssessment(id: string): Promise<void> {
    const owner = await this.requireOwner();
    await this.store.deleteGrcAssessment(owner.githubUserId, id);
  }

  private async runPipeline(
    ownerId: string,
    report: ScanReport,
    payload: CreateScanPayload,
    verifiedAuth: TargetAuthorization | null,
  ): Promise<void> {
    let current: ScanReport = { ...report };
    try {
      current = {
        ...current,
        currentStage: 'querying_vulnerability_intel',
      };
      await this.store.putScan(ownerId, current);

      const sca = await this.request<ScaApiResponse>('/analyze/sca', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: current.repositoryUrl,
          branch: current.branch,
          manifestFiles: payload.manifestFiles,
        }),
      });

      let findings = sca.findings;
      let probeResults: ProbeFinding[] = [];
      let auditLogs: ProbeAuditEntry[] = [];
      const warnings = [...sca.warnings];

      current = {
        ...current,
        ecosystems: sca.ecosystems,
        dependencies: sca.dependencies,
        totalDependencies: sca.dependencies.length,
        findings,
        warnings,
        currentStage: verifiedAuth ? 'running_safe_probes' : 'completed',
      };
      await this.store.putScan(ownerId, current);

      if (verifiedAuth && current.targetUrl && verifiedAuth.verificationProof) {
        const probes = await this.request<ProbesApiResponse>(
          '/analyze/probes',
          {
            method: 'POST',
            body: JSON.stringify({
              scanId: current.id,
              targetUrl: current.targetUrl,
              verificationProof: verifiedAuth.verificationProof,
              dependencies: sca.dependencies,
              advisories: sca.findings,
            }),
          },
        );

        probeResults = probes.probeResults;
        auditLogs = probes.auditLogs;

        if (probes.renewedAuthorization) {
          await this.store.putAuthorization(
            ownerId,
            probes.renewedAuthorization,
          );
        }

        await this.store.appendAuditLogs(ownerId, auditLogs);

        const matchedSet = new Set(probes.matchedPackages);
        if (matchedSet.size > 0) {
          findings = findings.map((f) =>
            matchedSet.has(f.packageName.toLowerCase())
              ? { ...f, verdict: 'CONFIRMED_ACTIVE' }
              : f,
          );
        }
      }

      const criticalCount = findings.filter(
        (f) => f.severity === 'CRITICAL',
      ).length;
      const highCount = findings.filter((f) => f.severity === 'HIGH').length;
      const mediumCount = findings.filter((f) => f.severity === 'MEDIUM').length;
      const lowCount = findings.filter((f) => f.severity === 'LOW').length;
      const confirmedActiveCount =
        findings.filter((f) => f.verdict === 'CONFIRMED_ACTIVE').length +
        probeResults.filter((p) => p.status === 'FINDING').length;
      const probeIssuesCount = countProbeIssues(probeResults);

      current = {
        ...current,
        status: 'COMPLETED',
        currentStage: 'completed',
        findings,
        probeResults,
        auditLogs,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        confirmedActiveCount,
        probeIssuesCount,
        completedAt: new Date().toISOString(),
      };
      await this.store.putScan(ownerId, current);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Falha ao executar varredura.';
      current = {
        ...current,
        status: 'FAILED',
        currentStage: 'failed',
        errorMessage: message,
        completedAt: new Date().toISOString(),
      };
      await this.store.putScan(ownerId, current);
    }
  }

  private async requireOwner(): Promise<{
    githubUserId: string;
    login: string | null;
  }> {
    if (this.cachedOwner) return this.cachedOwner;
    const status = await this.getGitHubStatus();
    if (!status.connected || !status.githubUserId) {
      throw new GatewayHttpError(
        401,
        'GITHUB_NOT_CONNECTED',
        'Conecte sua conta GitHub para acessar seu histórico local e iniciar varreduras.',
      );
    }
    return { githubUserId: status.githubUserId, login: status.login };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      let message = `Erro HTTP ${res.status}`;
      let code = 'HTTP_ERROR';
      try {
        const body = (await res.json()) as {
          message?: string;
          error?: string;
        };
        if (body.message) message = body.message;
        if (body.error) code = body.error;
      } catch {
        // fallback
      }
      if (res.status === 401) {
        this.cachedOwner = null;
      }
      throw new GatewayHttpError(res.status, code, message);
    }

    return (await res.json()) as T;
  }
}
