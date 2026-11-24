import { Inject, Injectable } from '@nestjs/common';
import {
  ProbeAuditEntry,
  ScanReport,
  ScanSummary,
} from '../domain/entities/scan.types';
import { ScanNotFoundError } from '../domain/errors/domain.errors';
import {
  IProbeAuditLogger,
  PROBE_AUDIT_LOGGER_PORT,
} from '../domain/ports/controlled-probe.port';
import {
  IScanReader,
  IScanWriter,
  SCAN_READER_PORT,
  SCAN_WRITER_PORT,
} from '../domain/ports/scan-repository.port';

@Injectable()
export class ListScansUseCase {
  constructor(
    @Inject(SCAN_READER_PORT)
    private readonly scanReader: IScanReader,
  ) {}

  async execute(
    ownerGithubUserId: string,
    limit = 25,
  ): Promise<ScanSummary[]> {
    return this.scanReader.listRecentByOwner(ownerGithubUserId, limit);
  }
}

@Injectable()
export class GetScanReportUseCase {
  constructor(
    @Inject(SCAN_READER_PORT)
    private readonly scanReader: IScanReader,
  ) {}

  async execute(
    scanId: string,
    ownerGithubUserId: string,
  ): Promise<ScanReport> {
    const report = await this.scanReader.findByIdForOwner(
      scanId,
      ownerGithubUserId,
    );
    if (!report) {
      throw new ScanNotFoundError(
        `Scan "${scanId}" não encontrado para este usuário.`,
      );
    }
    return report;
  }
}

@Injectable()
export class ListAuditLogsUseCase {
  constructor(
    @Inject(PROBE_AUDIT_LOGGER_PORT)
    private readonly auditLogger: IProbeAuditLogger,
  ) {}

  async execute(
    ownerGithubUserId: string,
    scanId?: string,
  ): Promise<Array<ProbeAuditEntry & { id: string; createdAt: Date }>> {
    if (scanId) {
      return this.auditLogger.listByScanForOwner(scanId, ownerGithubUserId);
    }
    return this.auditLogger.listRecentByOwner(ownerGithubUserId, 100);
  }
}

@Injectable()
export class DeleteScanUseCase {
  constructor(
    @Inject(SCAN_WRITER_PORT)
    private readonly scanWriter: IScanWriter,
  ) {}

  async execute(
    scanId: string,
    ownerGithubUserId: string,
  ): Promise<{ id: string; deleted: true }> {
    const deleted = await this.scanWriter.deleteForOwner(
      scanId,
      ownerGithubUserId,
    );
    if (!deleted) {
      throw new ScanNotFoundError(
        `Scan "${scanId}" não encontrado para este usuário.`,
      );
    }
    return { id: scanId, deleted: true };
  }
}
