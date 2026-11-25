'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Database,
  ExternalLink,
  Github,
  History,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useI18n } from '@/core/providers/i18n-provider';
import packageJson from '../../../../package.json';
import { BrynjaLogo } from './BrynjaLogo';

const REPO_URL = 'https://github.com/phenrique-coder/brynja';

export function Footer() {
  const { locale, messages, t } = useI18n();
  const version = packageJson.version;
  const isPt = locale === 'pt-BR';

  const externalLinks = [
    {
      label: messages.footer.repository,
      href: REPO_URL,
      icon: Github,
    },
    {
      label: messages.footer.security,
      href: isPt
        ? `${REPO_URL}/blob/main/docs/pt-BR/SECURITY.md`
        : `${REPO_URL}/blob/main/SECURITY.md`,
      icon: ShieldCheck,
    },
    {
      label: messages.footer.contributing,
      href: isPt
        ? `${REPO_URL}/blob/main/docs/pt-BR/CONTRIBUTING.md`
        : `${REPO_URL}/blob/main/CONTRIBUTING.md`,
      icon: BookOpen,
    },
    {
      label: messages.footer.license,
      href: `${REPO_URL}/blob/main/LICENSE`,
      icon: Scale,
    },
  ];

  return (
    <footer className="mt-10 border-t border-subtle bg-header/80 transition-colors">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Row: Brand + Version (links to /changelog) + Links */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2.5">
              <BrynjaLogo className="h-7 w-7 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-fg">
                  Brynja
                </span>
                <Link
                  href="/changelog"
                  title={messages.footer.versionTooltip}
                  className="inline-flex items-center rounded-md border border-cyan-500/30 bg-cyan-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-800 transition hover:border-cyan-500/60 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                >
                  v{version}
                </Link>
              </div>
            </div>

            <span
              aria-hidden="true"
              className="hidden h-4 w-px bg-subtle sm:inline-block"
            />

            <p className="text-xs text-fg-secondary">
              {messages.footer.stackSummary}
            </p>
          </div>

          <nav
            aria-label={messages.footer.linksAria}
            className="flex flex-wrap items-center gap-2"
          >
            <Link
              href="/changelog"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-50/70 px-2.5 py-1.5 text-xs font-semibold text-cyan-800 transition hover:border-cyan-500/50 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
            >
              <History className="h-3.5 w-3.5 shrink-0" />
              <span>{messages.footer.changelog}</span>
            </Link>

            {externalLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-surface px-2.5 py-1.5 text-xs font-medium text-fg-secondary transition hover:border-cyan-500/40 hover:text-cyan-700 dark:hover:text-cyan-300"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  <span>{item.label}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                </a>
              );
            })}
          </nav>
        </div>

        {/* Bottom Row: Privacy & Defensive Posture + Copyright */}
        <div className="mt-4 flex flex-col gap-2 border-t border-subtle/80 pt-4 text-[11px] text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Database className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              {messages.footer.localFirst}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
              {messages.footer.defensiveUse}
            </span>
          </div>

          <div className="font-mono text-[11px] text-fg-muted">
            {t(messages.footer.copyright, { year: new Date().getFullYear() })}
          </div>
        </div>
      </div>
    </footer>
  );
}
