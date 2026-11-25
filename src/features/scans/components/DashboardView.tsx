'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useI18n } from '@/core/providers/i18n-provider';
import { useScanList } from '../hooks/use-scans';
import { computeDashboardMetrics } from '../presenters/scan.presenter';
import { AuthRequiredCard } from './AuthRequiredCard';
import { ScanHistoryTable } from './ScanHistoryTable';
import {
  KpiStatCard,
  PageHeader,
  PageLoadingState,
  SurfaceCard,
} from './ui/PagePrimitives';

export function DashboardView() {
  const { scans, loading, authRequired, error, refresh, removeScan } =
    useScanList();
  const { messages } = useI18n();
  const metrics = computeDashboardMetrics(scans);

  if (authRequired) {
    return (
      <AuthRequiredCard
        returnTo="/"
        title={messages.authCard.dashboardTitle}
      />
    );
  }

  if (loading && scans.length === 0) {
    return <PageLoadingState label={messages.dashboard.loading} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            {messages.dashboard.badge}
          </span>
        }
        title={messages.dashboard.title}
        description={messages.dashboard.description}
        actions={
          <>
            <Link
              href="/authorizations"
              className="inline-flex items-center gap-2 rounded-xl border border-subtle bg-surface-subtle px-4 py-2.5 text-xs font-semibold text-fg transition hover:border-strong hover:bg-surface-hover sm:text-sm"
            >
              {messages.dashboard.authorizeTarget}
            </Link>
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
          label={messages.dashboard.kpiScans}
          value={metrics.totalScans}
          icon={
            <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          }
        />
        <KpiStatCard
          label={messages.dashboard.kpiDependencies}
          value={metrics.totalDependenciesScanned}
          icon={
            <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          }
        />
        <KpiStatCard
          label={messages.dashboard.kpiCriticalHigh}
          value={metrics.criticalAndHighTotal}
          accentClass="text-orange-600 dark:text-orange-300"
          icon={
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          }
        />
        <KpiStatCard
          label={messages.dashboard.kpiConfirmed}
          value={metrics.confirmedActiveTotal}
          accentClass="text-rose-600 dark:text-rose-300"
          icon={
            <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          }
        />
      </section>

      <SurfaceCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-fg">
              {messages.dashboard.historyTitle}
            </h2>
            <p className="text-xs text-fg-secondary">
              {messages.dashboard.historySubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-subtle bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-fg transition hover:border-cyan-500/40 hover:text-cyan-700 dark:hover:text-cyan-300"
            >
              {messages.dashboard.viewFullHistory}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-subtle bg-surface-subtle px-3 py-1.5 text-xs font-medium text-fg-secondary transition hover:border-strong hover:text-fg"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {messages.common.refresh}
            </button>
          </div>
        </div>

        {error ? (
          <div className="m-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 sm:m-6">
            {error}
          </div>
        ) : loading ? (
          <div className="p-10 text-center text-sm text-fg-secondary">
            {messages.dashboard.loadingScans}
          </div>
        ) : scans.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-fg">
              {messages.dashboard.emptyTitle}
            </p>
            <p className="mt-1 text-xs text-fg-secondary">
              {messages.dashboard.emptySubtitle}
            </p>
            <Link
              href="/scans/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-50 px-4 py-2 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-200 dark:hover:bg-cyan-500/25"
            >
              {messages.dashboard.createFirstScan}
            </Link>
          </div>
        ) : (
          <ScanHistoryTable scans={scans.slice(0, 10)} onDelete={removeScan} />
        )}
      </SurfaceCard>
    </div>
  );
}
