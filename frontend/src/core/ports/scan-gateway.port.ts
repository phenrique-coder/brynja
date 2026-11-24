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

export interface IScanReader {
  listScans(limit?: number): Promise<ScanSummary[]>;
  getScanReport(id: string): Promise<ScanReport>;
  deleteScan(id: string): Promise<void>;
}

export interface IScanCreator {
  createScan(payload: CreateScanPayload): Promise<ScanSummary>;
}

export interface ITargetAuthorizer {
  listAuthorizations(): Promise<TargetAuthorization[]>;
  createAuthorization(
    targetUrl: string,
    method: VerificationMethod,
  ): Promise<CreateAuthorizationResponse>;
  verifyAuthorization(id: string): Promise<TargetAuthorization>;
  revokeAuthorization(id: string): Promise<void>;
}

export interface IAuditLogReader {
  listAuditLogs(scanId?: string): Promise<ProbeAuditEntry[]>;
}

export interface IGitHubIntegrationPort {
  getGitHubStatus(): Promise<GitHubIntegrationStatus>;
  listGitHubRepos(): Promise<GitHubRepoSummary[]>;
  disconnectGitHub(): Promise<void>;
  getGitHubConnectUrl(returnTo?: string): string;
}

export interface ExportedReportFile {
  filename: string;
  mimeType: string;
  content: string;
}

export interface IReportExporter {
  readonly format: string;
  readonly label: string;
  export(report: ScanReport): ExportedReportFile;
}

export interface IVereditoGateway
  extends IScanReader,
    IScanCreator,
    ITargetAuthorizer,
    IAuditLogReader,
    IGitHubIntegrationPort {}
