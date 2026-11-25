import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IBrynjaGateway } from '@/core/ports/scan-gateway.port';
import { GatewayProvider } from '@/core/providers/gateway-provider';
import { AuthorizationsView } from '../components/AuthorizationsView';
import {
  buildOwnershipGuideSnippets,
  escapeShellSingleQuoted,
  parseDraftTargetUrl,
} from '../presenters/ownership-guide.presenter';

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

function makeGateway(overrides: Partial<IBrynjaGateway> = {}): IBrynjaGateway {
  return {
    listScans: vi.fn().mockResolvedValue([]),
    getScanReport: vi.fn(),
    deleteScan: vi.fn().mockResolvedValue(undefined),
    createScan: vi.fn(),
    listAuthorizations: vi.fn().mockResolvedValue([]),
    previewChallengeToken: vi.fn(),
    createAuthorization: vi.fn(),
    verifyAuthorization: vi.fn(),
    revokeAuthorization: vi.fn().mockResolvedValue(undefined),
    listAuditLogs: vi.fn().mockResolvedValue([]),
    getGitHubStatus: vi.fn(),
    listGitHubRepos: vi.fn(),
    disconnectGitHub: vi.fn(),
    getGitHubConnectUrl: () => '/api/integrations/github/connect',
    ...overrides,
  };
}

