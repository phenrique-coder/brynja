import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/core/providers/i18n-provider';
import { UserAccountMenu } from '@/features/scans/components/UserAccountMenu';
import { PresentationDeckView } from '../components/PresentationDeckView';
import {
  BRYNJA_PRESENTATION_SLIDES,
  PRESENTATION_CHAPTERS,
} from '../data/brynja-slides.pt-BR';

describe('Brynja interactive presentation deck', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defines 18 sequential slides with complete dual-layer metadata', () => {
    expect(BRYNJA_PRESENTATION_SLIDES).toHaveLength(18);
    const chapterIds = new Set(PRESENTATION_CHAPTERS.map((c) => c.id));

    BRYNJA_PRESENTATION_SLIDES.forEach((slide, index) => {
      expect(slide.number).toBe(index + 1);
      expect(chapterIds.has(slide.chapter)).toBe(true);
      expect(slide.title.trim().length).toBeGreaterThan(5);
      expect(slide.subtitle.trim().length).toBeGreaterThan(10);
      expect(slide.highlights.length).toBeGreaterThanOrEqual(3);
      expect(slide.itDetails.summary.trim().length).toBeGreaterThan(10);
      expect(slide.itDetails.tags.length).toBeGreaterThanOrEqual(3);
      expect(slide.presenterNotes.trim().length).toBeGreaterThan(20);
      expect(slide.estimatedTime.trim().length).toBeGreaterThan(0);
    });
  });

  it('navigates slides, toggles IT technical details, shows presenter notes, overview, and exports PDF', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <I18nProvider defaultLocale="pt-BR">
        <PresentationDeckView
          slides={BRYNJA_PRESENTATION_SLIDES}
          chapters={PRESENTATION_CHAPTERS}
          appVersion="1.23.0"
        />
      </I18nProvider>,
    );

    // Starts at slide 1 with IT details visible
    expect(screen.getByText('Slide 1 de 18')).toBeTruthy();
    expect(screen.getByTestId('slide-technical-details')).toBeTruthy();

    // Toggle to Executive-only mode (hides IT details)
    fireEvent.click(screen.getByRole('button', { name: /Diretoria \+ TI/i }));
    expect(screen.queryByTestId('slide-technical-details')).toBeNull();
    expect(
      screen.getByRole('button', { name: /Só Executivo/i }),
    ).toBeTruthy();

    // Toggle back via keyboard shortcut 'T'
    fireEvent.keyDown(window, { key: 't' });
    expect(screen.getByTestId('slide-technical-details')).toBeTruthy();

    // Navigate via Next button and ArrowRight/ArrowLeft
    fireEvent.click(screen.getByRole('button', { name: /Próximo slide/i }));
    expect(screen.getByText('Slide 2 de 18')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('Slide 3 de 18')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('Slide 2 de 18')).toBeTruthy();

    // Toggle presenter notes via button
    fireEvent.click(screen.getByRole('button', { name: /Notas/i }));
    expect(
      screen.getByText(/Roteiro de fala do apresentador/i),
    ).toBeTruthy();

    // Open slide overview and jump to slide 18
    fireEvent.click(screen.getByRole('button', { name: /Índice/i }));
    const dialog = screen.getByRole('dialog', {
      name: /Visão Geral da Apresentação/i,
    });
    expect(dialog).toBeTruthy();

    fireEvent.click(within(dialog).getByText(/Plano Sugerido de Piloto/i));
    expect(screen.getByText('Slide 18 de 18')).toBeTruthy();

    // Trigger PDF print export
    fireEvent.click(screen.getByRole('button', { name: /Exportar PDF/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });
});

describe('UserAccountMenu presentation link visibility', () => {
  const baseStatus = {
    configured: true,
    connected: true,
    githubUserId: '7',
    login: 'pedro',
    name: 'Pedro',
    avatarUrl: null,
    profileUrl: 'https://github.com/pedro',
    sessionExpiresAt: Date.now() + 60_000,
    callbackUrl: 'http://localhost:3000/api/integrations/github/callback',
    scopes: 'repo read:user user:email read:org',
    oauthAppSettingsUrl: null,
  };

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the discrete Presentation shortcut only when canViewPresentation is true', () => {
    const { rerender } = render(
      <I18nProvider defaultLocale="pt-BR">
        <UserAccountMenu
          status={{ ...baseStatus, canViewPresentation: false }}
          onLogout={vi.fn(async () => {})}
        />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /@pedro/i }));
    expect(
      screen.queryByRole('menuitem', { name: /Apresentação Executiva/i }),
    ).toBeNull();

    rerender(
      <I18nProvider defaultLocale="pt-BR">
        <UserAccountMenu
          status={{ ...baseStatus, canViewPresentation: true }}
          onLogout={vi.fn(async () => {})}
        />
      </I18nProvider>,
    );

    const link = screen.getByRole('menuitem', {
      name: /Apresentação Executiva/i,
    });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/presentation');
  });
});
