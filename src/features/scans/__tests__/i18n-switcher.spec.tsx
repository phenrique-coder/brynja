import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  detectBrowserLocale,
  interpolate,
  LOCALE_STORAGE_KEY,
} from '@/core/i18n';
import type { IBrynjaGateway } from '@/core/ports/scan-gateway.port';
import { GatewayProvider } from '@/core/providers/gateway-provider';
import { I18nProvider } from '@/core/providers/i18n-provider';
import packageJson from '../../../../package.json';
import { AuthRequiredCard } from '../components/AuthRequiredCard';
import { Footer } from '../components/Footer';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const stubGateway = {
  getGitHubConnectUrl: () => '/api/auth/github/login',
  getGitHubStatus: async () => ({
    connected: false,
    oauthConfigured: true,
    user: null,
  }),
} as unknown as IBrynjaGateway;

describe('Multi-language i18n & LanguageSwitcher (PT / EN / ES)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = 'pt-BR';
  });

  it('switches UI copy across Portuguese, English, and Spanish and persists preference', () => {
    render(
      <I18nProvider defaultLocale="pt-BR">
        <GatewayProvider gateway={stubGateway}>
          <LanguageSwitcher />
          <AuthRequiredCard />
          <Footer />
        </GatewayProvider>
      </I18nProvider>,
    );

    // Default Portuguese (pt-BR)
    expect(screen.getByText('Entrar com GitHub')).toBeTruthy();
    expect(screen.getByText(`v${packageJson.version}`)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /Segurança/i }).getAttribute('href'),
    ).toContain('/docs/pt-BR/SECURITY.md');

    // Open flag switcher and switch to English
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar idioma' }));
    expect(
      screen
        .getByRole('menuitemradio', { name: 'Português' })
        .getAttribute('aria-checked'),
    ).toBe('true');
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'English' }));

    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByText('Sign in with GitHub')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /Security/i }).getAttribute('href'),
    ).toMatch(/\/blob\/main\/SECURITY\.md$/);

    // Open flag switcher again and switch to Spanish
    fireEvent.click(screen.getByRole('button', { name: 'Select language' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Español' }));

    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('es');
    expect(document.documentElement.lang).toBe('es');
    expect(screen.getByText('Iniciar sesión con GitHub')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Seguridad/i })).toBeTruthy();
  });

  it('restores persisted locale from localStorage on initial mount', () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'es');

    render(
      <I18nProvider defaultLocale="pt-BR">
        <GatewayProvider gateway={stubGateway}>
          <AuthRequiredCard />
        </GatewayProvider>
      </I18nProvider>,
    );

    expect(screen.getByText('Iniciar sesión con GitHub')).toBeTruthy();
    expect(document.documentElement.lang).toBe('es');
  });

  it('maps browser languages and interpolates placeholders accurately', () => {
    expect(detectBrowserLocale('pt-BR')).toBe('pt-BR');
    expect(detectBrowserLocale('pt')).toBe('pt-BR');
    expect(detectBrowserLocale('en-US')).toBe('en');
    expect(detectBrowserLocale('en-GB')).toBe('en');
    expect(detectBrowserLocale('es-ES')).toBe('es');
    expect(detectBrowserLocale('es-AR')).toBe('es');
    expect(detectBrowserLocale('fr-FR')).toBe('pt-BR');
    expect(detectBrowserLocale(null)).toBe('pt-BR');

    expect(
      interpolate('Showing {shown} of {total} scans', { shown: 5, total: 12 }),
    ).toBe('Showing 5 of 12 scans');
  });
});
