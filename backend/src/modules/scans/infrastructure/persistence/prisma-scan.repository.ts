import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import {
  ProbeAuditEntry,
  ScanReport,
  ScanStatus,
  ScanSummary,
} from '../../domain/entities/scan.types';
import {
  CreateScanRecordInput,
  IScanReader,
  IScanWriter,
  SaveScanResultsInput,
} from '../../domain/ports/scan-repository.port';

@Injectable()
export class PrismaScanRepository implements IScanReader, IScanWriter {
  constructor(private readonly prisma: PrismaService) {}

  async createQueued(input: CreateScanRecordInput): Promise<ScanSummary> {
    const created = await this.prisma.scan.create({
      data: {
        ownerGithubUserId: input.ownerGithubUserId,
        ownerLogin: input.ownerLogin,
        repositoryUrl: input.repositoryUrl,
        branch: input.branch,
        targetUrl: input.targetUrl,
        authorizationId: input.authorizationId,
        status: 'QUEUED',
        currentStage: 'queued',
      },
    });
    return this.toSummary(created);
  }

  async updateProgress(
    scanId: string,
    status: ScanStatus,
    currentStage: string,
    startedAt?: Date,
  ): Promise<void> {
    await this.prisma.scan.update({
      where: { id: scanId },
      data: {
        status,
        currentStage,
        ...(startedAt ? { startedAt } : {}),
      },
    });
  }

  async saveCompletedReport(input: SaveScanResultsInput): Promise<void> {
    const criticalCount = input.advisories.filter(
      (a) => a.severity === 'CRITICAL',
    ).length;
    const highCount = input.advisories.filter(
      (a) => a.severity === 'HIGH',
    ).length;
    const mediumCount = input.advisories.filter(
      (a) => a.severity === 'MEDIUM',
    ).length;
    const lowCount = input.advisories.filter(
      (a) => a.severity === 'LOW',
    ).length;
    const confirmedActiveCount =
      input.advisories.filter((a) => a.verdict === 'CONFIRMED_ACTIVE').length +
      input.probeResults.filter((p) => p.status === 'FINDING').length;

    await this.prisma.$transaction(async (tx) => {
      const purlToId = new Map<string, string>();
      for (const dep of input.dependencies) {
        const createdDep = await tx.dependency.create({
          data: {
            scanId: input.scanId,
            name: dep.name,
            version: dep.version,
            ecosystem: dep.ecosystem,
            purl: dep.purl,
            sourceFile: dep.sourceFile,
            isDirect: dep.isDirect,
          },
        });
        purlToId.set(`${dep.ecosystem}:${dep.name}@${dep.version}`, createdDep.id);
      }

      if (input.advisories.length > 0) {
        const findingRows = input.advisories
          .map((adv) => {
            const depId = purlToId.get(
              `${adv.ecosystem}:${adv.packageName}@${adv.packageVersion}`,
            );
            if (!depId) return null;
            return {
              scanId: input.scanId,
              dependencyId: depId,
              advisoryId: adv.advisoryId,
              cveId: adv.cveId,
              title: adv.title,
              description: adv.description,
              severity: adv.severity,
              cvssScore: adv.cvssScore,
              cvssVector: adv.cvssVector,
              cweIds: adv.cweIds,
              epssScore: adv.epssScore,
              epssPercentile: adv.epssPercentile,
              isKnownExploited: adv.isKnownExploited,
              fixedVersion: adv.fixedVersion,
              references: adv.references,
              verdict: adv.verdict,
              source: adv.source,
            };
          })
          .filter((row): row is NonNullable<typeof row> => row !== null);

        if (findingRows.length > 0) {
          await tx.vulnerabilityFinding.createMany({ data: findingRows });
        }
      }

      if (input.probeResults.length > 0) {
        await tx.probeFinding.createMany({
          data: input.probeResults.map((p) => ({
            scanId: input.scanId,
            probeId: p.probeId,
            title: p.title,
            severity: p.severity,
            status: p.status,
            targetUrl: p.targetUrl,
            evidence: p.evidence,
            recommendation: p.recommendation,
            matchedPackage: p.matchedPackage,
          })),
        });
      }

      await tx.scan.update({
        where: { id: input.scanId },
        data: {
          status: input.status,
          currentStage: input.currentStage,
          ecosystems: input.ecosystems,
          totalDependencies: input.dependencies.length,
          criticalCount,
          highCount,
          mediumCount,
          lowCount,
          confirmedActiveCount,
          warnings: input.warnings as Prisma.InputJsonValue,
          errorMessage: input.errorMessage ?? null,
          completedAt: input.completedAt ?? new Date(),
        },
      });
    });
  }

