import { describe, expect, it } from 'vitest';
import {
  COMPLIANCE_CONTROLS_CATALOG,
  COMPLIANCE_FRAMEWORK_IDS,
} from '@/core/catalog/compliance-frameworks.catalog';
import { SUPPORTED_LOCALES } from '@/core/i18n';
import { GrcAssessment, ScanReport } from '@/core/models/scan.models';
import {
  buildComplianceMatrixCsv,
  buildComplianceMatrixExcel,
  evaluateComplianceFramework,
} from '../presenters/compliance.presenter';

function makeBaseReport(overrides: Partial<ScanReport> = {}): ScanReport {
  const now = '2026-11-26T12:00:00.000Z';
  return {
    id: 'scan-comp-1',
    repositoryUrl: 'https://github.com/acme/web-portal',
    branch: 'main',
    targetUrl: 'https://staging.acme.io',
    authorizationId: 'auth-1',
    status: 'COMPLETED',
    currentStage: 'completed',
    ecosystems: ['npm'],
    totalDependencies: 50,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    confirmedActiveCount: 0,
    warnings: [],
    errorMessage: null,
    startedAt: now,
    completedAt: now,
    createdAt: now,
    dependencies: [
      {
        id: 'dep-1',
        name: 'next',
        version: '15.2.3',
        ecosystem: 'npm',
        purl: 'pkg:npm/next@15.2.3',
        sourceFile: 'package.json',
        isDirect: true,
      },
    ],
    findings: [],
    probeResults: [
      {
        id: 'p-1',
        probeId: 'safe-probe:security-headers',
        title: 'Security headers OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'All defensive headers present.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-2',
        probeId: 'safe-probe:hsts-tls',
        title: 'HSTS OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'max-age=31536000',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-3',
        probeId: 'safe-probe:csp-permissions',
        title: 'CSP OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'Strict CSP.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-4',
        probeId: 'safe-probe:cookie-security',
        title: 'Cookies OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'HttpOnly, Secure, SameSite=Lax.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-5',
        probeId: 'safe-probe:cors-policy',
        title: 'CORS OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'Origin not reflected.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-6',
        probeId: 'safe-probe:cache-security',
        title: 'Cache OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'private, no-store.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-7',
        probeId: 'safe-probe:open-redirect',
        title: 'Open Redirect OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'No 3xx to untrusted domains.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-8',
        probeId: 'safe-probe:exposed-artifacts',
        title: 'Artifacts OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'All 404.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-9',
        probeId: 'safe-probe:exposed-docs-metrics',
        title: 'Docs/security.txt OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'security.txt present and docs restricted.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-10',
        probeId: 'safe-probe:backup-config-exposure',
        title: 'Backups OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'All 404.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-11',
        probeId: 'safe-probe:runtime-fingerprint',
        title: 'Runtime OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'No vulnerable libraries served.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-12',
        probeId: 'safe-probe:source-maps',
        title: 'Source Maps OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: '404.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-13',
        probeId: 'safe-probe:debug-error-leakage',
        title: 'Debug Leakage OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'Generic 404.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
      {
        id: 'p-14',
        probeId: 'safe-probe:sri-integrity',
        title: 'SRI OK',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'All CDN assets use integrity hashes.',
        recommendation: 'Keep policy.',
        matchedPackage: null,
        createdAt: now,
      },
    ],
    auditLogs: [
      {
        id: 'audit-1',
        scanId: 'scan-comp-1',
        authorizationId: 'auth-1',
        targetUrl: 'https://staging.acme.io',
        probeId: 'safe-probe:hsts-tls',
        httpMethod: 'HEAD',
        requestPath: '/',
        statusCode: 200,
        durationMs: 25,
        outcome: 'EXECUTED',
        details: 'Executed.',
        createdAt: now,
      },
    ],
    ...overrides,
  };
}

describe('Compliance Frameworks Catalog & Evaluator', () => {
  it('provides localized copy in pt-BR, en, and es for every control across all 4 frameworks', () => {
    for (const frameworkId of COMPLIANCE_FRAMEWORK_IDS) {
      const controls = COMPLIANCE_CONTROLS_CATALOG.filter(
        (c) => c.framework === frameworkId,
      );
      expect(controls.length).toBeGreaterThanOrEqual(5);

      for (const localeMeta of SUPPORTED_LOCALES) {
        for (const ctrl of controls) {
          const copy = ctrl.copy[localeMeta.code];
          expect(copy.title.trim().length).toBeGreaterThan(5);
          expect(copy.description.trim().length).toBeGreaterThan(10);
          expect(copy.guidance.trim().length).toBeGreaterThan(10);
          expect(copy.domainLabel.trim().length).toBeGreaterThan(3);
        }
      }
    }
  });

  it('scores high technical adherence on a clean full scan across CIS v8, NIST CSF 2.0, OWASP, and LGPD/ISO', () => {
    const cleanReport = makeBaseReport();

    for (const frameworkId of COMPLIANCE_FRAMEWORK_IDS) {
      const scorecard = evaluateComplianceFramework(cleanReport, {
        frameworkId,
        locale: 'pt-BR',
      });
      expect(scorecard.summary.gapCount).toBe(0);
      expect(scorecard.summary.technicalAdherencePercent).toBeGreaterThanOrEqual(85);
      expect(scorecard.domains.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('flags technical gaps from CISA KEV findings, CWE matches, and Safe Probe weaknesses', () => {
    const vulnerableReport = makeBaseReport({
      criticalCount: 1,
      findings: [
        {
          id: 'f-1',
          dependencyId: 'dep-1',
          advisoryId: 'GHSA-1234',
          cveId: 'CVE-2025-9999',
          packageName: 'lodash',
          packageVersion: '4.17.20',
          ecosystem: 'npm',
          title: 'Prototype Pollution / XSS',
          description: 'Critical flaw',
          severity: 'CRITICAL',
          cvssScore: 9.8,
          cvssVector: null,
          cweIds: ['CWE-79'],
          epssScore: 0.91,
          epssPercentile: 0.99,
          isKnownExploited: true,
          fixedVersion: '4.17.21',
          references: ['https://osv.dev'],
          verdict: 'CONFIRMED_ACTIVE',
          source: 'OSV.dev',
        },
      ],
      probeResults: [
        {
          id: 'p-hsts',
          probeId: 'safe-probe:hsts-tls',
          title: 'HSTS Missing',
          severity: 'MEDIUM',
          status: 'FINDING',
          targetUrl: 'https://staging.acme.io',
          evidence: 'Strict-Transport-Security missing',
          recommendation: 'Add HSTS header',
          matchedPackage: null,
          createdAt: '2026-11-26T12:00:00.000Z',
        },
      ],
    });

    const cis = evaluateComplianceFramework(vulnerableReport, {
      frameworkId: 'cis-v8',
      locale: 'en',
    });
    const cis310 = cis.controls.find((c) => c.controlId === 'cis-v8:3.10');
    const cis71 = cis.controls.find((c) => c.controlId === 'cis-v8:7.1');
    expect(cis310?.status).toBe('GAP_DETECTED');
    expect(cis71?.status).toBe('GAP_DETECTED');

    const nist = evaluateComplianceFramework(vulnerableReport, {
      frameworkId: 'nist-csf-2',
      locale: 'en',
    });
    expect(
      nist.controls.find((c) => c.controlId === 'nist-csf-2:PR.DS-02')?.status,
    ).toBe('GAP_DETECTED');
    expect(
      nist.controls.find((c) => c.controlId === 'nist-csf-2:ID.RA-01')?.status,
    ).toBe('GAP_DETECTED');

    const owasp = evaluateComplianceFramework(vulnerableReport, {
      frameworkId: 'owasp-asvs',
      locale: 'es',
    });
    expect(
      owasp.controls.find((c) => c.controlId === 'owasp-asvs:A03')?.status,
    ).toBe('GAP_DETECTED');
  });

  it('marks probe-dependent controls as NOT_EVALUATED in SCA-only scans without false passes', () => {
    const scaOnlyReport = makeBaseReport({
      targetUrl: null,
      authorizationId: null,
      probeResults: [],
      auditLogs: [],
    });

    const cis = evaluateComplianceFramework(scaOnlyReport, {
      frameworkId: 'cis-v8',
      locale: 'pt-BR',
    });
    const cis21 = cis.controls.find((c) => c.controlId === 'cis-v8:2.1');
    const cis310 = cis.controls.find((c) => c.controlId === 'cis-v8:3.10');
    expect(cis21?.status).toBe('COMPLIANT_EVIDENCE');
    expect(cis310?.status).toBe('NOT_EVALUATED');
  });

  it('filters CIS Implementation Groups and prevents optimistic manual override of technical gaps', () => {
    const reportWithGap = makeBaseReport({
      probeResults: [
        {
          id: 'p-hsts',
          probeId: 'safe-probe:hsts-tls',
          title: 'HSTS Missing',
          severity: 'MEDIUM',
          status: 'FINDING',
          targetUrl: 'https://staging.acme.io',
          evidence: 'Missing HSTS',
          recommendation: 'Add HSTS',
          matchedPackage: null,
          createdAt: '2026-11-26T12:00:00.000Z',
        },
      ],
    });

    const assessment: GrcAssessment = {
      id: 'grc-1',
      name: '=CMD("calc") Portal Assessment',
      repositoryUrl: 'https://github.com/acme/web-portal',
      linkedScanId: reportWithGap.id,
      targetIg: 'IG1',
      createdAt: '2026-11-26T12:00:00.000Z',
      updatedAt: '2026-11-26T12:00:00.000Z',
      responses: {
        // Organizational control manually attested as COMPLIANT
        'cis-v8:6.3': {
          controlId: 'cis-v8:6.3',
          status: 'COMPLIANT',
          ownerName: '=SecOps',
          evidenceNote: '+Okta MFA enforced',
          updatedAt: '2026-11-26T12:00:00.000Z',
        },
        // Technical control has an active HSTS gap -> MUST stay GAP_DETECTED
        'cis-v8:3.10': {
          controlId: 'cis-v8:3.10',
          status: 'COMPLIANT',
          ownerName: 'DevOps',
          evidenceNote: 'Claimed enabled',
          updatedAt: '2026-11-26T12:00:00.000Z',
        },
      },
    };

    const ig1Only = evaluateComplianceFramework(reportWithGap, {
      frameworkId: 'cis-v8',
      locale: 'en',
      maxCisIg: 'IG1',
      assessment,
    });
    expect(ig1Only.controls.every((c) => c.implementationGroup === 'IG1')).toBe(
      true,
    );
    expect(
      ig1Only.controls.find((c) => c.controlId === 'cis-v8:6.3')?.status,
    ).toBe('MANUAL_ATTESTED');

    const fullCis = evaluateComplianceFramework(reportWithGap, {
      frameworkId: 'cis-v8',
      locale: 'en',
      assessment,
    });
    expect(
      fullCis.controls.find((c) => c.controlId === 'cis-v8:3.10')?.status,
    ).toBe('GAP_DETECTED');

    // CSV & Excel exports must neutralize spreadsheet formula injection prefixes (=, +, -, @)
    const csv = buildComplianceMatrixCsv(reportWithGap, 'en', assessment);
    expect(csv.filename).toContain('brynja-compliance-');
    expect(csv.content).toContain('"\'=SecOps"');
    expect(csv.content).toContain('"\'+Okta MFA enforced"');

    const xlsx = buildComplianceMatrixExcel(reportWithGap, 'en', assessment);
    expect(xlsx.filename).toMatch(/^brynja-compliance-.*\.xlsx$/);
    expect(xlsx.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(Array.from(xlsx.bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const rawZipXml = new TextDecoder().decode(xlsx.bytes);
    expect(rawZipXml).toContain('Resumo GRC');
    expect(rawZipXml).toContain('xl/styles.xml');
    expect(rawZipXml).toContain('xl/worksheets/sheet5.xml');
    expect(rawZipXml).toContain('&apos;=SecOps');
    expect(rawZipXml).toContain('&apos;+Okta MFA enforced');
  });
});
