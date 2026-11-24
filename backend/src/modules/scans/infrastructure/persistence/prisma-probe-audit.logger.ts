import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { ProbeAuditEntry } from '../../domain/entities/scan.types';
import { IProbeAuditLogger } from '../../domain/ports/controlled-probe.port';

@Injectable()
export class PrismaProbeAuditLogger implements IProbeAuditLogger {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: ProbeAuditEntry): Promise<void> {
    await this.prisma.probeAuditLog.create({
      data: {
        ownerGithubUserId: entry.ownerGithubUserId,
        scanId: entry.scanId,
        authorizationId: entry.authorizationId,
        targetUrl: entry.targetUrl,
        probeId: entry.probeId,
        httpMethod: entry.httpMethod,
        requestPath: entry.requestPath,
        statusCode: entry.statusCode,
        durationMs: entry.durationMs,
        outcome: entry.outcome,
        details: entry.details,
      },
    });
  }

  async listByScanForOwner(
    scanId: string,
    ownerGithubUserId: string,
  ): Promise<Array<ProbeAuditEntry & { id: string; createdAt: Date }>> {
    const rows = await this.prisma.probeAuditLog.findMany({
      where: { scanId, ownerGithubUserId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      ownerGithubUserId: r.ownerGithubUserId,
      scanId: r.scanId,
      authorizationId: r.authorizationId,
      targetUrl: r.targetUrl,
      probeId: r.probeId,
      httpMethod: r.httpMethod,
      requestPath: r.requestPath,
      statusCode: r.statusCode,
      durationMs: r.durationMs,
      outcome: r.outcome as ProbeAuditEntry['outcome'],
      details: r.details,
      createdAt: r.createdAt,
    }));
  }

  async listRecentByOwner(
    ownerGithubUserId: string,
    limit = 100,
  ): Promise<Array<ProbeAuditEntry & { id: string; createdAt: Date }>> {
    const rows = await this.prisma.probeAuditLog.findMany({
      where: { ownerGithubUserId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      ownerGithubUserId: r.ownerGithubUserId,
      scanId: r.scanId,
      authorizationId: r.authorizationId,
      targetUrl: r.targetUrl,
      probeId: r.probeId,
      httpMethod: r.httpMethod,
      requestPath: r.requestPath,
      statusCode: r.statusCode,
      durationMs: r.durationMs,
      outcome: r.outcome as ProbeAuditEntry['outcome'],
      details: r.details,
      createdAt: r.createdAt,
    }));
  }
}
