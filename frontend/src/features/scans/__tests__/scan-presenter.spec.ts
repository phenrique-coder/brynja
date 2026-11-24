import { describe, expect, it } from 'vitest';
import {
  computeDashboardMetrics,
  filterAndSortFindings,
} from '../presenters/scan.presenter';
import { REPORT_EXPORTERS } from '../registries/finding-registries';
import { ScanReport, ScanSummary, VulnerabilityFinding } from '@/core/models/scan.models';

describe('Scan Presenter & OCP Registries', () => {
  const sampleFindings: VulnerabilityFinding[] = [
    {
      id: '1',
      dependencyId: 'd1',
      advisoryId: 'GHSA-1',
      cveId: 'CVE-2023-0001',
      packageName: 'alpha',
      packageVersion: '1.0.0',
      ecosystem: 'npm',
      title: 'Medium dependency issue',
      description: 'desc',
      severity: 'MEDIUM',
      cvssScore: 5.5,
      cvssVector: null,
      cweIds: [],
      epssScore: 0.1,
      epssPercentile: 0.2,
      isKnownExploited: false,
      fixedVersion: '1.0.1',
      references: [],
      verdict: 'DEPENDENCY_ONLY',
      source: 'OSV.dev',
    },
    {
      id: '2',
      dependencyId: 'd2',
      advisoryId: 'GHSA-2',
      cveId: 'CVE-2021-23337',
      packageName: 'lodash',
      packageVersion: '4.17.20',
      ecosystem: 'npm',
      title: 'Lodash active vulnerability',
      description: 'desc',
      severity: 'HIGH',
      cvssScore: 7.2,
      cvssVector: null,
      cweIds: [],
      epssScore: 0.65,
      epssPercentile: 0.9,
      isKnownExploited: true,
      fixedVersion: '4.17.21',
      references: [],
      verdict: 'CONFIRMED_ACTIVE',
      source: 'OSV.dev + KEV',
    },
  ];

  it('orders KEV & CONFIRMED_ACTIVE findings first and supports filtering', () => {
    const sorted = filterAndSortFindings(sampleFindings, {
      severity: 'ALL',
      verdict: 'ALL',
      onlyKev: false,
      search: '',
    });
    expect(sorted[0].packageName).toBe('lodash');

    const kevOnly = filterAndSortFindings(sampleFindings, {
      severity: 'ALL',
      verdict: 'ALL',
      onlyKev: true,
      search: '',
    });
    expect(kevOnly).toHaveLength(1);
    expect(kevOnly[0].cveId).toBe('CVE-2021-23337');
  });

  it('computes dashboard metrics accurately', () => {
    const scans: ScanSummary[] = [
      {
        id: 's1',
        repositoryUrl: 'https://github.com/a/b',
        branch: 'main',
        targetUrl: null,
        authorizationId: null,
        status: 'COMPLETED',
        currentStage: 'completed',
        ecosystems: ['npm'],
        totalDependencies: 12,
        criticalCount: 1,
        highCount: 2,
        mediumCount: 3,
        lowCount: 0,
        confirmedActiveCount: 1,
        warnings: [],
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
      },
    ];

    expect(computeDashboardMetrics(scans)).toEqual({
      totalScans: 1,
      totalDependenciesScanned: 12,
      criticalAndHighTotal: 3,
      confirmedActiveTotal: 1,
    });
  });

  it('supports CycloneDX, JSON and Markdown report exporters uniformly (OCP/LSP)', () => {
    const report: ScanReport = {
      id: '11111111-1111-1111-1111-111111111111',
      repositoryUrl: 'https://github.com/org/repo',
      branch: 'main',
      targetUrl: null,
      authorizationId: null,
      status: 'COMPLETED',
      currentStage: 'completed',
      ecosystems: ['npm'],
      totalDependencies: 1,
      criticalCount: 0,
      highCount: 1,
      mediumCount: 0,
      lowCount: 0,
      confirmedActiveCount: 0,
      warnings: [],
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      dependencies: [
        {
          id: 'd2',
          name: 'lodash',
          version: '4.17.20',
          ecosystem: 'npm',
          purl: 'pkg:npm/lodash@4.17.20',
          sourceFile: 'package.json',
          isDirect: true,
        },
      ],
      findings: sampleFindings,
      probeResults: [],
      auditLogs: [],
    };

    expect(REPORT_EXPORTERS).toHaveLength(3);
    for (const exporter of REPORT_EXPORTERS) {
      const exported = exporter.export(report);
      expect(exported.content.length).toBeGreaterThan(20);
      expect(exported.filename).toContain('11111111');
    }
  });
});
