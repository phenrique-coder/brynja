import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScanReport } from '@/core/models/scan.models';
import { IBrynjaGateway } from '@/core/ports/scan-gateway.port';
import { GatewayProvider } from '@/core/providers/gateway-provider';
import { ScanReportView } from '../components/ScanReportView';
import {
  AiRemediationJsonExporter,
  AiRemediationJsonPayload,
  buildAiRemediationPayload,
} from '../exporters/ai-remediation-json.exporter';
import {
  buildRemediationPlan,
  compareSemverLoose,
  pickHighestVersion,
} from '../presenters/remediation-plan.presenter';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function makeSampleScanReport(): ScanReport {
  return {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    repositoryUrl: 'https://github.com/acme/portal-web',
    branch: 'main',
    targetUrl: 'https://staging.acme.io',
    authorizationId: 'auth-1',
    status: 'COMPLETED',
    currentStage: 'completed',
    ecosystems: ['npm', 'PyPI'],
    totalDependencies: 4,
    criticalCount: 2,
    highCount: 1,
    mediumCount: 0,
    lowCount: 0,
    confirmedActiveCount: 1,
    warnings: [],
    errorMessage: null,
    startedAt: '2026-11-25T10:00:00.000Z',
    completedAt: '2026-11-25T10:00:25.000Z',
    createdAt: '2026-11-25T10:00:00.000Z',
    dependencies: [
      {
        id: 'dep-next',
        name: 'next',
        version: '15.0.0',
        ecosystem: 'npm',
        purl: 'pkg:npm/next@15.0.0',
        sourceFile: 'package.json',
        isDirect: true,
      },
      {
        id: 'dep-postcss',
        name: 'postcss',
        version: '8.4.10',
        ecosystem: 'npm',
        purl: 'pkg:npm/postcss@8.4.10',
        sourceFile: 'pnpm-lock.yaml',
        isDirect: false,
      },
      {
        id: 'dep-clean',
        name: 'lucide-react',
        version: '0.475.0',
        ecosystem: 'npm',
        purl: 'pkg:npm/lucide-react@0.475.0',
        sourceFile: 'package.json',
        isDirect: true,
      },
      {
        id: 'dep-requests',
        name: 'requests',
        version: '2.28.0',
        ecosystem: 'PyPI',
        purl: 'pkg:pypi/requests@2.28.0',
        sourceFile: 'requirements.txt',
        isDirect: true,
      },
    ],
    findings: [
      {
        id: 'f-next-1',
        dependencyId: 'dep-next',
        advisoryId: 'GHSA-next-001',
        cveId: 'CVE-2025-11111',
        packageName: 'next',
        packageVersion: '15.0.0',
        ecosystem: 'npm',
        title: 'SSRF in Image Optimization',
        description: 'Long advisory text that should not bloat AI JSON.',
        severity: 'CRITICAL',
        cvssScore: 9.0,
        cvssVector: null,
        cweIds: ['CWE-918'],
        epssScore: 0.42,
        epssPercentile: 0.9,
        isKnownExploited: false,
        fixedVersion: '15.1.2',
        references: ['https://nvd.nist.gov/vuln/detail/CVE-2025-11111'],
        verdict: 'DEPENDENCY_ONLY',
        source: 'OSV.dev',
      },
      {
        id: 'f-next-2',
        dependencyId: 'dep-next',
        advisoryId: 'GHSA-next-002',
        cveId: 'CVE-2025-29927',
        packageName: 'next',
        packageVersion: '15.0.0',
        ecosystem: 'npm',
        title: 'Authorization Bypass in Middleware',
        description: 'Another verbose advisory description.',
        severity: 'CRITICAL',
        cvssScore: 9.1,
        cvssVector: null,
        cweIds: ['CWE-285'],
        epssScore: 0.94,
        epssPercentile: 0.99,
        isKnownExploited: true,
        fixedVersion: '15.2.3',
        references: ['https://nvd.nist.gov/vuln/detail/CVE-2025-29927'],
        verdict: 'CONFIRMED_ACTIVE',
        source: 'OSV.dev + EPSS + CISA KEV',
      },
      {
        id: 'f-requests-1',
        dependencyId: 'dep-requests',
        advisoryId: 'GHSA-py-001',
        cveId: 'CVE-2024-35195',
        packageName: 'requests',
        packageVersion: '2.28.0',
        ecosystem: 'PyPI',
        title: 'TLS cert verification bypass on redirect',
        description: 'Verbose python description.',
        severity: 'HIGH',
        cvssScore: 7.5,
        cvssVector: null,
        cweIds: ['CWE-295'],
        epssScore: 0.12,
        epssPercentile: 0.7,
        isKnownExploited: false,
        fixedVersion: '2.32.0',
        references: [],
        verdict: 'DEPENDENCY_ONLY',
        source: 'OSV.dev',
      },
    ],
    probeResults: [
      {
        id: 'p-runtime',
        probeId: 'safe-probe:runtime-fingerprint',
        title: 'Biblioteca vulnerável "next" detectada em runtime',
        severity: 'HIGH',
        status: 'FINDING',
        targetUrl: 'https://staging.acme.io',
        evidence: 'Bundle /_next/static/chunks/main.js confirmou presença de next.',
        recommendation: 'Atualize "next" para a versão corrigida.',
        matchedPackage: 'next',
        createdAt: '2026-11-25T10:00:10.000Z',
      },
      {
        id: 'p-hsts',
        probeId: 'safe-probe:hsts-tls',
        title: 'Cabeçalho Strict-Transport-Security (HSTS) ausente em HTTPS',
        severity: 'MEDIUM',
        status: 'FINDING',
        targetUrl: 'https://staging.acme.io',
        evidence: 'HEAD / retornou HTTP 200 sem Strict-Transport-Security.',
        recommendation:
          'Configure Strict-Transport-Security: max-age=31536000; includeSubDomains.',
        matchedPackage: null,
        createdAt: '2026-11-25T10:00:12.000Z',
      },
      {
        id: 'p-passed',
        probeId: 'safe-probe:source-maps',
        title: 'Source Maps protegidos ou ausentes',
        severity: 'INFO',
        status: 'PASSED',
        targetUrl: 'https://staging.acme.io',
        evidence: 'Nenhum .js.map acessível.',
        recommendation: 'Manter política atual.',
        matchedPackage: null,
        createdAt: '2026-11-25T10:00:15.000Z',
      },
    ],
    auditLogs: [
      {
        id: 'audit-1',
        scanId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        authorizationId: 'auth-1',
        targetUrl: 'https://staging.acme.io',
        probeId: 'safe-probe:hsts-tls',
        httpMethod: 'HEAD',
        requestPath: '/',
        statusCode: 200,
        durationMs: 31,
        outcome: 'EXECUTED',
        details: 'Safe probe executado.',
        createdAt: '2026-11-25T10:00:12.000Z',
      },
    ],
  };
}

