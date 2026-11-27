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

  return (
    <article
      className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border border-subtle bg-surface shadow-sm ${
        isPrintMode
          ? 'presentation-print-slide min-h-[180mm] p-7 shadow-none'
          : 'min-h-[540px] p-5 sm:p-8'
      }`}
    >
      {/* Subtle decorative ambient accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl print:hidden"
      />

      <div className="relative space-y-5">
        {/* Slide header metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle pb-3">
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
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-fg sm:text-3xl">
            {slide.title}
          </h2>
          <p className="max-w-4xl text-sm leading-relaxed text-fg-secondary sm:text-base">
            {slide.subtitle}
          </p>
        </div>

        {/* Plain-language analogy callout when present */}
        {slide.analogy ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/25 bg-amber-50/70 px-4 py-2.5 text-xs leading-relaxed text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
            <span>{slide.analogy}</span>
          </div>
        ) : null}

        {/* Bespoke visual diagram for the slide */}
        <SlideVisualDiagram
          visual={slide.visual}
          appVersion={appVersion}
          showTechnicalDetails={showTechnicalDetails}
        />

        {/* Key executive takeaways */}
        <div
          className={`grid gap-3 ${
            slide.highlights.length === 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
          }`}
        >
          {slide.highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-subtle bg-surface-subtle/60 p-3.5"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-fg sm:text-sm">
                    {item.title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dual-layer optional IT technical footer */}
      <div className="relative mt-5">
        {showTechnicalDetails ? (
          <div
            data-testid={isPrintMode ? undefined : 'slide-technical-details'}
            className="rounded-2xl border border-indigo-500/25 bg-indigo-50/60 px-4 py-3 dark:bg-indigo-500/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-200">
                <Terminal className="h-3.5 w-3.5" />
                <span>{technicalBoxLabel}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {slide.itDetails.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-indigo-500/25 bg-surface/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-800 dark:text-indigo-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-fg-secondary">
              {slide.itDetails.summary}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between border-t border-subtle pt-2.5 text-[11px] text-fg-muted">
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
