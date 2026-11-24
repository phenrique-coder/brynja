import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import React from 'react';
import { GatewayProvider } from '@/core/providers/gateway-provider';
import { ThemeProvider } from '@/core/providers/theme-provider';
import { Navbar } from '@/features/scans/components/Navbar';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VereditoSec — Análise SCA, CVEs e Safe Probes',
  description:
    'Plataforma web de análise proativa de dependências, inteligência de CVEs e verificação ativa não destrutiva.',
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('veredito-theme');var dark=t?t==='dark':!window.matchMedia('(prefers-color-scheme: light)').matches;document.documentElement.classList.toggle('dark',dark);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} dark`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-canvas font-sans text-fg antialiased">
        <ThemeProvider>
          <GatewayProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {children}
              </main>
            </div>
          </GatewayProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
