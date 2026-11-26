'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitCompareArrows,
  History,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { ScanStatus } from '@/core/models/scan.models';
import {
  useExternalReportImporterPort,
  useScanReader,
} from '@/core/providers/gateway-provider';
import { useI18n } from '@/core/providers/i18n-provider';
import { useScanList } from '../hooks/use-scans';
import {
  ScanDiffResult,
  computeScanDiff,
} from '../presenters/scan-diff.presenter';
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
  const externalImporter = useExternalReportImporterPort();
  const scanReader = useScanReader();
  const { messages, t } = useI18n();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [showDiff, setShowDiff] = useState(false);
  const [baselineId, setBaselineId] = useState('');
  const [currentId, setCurrentId] = useState('');
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<ScanDiffResult | null>(null);

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

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    try {
      setImporting(true);
      const rawText = await file.text();
      const summary = await externalImporter.importExternalReport(
        rawText,
        file.name,
      );
      setImportSuccess(
        t(messages.history.importSuccess, { name: summary.repositoryUrl }),
      );
      await refresh();
    } catch (err) {
      setImportError(
        err instanceof Error
          ? err.message
          : messages.history.importErrorFallback,
      );
    } finally {
      setImporting(false);
    }
  }

  function toggleDiffPanel() {
    setShowDiff((prev) => {
      const next = !prev;
      if (next && scans.length >= 2) {
        if (!currentId) setCurrentId(scans[0].id);
        if (!baselineId) setBaselineId(scans[1].id);
      }
      return next;
    });
  }

  async function handleRunDiff() {
    setDiffError(null);
    if (!baselineId || !currentId || baselineId === currentId) {
      setDiffError(messages.history.diffSameScanError);
      return;
    }

    try {
      setDiffLoading(true);
      const [baseReport, currReport] = await Promise.all([
        scanReader.getScanReport(baselineId),
        scanReader.getScanReport(currentId),
      ]);
      setDiffResult(computeScanDiff(baseReport, currReport));
    } catch (err) {
      setDiffError(
        err instanceof Error ? err.message : messages.history.diffLoadError,
      );
    } finally {
      setDiffLoading(false);
    }
  }

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
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.sarif,application/json"
        onChange={(e) => void handleFileSelected(e)}
        className="hidden"
      />

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
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 text-xs font-semibold text-fg transition hover:border-cyan-500/40 disabled:opacity-50 sm:text-sm"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importing
                ? messages.history.importingButton
                : messages.history.importButton}
            </button>

            <button
              type="button"
              disabled={scans.length < 2}
              onClick={toggleDiffPanel}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition disabled:opacity-45 sm:text-sm ${
                showDiff
                  ? 'border-cyan-500/50 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200'
                  : 'border-subtle bg-surface-subtle text-fg-secondary hover:border-strong hover:text-fg'
              }`}
            >
              <GitCompareArrows className="h-4 w-4" />
              {messages.history.compareButton}
            </button>

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

      {importSuccess ? (
        <SurfaceCard className="border-emerald-300 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-200">
          {importSuccess}
        </SurfaceCard>
      ) : null}

      {importError ? (
        <SurfaceCard className="border-rose-300 bg-rose-50 p-3.5 text-xs font-medium text-rose-800 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200">
          {importError}
        </SurfaceCard>
      ) : null}

      {showDiff && scans.length >= 2 ? (
        <SurfaceCard className="space-y-4 border-cyan-500/25 p-5 sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-fg">
              {messages.history.diffTitle}
            </h2>
            <p className="text-xs text-fg-secondary">
              {messages.history.diffSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-fg-secondary">
                {messages.history.diffBaselineLabel}
              </label>
              <select
                value={baselineId}
                onChange={(e) => setBaselineId(e.target.value)}
                className="w-full rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs text-fg"
              >
                {scans.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.repositoryUrl} ({s.id.slice(0, 8)} ·{' '}
                    {s.createdAt.slice(0, 10)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-fg-secondary">
                {messages.history.diffCurrentLabel}
              </label>
              <select
                value={currentId}
                onChange={(e) => setCurrentId(e.target.value)}
                className="w-full rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs text-fg"
              >
                {scans.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.repositoryUrl} ({s.id.slice(0, 8)} ·{' '}
                    {s.createdAt.slice(0, 10)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                disabled={diffLoading}
                onClick={() => void handleRunDiff()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-50 dark:bg-cyan-500 dark:text-slate-950"
              >
                {diffLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GitCompareArrows className="h-4 w-4" />
                )}
                {messages.history.diffRunButton}
              </button>
            </div>
          </div>

          {diffError ? (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200">
              {diffError}
            </div>
          ) : null}

          {diffResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                <div className="rounded-xl border border-subtle bg-surface-subtle p-3">
                  <p className="text-[11px] font-medium text-fg-muted">
                    {messages.history.diffNewVulns}
                  </p>
                  <p className="mt-1 text-lg font-bold text-rose-600 dark:text-rose-300">
                    +{diffResult.newFindings.length}
                  </p>
                </div>
                <div className="rounded-xl border border-subtle bg-surface-subtle p-3">
                  <p className="text-[11px] font-medium text-fg-muted">
                    {messages.history.diffResolvedVulns}
                  </p>
                  <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-300">
                    -{diffResult.resolvedFindings.length}
                  </p>
                </div>
                <div className="rounded-xl border border-subtle bg-surface-subtle p-3">
                  <p className="text-[11px] font-medium text-fg-muted">
                    {messages.history.diffPersistentVulns}
                  </p>
                  <p className="mt-1 text-lg font-bold text-fg">
                    {diffResult.persistentFindingsCount}
                  </p>
                </div>
                <div className="rounded-xl border border-subtle bg-surface-subtle p-3">
                  <p className="text-[11px] font-medium text-fg-muted">
                    {messages.history.diffProbeDelta}
                  </p>
                  <p className="mt-1 text-sm font-bold text-fg">
                    +{diffResult.newProbeIssues.length} / -
                    {diffResult.resolvedProbeIssues.length}
                  </p>
                </div>
                <div className="rounded-xl border border-subtle bg-surface-subtle p-3">
                  <p className="text-[11px] font-medium text-fg-muted">
                    {messages.history.diffStaticDelta}
                  </p>
                  <p className="mt-1 text-sm font-bold text-fg">
                    +{diffResult.newStaticFindings.length} / -
                    {diffResult.resolvedStaticFindings.length}
                  </p>
                </div>
                <div className="rounded-xl border border-subtle bg-surface-subtle p-3">
                  <p className="text-[11px] font-medium text-fg-muted">
                    {messages.history.diffCisDelta} /{' '}
                    {messages.history.diffNistDelta}
                  </p>
                  <p className="mt-1 text-sm font-bold text-cyan-700 dark:text-cyan-300">
                    {diffResult.cisDelta >= 0
                      ? `+${diffResult.cisDelta}%`
                      : `${diffResult.cisDelta}%`}{' '}
                    /{' '}
                    {diffResult.nistDelta >= 0
                      ? `+${diffResult.nistDelta}%`
                      : `${diffResult.nistDelta}%`}
                  </p>
                </div>
              </div>

              {diffResult.newFindings.length === 0 &&
              diffResult.resolvedFindings.length === 0 &&
              diffResult.newStaticFindings.length === 0 &&
              diffResult.resolvedStaticFindings.length === 0 ? (
                <p className="text-xs text-fg-secondary">
                  {messages.history.diffNoChanges}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {diffResult.newFindings.length > 0 ? (
                    <div className="rounded-xl border border-rose-300/60 bg-rose-50/40 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
                      <p className="text-xs font-semibold text-rose-800 dark:text-rose-200">
                        {messages.history.diffNewVulns} (
                        {diffResult.newFindings.length})
                      </p>
                      <ul className="mt-1.5 space-y-1 text-xs text-fg-secondary">
                        {diffResult.newFindings.slice(0, 6).map((f) => (
                          <li key={f.id}>
                            [{f.severity}] {f.packageName}@{f.packageVersion} —{' '}
                            {f.cveId ?? f.advisoryId}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {diffResult.resolvedFindings.length > 0 ? (
                    <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/40 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                        {messages.history.diffResolvedVulns} (
                        {diffResult.resolvedFindings.length})
                      </p>
                      <ul className="mt-1.5 space-y-1 text-xs text-fg-secondary">
                        {diffResult.resolvedFindings.slice(0, 6).map((f) => (
                          <li key={f.id}>
                            [{f.severity}] {f.packageName}@{f.packageVersion} —{' '}
                            {f.cveId ?? f.advisoryId}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </SurfaceCard>
      ) : null}

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
