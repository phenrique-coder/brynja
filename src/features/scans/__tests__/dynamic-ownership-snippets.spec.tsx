import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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
      expiresIso: '2027-05-25T23:59:59Z',
    });
    expect(snippets.sshConnectCmd).toBe('ssh usuario@app.acme.io');
    expect(snippets.curlVerifyCmd).toBe(
      'curl -fsSL https://app.acme.io/.well-known/security.txt',
    );
    expect(snippets.fileContent).toBe(
      'Contact: mailto:security@app.acme.io\nExpires: 2027-05-25T23:59:59Z\n# Brynja-Verification: brynja-verify-1234567890abcdef',
    );
    expect(snippets.sshCreateFileCmd).toBe(
      "sudo mkdir -p /var/www/html/.well-known && printf '%s\\n' 'Contact: mailto:security@app.acme.io' 'Expires: 2027-05-25T23:59:59Z' '# Brynja-Verification: brynja-verify-1234567890abcdef' | sudo tee /var/www/html/.well-known/security.txt > /dev/null",
    );
    expect(snippets.sshCleanupFileCmd).toBe(
      'sudo rm -f /var/www/html/.well-known/security.txt && (sudo rmdir /var/www/html/.well-known 2>/dev/null || true)',
    );
    expect(snippets.nginxActiveConfigCmd).toContain(
      'ls -la /etc/nginx/sites-enabled/',
    );
    expect(snippets.nginxActiveConfigCmd).toContain('"app.acme.io"');
    expect(snippets.nginxSnippet).toContain(
      'location = /.well-known/security.txt {',
    );
    expect(snippets.nginxFindBlockCmd).toContain('/etc/nginx/sites-enabled/');
    expect(snippets.nginxFindBlockCmd).toContain('/etc/nginx/sites-available/');
    expect(snippets.apacheActiveConfigCmd).toContain(
      '/etc/apache2/sites-enabled/',
    );
    expect(snippets.apacheActiveConfigCmd).toContain('"app.acme.io"');
    expect(snippets.apacheSnippet).toContain('ProxyPass /.well-known/ !');
    expect(snippets.apacheSnippet).toContain(
      'Alias /.well-known/ /var/www/html/.well-known/',
    );
    expect(snippets.apacheSnippet).toContain('<Files "security.txt">');
    expect(snippets.apacheSnippet).toContain('ForceType text/plain');
    expect(snippets.apacheReloadCmd).toBe(
      'sudo apache2ctl configtest && sudo systemctl reload apache2',
    );
    expect(snippets.apacheFindBlockCmd).toContain(
      '/etc/apache2/sites-enabled/',
    );
    expect(snippets.apacheFindBlockCmd).toContain(
      '/etc/apache2/sites-available/',
    );
    expect(snippets.apacheFindBlockCmd).toContain('/etc/httpd/conf.d/');
    expect(snippets.reverseProxy.nginx).toEqual({
      activeConfigCmd: snippets.nginxActiveConfigCmd,
      snippet: snippets.nginxSnippet,
      reloadCmd: snippets.nginxReloadCmd,
      findBlockCmd: snippets.nginxFindBlockCmd,
    });
    expect(snippets.reverseProxy.apache).toEqual({
      activeConfigCmd: snippets.apacheActiveConfigCmd,
      snippet: snippets.apacheSnippet,
      reloadCmd: snippets.apacheReloadCmd,
      findBlockCmd: snippets.apacheFindBlockCmd,
    });
    expect(snippets.curlCleanupVerifyCmd).toBe(
      'curl -i https://app.acme.io/.well-known/security.txt',
    );
    expect(snippets.webCleanupCmd).toBe(
      'rm -f public/.well-known/security.txt && (rmdir public/.well-known 2>/dev/null || true)',
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
        /curl -fsSL https:\/\/app\.minhaempresa\.com\/\.well-known\/security\.txt/i,
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

    // Clicking copy on Step 2 copies the RFC 9116 security.txt creation command with the real token
    fireEvent.click(
      screen.getByRole('button', {
        name: /Copiar — Servidor remoto \(Linux \/ VPS\)/i,
      }),
    );

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining(
          "sudo mkdir -p /var/www/html/.well-known && printf '%s\\n' 'Contact: mailto:security@app.minhaempresa.com'",
        ),
      );
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining(
          "'# Brynja-Verification: brynja-verify-deadbeef00112233445566778899aabb' | sudo tee /var/www/html/.well-known/security.txt > /dev/null",
        ),
      );
    });

    // Step 5 rollback commands include safe file/folder removal, Step 3 Nginx revert, and dynamic curl check
    expect(
      screen.getByText(
        /sudo rm -f \/var\/www\/html\/\.well-known\/security\.txt && \(sudo rmdir \/var\/www\/html\/\.well-known 2>\/dev\/null \|\| true\)/i,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /sudo grep -rn "security\.txt\\\|brynja-verify\\\|well-known" \/etc\/nginx\/sites-enabled\/ \/etc\/nginx\/sites-available\//i,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /curl -i https:\/\/app\.minhaempresa\.com\/\.well-known\/security\.txt/i,
      ),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Copiar — 5\.1 — Remover \.well-known\/security\.txt/i,
      }),
    );
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenLastCalledWith(
        'sudo rm -f /var/www/html/.well-known/security.txt && (sudo rmdir /var/www/html/.well-known 2>/dev/null || true)',
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
        expect.stringContaining(
          "sudo mkdir -p /var/www/html/.well-known && printf '%s\\n' 'Contact: mailto:security@fast.acme.io'",
        ),
      );
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining(
          "'# Brynja-Verification: brynja-verify-ffeeddccbbaa99887766554433221100' | sudo tee /var/www/html/.well-known/security.txt > /dev/null",
        ),
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

  it('switches Step 3 and Step 5 reverse-proxy snippets synchronously between Nginx and Apache', async () => {
    const gateway = makeGateway();

    render(
      <GatewayProvider gateway={gateway}>
        <AuthorizationsView />
      </GatewayProvider>,
    );

    const step3ProxyGroup = await screen.findByRole('group', {
      name: /Selecionar servidor de proxy reverso \(Passo 3\)/i,
    });
    const step5ProxyGroup = screen.getByRole('group', {
      name: /Selecionar servidor de proxy reverso \(Passo 5\)/i,
    });

    // Defaults to Nginx in both Step 3 and Step 5
    expect(
      within(step3ProxyGroup)
        .getByRole('button', { name: 'Nginx' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(screen.getByText(/default_type text\/plain;/i)).toBeTruthy();
    expect(
      screen.getAllByText(/sudo nginx -t && sudo systemctl reload nginx/i),
    ).toHaveLength(2);
    expect(
      screen.getByText(
        /sudo grep -rn "security\.txt\\\|brynja-verify\\\|well-known" \/etc\/nginx\/sites-enabled\/ \/etc\/nginx\/sites-available\//i,
      ),
    ).toBeTruthy();

    // Switch to Apache from Step 3 -> updates both Step 3 and Step 5
    fireEvent.click(
      within(step3ProxyGroup).getByRole('button', { name: 'Apache' }),
    );

    expect(
      within(step3ProxyGroup)
        .getByRole('button', { name: 'Apache' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      within(step5ProxyGroup)
        .getByRole('button', { name: 'Apache' })
        .getAttribute('aria-pressed'),
    ).toBe('true');

    expect(
      screen.getByText(/Alias \/\.well-known\/ \/var\/www\/html\/\.well-known\//i),
    ).toBeTruthy();
    expect(screen.getByText(/ForceType text\/plain/i)).toBeTruthy();
    expect(
      screen.getAllByText(
        /sudo apache2ctl configtest && sudo systemctl reload apache2/i,
      ),
    ).toHaveLength(2);
    expect(
      screen.getByText(/ls -la \/etc\/apache2\/sites-enabled\//i),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /sudo grep -rn "security\.txt\\\|brynja-verify\\\|well-known" \/etc\/apache2\/sites-enabled\/ \/etc\/apache2\/sites-available\/ \/etc\/apache2\/conf-available\/ \/etc\/httpd\/conf\.d\//i,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/Servidor rodando em containers Docker\?/i),
    ).toBeTruthy();
    expect(
      screen.getAllByText(
        /sudo httpd -t && sudo systemctl reload httpd/i,
      ),
    ).toHaveLength(2);

    // Copying the Apache snippet writes the full Apache VirtualHost directives
    fireEvent.click(
      screen.getByRole('button', {
        name: /Copiar — Trecho Apache/i,
      }),
    );
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('ProxyPass /.well-known/ !'),
      );
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('Alias /.well-known/ /var/www/html/.well-known/'),
      );
    });

    // Switch back to Nginx from Step 5 -> syncs Step 3 back to Nginx
    fireEvent.click(
      within(step5ProxyGroup).getByRole('button', { name: 'Nginx' }),
    );

    expect(
      within(step3ProxyGroup)
        .getByRole('button', { name: 'Nginx' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(screen.getByText(/default_type text\/plain;/i)).toBeTruthy();
  });

  it('validates bare domains on /authorizations and transparently prepends https:// on submit', async () => {
    const createAuthorization = vi.fn().mockResolvedValue({
      authorization: {
        id: 'auth-prenora',
        origin: 'https://prenora.com.br',
        hostname: 'prenora.com.br',
        method: 'WELL_KNOWN_FILE',
        status: 'PENDING',
        challengeToken: 'brynja-verify-1234abcd5678ef001234abcd5678ef00',
        verifiedAt: null,
        expiresAt: null,
        createdAt: '2026-11-25T15:00:00.000Z',
        updatedAt: '2026-11-25T15:00:00.000Z',
      },
      instructions: 'Publique o arquivo de verificação.',
    });

    const gateway = makeGateway({ createAuthorization });

    render(
      <GatewayProvider gateway={gateway}>
        <AuthorizationsView />
      </GatewayProvider>,
    );

    const urlInput = await screen.findByPlaceholderText(
      'https://staging.suaempresa.com',
    );
    expect(urlInput.getAttribute('type')).toBe('text');

    // Invalid bare host is blocked with a friendly error without calling createAuthorization
    fireEvent.change(urlInput, { target: { value: 'prenora' } });
    fireEvent.click(
      screen.getByRole('button', { name: /Gerar Desafio de Posse/i }),
    );
    expect(createAuthorization).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Informe um domínio ou URL válido/i),
    ).toBeTruthy();

    // Valid bare domain transparently gets https:// prepended under the hood
    fireEvent.change(urlInput, { target: { value: 'prenora.com.br' } });
    fireEvent.click(
      screen.getByRole('button', { name: /Gerar Desafio de Posse/i }),
    );

    await waitFor(() => {
      expect(createAuthorization).toHaveBeenCalledWith(
        'https://prenora.com.br',
        'WELL_KNOWN_FILE',
      );
    });
  });
});
