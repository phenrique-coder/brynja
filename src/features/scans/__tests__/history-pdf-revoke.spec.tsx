import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HttpScanGateway } from '@/core/gateways/http-scan.gateway';
import { ScanReport } from '@/core/models/scan.models';
import { IBrynjaGateway } from '@/core/ports/scan-gateway.port';
import { GatewayProvider } from '@/core/providers/gateway-provider';
import { InMemoryBrynjaStore } from '@/core/storage/brynja-indexeddb.store';
import { AuthorizationsView } from '../components/AuthorizationsView';
import { ScanHistoryView } from '../components/ScanHistoryView';
import {
  buildScanReportPdf,
  sanitizePdfText,
} from '../exporters/scan-pdf.exporter';

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

function makeBaseGateway(
  overrides: Partial<IBrynjaGateway> = {},
): IBrynjaGateway {
  return {
    listScans: vi.fn().mockResolvedValue([]),
    getScanReport: vi.fn(),
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
    getGitHubConnectUrl: () =>
      'http://localhost:3001/api/integrations/github/connect',
    ...overrides,
  };
}

describe('Permanent Target Removal, Scan History & PDF Exporter', () => {
  it('requires inline confirmation and permanently removes both active and previously revoked targets', async () => {
    const revokeAuthorization = vi.fn().mockResolvedValue(undefined);
    const listAuthorizations = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'auth-1',
          origin: 'https://staging.example.com',
          hostname: 'staging.example.com',
          method: 'WELL_KNOWN_FILE',
          status: 'VERIFIED',
          verifiedAt: '2026-11-24T17:00:00.000Z',
          expiresAt: '2026-11-25T17:00:00.000Z',
          createdAt: '2026-11-24T17:00:00.000Z',
        },
        {
          id: 'auth-2',
          origin: 'https://old.example.com',
          hostname: 'old.example.com',
          method: 'WELL_KNOWN_FILE',
          status: 'REVOKED',
          verifiedAt: null,
          expiresAt: null,
          createdAt: '2026-11-24T16:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([]);

    const gateway = makeBaseGateway({
      listAuthorizations,
      revokeAuthorization,
    });

    render(
      <GatewayProvider gateway={gateway}>
        <AuthorizationsView />
      </GatewayProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('https://staging.example.com')).toBeTruthy();
      expect(screen.getByText('https://old.example.com')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Revogar'));
    expect(revokeAuthorization).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Remover permanentemente'));
    await waitFor(() => {
      expect(revokeAuthorization).toHaveBeenCalledWith('auth-1');
    });
  });

  it('renders detailed beginner and SSH terminal setup instructions populated with the pending target token', async () => {
    const gateway = makeBaseGateway({
      listAuthorizations: vi.fn().mockResolvedValue([
        {
          id: 'auth-pending',
          origin: 'https://staging.example.com',
          hostname: 'staging.example.com',
          method: 'WELL_KNOWN_FILE',
          status: 'PENDING',
          challengeToken: 'brynja-verify-abcdef1234567890',
          verifiedAt: null,
          expiresAt: null,
          createdAt: '2026-11-25T09:00:00.000Z',
          updatedAt: '2026-11-25T09:00:00.000Z',
        },
      ]),
    });

    render(
      <GatewayProvider gateway={gateway}>
        <AuthorizationsView />
      </GatewayProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/ssh usuario@staging\.example\.com/i),
      ).toBeTruthy();
      expect(
        screen.getByText(/brynja-verify-abcdef1234567890' \| sudo tee/i),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /curl -fsSL https:\/\/staging\.example\.com\/\.well-known\/security\.txt/i,
        ),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Registro DNS TXT/i }));
    expect(
      screen.getByText(/dig \+short TXT _brynja\.staging\.example\.com/i),
    ).toBeTruthy();
  });

  it('filters scan history by scope (Safe Probes vs SCA only) and search query', async () => {
    const gateway = makeBaseGateway({
      listScans: vi.fn().mockResolvedValue([
        {
          id: 'scan-1',
          repositoryUrl: 'https://github.com/octocat/web-app',
          branch: 'main',
          targetUrl: 'https://staging.example.com',
          authorizationId: 'auth-1',
          status: 'COMPLETED',
          currentStage: 'completed',
          ecosystems: ['npm'],
          totalDependencies: 120,
          criticalCount: 1,
          highCount: 4,
          mediumCount: 8,
          lowCount: 2,
          confirmedActiveCount: 1,
          warnings: [],
          errorMessage: null,
          startedAt: null,
          completedAt: '2026-11-24T19:00:00.000Z',
          createdAt: '2026-11-24T19:00:00.000Z',
        },
        {
          id: 'scan-2',
          repositoryUrl: 'https://github.com/octocat/python-worker',
          branch: 'develop',
          targetUrl: null,
          authorizationId: null,
          status: 'COMPLETED',
          currentStage: 'completed',
          ecosystems: ['PyPI'],
          totalDependencies: 45,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 2,
          lowCount: 0,
          confirmedActiveCount: 0,
          warnings: [],
          errorMessage: null,
          startedAt: null,
          completedAt: '2026-11-24T18:00:00.000Z',
          createdAt: '2026-11-24T18:00:00.000Z',
        },
      ]),
    });

    render(
      <GatewayProvider gateway={gateway}>
        <ScanHistoryView />
      </GatewayProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('octocat/web-app')).toBeTruthy();
      expect(screen.getByText('octocat/python-worker')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Safe Probes' }));
    expect(screen.getByText('octocat/web-app')).toBeTruthy();
    expect(screen.queryByText('octocat/python-worker')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Somente SCA' }));
    expect(screen.queryByText('octocat/web-app')).toBeNull();
    expect(screen.getByText('octocat/python-worker')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Excluir varredura octocat/python-worker',
      }),
    );
    await waitFor(() => {
      expect(gateway.deleteScan).toHaveBeenCalledWith('scan-2');
      expect(screen.queryByText('octocat/python-worker')).toBeNull();
    });
  });

  it('builds a valid multi-section PDF report with Portuguese Latin-1 sanitization', async () => {
    expect(sanitizePdfText('Atualizar → versão ≥ 15.2.3 (segurança)')).toBe(
      'Atualizar -> versão >= 15.2.3 (segurança)',
    );

    const sampleReport: ScanReport = {
      id: '11111111-2222-3333-4444-555555555555',
      repositoryUrl: 'https://github.com/octocat/demo-app',
      branch: 'main',
      targetUrl: 'https://staging.example.com',
      authorizationId: 'auth-1',
      status: 'COMPLETED',
      currentStage: 'completed',
      ecosystems: ['npm'],
      totalDependencies: 2,
      criticalCount: 1,
      highCount: 0,
      mediumCount: 1,
      lowCount: 0,
      confirmedActiveCount: 1,
      warnings: [],
      errorMessage: null,
      startedAt: '2026-11-24T20:00:00.000Z',
      completedAt: '2026-11-24T20:00:15.000Z',
      createdAt: '2026-11-24T20:00:00.000Z',
      dependencies: [
        {
          id: 'dep-1',
          name: 'next',
          version: '15.0.0',
          ecosystem: 'npm',
          purl: 'pkg:npm/next@15.0.0',
          sourceFile: 'package.json',
          isDirect: true,
        },
      ],
      findings: [
        {
          id: 'find-1',
          dependencyId: 'dep-1',
          advisoryId: 'GHSA-demo-0001',
          cveId: 'CVE-2025-29927',
          packageName: 'next',
          packageVersion: '15.0.0',
          ecosystem: 'npm',
          title: 'Authorization Bypass in Middleware',
          description: 'Vulnerability summary for executive PDF testing.',
          severity: 'CRITICAL',
          cvssScore: 9.1,
          cvssVector: null,
          cweIds: ['CWE-285'],
          epssScore: 0.94,
          epssPercentile: 0.99,
          isKnownExploited: true,
          fixedVersion: '15.2.3',
          references: ['https://osv.dev'],
          verdict: 'CONFIRMED_ACTIVE',
          source: 'OSV.dev + EPSS + CISA KEV',
        },
      ],
      probeResults: [
        {
          id: 'probe-1',
          probeId: 'safe-probe:hsts-tls',
          title: 'Cabeçalho Strict-Transport-Security (HSTS) ausente em HTTPS',
          severity: 'MEDIUM',
          status: 'FINDING',
          targetUrl: 'https://staging.example.com',
          evidence: 'HEAD / retornou HTTP 200 sem HSTS.',
          recommendation: 'Configure Strict-Transport-Security com max-age=31536000.',
          matchedPackage: null,
          createdAt: '2026-11-24T20:00:10.000Z',
        },
      ],
      auditLogs: [
        {
          id: 'audit-1',
          scanId: '11111111-2222-3333-4444-555555555555',
          authorizationId: 'auth-1',
          targetUrl: 'https://staging.example.com',
          probeId: 'safe-probe:hsts-tls',
          httpMethod: 'HEAD',
          requestPath: '/',
          statusCode: 200,
          durationMs: 42,
          outcome: 'EXECUTED',
          details: 'Safe probe executado (HEAD / -> HTTP 200).',
          createdAt: '2026-11-24T20:00:10.000Z',
        },
      ],
    };

    const doc = await buildScanReportPdf(
      {
        ...sampleReport,
        staticFindings: [
          {
            id: 'stat-1',
            ruleId: 'secret:db-connection-credentials',
            category: 'SECRET_LEAK',
            severity: 'HIGH',
            title: 'String de conexão com senha embutida',
            description: 'Credencial mascarada',
            filePath: 'apps/api/src/lib/db.ts',
            lineNumber: 3,
            maskedSnippet: 'postgres://***',
            cweIds: ['CWE-798'],
            recommendation: 'Usar DATABASE_URL via secret manager.',
          },
        ],
        aiRemediationPlan: {
          generatedBy: 'gemini:gemini-2.5-flash',
          summary: 'Priorize a remoção da credencial em db.ts antes do deploy.',
          reachabilityHits: ['next importado em src/app.ts'],
          prioritizedSteps: [
            'Rotacionar senha em apps/api/src/lib/db.ts imediatamente.',
          ],
        },
      },
      { compress: false },
    );
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

    const bytes = new Uint8Array(doc.output('arraybuffer'));
    const header = String.fromCharCode(...bytes.slice(0, 5));
    expect(header).toBe('%PDF-');

    const pdfLatin1 = new TextDecoder('latin1').decode(bytes);
    expect(pdfLatin1).toContain('PARECER EXECUTIVO PARA GERÊNCIA E DIRETORIA');
    expect(pdfLatin1).toContain(
      'DIAGNÓSTICO EXECUTIVO POR IA \\(gemini:gemini-2.5-flash\\)',
    );
    expect(pdfLatin1).toContain('Priorize a remoção da credencial em db.ts');
    expect(pdfLatin1).toContain('Rotacionar senha em apps/api/src/lib/db.ts');
    expect(pdfLatin1).toContain('Apresentação dos Problemas e Plano de Soluções');
    expect(pdfLatin1).toContain('APRESENTAÇÃO E EXPLANAÇÃO DO PROBLEMA');
    expect(pdfLatin1).toContain('SOLUÇÃO RECOMENDADA');
    expect(pdfLatin1).toContain('FIX-01');
    expect(pdfLatin1).toContain('FIX-02');
    expect(pdfLatin1).toContain('15.2.3');
  });

  it('displays the Safe Probe issues badge (P:N) in the Severity column only when probes have issues and derives it for legacy stored reports', async () => {
    const store = new InMemoryBrynjaStore();
    const now = '2026-11-25T20:33:00.000Z';

    // Simulate two legacy reports stored in IndexedDB without `probeIssuesCount` persisted yet
    await store.putScan('gh-user-1', {
      id: 'scan-with-issues',
      repositoryUrl: 'https://github.com/Prenora/prenora',
      branch: 'main',
      targetUrl: 'https://prenora.com.br',
      authorizationId: 'auth-1',
      status: 'COMPLETED',
      currentStage: 'completed',
      ecosystems: ['npm'],
      totalDependencies: 744,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      confirmedActiveCount: 2,
      warnings: [],
      errorMessage: null,
      startedAt: now,
      completedAt: now,
      createdAt: now,
      dependencies: [],
      findings: [],
      probeResults: [
        {
          id: 'p-1',
          probeId: 'safe-probe:csp-permissions',
          title: 'CSP permissiva',
          severity: 'MEDIUM',
          status: 'FINDING',
          targetUrl: 'https://prenora.com.br',
          evidence: 'unsafe-inline',
          recommendation: 'Usar nonce.',
          matchedPackage: null,
          createdAt: now,
        },
        {
          id: 'p-2',
          probeId: 'safe-probe:sri-integrity',
          title: 'Script CDN sem SRI',
          severity: 'MEDIUM',
          status: 'FINDING',
          targetUrl: 'https://prenora.com.br',
          evidence: 'Sem integrity',
          recommendation: 'Adicionar SRI.',
          matchedPackage: null,
          createdAt: now,
        },
        {
          id: 'p-3',
          probeId: 'safe-probe:hsts-tls',
          title: 'HSTS OK',
          severity: 'INFO',
          status: 'PASSED',
          targetUrl: 'https://prenora.com.br',
          evidence: 'max-age=31536000',
          recommendation: 'Manter.',
          matchedPackage: null,
          createdAt: now,
        },
      ],
      auditLogs: [],
      staticFindings: [
        {
          id: 'stat-legacy-1',
          ruleId: 'secret:db-connection-credentials',
          category: 'SECRET_LEAK',
          severity: 'HIGH',
          title: 'Credencial no código',
          description: 'Desc',
          filePath: 'apps/api/src/lib/db.ts',
          lineNumber: 3,
          maskedSnippet: '****',
          cweIds: ['CWE-798'],
          recommendation: 'Rotacionar.',
        },
      ],
    });

    await store.putScan('gh-user-1', {
      id: 'scan-clean',
      repositoryUrl: 'https://github.com/Prenora/prenora',
      branch: 'main',
      targetUrl: 'https://prenora.com.br',
      authorizationId: 'auth-1',
      status: 'COMPLETED',
      currentStage: 'completed',
      ecosystems: ['npm'],
      totalDependencies: 744,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      confirmedActiveCount: 0,
      warnings: [],
      errorMessage: null,
      startedAt: '2026-11-25T20:06:00.000Z',
      completedAt: '2026-11-25T20:06:10.000Z',
      createdAt: '2026-11-25T20:06:00.000Z',
      dependencies: [],
      findings: [],
      probeResults: [
        {
          id: 'p-clean',
          probeId: 'safe-probe:hsts-tls',
          title: 'HSTS OK',
          severity: 'INFO',
          status: 'PASSED',
          targetUrl: 'https://prenora.com.br',
          evidence: 'max-age=31536000',
          recommendation: 'Manter.',
          matchedPackage: null,
          createdAt: '2026-11-25T20:06:10.000Z',
        },
      ],
      auditLogs: [],
    });

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            configured: true,
            connected: true,
            githubUserId: 'gh-user-1',
            login: 'pedro',
            avatarUrl: null,
            callbackUrl: 'http://localhost:3000/api/integrations/github/callback',
            scopes: 'repo',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );

    try {
      const gateway = new HttpScanGateway('/api', store);

      render(
        <GatewayProvider gateway={gateway}>
          <ScanHistoryView />
        </GatewayProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('P:2')).toBeTruthy();
        expect(screen.getByText('E:1')).toBeTruthy();
      });

      expect(screen.getByTitle('2 Probe(s) com problema(s)')).toBeTruthy();
      expect(
        screen.getByTitle('1 achado(s) em Código, Segredos & IaC'),
      ).toBeTruthy();
      expect(screen.queryByText('P:0')).toBeNull();
      expect(screen.queryByText('E:0')).toBeNull();

      const barWithProbes = screen.getByTestId('severity-bar-scan-with-issues');
      const probeSlice = barWithProbes.querySelector(
        '[data-segment="probes"]',
      ) as HTMLElement | null;
      const staticSlice = barWithProbes.querySelector(
        '[data-segment="static"]',
      ) as HTMLElement | null;
      expect(probeSlice).not.toBeNull();
      expect(staticSlice).not.toBeNull();
      expect(probeSlice?.style.width).toContain('66.6');
      expect(probeSlice?.className).toContain('bg-violet-500');
      expect(staticSlice?.className).toContain('bg-cyan-500');
      expect(screen.queryByTestId('severity-bar-scan-clean')).toBeNull();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
