'use client';

import React from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Terminal,
} from 'lucide-react';
import { BrynjaLogo } from '@/features/scans/components/BrynjaLogo';
import type { PresentationSlide } from '../models/presentation.models';
import { SlideVisualDiagram } from './SlideVisualDiagram';

export interface PresentationSlideCardProps {
  slide: PresentationSlide;
  totalSlides: number;
  chapterLabel: string;
  appVersion: string;
  showTechnicalDetails: boolean;
  technicalBoxLabel: string;
  openLiveDemoLabel: string;
  isPrintMode?: boolean;
}

export function PresentationSlideCard({
  slide,
  totalSlides,
  chapterLabel,
  appVersion,
  showTechnicalDetails,
  technicalBoxLabel,
  openLiveDemoLabel,
  isPrintMode = false,
}: PresentationSlideCardProps) {
  const slideNum = String(slide.number).padStart(2, '0');
  const totalNum = String(totalSlides).padStart(2, '0');

  if (slide.isHeroCover) {
    return (
      <article
        className={`relative flex flex-col justify-between overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-surface via-surface to-cyan-500/10 shadow-sm ${
          isPrintMode
            ? 'presentation-print-slide rounded-2xl p-6 shadow-none'
            : 'min-h-[540px] rounded-3xl p-6 sm:p-10'
        }`}
      >
        {/* Decorative ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl print:hidden"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl print:hidden"
        />

        {/* Top bar */}
        <div className="relative flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-800 dark:text-cyan-200">
            {slide.kicker}
          </span>
          <span className="rounded-lg border border-subtle bg-surface-subtle px-2.5 py-1 font-mono text-xs font-semibold text-fg-secondary">
            v{appVersion} · {slideNum} / {totalNum}
          </span>
        </div>

        {/* Center Keynote Hero */}
        <div
          className={`relative mx-auto flex max-w-4xl flex-col items-center text-center ${
            isPrintMode ? 'my-4 gap-4' : 'my-6 gap-5 sm:my-8'
          }`}
        >
          <div
            className={`flex items-center justify-center rounded-3xl border border-cyan-500/35 bg-surface shadow-xl shadow-cyan-950/20 ${
              isPrintMode ? 'h-24 w-24' : 'h-28 w-28 sm:h-32 sm:w-32'
            }`}
          >
            <BrynjaLogo
              className={
                isPrintMode
                  ? 'h-16 w-16 drop-shadow-sm'
                  : 'h-20 w-20 drop-shadow-sm sm:h-24 sm:w-24'
              }
            />
          </div>

          <div className="space-y-2.5">
            <h1
              className={
                isPrintMode
                  ? 'text-5xl font-extrabold tracking-tight text-fg'
                  : 'text-4xl font-extrabold tracking-tight text-fg sm:text-6xl'
              }
            >
              {slide.title}
            </h1>
            <p
              className={
                isPrintMode
                  ? 'mx-auto max-w-3xl text-base leading-relaxed text-fg-secondary'
                  : 'mx-auto max-w-2xl text-base leading-relaxed text-fg-secondary sm:text-lg'
              }
            >
              {slide.subtitle}
            </p>
          </div>

          {/* Four signature pillars */}
          <div
            className={`grid w-full gap-2.5 ${
              isPrintMode
                ? 'grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-4'
            }`}
          >
            {slide.highlights.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-subtle bg-surface/85 px-3.5 py-3 text-center shadow-sm"
              >
                <div className="text-xs font-bold text-cyan-800 dark:text-cyan-200 sm:text-sm">
                  {pillar.title}
                </div>
                <div className="mt-0.5 text-[11px] text-fg-secondary">
                  {pillar.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom strip */}
        <div className="relative">
          {showTechnicalDetails ? (
            <div
              data-testid={isPrintMode ? undefined : 'slide-technical-details'}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/25 bg-indigo-50/60 px-4 py-2.5 dark:bg-indigo-500/10"
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-200">
                <Terminal className="h-3.5 w-3.5" />
                {technicalBoxLabel}
              </span>
              <span className="font-mono text-[11px] text-fg-secondary">
                {slide.itDetails.summary}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between border-t border-subtle pt-3 text-xs text-fg-muted">
              <span>Brynja — Segurança Proativa em Camadas</span>
              <span className="font-mono">
                v{appVersion} · Open-Source (MIT)
              </span>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      className={`relative flex flex-col justify-between overflow-hidden border border-subtle bg-surface shadow-sm ${
        isPrintMode
          ? 'presentation-print-slide rounded-2xl p-5 shadow-none'
          : 'min-h-[540px] rounded-3xl p-5 sm:p-8'
      }`}
    >
      {/* Subtle decorative ambient accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl print:hidden"
      />

      <div className={isPrintMode ? 'relative space-y-3' : 'relative space-y-5'}>
        {/* Slide header metadata */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 border-b border-subtle ${
            isPrintMode ? 'pb-2' : 'pb-3'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-200">
              {chapterLabel}
            </span>
            <span className="text-xs font-semibold text-fg-muted">
              {slide.kicker}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {slide.demoLink && !isPrintMode ? (
              <a
                href={slide.demoLink.href}
                target="_blank"
                rel="noreferrer"
                className="no-print inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-800 transition hover:border-cyan-500/50 hover:bg-cyan-500/20 dark:text-cyan-200"
                title={openLiveDemoLabel}
              >
                <span>{slide.demoLink.label}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : null}

            <div className="flex items-center gap-1.5 rounded-lg border border-subtle bg-surface-subtle px-2.5 py-1 font-mono text-[11px] font-semibold text-fg-secondary">
              <BrynjaLogo className="h-3.5 w-3.5" />
              <span>
                {slideNum} / {totalNum}
              </span>
            </div>
          </div>
        </div>

        {/* Title & universal plain-language summary */}
        <div className={isPrintMode ? 'space-y-1' : 'space-y-2'}>
          <h2
            className={
              isPrintMode
                ? 'text-[21px] font-bold leading-tight tracking-tight text-fg'
                : 'text-xl font-bold tracking-tight text-fg sm:text-3xl'
            }
          >
            {slide.title}
          </h2>
          <p
            className={
              isPrintMode
                ? 'max-w-5xl text-[12.5px] leading-snug text-fg-secondary'
                : 'max-w-4xl text-sm leading-relaxed text-fg-secondary sm:text-base'
            }
          >
            {slide.subtitle}
          </p>
        </div>

        {/* Plain-language analogy callout when present */}
        {slide.analogy ? (
          <div
            className={`flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-50/70 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100 ${
              isPrintMode
                ? 'px-3 py-1.5 text-[11px] leading-snug'
                : 'rounded-2xl px-4 py-2.5 text-xs leading-relaxed'
            }`}
          >
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-300" />
            <span>{slide.analogy}</span>
          </div>
        ) : null}

        {/* Bespoke visual diagram for the slide */}
        <SlideVisualDiagram
          visual={slide.visual}
          appVersion={appVersion}
          showTechnicalDetails={showTechnicalDetails}
          compact={isPrintMode}
        />

        {/* Key executive takeaways */}
        <div
          className={`grid ${
            isPrintMode ? 'gap-2' : 'gap-3'
          } ${
            slide.highlights.length === 4
              ? isPrintMode
                ? 'grid-cols-2'
                : 'sm:grid-cols-2'
              : isPrintMode
                ? 'grid-cols-3'
                : 'sm:grid-cols-3'
          }`}
        >
          {slide.highlights.map((item) => (
            <div
              key={item.title}
              className={`border border-subtle bg-surface-subtle/60 ${
                isPrintMode ? 'rounded-xl p-2.5' : 'rounded-2xl p-3.5'
              }`}
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <div
                    className={
                      isPrintMode
                        ? 'text-[11.5px] font-bold leading-snug text-fg'
                        : 'text-xs font-bold text-fg sm:text-sm'
                    }
                  >
                    {item.title}
                  </div>
                  <p
                    className={
                      isPrintMode
                        ? 'mt-0.5 text-[10.5px] leading-snug text-fg-secondary'
                        : 'mt-1 text-xs leading-relaxed text-fg-secondary'
                    }
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dual-layer optional IT technical footer */}
      <div className={isPrintMode ? 'relative mt-2.5' : 'relative mt-5'}>
        {showTechnicalDetails ? (
          <div
            data-testid={isPrintMode ? undefined : 'slide-technical-details'}
            className={`border border-indigo-500/25 bg-indigo-50/60 dark:bg-indigo-500/10 ${
              isPrintMode ? 'rounded-xl px-3 py-2' : 'rounded-2xl px-4 py-3'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-200">
                <Terminal className="h-3.5 w-3.5" />
                <span>{technicalBoxLabel}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {slide.itDetails.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-indigo-500/25 bg-surface/80 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-indigo-800 dark:text-indigo-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <p
              className={
                isPrintMode
                  ? 'mt-1 font-mono text-[10px] leading-snug text-fg-secondary'
                  : 'mt-1.5 font-mono text-[11px] leading-relaxed text-fg-secondary'
              }
            >
              {slide.itDetails.summary}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between border-t border-subtle pt-2 text-[11px] text-fg-muted">
            <span>Brynja v{appVersion} · Apresentação Executiva</span>
            <span className="font-mono">
              {slideNum} / {totalNum}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