function makeGateway(report: ScanReport): IBrynjaGateway {
  return {
    listScans: vi.fn().mockResolvedValue([]),
    getScanReport: vi.fn().mockResolvedValue(report),
    deleteScan: vi.fn().mockResolvedValue(undefined),
    createScan: vi.fn(),
    listAuthorizations: vi.fn().mockResolvedValue([]),
    createAuthorization: vi.fn(),
    verifyAuthorization: vi.fn(),
    revokeAuthorization: vi.fn().mockResolvedValue(undefined),
    listAuditLogs: vi.fn().mockResolvedValue([]),
    getGitHubStatus: vi.fn(),
    listGitHubRepos: vi.fn(),
    disconnectGitHub: vi.fn(),
    getGitHubConnectUrl: () => '/api/integrations/github/connect',
  };
}

describe('AI Remediation JSON Exporter & Executive Remediation Planner', () => {
  const writeTextMock = vi.fn<(_text: string) => Promise<void>>();

  beforeEach(() => {
    writeTextMock.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });
  });

  it('compares loose SemVer versions numerically and picks the highest fixed version', () => {
    expect(compareSemverLoose('1.10.0', '1.2.3')).toBeGreaterThan(0);
    expect(compareSemverLoose('2.0.0', '2.0.0-rc.1')).toBeGreaterThan(0);
    expect(pickHighestVersion(['15.1.2', '15.10.0', '15.2.3', null])).toBe(
      '15.10.0',
    );
    expect(pickHighestVersion([null, undefined, ''])).toBeNull();
  });

  it('produces a concise, deduplicated, prioritized AI remediation JSON without report bloat', () => {
    const report = makeSampleScanReport();
    const exporter = new AiRemediationJsonExporter();
    const exported = exporter.export(report);

    expect(exported.filename).toBe('brynja-ai-fix-aaaaaaaa.json');
    expect(exported.mimeType).toBe('application/json');

    const payload = JSON.parse(exported.content) as AiRemediationJsonPayload;
    expect(payload.schema).toBe('brynja.ai-remediation.v1');
    expect(payload.context).toEqual({
      repository: 'acme/portal-web',
      branch: 'main',
      targetUrl: 'https://staging.acme.io',
      ecosystems: ['npm', 'PyPI'],
      overallRisk: 'CRITICAL',
    });

    // 2 CVEs on "next" + matching runtime-fingerprint probe collapse into 1 P0 task;
    // "requests" is 1 P1 task; HSTS probe is 1 P2 task; PASSED probe & clean deps & auditLogs are excluded.
    expect(payload.summary).toEqual({
      totalTasks: 3,
      byPriority: { P0: 1, P1: 1, P2: 1, P3: 0 },
      dependencyUpgrades: 2,
      runtimeHardening: 1,
    });
    expect(payload.tasks).toHaveLength(3);

    const [t0, t1, t2] = payload.tasks;
    expect(t0.id).toBe('FIX-01');
    expect(t0.priority).toBe('P0');
    expect(t0.kind).toBe('dependency');
    expect(t0.package).toBe('next');
    expect(t0.currentVersion).toBe('15.0.0');
    expect(t0.targetVersion).toBe('15.2.3');
    expect(t0.cves).toEqual(['CVE-2025-29927', 'CVE-2025-11111']);
    expect(t0.flags).toEqual(['CISA_KEV', 'CONFIRMED_RUNTIME']);
    // Repo contains pnpm-lock.yaml, so pnpm upgrade command is inferred
    expect(t0.command).toBe('pnpm up next@^15.2.3');
    expect(t0.evidence).toContain('_next/static');

    expect(t1.id).toBe('FIX-02');
    expect(t1.priority).toBe('P1');
    expect(t1.package).toBe('requests');
    expect(t1.where).toBe('requirements.txt');
    expect(t1.command).toBe('pip install --upgrade "requests>=2.32.0"');

    expect(t2.id).toBe('FIX-03');
    expect(t2.priority).toBe('P2');
    expect(t2.kind).toBe('runtime_config');
    expect(t2.probeId).toBe('safe-probe:hsts-tls');
    expect(t2.action).toContain('Strict-Transport-Security');

    // No bloat: clean dependencies, PASSED probes, and raw audit logs must not leak into AI JSON
    expect(exported.content).not.toContain('lucide-react');
    expect(exported.content).not.toContain('Source Maps protegidos');
    expect(exported.content).not.toContain('audit-1');
    expect(exported.content).not.toContain('Long advisory text');
  });

  it('generates clean executive posture when a scan has zero actionable issues', () => {
    const cleanReport: ScanReport = {
      ...makeSampleScanReport(),
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      confirmedActiveCount: 0,
      findings: [],
      probeResults: [
        {
          id: 'p-ok',
          probeId: 'safe-probe:hsts-tls',
          title: 'Política HSTS configurada adequadamente',
          severity: 'INFO',
          status: 'PASSED',
          targetUrl: 'https://staging.acme.io',
          evidence: 'HSTS max-age=31536000',
          recommendation: 'Manter política atual.',
          matchedPackage: null,
          createdAt: '2026-11-25T10:00:12.000Z',
        },
      ],
    };

    const plan = buildRemediationPlan(cleanReport);
    expect(plan.counts.total).toBe(0);
    expect(plan.overallRisk.severity).toBe('INFO');
    expect(plan.executiveHeadline).toContain('Saudável');

    const aiPayload = buildAiRemediationPayload(cleanReport);
    expect(aiPayload.tasks).toEqual([]);
    expect(aiPayload.summary.totalTasks).toBe(0);
  });

  it('places all report exports in a right-side dropdown ordered PDF -> AI JSON -> others and supports clipboard copy', async () => {
    const report = makeSampleScanReport();
    const gateway = makeGateway(report);

    render(
      <GatewayProvider gateway={gateway}>
        <ScanReportView scanId={report.id} />
      </GatewayProvider>,
    );

    const trigger = await screen.findByRole('button', {
      name: /Exportar Relatório/i,
    });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();

    // Should NOT display all-clear celebration when vulnerabilities/findings exist
    expect(screen.queryByText(/Escudo Íntegro/i)).toBeNull();

    // Open dropdown menu
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.map((el) => el.textContent ?? '')).toEqual([
      expect.stringContaining('PDF Executivo (Gerência)'),
      expect.stringContaining('JSON para IA'),
      expect.stringContaining('Copiar JSON para IA'),
      expect.stringContaining('JSON Completo'),
      expect.stringContaining('Markdown'),
      expect.stringContaining('SBOM (CycloneDX)'),
      expect.stringContaining('SARIF 2.1.0'),
      expect.stringContaining('SBOM (SPDX 2.3)'),
      expect.stringContaining('CSV Conformidade'),
    ]);

    // All menu items are enabled when there are findings
    for (const item of menuItems) {
      expect((item as HTMLButtonElement).disabled).toBe(false);
    }

    // Clicking "Copiar JSON para IA" copies the concise AI remediation JSON
    fireEvent.click(menuItems[2]);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(1);
    });

    const copiedPayload = JSON.parse(
      writeTextMock.mock.calls[0][0],
    ) as AiRemediationJsonPayload;
    expect(copiedPayload.schema).toBe('brynja.ai-remediation.v1');
    expect(copiedPayload.summary.totalTasks).toBe(3);
    expect(copiedPayload.tasks[0].package).toBe('next');
  });

  it('shows the celebratory all-clear message and disables non-PDF exports when all checks pass with zero issues', async () => {
    const cleanReport: ScanReport = {
      ...makeSampleScanReport(),
      totalDependencies: 264,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      confirmedActiveCount: 0,
      findings: [],
      probeResults: [
        {
          id: 'p-ok-1',
          probeId: 'safe-probe:hsts-tls',
          title: 'Política HSTS configurada adequadamente',
          severity: 'INFO',
          status: 'PASSED',
          targetUrl: 'https://staging.acme.io',
          evidence: 'HSTS max-age=31536000',
          recommendation: 'Manter política atual.',
          matchedPackage: null,
          createdAt: '2026-11-25T10:00:12.000Z',
        },
      ],
    };

    const gateway = makeGateway(cleanReport);

    render(
      <GatewayProvider gateway={gateway}>
        <ScanReportView scanId={cleanReport.id} />
      </GatewayProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Escudo Íntegro — Todos os testes passaram sem nenhum erro!/i),
      ).toBeTruthy();
      expect(
        screen.getByText(/264 dependência\(s\) analisada\(s\) e 1 Safe Probe\(s\)/i),
      ).toBeTruthy();
      expect(
        screen.getByText(/Tudo limpo! Nenhuma vulnerabilidade foi detectada/i),
      ).toBeTruthy();
    });

    // Open export dropdown: only PDF Executivo stays enabled; AI JSON & others are disabled
    fireEvent.click(
      screen.getByRole('button', { name: /Exportar Relatório/i }),
    );
    expect(
      screen.getByText(/Nenhum erro encontrado — apenas o PDF Executivo permanece habilitado/i),
    ).toBeTruthy();

    const menuItems = screen.getAllByRole('menuitem') as HTMLButtonElement[];
    expect(menuItems[0].textContent).toContain('PDF Executivo (Gerência)');
    expect(menuItems[0].disabled).toBe(false);

    for (const nonPdfItem of menuItems.slice(1)) {
      expect(nonPdfItem.disabled).toBe(true);
    }
  });
});
