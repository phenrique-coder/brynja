'use client';

import React from 'react';
import { useI18n } from '@/core/providers/i18n-provider';
import { useTheme } from '@/core/providers/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { messages } = useI18n();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={
        isDark ? messages.theme.switchToLight : messages.theme.switchToDark
      }
      title={isDark ? messages.theme.tooltipLight : messages.theme.tooltipDark}
      onClick={toggleTheme}
      className={`group relative inline-flex h-8 w-[62px] shrink-0 cursor-pointer items-center overflow-hidden rounded-full border p-[3px] transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
        isDark
          ? 'border-amber-300/35 bg-gradient-to-r from-[#090d1a] via-[#151c32] to-[#1e293b] shadow-inner shadow-black/80'
          : 'border-amber-700/40 bg-gradient-to-r from-[#cfe0ee] via-[#efe1c2] to-[#f2cb85] shadow-inner shadow-amber-900/20'
      }`}
    >
      {/* Medieval night watch: castle battlements, torchlight window & twinkling stars (dark mode) */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <svg
          viewBox="0 0 62 32"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Twinkling Nordic polar star & celestial sparks */}
          <path
            d="M21 5.5L21.75 7.75L24 8.5L21.75 9.25L21 11.5L20.25 9.25L18 8.5L20.25 7.75L21 5.5Z"
            fill="#FDE68A"
            className="animate-twinkle origin-center"
          />
          <circle
            cx="13"
            cy="8"
            r="1"
            fill="#E2E8F0"
            className="animate-twinkle"
            style={{ animationDelay: '0.5s' }}
          />
          <circle
            cx="27.5"
            cy="12.5"
            r="1.1"
            fill="#93C5FD"
            className="animate-twinkle"
            style={{ animationDelay: '0.9s' }}
          />
          <circle
            cx="7.5"
            cy="12"
            r="0.85"
            fill="#FCD34D"
            className="animate-twinkle"
            style={{ animationDelay: '1.3s' }}
          />

          {/* Castle tower & crenellated battlements silhouette */}
          <path
            d="M4 32V22H6.5V24H8.5V16.5H10.3V18.3H12V16.5H13.8V18.3H15.5V16.5H17.3V23H19.5V21H21.7V23H24V21H26.2V32H4Z"
            fill="#060913"
            fillOpacity="0.88"
          />
          {/* Subtle moonlight stone edge */}
          <path
            d="M8.5 16.5H10.3V18.3H12V16.5H13.8V18.3H15.5V16.5H17.3"
            stroke="#64748B"
            strokeOpacity="0.5"
            strokeWidth="0.6"
          />
          {/* Flickering torchlit arch window */}
          <path
            d="M11.9 24.5V21.9C11.9 21.3 12.35 20.85 12.9 20.85C13.45 20.85 13.9 21.3 13.9 21.9V24.5H11.9Z"
            fill="#F59E0B"
            className="animate-twinkle"
            style={{ animationDelay: '0.35s' }}
          />
        </svg>
      </span>

      {/* Medieval daylight kingdom: castle keep, crimson pennant & drifting clouds (light mode) */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
          isDark ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <svg
          viewBox="0 0 62 32"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Floating daylight cloud (same gentle drift animation) */}
          <g className="animate-float-cloud">
            <path
              d="M32.5 13.2H42.2C43.5 13.2 44.5 12.3 44.5 11.1C44.5 10 43.7 9.1 42.5 9C42.1 7.4 40.7 6.3 39 6.3C37.4 6.3 36.1 7.3 35.6 8.7C35.3 8.6 35 8.6 34.7 8.6C33.3 8.6 32.2 9.7 32.2 11C32.2 12.2 32.3 13.2 32.5 13.2Z"
              fill="#FFFBEB"
              fillOpacity="0.92"
            />
            <circle cx="54.2" cy="8.2" r="1.6" fill="#FFFBEB" fillOpacity="0.65" />
          </g>

          {/* Heraldic banner pole & crimson pennant */}
          <path d="M47.5 15V8.2" stroke="#78350F" strokeWidth="0.9" strokeLinecap="round" />
          <path
            d="M47.8 8.4L53.8 10.1L47.8 11.8Z"
            fill="#B91C1C"
            fillOpacity="0.88"
            className="animate-float-cloud"
          />

          {/* Daylight castle keep silhouette */}
          <path
            d="M35.5 32V23.5H38V21.5H40.3V23.5H42.8V15H44.6V17H46.6V15H48.4V17H50.4V15H52.2V22.5H54.5V20.5H56.8V32H35.5Z"
            fill="#78350F"
            fillOpacity="0.34"
          />
          {/* Castle arch gate */}
          <path
            d="M46.2 32V26.8C46.2 25.9 46.8 25.2 47.5 25.2C48.2 25.2 48.8 25.9 48.8 26.8V32H46.2Z"
            fill="#78350F"
            fillOpacity="0.45"
          />
        </svg>
      </span>

      {/* Sliding forged medieval medallion (Gold Heraldic Sun / Silver Crescent Moon) */}
      <span
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-90 ${
          isDark
            ? 'translate-x-[30px] rotate-0 bg-gradient-to-br from-[#f8fafc] via-[#cbd5e1] to-[#64748b] ring-1 ring-inset ring-white/80 shadow-cyan-400/25'
            : 'translate-x-0 rotate-12 bg-gradient-to-br from-[#fef08a] via-[#f59e0b] to-[#b45309] ring-1 ring-inset ring-amber-100/80 shadow-amber-900/40'
        }`}
      >
        {/* Forged Gold Heraldic Sun (Sun in Splendour — light mode) */}
        <svg
          viewBox="0 0 24 24"
          className={`absolute h-5 w-5 transition-all duration-300 ${
            isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
          }`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Minted coin rim */}
          <circle
            cx="12"
            cy="12"
            r="9.8"
            stroke="#78350F"
            strokeOpacity="0.42"
            strokeWidth="0.85"
            strokeDasharray="1.8 1.3"
          />
          {/* Secondary diagonal heraldic rays */}
          <path
            d="M6.9 6.9L12 9.6L17.1 6.9L14.4 12L17.1 17.1L12 14.4L6.9 17.1L9.6 12L6.9 6.9Z"
            fill="#78350F"
            fillOpacity="0.85"
          />
          {/* Primary cardinal heraldic rays */}
          <path
            d="M12 3.2L13.6 10.4L20.8 12L13.6 13.6L12 20.8L10.4 13.6L3.2 12L10.4 10.4L12 3.2Z"
            fill="#451A03"
          />
          {/* Embossed solar boss */}
          <circle
            cx="12"
            cy="12"
            r="3.2"
            fill="#FEF3C7"
            stroke="#78350F"
            strokeWidth="1.15"
          />
          <circle cx="12" cy="12" r="1.1" fill="#92400E" />
        </svg>

        {/* Forged Silver Crescent Moon & Polar Star (dark mode) */}
        <svg
          viewBox="0 0 24 24"
          className={`absolute h-5 w-5 transition-all duration-300 ${
            isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'
          }`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Minted steel-silver rim */}
          <circle
            cx="12"
            cy="12"
            r="9.8"
            stroke="#334155"
            strokeOpacity="0.5"
            strokeWidth="0.85"
            strokeDasharray="1.8 1.3"
          />
          {/* Heraldic crescent moon */}
          <path
            d="M14.9 6.9A6.2 6.2 0 1 0 14.9 17.1A5.1 5.1 0 1 1 14.9 6.9Z"
            fill="#1E293B"
          />
          {/* 4-point Nordic golden star nestled in crescent */}
          <path
            d="M16.1 8.8L16.9 11.2L19.3 12L16.9 12.8L16.1 15.2L15.3 12.8L12.9 12L15.3 11.2L16.1 8.8Z"
            fill="#D97706"
          />
          <circle cx="16.1" cy="12" r="0.7" fill="#FEF3C7" />
        </svg>
      </span>
    </button>
  );
}
