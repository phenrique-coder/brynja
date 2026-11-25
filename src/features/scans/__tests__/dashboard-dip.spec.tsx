import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GatewayHttpError } from '@/core/gateways/http-scan.gateway';
import { IBrynjaGateway } from '@/core/ports/scan-gateway.port';
import { GatewayProvider } from '@/core/providers/gateway-provider';
import { DashboardView } from '../components/DashboardView';

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

describe('DashboardView (DIP injection test)', () => {
  it('renders scan history from an injected mock gateway without real HTTP', async () => {
    const mockGateway: IBrynjaGateway = {
      listScans: vi.fn().mockResolvedValue([
        {
          id: 'scan-abc',
          repositoryUrl: 'https://github.com/octocat/demo-platform',
          branch: 'main',
          targetUrl: 'https://staging.example.com',
          authorizationId: 'auth-1',
          status: 'COMPLETED',
          currentStage: 'completed',
          ecosystems: ['npm'],
          totalDependencies: 42,
          criticalCount: 2,
          highCount: 3,
          mediumCount: 1,
          lowCount: 0,
          confirmedActiveCount: 1,
          warnings: [],
          errorMessage: null,
          startedAt: null,
          completedAt: null,
          createdAt: '2026-11-24T17:00:00.000Z',
        },
      ]),
      getScanReport: vi.fn(),
      deleteScan: vi.fn(),
      createScan: vi.fn(),
      listAuthorizations: vi.fn(),
      createAuthorization: vi.fn(),
      verifyAuthorization: vi.fn(),
      revokeAuthorization: vi.fn(),
      listAuditLogs: vi.fn(),
      getGitHubStatus: vi.fn(),
      listGitHubRepos: vi.fn(),
      disconnectGitHub: vi.fn(),
      getGitHubConnectUrl: vi.fn().mockReturnValue('http://localhost:3001/api/integrations/github/connect'),
    };

    render(
      <GatewayProvider gateway={mockGateway}>
        <DashboardView />
      </GatewayProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('octocat/demo-platform')).toBeTruthy();
    });
    expect(mockGateway.listScans).toHaveBeenCalledTimes(1);
  });

  it('renders GitHub login prompt when session is unauthenticated (401)', async () => {
    const unauthGateway: IBrynjaGateway = {
      listScans: vi
        .fn()
        .mockRejectedValue(
          new GatewayHttpError(401, 'GITHUB_NOT_CONNECTED', 'Sessão necessária'),
        ),
      getScanReport: vi.fn(),
      deleteScan: vi.fn(),
      createScan: vi.fn(),
      listAuthorizations: vi.fn(),
      createAuthorization: vi.fn(),
      verifyAuthorization: vi.fn(),
      revokeAuthorization: vi.fn(),
      listAuditLogs: vi.fn(),
      getGitHubStatus: vi.fn(),
      listGitHubRepos: vi.fn(),
      disconnectGitHub: vi.fn(),
      getGitHubConnectUrl: vi
        .fn()
        .mockReturnValue('http://localhost:3001/api/integrations/github/connect?returnTo=%2F'),
    };

    render(
      <GatewayProvider gateway={unauthGateway}>
        <DashboardView />
      </GatewayProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Entrar com GitHub')).toBeTruthy();
    });
  });
});
