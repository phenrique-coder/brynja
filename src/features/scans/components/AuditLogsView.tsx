'use client';

import React from 'react';
import {
  CheckCircle2,
  RefreshCw,
  ScrollText,
  ShieldAlert,
} from 'lucide-react';
import { useI18n } from '@/core/providers/i18n-provider';
import { useAuditLogs } from '../hooks/use-scans';
import { AuthRequiredCard } from './AuthRequiredCard';
import {
  KpiStatCard,
  PageHeader,
  PageLoadingState,
  SurfaceCard,
} from './ui/PagePrimitives';

export function AuditLogsView() {
  const { logs, loading, authRequired, error, refresh } = useAuditLogs();
  const { messages, intlLocale } = useI18n();

  if (authRequired) {
    return (
      <AuthRequiredCard
        returnTo="/audit"
        title={messages.authCard.auditTitle}
      />
    );
  }

  if (loading && logs.length === 0) {
    return <PageLoadingState label={messages.audit.loading} />;
  }

  const allowedOrExecuted = logs.filter(
    (l) =>
      l.outcome === 'EXECUTED' ||
      l.outcome === 'ALLOWED' ||
      l.outcome === 'VERIFICATION_SUCCESS',
  ).length;
  const blockedCount = logs.filter((l) => l.outcome.startsWith('BLOCKED')).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.audit.title}
        description={messages.audit.description}
        actions={
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2 text-xs font-semibold text-fg-secondary transition hover:border-strong hover:text-fg"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {messages.common.refresh}
          </button>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiStatCard
          label={messages.audit.kpiTotal}
          value={logs.length}
          icon={
            <ScrollText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          }
        />
        <KpiStatCard
          label={messages.audit.kpiAllowed}
          value={allowedOrExecuted}
          accentClass="text-emerald-600 dark:text-emerald-300"
          icon={
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          }
        />
        <KpiStatCard
          label={messages.audit.kpiBlocked}
          value={blockedCount}
          accentClass="text-rose-600 dark:text-rose-300"
          icon={
            <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          }
        />
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <SurfaceCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-subtle bg-surface-subtle/80 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
              <tr>
                <th className="px-5 py-3">{messages.audit.colDate}</th>
                <th className="px-4 py-3">{messages.audit.colOutcome}</th>
                <th className="px-4 py-3">{messages.audit.colTarget}</th>
                <th className="px-4 py-3">{messages.audit.colProbeMethod}</th>
                <th className="px-4 py-3">{messages.audit.colStatus}</th>
                <th className="px-5 py-3">{messages.audit.colDetails}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-fg-secondary"
                  >
                    {messages.audit.loadingRows}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-fg-secondary"
                  >
                    {messages.audit.emptyRows}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-surface-hover/50"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-fg-muted">
                      {new Date(log.createdAt).toLocaleString(intlLocale)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-cyan-700 dark:text-cyan-300">
                      {log.outcome}
                    </td>
                    <td className="px-4 py-3 font-mono text-fg">
                      {log.targetUrl}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-fg-secondary">
                      {log.httpMethod} {log.requestPath}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-fg-secondary">
                      {log.statusCode ?? '-'} ({log.durationMs}ms)
                    </td>
                    <td className="px-5 py-3 text-fg-secondary">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
