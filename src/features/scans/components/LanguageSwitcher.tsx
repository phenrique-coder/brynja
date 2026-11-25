'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  getLocaleMeta,
  Locale,
  SUPPORTED_LOCALES,
} from '@/core/i18n';
import { useI18n } from '@/core/providers/i18n-provider';

function FlagIcon({
  locale,
  className = 'h-4 w-5 shrink-0 rounded-[3px] shadow-sm ring-1 ring-black/15 dark:ring-white/15',
}: {
  locale: Locale;
  className?: string;
}) {
  if (locale === 'pt-BR') {
    return (
      <svg
        viewBox="0 0 28 20"
        aria-hidden="true"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="28" height="20" fill="#009B3A" />
        <polygon points="14,2.4 25.2,10 14,17.6 2.8,10" fill="#FFDF00" />
        <circle cx="14" cy="10" r="4.3" fill="#002776" />
        <path
          d="M10.1 9.1C12.7 8.4 15.6 9.1 18 10.8"
          stroke="#FFFFFF"
          strokeWidth="1.05"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }

  if (locale === 'en') {
    return (
      <svg
        viewBox="0 0 28 20"
        aria-hidden="true"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="28" height="20" fill="#FFFFFF" />
        <rect y="0" width="28" height="2.2" fill="#B22234" />
        <rect y="4.4" width="28" height="2.2" fill="#B22234" />
        <rect y="8.8" width="28" height="2.2" fill="#B22234" />
        <rect y="13.2" width="28" height="2.2" fill="#B22234" />
        <rect y="17.6" width="28" height="2.4" fill="#B22234" />
        <rect width="12.5" height="11" fill="#3C3B6E" />
        <g fill="#FFFFFF">
          <circle cx="2.5" cy="2.5" r="0.7" />
          <circle cx="6.2" cy="2.5" r="0.7" />
          <circle cx="9.9" cy="2.5" r="0.7" />
          <circle cx="4.3" cy="5.4" r="0.7" />
          <circle cx="8.1" cy="5.4" r="0.7" />
          <circle cx="2.5" cy="8.3" r="0.7" />
          <circle cx="6.2" cy="8.3" r="0.7" />
          <circle cx="9.9" cy="8.3" r="0.7" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 28 20"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="28" height="20" fill="#AA151B" />
      <rect y="5" width="28" height="10" fill="#F1BF00" />
      <rect x="6.5" y="7.5" width="3.6" height="5" rx="0.8" fill="#AA151B" />
      <rect x="7.4" y="8.4" width="1.8" height="3.2" rx="0.4" fill="#F1BF00" />
    </svg>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale, messages } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentMeta = getLocaleMeta(locale);

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={messages.common.languageSelectorLabel}
        title={`${messages.common.languageSelectorLabel}: ${currentMeta.nativeName}`}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-subtle bg-surface-subtle px-2.5 text-[11px] font-semibold text-fg transition hover:border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        <FlagIcon locale={locale} />
        <span className="hidden font-mono tracking-tight sm:inline">
          {currentMeta.shortLabel}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-fg-muted transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={messages.common.languageSelectorLabel}
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-subtle bg-surface p-1 shadow-xl shadow-slate-900/10 dark:shadow-black/60"
        >
          {SUPPORTED_LOCALES.map((item) => {
            const active = item.code === locale;
            return (
              <button
                key={item.code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setLocale(item.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition ${
                  active
                    ? 'bg-cyan-500/10 font-semibold text-cyan-700 dark:text-cyan-300'
                    : 'text-fg hover:bg-surface-hover'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <FlagIcon locale={item.code} />
                  <span>{item.nativeName}</span>
                </span>
                {active ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-300" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
