import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HttpScanGateway } from '@/core/gateways/http-scan.gateway';
import { LocalBackupBundle, ScanReport } from '@/core/models/scan.models';
import { GatewayProvider } from '@/core/providers/gateway-provider';
import { InMemoryBrynjaStore } from '@/core/storage/brynja-indexeddb.store';
import { GovernanceView } from '../components/GovernanceView';
import { ScanReportView } from '../components/ScanReportView';
import { buildScanReportPdf } from '../exporters/scan-pdf.exporter';

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

function makeSampleReport(id = 'scan-grc-1'): ScanReport {
  const now = '2026-11-26T12:00:00.000Z';
  return {
    id,
    repositoryUrl: 'https://github.com/acme/fintech-api',
    branch: 'main',
    targetUrl: 'https://api.acme.io',
    authorizationId: 'auth-1',
    status: 'COMPLETED',
    currentStage: 'completed',
    ecosystems: ['npm'],
    totalDependencies: 12,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 1,
    lowCount: 0,
    confirmedActiveCount: 1,
    warnings: [],
    errorMessage: null,
    startedAt: now,
    completedAt: now,
    createdAt: now,
    dependencies: [
      {
        id: 'dep-1',
        name: 'express',
        version: '4.21.0',
        ecosystem: 'npm',
        purl: 'pkg:npm/express@4.21.0',
        sourceFile: 'package.json',
        isDirect: true,
      },
    ],
    findings: [],
    probeResults: [
      {
        id: 'probe-1',
        probeId: 'safe-probe:hsts-tls',
        title: 'Cabeçalho HSTS ausente',
        severity: 'MEDIUM',
        status: 'FINDING',
        targetUrl: 'https://api.acme.io',
        evidence: 'HEAD / sem Strict-Transport-Security.',
        recommendation: 'Ativar HSTS.',
        matchedPackage: null,
        createdAt: now,
      },
    ],
    auditLogs: [],
  };
}

