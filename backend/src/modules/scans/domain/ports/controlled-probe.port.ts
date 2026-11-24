import {
  ProbeAuditEntry,
  ProbeExecutionContext,
  ProbeResult,
} from '../entities/scan.types';

export const CONTROLLED_PROBES_PORT = Symbol('CONTROLLED_PROBES_PORT');
export const SAFE_HTTP_CLIENT_PORT = Symbol('SAFE_HTTP_CLIENT_PORT');
export const PROBE_AUDIT_LOGGER_PORT = Symbol('PROBE_AUDIT_LOGGER_PORT');

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
  log(entry: ProbeAuditEntry): Promise<void>;
  listByScanForOwner(
    scanId: string,
    ownerGithubUserId: string,
  ): Promise<Array<ProbeAuditEntry & { id: string; createdAt: Date }>>;
  listRecentByOwner(
    ownerGithubUserId: string,
    limit?: number,
  ): Promise<Array<ProbeAuditEntry & { id: string; createdAt: Date }>>;
}
