import {
  NormalizedAdvisory,
  ParsedDependency,
  ProbeResult,
  ScanReport,
  ScanStatus,
  ScanSummary,
} from '../entities/scan.types';

export const SCAN_READER_PORT = Symbol('SCAN_READER_PORT');
export const SCAN_WRITER_PORT = Symbol('SCAN_WRITER_PORT');

export interface CreateScanRecordInput {
  ownerGithubUserId: string;
  ownerLogin: string | null;
  repositoryUrl: string;
  branch: string;
  targetUrl: string | null;
  authorizationId: string | null;
}

export interface SaveScanResultsInput {
  scanId: string;
  status: ScanStatus;
  currentStage: string;
  ecosystems: string[];
  dependencies: ParsedDependency[];
  advisories: NormalizedAdvisory[];
  probeResults: ProbeResult[];
  warnings: string[];
  errorMessage?: string | null;
  completedAt?: Date | null;
}

export interface IScanReader {
  listRecentByOwner(
    ownerGithubUserId: string,
    limit?: number,
  ): Promise<ScanSummary[]>;
  findByIdForOwner(
    scanId: string,
    ownerGithubUserId: string,
  ): Promise<ScanReport | null>;
}

export interface IScanWriter {
  createQueued(input: CreateScanRecordInput): Promise<ScanSummary>;
  updateProgress(
    scanId: string,
    status: ScanStatus,
    currentStage: string,
    startedAt?: Date,
  ): Promise<void>;
  saveCompletedReport(input: SaveScanResultsInput): Promise<void>;
  markFailed(scanId: string, errorMessage: string): Promise<void>;
  deleteForOwner(scanId: string, ownerGithubUserId: string): Promise<boolean>;
}
