'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import { useI18n } from '@/core/providers/i18n-provider';
import { AuthRequiredCard } from '@/features/scans/components/AuthRequiredCard';
import { BrynjaLogo } from '@/features/scans/components/BrynjaLogo';
import { SurfaceCard } from '@/features/scans/components/ui/PagePrimitives';

export function PresentationAuthRequiredView() {
  const { messages } = useI18n();
  return (
    <AuthRequiredCard
      returnTo="/presentation"
      title={messages.presentation.authTitle}
    />
  );
}

export function PresentationAccessDeniedCard({ login }: { login: string }) {
  const { messages } = useI18n();

  return (
    <div className="mx-auto max-w-2xl py-8">
      <SurfaceCard className="p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
          <Lock className="h-6 w-6" />
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>{messages.presentation.restrictedBadge}</span>
        </div>

        <h1 className="mt-4 text-xl font-bold tracking-tight text-fg sm:text-2xl">
          {messages.presentation.restrictedTitle}
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-fg-secondary">
          {messages.presentation.restrictedDescription}
        </p>

        <div className="mx-auto mt-5 flex max-w-md flex-col gap-2 rounded-2xl border border-subtle bg-surface-subtle p-4 text-left text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-fg-secondary">
              {messages.presentation.signedInAs}
            </span>
            <span className="font-mono font-semibold text-fg">@{login}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-fg-muted">
            {messages.presentation.reloginHint}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{messages.presentation.backToDashboard}</span>
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 border-t border-subtle pt-4 text-[11px] text-fg-muted">
          <BrynjaLogo className="h-4 w-4" />
          <span>Brynja · Fail-Closed Access Guard</span>
        </div>
      </SurfaceCard>
    </div>
  );
}
