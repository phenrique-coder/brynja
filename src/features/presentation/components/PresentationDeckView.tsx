'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  FileDown,
  LayoutGrid,
  Maximize2,
  Minimize2,
  StickyNote,
  X,
} from 'lucide-react';
import { useI18n } from '@/core/providers/i18n-provider';
import { BrynjaLogo } from '@/features/scans/components/BrynjaLogo';
import type {
  PresentationDecksByLocale,
  PresentationSlide,
  SlideChapterId,
  SlideChapterMeta,
} from '../models/presentation.models';
import { PresentationSlideCard } from './PresentationSlideCard';

export interface PresentationDeckViewProps {
  decks?: PresentationDecksByLocale;
  slides?: readonly PresentationSlide[];
  chapters?: readonly SlideChapterMeta[];
  appVersion: string;
}

export function PresentationDeckView({
  decks,
  slides: fallbackSlides,
  chapters: fallbackChapters,
  appVersion,
}: PresentationDeckViewProps) {
  const { locale, messages, t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [isStageMode, setIsStageMode] = useState(false);

  const activeDeck = decks ? (decks[locale] ?? decks['pt-BR']) : null;
  const slides = activeDeck?.slides ?? fallbackSlides ?? [];
  const chapters = activeDeck?.chapters ?? fallbackChapters ?? [];

  const totalSlides = slides.length;
  const activeSlide = slides[currentIndex] ?? slides[0];
  const executiveFooter = t(messages.presentation.executiveFooter, {
    version: appVersion,
  });

  const chapterLabelMap = useMemo(() => {
    const map = new Map<SlideChapterId, string>();
    for (const ch of chapters) {
      map.set(ch.id, ch.label);
    }
    return map;
  }, [chapters]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(totalSlides - 1, prev + 1));
  }, [totalSlides]);

  const goToSlide = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(totalSlides - 1, index));
      setCurrentIndex(clamped);
      setShowOverview(false);
    },
    [totalSlides],
  );

  const jumpToChapter = useCallback(
    (chapterId: SlideChapterId) => {
      const idx = slides.findIndex((s) => s.chapter === chapterId);
      if (idx >= 0) {
        goToSlide(idx);
      }
    },
    [slides, goToSlide],
  );

  const toggleStageMode = useCallback(() => {
    setIsStageMode((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        if (next && document.documentElement.requestFullscreen) {
          void document.documentElement.requestFullscreen().catch(() => {
            // Browser fullscreen may be denied in non-gesture contexts; CSS stage mode still works.
          });
        } else if (!next && document.fullscreenElement && document.exitFullscreen) {
          void document.exitFullscreen().catch(() => {
            // Ignore exitFullscreen errors
          });
        }
      }
      return next;
    });
  }, []);

  // Keep stage mode synced if user exits native browser fullscreen via Esc
  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsStageMode(false);
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcuts for stage navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        goPrev();
      } else if (event.key === ' ' && !showOverview) {
        event.preventDefault();
        goNext();
      } else if (event.key === 'Home') {
        event.preventDefault();
        goToSlide(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        goToSlide(totalSlides - 1);
      } else if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        setShowNotes((prev) => !prev);
      } else if (event.key === 'g' || event.key === 'G') {
        event.preventDefault();
        setShowOverview((prev) => !prev);
      } else if (event.key === 't' || event.key === 'T') {
        event.preventDefault();
        setShowTechnicalDetails((prev) => !prev);
      } else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        toggleStageMode();
      } else if (event.key === 'Escape') {
        if (showOverview) {
          setShowOverview(false);
        } else if (isStageMode) {
          setIsStageMode(false);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    goNext,
    goPrev,
    goToSlide,
    isStageMode,
    showOverview,
    toggleStageMode,
    totalSlides,
  ]);

  function handleExportPdf() {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

  if (!activeSlide) {
    return null;
  }

  const progressPercent = Math.round(((currentIndex + 1) / totalSlides) * 100);

  return (
    <div className="presentation-print-deck">
      {/* Interactive Stage Container (hidden during print) */}
      <div
        className={
          isStageMode
            ? 'no-print fixed inset-0 z-50 flex flex-col overflow-y-auto bg-canvas px-4 py-4 sm:px-8 sm:py-6'
            : 'no-print space-y-4'
        }
      >
        <div
          className={
            isStageMode ? 'mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4' : 'space-y-4'
          }
        >
          {/* Top Stage Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-subtle bg-surface px-3.5 py-2.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <BrynjaLogo className="h-7 w-7 shrink-0" />
              <div className="leading-tight">
                <div className="text-xs font-bold text-fg">
                  {messages.presentation.deckBrandTitle}
                </div>
                <div className="font-mono text-[11px] text-fg-muted">
                  {t(messages.presentation.slideOf, {
                    current: currentIndex + 1,
                    total: totalSlides,
                  })}
                </div>
              </div>
            </div>

            {/* Chapter Quick Pills (desktop) */}
            <div className="hidden items-center gap-1 rounded-xl border border-subtle bg-surface-subtle p-1 xl:flex">
              {chapters.map((ch) => {
                const active = activeSlide.chapter === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => jumpToChapter(ch.id)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                      active
                        ? 'bg-surface text-cyan-700 shadow-sm dark:text-cyan-300'
                        : 'text-fg-secondary hover:text-fg'
                    }`}
                  >
                    {ch.label}
                  </button>
                );
              })}
            </div>

            {/* Stage Controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Dual Audience Focus Toggle */}
              <button
                type="button"
                onClick={() => setShowTechnicalDetails((prev) => !prev)}
                title={
                  showTechnicalDetails
                    ? messages.presentation.modeExecutiveTooltip
                    : messages.presentation.modeCompleteTooltip
                }
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                  showTechnicalDetails
                    ? 'border-indigo-500/35 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200'
                    : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                }`}
              >
                {showTechnicalDetails ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                <span>
                  {showTechnicalDetails
                    ? messages.presentation.modeComplete
                    : messages.presentation.modeExecutive}
                </span>
              </button>

              {/* Presenter Notes Toggle */}
              <button
                type="button"
                aria-pressed={showNotes}
                onClick={() => setShowNotes((prev) => !prev)}
                title={messages.presentation.notesTooltip}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                  showNotes
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200'
                    : 'border-subtle bg-surface-subtle text-fg-secondary hover:text-fg'
                }`}
              >
                <StickyNote className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {messages.presentation.notesLabel}
                </span>
              </button>

              {/* Overview Grid Toggle */}
              <button
                type="button"
                aria-pressed={showOverview}
                onClick={() => setShowOverview((prev) => !prev)}
                title={messages.presentation.overviewTooltip}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                  showOverview
                    ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-800 dark:text-cyan-200'
                    : 'border-subtle bg-surface-subtle text-fg-secondary hover:text-fg'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {messages.presentation.overviewLabel}
                </span>
              </button>

              {/* Export PDF (Print) */}
              <button
                type="button"
                onClick={handleExportPdf}
                title={messages.presentation.exportPdfTooltip}
                className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-2.5 py-1.5 text-xs font-semibold text-fg-secondary transition hover:border-strong hover:text-fg"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span className="hidden md:inline">
                  {messages.presentation.exportPdf}
                </span>
              </button>

              {/* Fullscreen / Stage Mode Toggle */}
              <button
                type="button"
                onClick={toggleStageMode}
                title={messages.presentation.fullscreenTooltip}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {isStageMode ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {isStageMode
                    ? messages.presentation.fullscreenExit
                    : messages.presentation.fullscreenEnter}
                </span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Active Slide Stage */}
          <div className="flex-1">
            <PresentationSlideCard
              slide={activeSlide}
              totalSlides={totalSlides}
              chapterLabel={
                chapterLabelMap.get(activeSlide.chapter) ?? activeSlide.chapter
              }
              appVersion={appVersion}
              locale={locale}
              showTechnicalDetails={showTechnicalDetails}
              technicalBoxLabel={messages.presentation.technicalBoxLabel}
              openLiveDemoLabel={messages.presentation.openLiveDemo}
              heroFooterTagline={messages.presentation.heroFooterTagline}
              executiveFooter={executiveFooter}
            />
          </div>

          {/* Presenter Speaking Notes Drawer */}
          {showNotes ? (
            <aside
              aria-label={messages.presentation.presenterNotesHeading}
              className="rounded-2xl border border-amber-500/30 bg-amber-50/70 p-4 dark:bg-amber-500/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  <StickyNote className="h-4 w-4" />
                  <span>{messages.presentation.presenterNotesHeading}</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface/80 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-fg-secondary">
                  <Clock className="h-3 w-3" />
                  {t(messages.presentation.estimatedTime, {
                    time: activeSlide.estimatedTime,
                  })}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-amber-950 dark:text-amber-100">
                {activeSlide.presenterNotes}
              </p>
            </aside>
          ) : null}

          {/* Bottom Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-subtle bg-surface px-4 py-2.5 shadow-sm">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={goPrev}
              className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2 text-xs font-semibold text-fg transition hover:border-strong hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{messages.presentation.prevSlide}</span>
            </button>

            {/* Clickable Slide Stepper Dots */}
            <div className="hidden flex-col items-center gap-1 sm:flex">
              <div className="flex items-center gap-1">
                {slides.map((s, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={`Slide ${s.number}: ${s.title}`}
                      aria-current={isCurrent ? 'step' : undefined}
                      onClick={() => goToSlide(idx)}
                      className={`h-2 rounded-full transition-all ${
                        isCurrent
                          ? 'w-6 bg-cyan-600 dark:bg-cyan-400'
                          : 'w-2 bg-subtle hover:bg-fg-muted'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] text-fg-muted">
                {messages.presentation.shortcutsHint}
              </span>
            </div>

            <button
              type="button"
              disabled={currentIndex === totalSlides - 1}
              onClick={goNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>{messages.presentation.nextSlide}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Slide Index / Overview Modal */}
      {showOverview ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={messages.presentation.overviewTitle}
          className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
        >
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-subtle bg-surface shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-subtle px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-fg">
                  {messages.presentation.overviewTitle}
                </h2>
                <p className="text-xs text-fg-secondary">
                  {messages.presentation.overviewSubtitle}
                </p>
              </div>
              <button
                type="button"
                aria-label={messages.presentation.closeOverview}
                onClick={() => setShowOverview(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-subtle bg-surface-subtle text-fg-secondary transition hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
              {slides.map((s, idx) => {
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    className={`flex flex-col rounded-2xl border p-4 text-left transition ${
                      isCurrent
                        ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/40'
                        : 'border-subtle bg-surface-subtle hover:border-strong hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-cyan-700 dark:text-cyan-300">
                        {String(s.number).padStart(2, '0')} ·{' '}
                        {chapterLabelMap.get(s.chapter) ?? s.chapter}
                      </span>
                      <span className="font-mono text-[10px] text-fg-muted">
                        {s.estimatedTime}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs font-bold text-fg">
                      {s.title}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-fg-secondary">
                      {s.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Print-Only Complete Landscape Deck (1 slide per page for clean PDF export) */}
      <div className="hidden print:block" aria-hidden="true">
        {slides.map((slide) => (
          <PresentationSlideCard
            key={`print-${slide.id}`}
            slide={slide}
            totalSlides={totalSlides}
            chapterLabel={
              chapterLabelMap.get(slide.chapter) ?? slide.chapter
            }
            appVersion={appVersion}
            locale={locale}
            showTechnicalDetails={showTechnicalDetails}
            technicalBoxLabel={messages.presentation.technicalBoxLabel}
            openLiveDemoLabel={messages.presentation.openLiveDemo}
            heroFooterTagline={messages.presentation.heroFooterTagline}
            executiveFooter={executiveFooter}
            isPrintMode
          />
        ))}
      </div>
    </div>
  );
}
