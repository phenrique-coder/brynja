import {
  CreateAuthorizationResponse,
  CreateScanPayload,
  GitHubIntegrationStatus,
  GitHubRepoSummary,
  ProbeAuditEntry,
  ScanReport,
  ScanSummary,
  TargetAuthorization,
  VerificationMethod,
} from '../models/scan.models';
import { IVereditoGateway } from '../ports/scan-gateway.port';

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

export class HttpScanGateway implements IVereditoGateway {
  constructor(
    private readonly baseUrl: string = process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3001/api',
  ) {}

  async listScans(limit = 25): Promise<ScanSummary[]> {
    return this.request<ScanSummary[]>(`/scans?limit=${limit}`);
  }

  async getScanReport(id: string): Promise<ScanReport> {
    return this.request<ScanReport>(`/scans/${encodeURIComponent(id)}`);
  }

  async deleteScan(id: string): Promise<void> {
    await this.request<{ deleted: boolean }>(
      `/scans/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
  }

  async createScan(payload: CreateScanPayload): Promise<ScanSummary> {
    return this.request<ScanSummary>('/scans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listAuthorizations(): Promise<TargetAuthorization[]> {
    return this.request<TargetAuthorization[]>('/authorizations');
  }

  async createAuthorization(
    targetUrl: string,
    method: VerificationMethod,
  ): Promise<CreateAuthorizationResponse> {
    return this.request<CreateAuthorizationResponse>('/authorizations', {
      method: 'POST',
      body: JSON.stringify({ targetUrl, method }),
    });
  }

  async verifyAuthorization(id: string): Promise<TargetAuthorization> {
    return this.request<TargetAuthorization>(
      `/authorizations/${encodeURIComponent(id)}/verify`,
      { method: 'POST' },
    );
  }

  async revokeAuthorization(id: string): Promise<void> {
    await this.request<{ deleted: boolean }>(
      `/authorizations/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
  }

  async listAuditLogs(scanId?: string): Promise<ProbeAuditEntry[]> {
    const query = scanId ? `?scanId=${encodeURIComponent(scanId)}` : '';
    return this.request<ProbeAuditEntry[]>(`/scans/audit-logs${query}`);
  }

  async getGitHubStatus(): Promise<GitHubIntegrationStatus> {
    return this.request<GitHubIntegrationStatus>('/integrations/github/status');
  }

  async listGitHubRepos(): Promise<GitHubRepoSummary[]> {
    return this.request<GitHubRepoSummary[]>('/integrations/github/repos');
  }

  async disconnectGitHub(): Promise<void> {
    await this.request<{ disconnected: boolean }>(
      '/integrations/github/disconnect',
      { method: 'POST' },
    );
  }

  getGitHubConnectUrl(returnTo = '/'): string {
    return `${this.baseUrl}/integrations/github/connect?returnTo=${encodeURIComponent(returnTo)}`;
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
        // fallback to default message
      }
      throw new GatewayHttpError(res.status, code, message);
    }

    return (await res.json()) as T;
  }
}
