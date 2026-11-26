import { describe, expect, it } from 'vitest';
import { ScanReport } from '@/core/models/scan.models';
import { parseExternalSecurityReport } from '../importers/external-report.importer';
import { computeScanDiff } from '../presenters/scan-diff.presenter';
import { REPORT_EXPORTERS } from '../registries/finding-registries';

function makeBaseReport(overrides: Partial<ScanReport> = {}): ScanReport {
  return {
    id: '11111111-2222-3333-4444-555555555555',
    repositoryUrl: 'https://github.com/acme/portal',
    branch: 'main',
    targetUrl: 'https://staging.acme.io',
    authorizationId: 'auth-1',
    status: 'COMPLETED',
    currentStage: 'completed',
    ecosystems: ['npm'],
    totalDependencies: 2,
    criticalCount: 1,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    confirmedActiveCount: 0,
    warnings: [],
    errorMessage: null,
    startedAt: '2026-11-20T10:00:00.000Z',
    completedAt: '2026-11-20T10:01:00.000Z',
    createdAt: '2026-11-20T10:00:00.000Z',
    dependencies: [
      {
        id: 'dep-next',
        name: 'next',
        version: '15.0.0',
        ecosystem: 'npm',
        purl: 'pkg:npm/next@15.0.0',
        sourceFile: 'package.json',
        isDirect: true,
        license: 'MIT',
      },
      {
        id: 'dep-zod',
        name: 'zod',
        version: '3.24.0',
        ecosystem: 'npm',
        purl: 'pkg:npm/zod@3.24.0',
        sourceFile: 'package.json',
        isDirect: true,
        license: 'MIT',
      },
    ],
    findings: [
      {
        id: 'f-1',
        dependencyId: 'dep-next',
        advisoryId: 'GHSA-old-1',
        cveId: 'CVE-2025-1000',
        packageName: 'next',
        packageVersion: '15.0.0',
        ecosystem: 'npm',
        title: 'Old Critical Issue',
        description: 'Desc',
        severity: 'CRITICAL',
        cvssScore: 9.0,
        cvssVector: null,
        cweIds: ['CWE-285'],
        epssScore: 0.8,
        epssPercentile: 0.95,
        isKnownExploited: true,
        fixedVersion: '15.1.0',
        references: ['https://nvd.nist.gov/vuln/detail/CVE-2025-1000'],
        verdict: 'DEPENDENCY_ONLY',
        source: 'OSV.dev',
      },
    ],
    probeResults: [
      {
        id: 'p-1',
        probeId: 'safe-probe:hsts-tls',
        title: 'Missing HSTS',
        severity: 'MEDIUM',
        status: 'FINDING',
        targetUrl: 'https://staging.acme.io',
        evidence: 'Missing header',
        recommendation: 'Enable HSTS',
        matchedPackage: null,
        createdAt: '2026-11-20T10:00:30.000Z',
      },
    ],
    auditLogs: [],
    staticFindings: [
      {
        id: 's-1',
        ruleId: 'sast:eval-js',
        category: 'SAST_PATTERN',
        severity: 'HIGH',
        title: 'Uso de eval()',
        description: 'Dynamic code exec',
        filePath: 'src/legacy.ts',
        lineNumber: 12,
        maskedSnippet: null,
        cweIds: ['CWE-95'],
        recommendation: 'Remove eval',
      },
    ],
    ...overrides,
  };
}

