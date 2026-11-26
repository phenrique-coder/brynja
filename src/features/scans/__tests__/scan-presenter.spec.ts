import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseChangelogMarkdown } from '@/core/changelog/changelog.parser';
import packageJson from '../../../../package.json';
import {
  computeDashboardMetrics,
  computeSeverityBarSegments,
  filterAndSortFindings,
  formatReferenceLinks,
} from '../presenters/scan.presenter';
import { REPORT_EXPORTERS } from '../registries/finding-registries';
import {
  ScanReport,
  ScanSummary,
  VulnerabilityFinding,
  countProbeIssues,
  resolveScanProbeIssuesCount,
  resolveScanStaticCritHighCount,
  resolveScanStaticIssuesCount,
} from '@/core/models/scan.models';

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
        staticIssuesCount: 4,
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
      staticIssuesTotal: 4,
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

    expect(REPORT_EXPORTERS).toHaveLength(7);
    expect(REPORT_EXPORTERS.map((e) => e.format)).toEqual([
      'ai-json',
      'json',
      'markdown',
      'cyclonedx',
      'sarif',
      'spdx',
      'compliance-xlsx',
    ]);
    for (const exporter of REPORT_EXPORTERS) {
      const exported = exporter.export(report);
      expect(exported.content.length).toBeGreaterThan(20);
      expect(exported.filename).toContain('11111111');
    }
  });

  it('labels reference links by origin and disambiguates duplicate sources', () => {
    const formatted = formatReferenceLinks([
      'https://github.com/vercel/next.js/security/advisories/GHSA-1111-2222-3333',
      'https://nvd.nist.gov/vuln/detail/CVE-2026-75604',
      'https://github.com/vercel/next.js/commit/abcdef1234567890',
      'https://github.com/vercel/next.js/commit/9876543fedcba',
    ]);

    expect(formatted.map((r) => r.label)).toEqual([
      'GitHub Advisory',
      'NVD (NIST)',
      'GitHub Commit (abcdef1)',
      'GitHub Commit (9876543)',
    ]);
  });

  it('parses bilingual Keep a Changelog files and verifies current package.json version is documented', () => {
    const enRaw = readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf8');
    const ptRaw = readFileSync(
      join(process.cwd(), 'docs', 'pt-BR', 'CHANGELOG.md'),
      'utf8',
    );

    const enReleases = parseChangelogMarkdown(enRaw);
    const ptReleases = parseChangelogMarkdown(ptRaw);

    expect(enReleases.length).toBeGreaterThanOrEqual(2);
    expect(ptReleases.length).toBeGreaterThanOrEqual(2);
    expect(enReleases[0].version).toBe(packageJson.version);
    expect(ptReleases[0].version).toBe(packageJson.version);
    expect(ptReleases[0].sections.length).toBeGreaterThan(0);
  });

  it('counts Safe Probe issues (FINDING and ABORTED) and resolves legacy summaries safely', () => {
    expect(
      countProbeIssues([
        { status: 'PASSED' },
        { status: 'SKIPPED' },
        { status: 'FINDING' },
        { status: 'ABORTED' },
      ]),
    ).toBe(2);

    expect(resolveScanProbeIssuesCount({ probeIssuesCount: 3 })).toBe(3);
    expect(resolveScanProbeIssuesCount({})).toBe(0);
    expect(
      resolveScanProbeIssuesCount({
        probeResults: [{ status: 'FINDING' }, { status: 'PASSED' }],
      }),
    ).toBe(1);

    expect(
      computeSeverityBarSegments({
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        probeIssuesCount: 2,
      }),
    ).toEqual([
      {
        key: 'probes',
        count: 2,
        percentage: 100,
        colorClass: 'bg-violet-500',
      },
    ]);

    expect(
      computeSeverityBarSegments({
        criticalCount: 0,
        highCount: 5,
        mediumCount: 3,
        lowCount: 0,
        probeIssuesCount: 2,
      }),
    ).toEqual([
      {
        key: 'high',
        count: 5,
        percentage: 50,
        colorClass: 'bg-orange-500',
      },
      {
        key: 'medium',
        count: 3,
        percentage: 30,
        colorClass: 'bg-amber-400',
      },
      {
        key: 'probes',
        count: 2,
        percentage: 20,
        colorClass: 'bg-violet-500',
      },
    ]);

    expect(
      computeSeverityBarSegments({
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        probeIssuesCount: 0,
      }),
    ).toEqual([]);

    expect(
      computeSeverityBarSegments({
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        probeIssuesCount: 2,
        staticIssuesCount: 6,
      }),
    ).toEqual([
      {
        key: 'probes',
        count: 2,
        percentage: 25,
        colorClass: 'bg-violet-500',
      },
      {
        key: 'static',
        count: 6,
        percentage: 75,
        colorClass: 'bg-cyan-500',
      },
    ]);

    expect(resolveScanStaticIssuesCount({ staticIssuesCount: 9 })).toBe(9);
    expect(
      resolveScanStaticCritHighCount({
        staticFindings: [
          { severity: 'CRITICAL' },
          { severity: 'HIGH' },
          { severity: 'MEDIUM' },
        ],
      }),
    ).toBe(2);
  });
});
