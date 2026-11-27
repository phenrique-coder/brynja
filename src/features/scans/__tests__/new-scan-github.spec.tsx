import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IBrynjaGateway } from '@/core/ports/scan-gateway.port';
import { GatewayProvider } from '@/core/providers/gateway-provider';
import { NewScanView } from '../components/NewScanView';
import { UserAccountMenu } from '../components/UserAccountMenu';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

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

describe('NewScanView GitHub OAuth Repo Picker & UserAccountMenu', () => {
  it('renders private and public GitHub repositories without redundant disconnect banner and submits selected repo', async () => {
    const createScan = vi.fn().mockResolvedValue({ id: 'scan-gh-1' });
    const mockGateway: IBrynjaGateway = {
      listScans: vi.fn(),
      getScanReport: vi.fn(),
      deleteScan: vi.fn(),
      createScan,
      listAuthorizations: vi.fn().mockResolvedValue([]),
      createAuthorization: vi.fn(),
      verifyAuthorization: vi.fn(),
      revokeAuthorization: vi.fn(),
      listAuditLogs: vi.fn(),
      getGitHubStatus: vi.fn().mockResolvedValue({
        configured: true,
        connected: true,
        githubUserId: '99',
        login: 'octocat',
        name: 'Octocat Developer',
        avatarUrl: null,
        profileUrl: 'https://github.com/octocat',
        sessionExpiresAt: Date.now() + 3600_000,
        callbackUrl: 'http://localhost:3001/api/integrations/github/callback',
        scopes: 'repo read:user',
      }),
      listGitHubRepos: vi.fn().mockResolvedValue([
        {
          id: 1,
          name: 'demo-app',
          fullName: 'octocat/demo-app',
          htmlUrl: 'https://github.com/octocat/demo-app',
          private: true,
          defaultBranch: 'main',
          updatedAt: '2026-11-24T17:00:00Z',
        },
      ]),
      disconnectGitHub: vi.fn(),
      getGitHubConnectUrl: () =>
        'http://localhost:3001/api/integrations/github/connect',
    };

    render(
      <GatewayProvider gateway={mockGateway}>
        <NewScanView />
      </GatewayProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('octocat/demo-app')).toBeTruthy();
    });
    expect(screen.queryByText('Desconectar')).toBeNull();
    expect(
      screen.getByText('Ecossistemas, Manifestos & Linguagens Suportadas'),
    ).toBeTruthy();
    expect(screen.getByText('Tipos de Safe Probes Executados')).toBeTruthy();
    expect(screen.getByText('Cabeçalhos de Segurança HTTP & Banners')).toBeTruthy();

    fireEvent.click(screen.getByText('octocat/demo-app'));
    fireEvent.click(screen.getByText('Executar Varredura'));

    await waitFor(() => {
      expect(createScan).toHaveBeenCalledWith(
        expect.objectContaining({
          repositoryUrl: 'https://github.com/octocat/demo-app',
          branch: 'main',
        }),
      );
    });
  });

  it('opens UserAccountMenu dropdown with GitHub user info and triggers logout on Sair', async () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);

    render(
      <UserAccountMenu
        status={{
          configured: true,
          connected: true,
          githubUserId: '99',
          login: 'octocat',
          name: 'Octocat Developer',
          avatarUrl: null,
          profileUrl: 'https://github.com/octocat',
          sessionExpiresAt: Date.now() + 3600_000,
          callbackUrl: 'http://localhost:3001/api/integrations/github/callback',
          scopes: 'repo read:user',
        }}
        onLogout={onLogout}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Octocat Developer')).toBeTruthy();
    expect(screen.getByText('#99')).toBeTruthy();
    expect(screen.getByText('repo read:user')).toBeTruthy();

    fireEvent.click(screen.getByRole('menuitem'));
    await waitFor(() => {
      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });
});