describe('External Report Importers (SARIF, Trivy, Semgrep, Prowler)', () => {
  it('parses OASIS SARIF 2.1.0 reports with CWE tags and secret/IaC classification', () => {
    const sarif = JSON.stringify({
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'CodeQL',
              rules: [
                {
                  id: 'js/sql-injection',
                  shortDescription: { text: 'SQL Injection query' },
                  properties: { tags: ['security', 'external/cwe/cwe-89'] },
                },
              ],
            },
          },
          results: [
            {
              ruleId: 'js/sql-injection',
              level: 'error',
              message: { text: 'Untrusted SQL query built from req.query' },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'src/db.ts' },
                    region: { startLine: 42 },
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const report = parseExternalSecurityReport(sarif, 'codeql.sarif');
    expect(report.repositoryUrl).toBe('imported://sarif/codeql.sarif');
    expect(report.staticFindings).toHaveLength(1);
    expect(report.staticFindings?.[0]).toMatchObject({
      ruleId: 'CodeQL:js/sql-injection',
      category: 'SAST_PATTERN',
      severity: 'HIGH',
      filePath: 'src/db.ts',
      lineNumber: 42,
      cweIds: ['CWE-89'],
    });
    expect(report.highCount).toBe(1);
  });

  it('parses Trivy JSON Vulnerabilities & Misconfigurations (skipping PASS checks)', () => {
    const trivy = JSON.stringify({
      ArtifactName: 'acme/api:1.0.0',
      Results: [
        {
          Target: 'package-lock.json',
          Type: 'npm',
          Vulnerabilities: [
            {
              VulnerabilityID: 'CVE-2024-99999',
              PkgName: 'lodash',
              InstalledVersion: '4.17.20',
              FixedVersion: '4.17.21',
              Severity: 'CRITICAL',
              Title: 'Prototype Pollution',
              CweIDs: ['CWE-1321'],
            },
          ],
          Misconfigurations: [
            {
              ID: 'DS002',
              Title: 'Image user should not be root',
              Severity: 'HIGH',
              Status: 'FAIL',
              Resolution: 'Add USER nonroot',
            },
            {
              ID: 'DS001',
              Title: 'Already safe',
              Severity: 'LOW',
              Status: 'PASS',
            },
          ],
        },
      ],
    });

    const report = parseExternalSecurityReport(trivy, 'trivy.json');
    expect(report.repositoryUrl).toBe('imported://trivy/acme/api:1.0.0');
    expect(report.ecosystems).toEqual(['npm']);
    expect(report.dependencies).toHaveLength(1);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].cveId).toBe('CVE-2024-99999');
    expect(report.staticFindings).toHaveLength(1);
    expect(report.staticFindings?.[0].ruleId).toBe('trivy:DS002');
    expect(report.criticalCount).toBe(1);
    expect(report.highCount).toBe(1);
  });

  it('parses Semgrep JSON results with CWE normalization', () => {
    const semgrep = JSON.stringify({
      results: [
        {
          check_id: 'javascript.express.security.audit.xss',
          path: 'src/render.ts',
          start: { line: 19 },
          extra: {
            severity: 'WARNING',
            message: 'Unescaped template output',
            metadata: { cwe: ['CWE-79: Cross-site Scripting'] },
          },
        },
      ],
    });

    const report = parseExternalSecurityReport(semgrep, 'semgrep.json');
    expect(report.repositoryUrl).toBe('imported://semgrep/semgrep.json');
    expect(report.staticFindings).toHaveLength(1);
    expect(report.staticFindings?.[0]).toMatchObject({
      category: 'SAST_PATTERN',
      severity: 'MEDIUM',
      filePath: 'src/render.ts',
      lineNumber: 19,
      cweIds: ['CWE-79'],
    });
  });

  it('parses Prowler OCSF/JSON cloud audit array keeping non-PASS findings', () => {
    const prowler = JSON.stringify([
      {
        status_code: 'PASS',
        finding_info: { uid: 'iam_root_mfa', title: 'Root MFA Enabled' },
        severity: 'HIGH',
      },
      {
        status_code: 'FAIL',
        finding_info: {
          uid: 's3_bucket_public_access',
          title: 'S3 Bucket allows public read',
          desc: 'Bucket ACL is public',
        },
        remediation: { desc: 'Enable S3 Block Public Access' },
        severity: 'CRITICAL',
        resource_uid: 'arn:aws:s3:::acme-public-logs',
      },
    ]);

    const report = parseExternalSecurityReport(prowler, 'prowler-aws.json');
    expect(report.repositoryUrl).toBe('imported://prowler/prowler-aws.json');
    expect(report.staticFindings).toHaveLength(1);
    expect(report.staticFindings?.[0]).toMatchObject({
      ruleId: 'prowler:s3_bucket_public_access',
      category: 'IAC_MISCONFIG',
      severity: 'CRITICAL',
      filePath: 'arn:aws:s3:::acme-public-logs',
    });
  });

  it('throws clear error on invalid JSON or unknown schema', () => {
    expect(() => parseExternalSecurityReport('{not-json')).toThrow(/JSON inválido/i);
    expect(() => parseExternalSecurityReport('{"foo": "bar"}')).toThrow(
      /Formato não reconhecido/i,
    );
  });
});

