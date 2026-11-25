import React, { useId } from 'react';

interface BrynjaLogoProps {
  className?: string;
}

/**
 * Brynja Brand Mark: Nordic shield woven with interlocking chainmail links
 * representing layered defense-in-depth (SCA + CVE Intel + Safe Probes).
 */
export function BrynjaLogo({ className = 'h-9 w-9' }: BrynjaLogoProps) {
  const uid = useId().replace(/:/g, '');
  const bgId = `brynja-shield-bg-${uid}`;
  const rimId = `brynja-shield-rim-${uid}`;
  const mailId = `brynja-mail-link-${uid}`;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id={bgId}
          x1="10"
          y1="6"
          x2="54"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#164e63" />
          <stop offset="52%" stopColor="#0f293a" />
          <stop offset="100%" stopColor="#0b1322" />
        </linearGradient>
        <linearGradient
          id={rimId}
          x1="10"
          y1="6"
          x2="54"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient
          id={mailId}
          x1="18"
          y1="16"
          x2="46"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      {/* Outer Nordic shield */}
      <path
        d="M32 4.5L53.5 12.8V30.2C53.5 44.6 44.3 55 32 59.5C19.7 55 10.5 44.6 10.5 30.2V12.8L32 4.5Z"
        fill={`url(#${bgId})`}
        stroke={`url(#${rimId})`}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />

      {/* Inner beveled armor border */}
      <path
        d="M32 9.2L49 15.8V30C49 41.6 41.6 50.1 32 54C22.4 50.1 15 41.6 15 30V15.8L32 9.2Z"
        stroke="#22d3ee"
        strokeOpacity="0.24"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Interlocking chainmail diamond weave (Brynja) */}
      <g
        stroke={`url(#${mailId})`}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Top link */}
        <path d="M32 14.5L39 21.5L32 28.5L25 21.5L32 14.5Z" opacity="0.92" />
        {/* Left link */}
        <path d="M23.5 23L30.5 30L23.5 37L16.5 30L23.5 23Z" opacity="0.72" />
        {/* Right link */}
        <path d="M40.5 23L47.5 30L40.5 37L33.5 30L40.5 23Z" opacity="0.72" />
        {/* Bottom link */}
        <path d="M32 31.5L39 38.5L32 45.5L25 38.5L32 31.5Z" opacity="0.92" />
      </g>

      {/* Center forged diamond clasp */}
      <path
        d="M32 25.2L36.8 30L32 34.8L27.2 30L32 25.2Z"
        fill="#22d3ee"
        fillOpacity="0.28"
        stroke="#cffafe"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="30" r="1.8" fill="#ecfeff" />
    </svg>
  );
}
