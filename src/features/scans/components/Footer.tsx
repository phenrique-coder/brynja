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
import packageJson from '../../../../package.json';
import { BrynjaLogo } from './BrynjaLogo';

const REPO_URL = 'https://github.com/phenrique-coder/brynja';

const EXTERNAL_FOOTER_LINKS = [
  {
    label: 'Repositório',
    href: REPO_URL,
    icon: Github,
  },
  {
    label: 'Segurança',
    href: `${REPO_URL}/blob/main/docs/pt-BR/SECURITY.md`,
    icon: ShieldCheck,
  },
  {
    label: 'Contribuir',
    href: `${REPO_URL}/blob/main/docs/pt-BR/CONTRIBUTING.md`,
    icon: BookOpen,
  },
  {
    label: 'Licença MIT',
    href: `${REPO_URL}/blob/main/LICENSE`,
    icon: Scale,
  },
] as const;

export function Footer() {
  const version = packageJson.version;

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
                  title="Ver changelog e novidades de cada versão"
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
              SCA / SBOM · OSV · NVD · EPSS · CISA KEV · 8 Safe Probes
            </p>
          </div>

          <nav
            aria-label="Links do projeto"
            className="flex flex-wrap items-center gap-2"
          >
            <Link
              href="/changelog"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-50/70 px-2.5 py-1.5 text-xs font-semibold text-cyan-800 transition hover:border-cyan-500/50 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
            >
              <History className="h-3.5 w-3.5 shrink-0" />
              <span>Changelog</span>
            </Link>

            {EXTERNAL_FOOTER_LINKS.map((item) => {
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
              Local-First (IndexedDB) · Zero banco na nuvem
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
              Uso estritamente defensivo e autorizado (GET/HEAD)
            </span>
          </div>

          <div className="font-mono text-[11px] text-fg-muted">
            © {new Date().getFullYear()} Brynja Contributors · Open-Source (MIT)
          </div>
        </div>
      </div>
    </footer>
  );
}