describe('Dynamic Ownership Setup Snippets & Copy-Ready Token', () => {
  const writeTextMock = vi.fn<(_text: string) => Promise<void>>();

  beforeEach(() => {
    writeTextMock.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });
  });

  it('parses valid target URLs cleanly and rejects incomplete or shell-unsafe inputs', () => {
    expect(
      parseDraftTargetUrl('https://STAGING.Empresa.com.br:8443/login?x=1'),
    ).toEqual({
      origin: 'https://staging.empresa.com.br:8443',
      hostname: 'staging.empresa.com.br',
      isLoopback: false,
    });

    expect(parseDraftTargetUrl('staging.empresa.com')).toEqual({
      origin: 'https://staging.empresa.com',
      hostname: 'staging.empresa.com',
      isLoopback: false,
    });

    expect(parseDraftTargetUrl('localhost:3000')).toEqual({
      origin: 'http://localhost:3000',
      hostname: 'localhost',
      isLoopback: true,
    });

    expect(parseDraftTargetUrl('http://127.0.0.1:8080/api')).toEqual({
      origin: 'http://127.0.0.1:8080',
      hostname: '127.0.0.1',
      isLoopback: true,
    });

    expect(parseDraftTargetUrl('')).toBeNull();
    expect(parseDraftTargetUrl('https://')).toBeNull();
    expect(parseDraftTargetUrl('https://staging')).toBeNull();
    expect(parseDraftTargetUrl('https://staging.c')).toBeNull();
    expect(parseDraftTargetUrl('ftp://staging.empresa.com')).toBeNull();
    expect(parseDraftTargetUrl('javascript:alert(1)')).toBeNull();
    expect(
      parseDraftTargetUrl('https://user:pass@staging.empresa.com'),
    ).toBeNull();
    expect(parseDraftTargetUrl("https://evil'$(id).com")).toBeNull();

    expect(escapeShellSingleQuoted("abc'def")).toBe("abc'\\''def");
    const snippets = buildOwnershipGuideSnippets({
      origin: 'https://app.acme.io',
      hostname: 'app.acme.io',
      token: 'brynja-verify-1234567890abcdef',
      dnsAltComment: '# alt',
    });
    expect(snippets.sshConnectCmd).toBe('ssh usuario@app.acme.io');
    expect(snippets.curlVerifyCmd).toBe(
      'curl -fsSL https://app.acme.io/.well-known/brynja-verify.txt',
    );
    expect(snippets.sshCreateFileCmd).toContain(
      "'brynja-verify-1234567890abcdef'",
    );
  });

  it('dynamically updates terminal snippets from the typed target URL and copies with the real derived token', async () => {
    const previewChallengeToken = vi.fn().mockResolvedValue({
      origin: 'https://app.minhaempresa.com',
      hostname: 'app.minhaempresa.com',
      challengeToken: 'brynja-verify-deadbeef00112233445566778899aabb',
    });

    const gateway = makeGateway({ previewChallengeToken });

    render(
      <GatewayProvider gateway={gateway}>
        <AuthorizationsView />
      </GatewayProvider>,
    );

    const urlInput = await screen.findByPlaceholderText(
      'https://staging.suaempresa.com',
    );
    fireEvent.change(urlInput, {
      target: { value: 'https://app.minhaempresa.com/painel' },
    });

    // Hostname and origin update immediately in terminal commands
    expect(
      screen.getByText(/ssh usuario@app\.minhaempresa\.com/i),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /curl -fsSL https:\/\/app\.minhaempresa\.com\/\.well-known\/brynja-verify\.txt/i,
      ),
    ).toBeTruthy();

    // Debounced token preview populates the real token automatically
    await waitFor(() => {
      expect(previewChallengeToken).toHaveBeenCalledWith(
        'https://app.minhaempresa.com',
      );
      expect(
        screen.getByText(
          /brynja-verify-deadbeef00112233445566778899aabb' \| sudo tee/i,
        ),
      ).toBeTruthy();
    });

    // Clicking copy on Step 2 copies the ready-to-run command with the real token
    fireEvent.click(
      screen.getByRole('button', {
        name: /Copiar — Servidor remoto \(Linux \/ VPS\)/i,
      }),
    );

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        "sudo mkdir -p /var/www/html/.well-known && printf '%s\\n' 'brynja-verify-deadbeef00112233445566778899aabb' | sudo tee /var/www/html/.well-known/brynja-verify.txt > /dev/null",
      );
    });

    // Switching to DNS TXT tab also shows dynamic host and copies the real token
    fireEvent.click(screen.getByRole('button', { name: /Registro DNS TXT/i }));
    expect(
      screen.getByText(/dig \+short TXT _brynja\.app\.minhaempresa\.com/i),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: /Copiar valor do token DNS TXT/i }),
    );
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenLastCalledWith(
        'brynja-verify-deadbeef00112233445566778899aabb',
      );
    });
  });

  it('resolves the real token on demand when clicking Copy immediately before debounce completes', async () => {
    const previewChallengeToken = vi.fn().mockResolvedValue({
      origin: 'https://fast.acme.io',
      hostname: 'fast.acme.io',
      challengeToken: 'brynja-verify-ffeeddccbbaa99887766554433221100',
    });

    const gateway = makeGateway({ previewChallengeToken });

    render(
      <GatewayProvider gateway={gateway}>
        <AuthorizationsView />
      </GatewayProvider>,
    );

    const urlInput = await screen.findByPlaceholderText(
      'https://staging.suaempresa.com',
    );
    fireEvent.change(urlInput, {
      target: { value: 'https://fast.acme.io' },
    });

    // Click copy immediately without waiting for the 250ms debounce
    fireEvent.click(
      screen.getByRole('button', {
        name: /Copiar — Servidor remoto \(Linux \/ VPS\)/i,
      }),
    );

    await waitFor(() => {
      expect(previewChallengeToken).toHaveBeenCalledWith(
        'https://fast.acme.io',
      );
      expect(writeTextMock).toHaveBeenCalledWith(
        "sudo mkdir -p /var/www/html/.well-known && printf '%s\\n' 'brynja-verify-ffeeddccbbaa99887766554433221100' | sudo tee /var/www/html/.well-known/brynja-verify.txt > /dev/null",
      );
    });

    // Never copies the placeholder token
    expect(writeTextMock.mock.calls[0]?.[0]).not.toContain(
      'SEU_TOKEN_GERADO_ACIMA',
    );
  });

  it('switches between typed URL and registered targets without redundant preview calls for known targets', async () => {
    const previewChallengeToken = vi.fn().mockResolvedValue({
      origin: 'https://novo.example.com',
      hostname: 'novo.example.com',
      challengeToken: 'brynja-verify-99998888777766665555444433332222',
    });

    const gateway = makeGateway({
      previewChallengeToken,
      listAuthorizations: vi.fn().mockResolvedValue([
        {
          id: 'auth-existing',
          origin: 'https://existing.example.com',
          hostname: 'existing.example.com',
          method: 'WELL_KNOWN_FILE',
          status: 'PENDING',
          challengeToken: 'brynja-verify-11112222333344445555666677778888',
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
        screen.getByText(/ssh usuario@existing\.example\.com/i),
      ).toBeTruthy();
    });

    const urlInput = screen.getByPlaceholderText(
      'https://staging.suaempresa.com',
    );

    // Typing the same origin as an existing target reuses its token with zero preview calls
    fireEvent.change(urlInput, {
      target: { value: 'https://existing.example.com/status' },
    });
    expect(
      screen.getByText(
        /brynja-verify-11112222333344445555666677778888' \| sudo tee/i,
      ),
    ).toBeTruthy();
    expect(previewChallengeToken).not.toHaveBeenCalled();

    // Typing a brand new URL switches snippets and fetches the real token for the new target
    fireEvent.change(urlInput, {
      target: { value: 'https://novo.example.com' },
    });

    await waitFor(() => {
      expect(previewChallengeToken).toHaveBeenCalledWith(
        'https://novo.example.com',
      );
      expect(
        screen.getByText(
          /brynja-verify-99998888777766665555444433332222' \| sudo tee/i,
        ),
      ).toBeTruthy();
    });

    // Clicking "Como configurar" on the registered target switches the guide back to it
    fireEvent.click(screen.getByRole('button', { name: /Como configurar/i }));
    expect(
      screen.getByText(/ssh usuario@existing\.example\.com/i),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /brynja-verify-11112222333344445555666677778888' \| sudo tee/i,
      ),
    ).toBeTruthy();
  });
});
