import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Locale } from '@/core/i18n/types';
import { I18nProvider } from '@/core/providers/i18n-provider';
import { LanguageSwitcher } from '@/features/scans/components/LanguageSwitcher';
import { UserAccountMenu } from '@/features/scans/components/UserAccountMenu';
import { PresentationDeckView } from '../components/PresentationDeckView';
import { PRESENTATION_DECKS } from '../data';
import {
  BRYNJA_PRESENTATION_SLIDES,
  PRESENTATION_CHAPTERS,
} from '../data/brynja-slides.pt-BR';

describe('Brynja interactive presentation deck', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('maintains 1-to-1 structural parity across PT-BR, EN, and ES for all 19 slides', () => {
    const locales: Locale[] = ['pt-BR', 'en', 'es'];
    const baseDeck = PRESENTATION_DECKS['pt-BR'];

    expect(baseDeck.slides).toHaveLength(19);
    expect(baseDeck.slides[0]?.isHeroCover).toBe(true);

    for (const locale of locales) {
      const deck = PRESENTATION_DECKS[locale];
      const chapterIds = new Set(deck.chapters.map((c) => c.id));

      expect(deck.chapters).toHaveLength(baseDeck.chapters.length);
      expect(deck.slides).toHaveLength(19);

      deck.slides.forEach((slide, index) => {
        const ref = baseDeck.slides[index];
        expect(slide.id).toBe(ref.id);
        expect(slide.number).toBe(index + 1);
        expect(slide.chapter).toBe(ref.chapter);
        expect(slide.visual).toBe(ref.visual);
        expect(Boolean(slide.isHeroCover)).toBe(Boolean(ref.isHeroCover));
        expect(chapterIds.has(slide.chapter)).toBe(true);
        expect(slide.title.trim().length).toBeGreaterThan(3);
        expect(slide.subtitle.trim().length).toBeGreaterThan(10);
        expect(slide.highlights.length).toBe(ref.highlights.length);
        expect(slide.itDetails.summary.trim().length).toBeGreaterThan(10);
        expect(slide.itDetails.tags.length).toBeGreaterThanOrEqual(3);
        expect(slide.presenterNotes.trim().length).toBeGreaterThan(20);
        expect(slide.estimatedTime.trim().length).toBeGreaterThan(0);

        if (locale !== 'pt-BR' && !slide.isHeroCover) {
          expect(slide.title).not.toBe(ref.title);
          expect(slide.subtitle).not.toBe(ref.subtitle);
        }
      });
    }
  });

  it('navigates slides, toggles IT technical details, shows presenter notes, overview, and exports PDF', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <I18nProvider defaultLocale="pt-BR">
        <PresentationDeckView
          decks={PRESENTATION_DECKS}
          appVersion="1.24.0"
        />
      </I18nProvider>,
    );

    // Starts at slide 1 (hero cover) with IT details visible
    expect(screen.getByText('Slide 1 de 19')).toBeTruthy();
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
    expect(screen.getByText('Slide 2 de 19')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('Slide 3 de 19')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('Slide 2 de 19')).toBeTruthy();

    // Toggle presenter notes via button
    fireEvent.click(screen.getByRole('button', { name: /Notas/i }));
    expect(
      screen.getByText(/Roteiro de fala do apresentador/i),
    ).toBeTruthy();

    // Open slide overview and jump to slide 19
    fireEvent.click(screen.getByRole('button', { name: /Índice/i }));
    const dialog = screen.getByRole('dialog', {
      name: /Visão Geral da Apresentação/i,
    });
    expect(dialog).toBeTruthy();

    fireEvent.click(within(dialog).getByText(/Plano Sugerido de Piloto/i));
    expect(screen.getByText('Slide 19 de 19')).toBeTruthy();

    // Trigger PDF print export
    fireEvent.click(screen.getByRole('button', { name: /Exportar PDF/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  it('translates toolbar, slide content, visual diagrams, and presenter notes live across PT-BR, EN, and ES', () => {
    render(
      <I18nProvider defaultLocale="pt-BR">
        <LanguageSwitcher />
        <PresentationDeckView
          decks={PRESENTATION_DECKS}
          slides={BRYNJA_PRESENTATION_SLIDES}
          chapters={PRESENTATION_CHAPTERS}
          appVersion="1.24.0"
        />
      </I18nProvider>,
    );

    // Jump to slide 3 (Problem slide) and open presenter notes
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'n' });

    expect(screen.getByText('Brynja · Apresentação')).toBeTruthy();
    expect(
      screen.getAllByText('O Desafio Atual da Segurança em Aplicações').length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Código de Terceiros').length).toBeGreaterThanOrEqual(
      1,
    );

    // Switch to English
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar idioma' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'English' }));

    expect(screen.getByText('Brynja · Presentation')).toBeTruthy();
    expect(
      screen.getAllByText('The Current Challenge in Application Security')
        .length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Third-Party Code').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText(/Frame the pain before introducing/i)).toBeTruthy();

    // Switch to Spanish
    fireEvent.click(screen.getByRole('button', { name: 'Select language' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Español' }));

    expect(screen.getByText('Brynja · Presentación')).toBeTruthy();
    expect(
      screen.getAllByText('El Desafío Actual de la Seguridad en Aplicaciones')
        .length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Código de Terceros').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText(/Contextualiza el problema antes/i)).toBeTruthy();
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
