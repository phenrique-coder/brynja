'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Clock,
  ExternalLink,
  Github,
  KeyRound,
  LogOut,
  Presentation,
  ShieldCheck,
} from 'lucide-react';
import { GitHubIntegrationStatus } from '@/core/models/scan.models';
import { useI18n } from '@/core/providers/i18n-provider';

export interface UserAccountMenuProps {
  status: GitHubIntegrationStatus;
  onLogout: () => Promise<void>;
}

export function UserAccountMenu({ status, onLogout }: UserAccountMenuProps) {
  const { messages, intlLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  async function handleSignOut() {
    setBusy(true);
    try {
      await onLogout();
    } finally {
      setBusy(false);
    }
  }

  const profileUrl =
    status.profileUrl ??
    (status.login ? `https://github.com/${status.login}` : 'https://github.com');
  const expiresTime = status.sessionExpiresAt
    ? new Date(status.sessionExpiresAt).toLocaleTimeString(intlLocale, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-subtle bg-surface-subtle px-2.5 text-xs text-fg transition hover:border-strong hover:bg-surface-hover"
      >
        {status.avatarUrl ? (
          <img
            src={status.avatarUrl}
            alt={status.login ?? 'GitHub avatar'}
            className="h-5 w-5 rounded-full border border-emerald-500/40 object-cover"
          />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <Github className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="hidden max-w-[128px] truncate font-mono font-medium sm:inline">
          @{status.login}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-fg-muted transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-subtle bg-surface shadow-xl shadow-slate-900/10 dark:shadow-black/60"
        >
          <div className="border-b border-subtle p-4">
            <div className="flex items-center gap-3">
              {status.avatarUrl ? (
                <img
                  src={status.avatarUrl}
                  alt={status.login ?? 'GitHub avatar'}
                  className="h-10 w-10 rounded-full border border-subtle object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-subtle bg-surface-subtle text-fg">
                  <Github className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-fg">
                  {status.name || `@${status.login}`}
                </div>
                <div className="truncate font-mono text-xs text-fg-secondary">
                  @{status.login}
                </div>
              </div>
            </div>

            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle/80 px-3 py-1.5 text-xs font-medium text-cyan-700 transition hover:border-cyan-500/40 hover:bg-surface-hover dark:text-cyan-300"
            >
              <span>{messages.accountMenu.viewProfile}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-2.5 border-b border-subtle bg-surface-subtle/70 px-4 py-3 text-xs">
            <div className="flex items-center justify-between text-fg-secondary">
              <span className="inline-flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-fg-muted" />
                {messages.accountMenu.githubId}
              </span>
              <span className="font-mono font-medium text-fg">
                #{status.githubUserId ?? '-'}
              </span>
            </div>

            <div className="flex items-center justify-between text-fg-secondary">
              <span>{messages.accountMenu.scopes}</span>
              <span className="font-mono text-[11px] font-medium text-fg">
                {status.scopes || 'app'}
              </span>
            </div>

            <div className="flex items-center justify-between text-fg-secondary">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-fg-muted" />
                {messages.accountMenu.ephemeralSession}
              </span>
              <span className="font-medium text-fg">
                {expiresTime
                  ? t(messages.accountMenu.expiresAt, { time: expiresTime })
                  : messages.accountMenu.activeInTab}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-50 px-2.5 py-1.5 text-[11px] text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-300" />
              <span>{messages.accountMenu.securityBadge}</span>
            </div>
          </div>

          <div className="space-y-1.5 p-2.5">
            {status.canViewPresentation ? (
              <Link
                href="/presentation"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-50/70 px-3 py-2 text-center text-xs font-semibold text-cyan-800 transition hover:border-cyan-500/45 hover:bg-cyan-50 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
              >
                <Presentation className="h-4 w-4 shrink-0" />
                <span>{messages.accountMenu.presentation}</span>
              </Link>
            ) : null}

            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => void handleSignOut()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-50/60 px-3 py-2 text-center text-xs font-semibold text-rose-600 transition hover:border-rose-500/40 hover:bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>
                {busy
                  ? messages.accountMenu.signingOut
                  : messages.accountMenu.signOut}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