describe('Governance GRC Local-First Storage & UI', () => {
  it('isolates GRC assessments by ownerGithubUserId and supports v1->v2 backup import', async () => {
    const store = new InMemoryBrynjaStore();
    await store.putGrcAssessment('user-a', {
      id: 'grc-a',
      name: 'Sistema A',
      repositoryUrl: 'https://github.com/acme/a',
      linkedScanId: null,
      targetIg: 'IG2',
      responses: {},
      createdAt: '2026-11-26T10:00:00.000Z',
      updatedAt: '2026-11-26T10:00:00.000Z',
    });

    expect(await store.listGrcAssessments('user-a')).toHaveLength(1);
    expect(await store.listGrcAssessments('user-b')).toHaveLength(0);
    expect(await store.getGrcAssessment('user-b', 'grc-a')).toBeNull();

    const v2Backup = await store.exportBackup('user-a');
    expect(v2Backup.version).toBe(2);
    expect(v2Backup.grcAssessments).toHaveLength(1);

    // Import legacy v1 backup (without grcAssessments) without errors
    const legacyV1: LocalBackupBundle = {
      version: 1,
      exportedAt: '2026-11-25T10:00:00.000Z',
      ownerGithubUserId: 'user-b',
      scans: [makeSampleReport('legacy-scan-1')],
      authorizations: [],
      auditLogs: [],
    };
    await store.importBackup('user-b', legacyV1);
    expect(await store.listScans('user-b')).toHaveLength(1);
    expect(await store.listGrcAssessments('user-b')).toHaveLength(0);
  });

  it('renders the Compliance tab in ScanReportView and persists GRC attestations via GovernanceView', async () => {
    const store = new InMemoryBrynjaStore();
    const report = makeSampleReport('scan-ui-1');
    await store.putScan('gh-user-1', report);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
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
      );
    });

    try {
      const gateway = new HttpScanGateway('/api', store);

      const { unmount } = render(
        <GatewayProvider gateway={gateway}>
          <ScanReportView scanId="scan-ui-1" />
        </GatewayProvider>,
      );

      const complianceTab = await screen.findByRole('button', {
        name: /Conformidade/i,
      });
      fireEvent.click(complianceTab);

      await waitFor(() => {
        expect(
          screen.getByText('Scorecard de Conformidade & Frameworks'),
        ).toBeTruthy();
        expect(screen.getByText('CIS 3.10')).toBeTruthy();
      });

      // Switch to NIST CSF 2.0 tab inside ComplianceScorecardTab
      fireEvent.click(screen.getByRole('tab', { name: /NIST CSF 2\.0/i }));
      expect(screen.getByText('PR.DS-02')).toBeTruthy();

      unmount();

      // Now open GovernanceView linked to scan-ui-1 and save an attestation
      render(
        <GatewayProvider gateway={gateway}>
          <GovernanceView initialScanId="scan-ui-1" />
        </GatewayProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('CIS 6.3 / 6.5')).toBeTruthy();
      });

      const attestationSelect = screen.getByLabelText(
        /CIS 6\.3 \/ 6\.5 — Atestado Manual/i,
      ) as HTMLSelectElement;
      fireEvent.change(attestationSelect, { target: { value: 'COMPLIANT' } });

      fireEvent.click(
        screen.getByRole('button', { name: /Salvar no Navegador/i }),
      );

      await waitFor(async () => {
        const saved = await store.listGrcAssessments('gh-user-1');
        expect(saved).toHaveLength(1);
        expect(saved[0].responses['cis-v8:6.3']?.status).toBe('COMPLIANT');
      });
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('includes the Compliance Matrix across CIS v8, NIST CSF 2.0, OWASP, and LGPD/ISO in the Executive PDF', async () => {
    const report = makeSampleReport('scan-pdf-comp-1');
    const doc = await buildScanReportPdf(report, { compress: false });
    const bytes = new Uint8Array(doc.output('arraybuffer'));
    const pdfLatin1 = new TextDecoder('latin1').decode(bytes);

    expect(pdfLatin1).toContain('Matriz de Conformidade');
    expect(pdfLatin1).toContain('CIS Controls v8');
    expect(pdfLatin1).toContain('NIST CSF 2.0');
    expect(pdfLatin1).toContain('OWASP ASVS / Top 10');
    expect(pdfLatin1).toContain('LGPD & ISO 27001');
  });

  it('opens the "O que é governança?" modal in GovernanceView and switches across Overview, CIS Controls (IG1-IG3), NIST, OWASP, and LGPD/ISO tabs', async () => {
    const store = new InMemoryBrynjaStore();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
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
          <GovernanceView />
        </GatewayProvider>,
      );

      const guideBtn = await screen.findByRole('button', {
        name: /O que é governança\?/i,
      });
      fireEvent.click(guideBtn);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeTruthy();
      expect(
        within(dialog).getByText('Guia de Governança & Conformidade (GRC)'),
      ).toBeTruthy();
      expect(
        within(dialog).getByText(/O que é Governança, Risco & Conformidade/i),
      ).toBeTruthy();

      // Switch to CIS Controls v8 tab -> shows IG1, IG2 & IG3 explanation cards
      fireEvent.click(
        within(dialog).getByRole('tab', { name: /CIS Controls v8/i }),
      );
      expect(within(dialog).getByText(/IG1 · Essencial \/ PME/i)).toBeTruthy();
      expect(
        within(dialog).getByText(/IG2 · Corporativo \/ SaaS/i),
      ).toBeTruthy();
      expect(
        within(dialog).getByText(/IG3 · Alta Maturidade/i),
      ).toBeTruthy();

      // Switch through NIST, OWASP, and LGPD tabs
      fireEvent.click(
        within(dialog).getByRole('tab', { name: /NIST CSF 2\.0/i }),
      );
      expect(
        within(dialog).getByText(/NIST Cybersecurity Framework \(CSF\) 2\.0/i),
      ).toBeTruthy();

      fireEvent.click(
        within(dialog).getByRole('tab', { name: /OWASP ASVS \/ Top 10/i }),
      );
      expect(
        within(dialog).getByText(
          /OWASP Application Security Verification Standard/i,
        ),
      ).toBeTruthy();

      fireEvent.click(
        within(dialog).getByRole('tab', { name: /LGPD & ISO 27001/i }),
      );
      expect(
        within(dialog).getByText(/LGPD \(Lei 13\.709\/2018\)/i),
      ).toBeTruthy();

      // Close modal
      fireEvent.click(within(dialog).getAllByRole('button', { name: /Fechar guia/i })[0]);
      expect(screen.queryByRole('dialog')).toBeNull();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