describe('Phase 5 Exporters (SARIF 2.1.0, SPDX 2.3, Compliance Excel .xlsx)', () => {
  it('exports valid SARIF 2.1.0, SPDX 2.3 SBOM, and Compliance Matrix Excel (.xlsx)', () => {
    const report = makeBaseReport();

    const sarifExp = REPORT_EXPORTERS.find((e) => e.format === 'sarif');
    const spdxExp = REPORT_EXPORTERS.find((e) => e.format === 'spdx');
    const xlsxExp = REPORT_EXPORTERS.find((e) => e.format === 'compliance-xlsx');

    expect(sarifExp).toBeDefined();
    expect(spdxExp).toBeDefined();
    expect(xlsxExp).toBeDefined();

    const sarifFile = sarifExp!.export(report);
    expect(sarifFile.filename.endsWith('.sarif')).toBe(true);
    const sarifParsed = JSON.parse(sarifFile.content) as {
      version: string;
      runs: Array<{ tool: { driver: { rules: unknown[] } }; results: unknown[] }>;
    };
    expect(sarifParsed.version).toBe('2.1.0');
    expect(sarifParsed.runs[0].results).toHaveLength(3); // 1 CVE + 1 Probe + 1 Static

    const spdxFile = spdxExp!.export(report);
    expect(spdxFile.filename.endsWith('.spdx.json')).toBe(true);
    const spdxParsed = JSON.parse(spdxFile.content) as {
      spdxVersion: string;
      packages: Array<{ name: string; licenseConcluded: string; externalRefs?: unknown[] }>;
      relationships: unknown[];
    };
    expect(spdxParsed.spdxVersion).toBe('SPDX-2.3');
    expect(spdxParsed.packages).toHaveLength(2);
    expect(spdxParsed.packages[0].licenseConcluded).toBe('MIT');
    expect(spdxParsed.relationships).toHaveLength(2);

    const xlsxFile = xlsxExp!.export(report);
    expect(xlsxFile.filename.endsWith('.xlsx')).toBe(true);
    expect(xlsxFile.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(xlsxFile.binaryContent).toBeInstanceOf(Uint8Array);
    // PKZIP local file header signature ("PK\x03\x04")
    expect(Array.from(xlsxFile.binaryContent!.slice(0, 4))).toEqual([
      0x50, 0x4b, 0x03, 0x04,
    ]);
    const zipText = new TextDecoder().decode(xlsxFile.binaryContent);
    expect(zipText).toContain('xl/workbook.xml');
    expect(zipText).toContain('CIS Controls v8');
    expect(zipText).toContain('NIST CSF 2.0');
  });
});

describe('Scan Diff Presenter', () => {
  it('computes new/resolved CVEs, probes, static findings, and CIS/NIST compliance deltas', () => {
    const baseline = makeBaseReport({ id: 'scan-base' });
    const current = makeBaseReport({
      id: 'scan-curr',
      findings: [
        {
          id: 'f-new',
          dependencyId: 'dep-zod',
          advisoryId: 'GHSA-new-2',
          cveId: 'CVE-2026-2222',
          packageName: 'zod',
          packageVersion: '3.24.0',
          ecosystem: 'npm',
          title: 'ReDoS in zod email parser',
          description: 'Desc',
          severity: 'HIGH',
          cvssScore: 7.5,
          cvssVector: null,
          cweIds: ['CWE-1333'],
          epssScore: 0.2,
          epssPercentile: 0.5,
          isKnownExploited: false,
          fixedVersion: '3.25.0',
          references: [],
          verdict: 'DEPENDENCY_ONLY',
          source: 'OSV.dev',
        },
      ],
      probeResults: [
        {
          id: 'p-1',
          probeId: 'safe-probe:hsts-tls',
          title: 'HSTS Configured',
          severity: 'INFO',
          status: 'PASSED',
          targetUrl: 'https://staging.acme.io',
          evidence: 'max-age=31536000',
          recommendation: 'Keep',
          matchedPackage: null,
          createdAt: '2026-11-26T10:00:30.000Z',
        },
      ],
      staticFindings: [],
    });

    const diff = computeScanDiff(baseline, current);
    expect(diff.newFindings.map((f) => f.cveId)).toEqual(['CVE-2026-2222']);
    expect(diff.resolvedFindings.map((f) => f.cveId)).toEqual(['CVE-2025-1000']);
    expect(diff.persistentFindingsCount).toBe(0);
    expect(diff.resolvedProbeIssues).toHaveLength(1);
    expect(diff.newProbeIssues).toHaveLength(0);
    expect(diff.resolvedStaticFindings).toHaveLength(1);
    expect(diff.newStaticFindings).toHaveLength(0);
    expect(diff.cisCurrentPercent).toBeGreaterThanOrEqual(diff.cisBaselinePercent);
    expect(diff.cisDelta).toBe(diff.cisCurrentPercent - diff.cisBaselinePercent);
  });
});
