'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  History,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { ScanStatus } from '@/core/models/scan.models';
import { useI18n } from '@/core/providers/i18n-provider';
import { useScanList } from '../hooks/use-scans';
import { filterScanHistory } from '../presenters/scan.presenter';
import { AuthRequiredCard } from './AuthRequiredCard';
import { ScanHistoryTable } from './ScanHistoryTable';
import {
  KpiStatCard,
  PageHeader,
  PageLoadingState,
  SurfaceCard,
} from './ui/PagePrimitives';

export function ScanHistoryView() {
  const { scans, loading, authRequired, error, refresh, removeScan } =
    useScanList(100);
  const { messages, t } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScanStatus | 'ALL'>('ALL');
  const [scopeFilter, setScopeFilter] = useState<
    'ALL' | 'WITH_PROBES' | 'SCA_ONLY'
  >('ALL');

  const filteredScans = useMemo(
    () =>
      filterScanHistory(scans, {
        search,
        status: statusFilter,
        scope: scopeFilter,
      }),
    [scans, search, statusFilter, scopeFilter],
  );

  const completedCount = useMemo(
    () => scans.filter((s) => s.status === 'COMPLETED').length,
    [scans],
  );
  const withProbesCount = useMemo(
    () => scans.filter((s) => Boolean(s.targetUrl)).length,
    [scans],
  );
  const withCriticalOrHighCount = useMemo(
    () => scans.filter((s) => s.criticalCount > 0 || s.highCount > 0).length,
    [scans],
  );

  if (authRequired) {
    return (
      <AuthRequiredCard
        returnTo="/history"
        title={messages.authCard.historyTitle}
      />
    );
  }

  if (loading && scans.length === 0) {
    return <PageLoadingState label={messages.history.loading} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200">
            <History className="h-3.5 w-3.5" />
            {messages.history.badge}
          </span>
        }
        title={messages.history.title}
        description={messages.history.description}
        actions={
          <>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 text-xs font-semibold text-fg-secondary transition hover:border-strong hover:text-fg sm:text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              {messages.common.refresh}
            </button>
            <Link
              href="/scans/new"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 sm:text-sm"
            >
              {messages.dashboard.newScan}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiStatCard
          label={messages.history.kpiTotal}
          value={scans.length}
          icon={<History className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
        />
        <KpiStatCard
          label={messages.history.kpiCompleted}
          value={completedCount}
          accentClass="text-emerald-700 dark:text-emerald-300"
          icon={
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          }
        />
        <KpiStatCard
          label={messages.history.kpiWithProbes}
          value={withProbesCount}
          accentClass="text-cyan-700 dark:text-cyan-300"
          icon={
            <ShieldCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          }
        />
        <KpiStatCard
          label={messages.history.kpiCritHigh}
          value={withCriticalOrHighCount}
          accentClass="text-orange-600 dark:text-orange-300"
          icon={
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          }
        />
      </section>

      <SurfaceCard className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={messages.history.searchPlaceholder}
              className="w-full rounded-xl border border-subtle bg-surface-subtle py-2 pl-9 pr-3 text-xs text-fg placeholder-fg-muted focus:border-cyan-500 focus:outline-none sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label={messages.history.filterStatusAria}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ScanStatus | 'ALL')
              }
              className="rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs font-medium text-fg focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">{messages.history.allStatuses}</option>
              <option value="COMPLETED">
                {messages.enums.scanStatus.COMPLETED}
              </option>
              <option value="RUNNING">
                {messages.enums.scanStatus.RUNNING}
              </option>
              <option value="QUEUED">{messages.enums.scanStatus.QUEUED}</option>
              <option value="FAILED">{messages.enums.scanStatus.FAILED}</option>
            </select>

            <div className="inline-flex rounded-xl border border-subtle bg-surface-subtle p-0.5 text-xs font-semibold">
              {(
                [
                  ['ALL', messages.history.scopeAll],
                  ['WITH_PROBES', messages.history.scopeWithProbes],
                  ['SCA_ONLY', messages.history.scopeScaOnly],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScopeFilter(key)}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 transition ${
                    scopeFilter === key
                      ? 'bg-surface text-cyan-700 shadow-sm ring-1 ring-black/5 dark:text-cyan-300 dark:ring-white/10'
                      : 'text-fg-secondary hover:text-fg'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-fg">
              {t(messages.history.foundTitle, { count: filteredScans.length })}
            </h2>
            <p className="text-xs text-fg-secondary">
              {messages.history.foundSubtitle}
            </p>
          </div>
        </div>

        {error ? (
          <div className="m-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 sm:m-6">
            {error}
          </div>
        ) : loading ? (
          <div className="p-10 text-center text-sm text-fg-secondary">
            {messages.history.loading}
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-fg">
              {scans.length === 0
                ? messages.history.emptyAccountTitle
                : messages.history.emptyFilterTitle}
            </p>
            <p className="mt-1 text-xs text-fg-secondary">
              {scans.length === 0
                ? messages.history.emptyAccountSubtitle
                : messages.history.emptyFilterSubtitle}
            </p>
          </div>
        ) : (
          <ScanHistoryTable scans={filteredScans} onDelete={removeScan} />
        )}
      </SurfaceCard>
    </div>
  );
}