  async markFailed(scanId: string, errorMessage: string): Promise<void> {
    await this.prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'FAILED',
        currentStage: 'failed',
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  async deleteForOwner(
    scanId: string,
    ownerGithubUserId: string,
  ): Promise<boolean> {
    const res = await this.prisma.scan.deleteMany({
      where: { id: scanId, ownerGithubUserId },
    });
    return res.count > 0;
  }

  async listRecentByOwner(
    ownerGithubUserId: string,
    limit = 25,
  ): Promise<ScanSummary[]> {
    const rows = await this.prisma.scan.findMany({
      where: { ownerGithubUserId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => this.toSummary(r));
  }

  async findByIdForOwner(
    scanId: string,
    ownerGithubUserId: string,
  ): Promise<ScanReport | null> {
    const scan = await this.prisma.scan.findFirst({
      where: { id: scanId, ownerGithubUserId },
      include: {
        dependencies: { orderBy: [{ isDirect: 'desc' }, { name: 'asc' }] },
        findings: {
          include: { dependency: true },
          orderBy: [{ isKnownExploited: 'desc' }, { cvssScore: 'desc' }],
        },
        probeResults: { orderBy: { createdAt: 'asc' } },
        auditLogs: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!scan) return null;

    return {
      ...this.toSummary(scan),
      dependencies: scan.dependencies.map((d) => ({
        id: d.id,
        name: d.name,
        version: d.version,
        ecosystem: d.ecosystem as 'npm' | 'PyPI',
        purl: d.purl,
        sourceFile: d.sourceFile,
        isDirect: d.isDirect,
      })),
      findings: scan.findings.map((f) => ({
        id: f.id,
        dependencyId: f.dependencyId,
        advisoryId: f.advisoryId,
        cveId: f.cveId,
        packageName: f.dependency.name,
        packageVersion: f.dependency.version,
        ecosystem: f.dependency.ecosystem as 'npm' | 'PyPI',
        title: f.title,
        description: f.description,
        severity: f.severity,
        cvssScore: f.cvssScore,
        cvssVector: f.cvssVector,
        cweIds: f.cweIds,
        epssScore: f.epssScore,
        epssPercentile: f.epssPercentile,
        isKnownExploited: f.isKnownExploited,
        fixedVersion: f.fixedVersion,
        references: f.references,
        verdict: f.verdict,
        source: f.source,
      })),
      probeResults: scan.probeResults.map((p) => ({
        id: p.id,
        probeId: p.probeId,
        title: p.title,
        severity: p.severity,
        status: p.status,
        targetUrl: p.targetUrl,
        evidence: p.evidence,
        recommendation: p.recommendation,
        matchedPackage: p.matchedPackage,
        createdAt: p.createdAt,
      })),
      auditLogs: scan.auditLogs.map((l) => ({
        id: l.id,
        ownerGithubUserId: l.ownerGithubUserId,
        scanId: l.scanId,
        authorizationId: l.authorizationId,
        targetUrl: l.targetUrl,
        probeId: l.probeId,
        httpMethod: l.httpMethod,
        requestPath: l.requestPath,
        statusCode: l.statusCode,
        durationMs: l.durationMs,
        outcome: l.outcome as ProbeAuditEntry['outcome'],
        details: l.details,
        createdAt: l.createdAt,
      })),
    };
  }

  private toSummary(row: {
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
    warnings: Prisma.JsonValue;
    errorMessage: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
  }): ScanSummary {
    return {
      id: row.id,
      ownerGithubUserId: row.ownerGithubUserId,
      ownerLogin: row.ownerLogin,
      repositoryUrl: row.repositoryUrl,
      branch: row.branch,
      targetUrl: row.targetUrl,
      authorizationId: row.authorizationId,
      status: row.status,
      currentStage: row.currentStage,
      ecosystems: row.ecosystems,
      totalDependencies: row.totalDependencies,
      criticalCount: row.criticalCount,
      highCount: row.highCount,
      mediumCount: row.mediumCount,
      lowCount: row.lowCount,
      confirmedActiveCount: row.confirmedActiveCount,
      warnings: Array.isArray(row.warnings)
        ? (row.warnings as string[])
        : [],
      errorMessage: row.errorMessage,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
    };
  }
}
