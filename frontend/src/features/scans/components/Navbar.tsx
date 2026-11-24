'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  FileSearch,
  Github,
  History,
  LockKeyhole,
  Menu,
  PlusCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useGitHubSession } from '../hooks/use-scans';
import { ThemeToggle } from './ThemeToggle';
import { UserAccountMenu } from './UserAccountMenu';

const NAV_ITEMS = [
  { href: '/', label: 'Painel', icon: Activity },
  { href: '/history', label: 'Histórico', icon: History },
  { href: '/scans/new', label: 'Nova Varredura', icon: PlusCircle },
  { href: '/authorizations', label: 'Alvos & Guardrails', icon: LockKeyhole },
  { href: '/audit', label: 'Auditoria', icon: FileSearch },
];

function isNavItemActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  if (href === '/history') {
    return (
      pathname.startsWith('/history') ||
      (pathname.startsWith('/scans/') && !pathname.startsWith('/scans/new'))
    );
  }
  return pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { status, connectUrl, disconnect } = useGitHubSession(pathname || '/');

  async function handleLogout() {
    await disconnect();
    window.location.assign('/');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-subtle bg-header/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex shrink-0 items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-fg">
              VereditoSec
            </span>
            <span className="hidden text-[11px] text-fg-muted sm:block">
              SCA · CVEs · Safe Probes
            </span>
          </div>
        </Link>

        {/* Center: Desktop Segmented Navigation */}
        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-1 rounded-xl border border-subtle bg-surface-subtle p-1 md:flex"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item.href, pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition lg:px-3 ${
                  active
                    ? 'bg-surface text-cyan-700 shadow-sm ring-1 ring-black/5 dark:text-cyan-300 dark:ring-white/10'
                    : 'text-fg-secondary hover:bg-surface/60 hover:text-fg'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Theme toggle + User menu + Mobile burger */}
        <div className="flex shrink-0 items-center gap-2.5">
          <ThemeToggle />

          <span
            aria-hidden="true"
            className="hidden h-5 w-px bg-subtle sm:block"
          />

          {status?.connected ? (
            <UserAccountMenu status={status} onLogout={handleLogout} />
          ) : (
            <a
              href={connectUrl}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Entrar com GitHub</span>
              <span className="sm:hidden">Entrar</span>
            </a>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-subtle bg-surface-subtle text-fg-secondary transition hover:text-fg md:hidden"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen ? (
        <nav
          aria-label="Navegação mobile"
          className="border-t border-subtle bg-surface px-4 py-3 md:hidden"
        >
          <div className="mx-auto grid max-w-6xl gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(item.href, pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                      : 'text-fg-secondary hover:bg-surface-subtle hover:text-fg'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
