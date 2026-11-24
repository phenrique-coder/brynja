'use client';

import React from 'react';
import { useTheme } from '@/core/providers/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
      title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      onClick={toggleTheme}
      className={`group relative inline-flex h-8 w-[62px] shrink-0 cursor-pointer items-center overflow-hidden rounded-full border p-[3px] transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
        isDark
          ? 'border-indigo-400/40 bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#312e81] shadow-inner shadow-indigo-950/80'
          : 'border-sky-300/90 bg-gradient-to-r from-sky-300 via-sky-200 to-amber-100 shadow-inner shadow-sky-400/30'
      }`}
    >
      {/* Night sky twinkling stars (visible in dark mode) */}
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
          <path
            d="M12 7L12.8 9.2L15 10L12.8 10.8L12 13L11.2 10.8L9 10L11.2 9.2L12 7Z"
            fill="#FDE68A"
            className="animate-twinkle origin-center"
          />
          <circle
            cx="21"
            cy="11"
            r="1.15"
            fill="#E0E7FF"
            className="animate-twinkle"
            style={{ animationDelay: '0.5s' }}
          />
          <circle
            cx="15"
            cy="22"
            r="1.35"
            fill="#FCD34D"
            className="animate-twinkle"
            style={{ animationDelay: '0.9s' }}
          />
          <circle
            cx="25"
            cy="20"
            r="0.95"
            fill="#C7D2FE"
            className="animate-twinkle"
            style={{ animationDelay: '1.3s' }}
          />
        </svg>
      </span>

      {/* Day sky fluffy clouds (visible in light mode) */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
          isDark ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <svg
          viewBox="0 0 62 32"
          className="h-full w-full animate-float-cloud"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M36 22.5H49.5C51.4 22.5 53 21.1 53 19.3C53 17.6 51.7 16.3 50 16.1C49.5 13.7 47.4 12 44.8 12C42.5 12 40.5 13.4 39.8 15.5C39.4 15.4 39 15.3 38.6 15.3C36.6 15.3 35 16.9 35 18.9C35 20.9 35.4 22.5 36 22.5Z"
            fill="white"
            fillOpacity="0.92"
          />
          <circle cx="53.5" cy="11.5" r="2.2" fill="white" fillOpacity="0.65" />
        </svg>
      </span>

      {/* Sliding cute Sun / Moon knob */}
      <span
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-90 ${
          isDark
            ? 'translate-x-[30px] rotate-0 bg-gradient-to-br from-slate-50 via-indigo-100 to-indigo-200 shadow-indigo-300/40'
            : 'translate-x-0 rotate-12 bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-400 shadow-amber-400/60'
        }`}
      >
        {/* Cute smiling Sun face */}
        <svg
          viewBox="0 0 24 24"
          className={`absolute h-5 w-5 transition-all duration-300 ${
            isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
          }`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cute eyes */}
          <circle cx="8.5" cy="10.5" r="1.35" fill="#7C2D12" />
          <circle cx="15.5" cy="10.5" r="1.35" fill="#7C2D12" />
          {/* Tiny eye sparkles */}
          <circle cx="8.9" cy="10.1" r="0.45" fill="#FFFBEB" />
          <circle cx="15.9" cy="10.1" r="0.45" fill="#FFFBEB" />
          {/* Rosy cheeks */}
          <ellipse cx="6.2" cy="13.2" rx="1.5" ry="0.9" fill="#FB7185" fillOpacity="0.65" />
          <ellipse cx="17.8" cy="13.2" rx="1.5" ry="0.9" fill="#FB7185" fillOpacity="0.65" />
          {/* Happy smile */}
          <path
            d="M9.6 13.6C10.3 14.8 11.1 15.3 12 15.3C12.9 15.3 13.7 14.8 14.4 13.6"
            stroke="#7C2D12"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>

        {/* Cute cozy Moon face */}
        <svg
          viewBox="0 0 24 24"
          className={`absolute h-5 w-5 transition-all duration-300 ${
            isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'
          }`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Soft moon craters */}
          <circle cx="6.2" cy="7.2" r="1.4" fill="#C7D2FE" fillOpacity="0.8" />
          <circle cx="17.2" cy="16.5" r="1.1" fill="#C7D2FE" fillOpacity="0.7" />
          {/* Peaceful closed-arc cute eyes */}
          <path
            d="M7.2 11.4C7.7 10.3 9.1 10.3 9.6 11.4"
            stroke="#312E81"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          <path
            d="M14.4 11.4C14.9 10.3 16.3 10.3 16.8 11.4"
            stroke="#312E81"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          {/* Rosy cheeks */}
          <ellipse cx="6.8" cy="13.7" rx="1.4" ry="0.85" fill="#F472B6" fillOpacity="0.55" />
          <ellipse cx="17.2" cy="13.7" rx="1.4" ry="0.85" fill="#F472B6" fillOpacity="0.55" />
          {/* Cozy little smile */}
          <path
            d="M10.4 14.1C10.9 14.9 11.4 15.2 12 15.2C12.6 15.2 13.1 14.9 13.6 14.1"
            stroke="#312E81"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </button>
  );
}
