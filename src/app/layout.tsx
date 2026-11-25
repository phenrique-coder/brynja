import type { Metadata } from 'next';
import React from 'react';
import { GatewayProvider } from '@/core/providers/gateway-provider';
import { ThemeProvider } from '@/core/providers/theme-provider';
import { Footer } from '@/features/scans/components/Footer';
import { Navbar } from '@/features/scans/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brynja — Análise SCA, CVEs e Safe Probes',
  description:
    'Plataforma web de análise proativa de dependências, inteligência de CVEs e verificação ativa não destrutiva.',
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('brynja-theme');var dark=t?t==='dark':!window.matchMedia('(prefers-color-scheme: light)').matches;document.documentElement.classList.toggle('dark',dark);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-canvas font-sans text-fg antialiased">
        <ThemeProvider>
          <GatewayProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {children}
              </main>
              <Footer />
            </div>
          </GatewayProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
