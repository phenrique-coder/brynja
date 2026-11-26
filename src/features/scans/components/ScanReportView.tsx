'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileDown,
  Flame,
  FolderGit2,
  GitBranch,
  Globe,
  Layers,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  FindingVerdict,
  ScanReport,
  SeverityLevel,
  countProbeIssues,
} from '@/core/models/scan.models';
import { IReportExporter } from '@/core/ports/scan-gateway.port';
import { useI18n } from '@/core/providers/i18n-provider';
import { downloadScanReportPdf } from '../exporters/scan-pdf.exporter';
import { useGrcAssessments, useScanReport } from '../hooks/use-scans';
import { evaluateComplianceFramework } from '../presenters/compliance.presenter';
import {
  filterAndSortFindings,
  formatReferenceLinks,
  formatRepositoryDisplay,
  formatTargetHost,
  isScanAllClear,
} from '../presenters/scan.presenter';
import {
  PIPELINE_STAGES,
  PROBE_OUTCOME_REGISTRY,
  REPORT_EXPORTERS,
  SCAN_STATUS_REGISTRY,
  SEVERITY_REGISTRY,
  VERDICT_REGISTRY,
} from '../registries/finding-registries';
import { AuthRequiredCard } from './AuthRequiredCard';
import { ComplianceScorecardTab } from './ComplianceScorecardTab';
import { StatusPill } from './StatusPill';
import {
  KpiStatCard,
  PageLoadingState,
  SurfaceCard,
} from './ui/PagePrimitives';

type ReportTab = 'findings' | 'dependencies' | 'probes' | 'compliance' | 'audit';

export function ScanReportView({ scanId }: { scanId: string }) {
  const { report, loading, authRequired, error } = useScanReport(scanId);
  const { assessments } = useGrcAssessments();
  const { messages, locale, intlLocale, t } = useI18n();
  const [tab, setTab] = useState<ReportTab>('findings');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'ALL'>(
    'ALL',
  );
  const [verdictFilter, setVerdictFilter] = useState<FindingVerdict | 'ALL'>(
    'ALL',
  );
  const [onlyKev, setOnlyKev] = useState(false);
  const [search, setSearch] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAiJson, setCopiedAiJson] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setExportMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [exportMenuOpen]);

  const linkedAssessment = useMemo(() => {
    if (!report) return null;
    return assessments.find((a) => a.linkedScanId === report.id) ?? null;
  }, [assessments, report]);

  const complianceSummaryScore = useMemo(() => {
    if (!report) return 0;
    return evaluateComplianceFramework(report, {
      frameworkId: 'cis-v8',
      locale,
      assessment: linkedAssessment,
    }).summary.technicalAdherencePercent;
  }, [report, locale, linkedAssessment]);

  const filteredFindings = useMemo(() => {
    if (!report) return [];
    return filterAndSortFindings(report.findings, {
      severity: severityFilter,
      verdict: verdictFilter,
      onlyKev,
      search,
    });
  }, [report, severityFilter, verdictFilter, onlyKev, search]);

  function triggerDownload(exporter: IReportExporter, current: ScanReport) {
    const file = exporter.export(current);
    const blob = new Blob([file.content], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadPdf(current: ScanReport) {
    try {
      setExportingPdf(true);
      await downloadScanReportPdf(current);
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleCopyAiJson(
    exporter: IReportExporter,
    current: ScanReport,
  ) {
    try {
      const file = exporter.export(current);
      await navigator.clipboard.writeText(file.content);
      setCopiedAiJson(true);
      window.setTimeout(() => setCopiedAiJson(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  }

  if (authRequired) {
    return (
      <AuthRequiredCard
        returnTo={`/scans/${scanId}`}
        title={messages.authCard.reportTitle}
      />
    );
  }

  if (loading) {
    return <PageLoadingState label={messages.scanReport.loading} />;
  }

  if (error || !report) {
    return (
      <SurfaceCard className="border-rose-300 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        <p>{error ?? messages.scanReport.notFound}</p>
        <Link
          href="/"
          className="mt-3 inline-block font-semibold text-cyan-700 underline dark:text-cyan-300"
        >
          {messages.common.backToDashboard}
        </Link>
      </SurfaceCard>
    );
  }

  const currentStageIdx = PIPELINE_STAGES.findIndex(
    (s) => s.key === report.currentStage,
  );
  const repoDisplay = formatRepositoryDisplay(report.repositoryUrl);
  const targetHost = formatTargetHost(report.targetUrl);
  const isHttpRepo = /^https?:\/\//i.test(report.repositoryUrl);

  async function handleCopyScanId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  }

  const aiExporter = REPORT_EXPORTERS.find((e) => e.format === 'ai-json');
  const secondaryExporters = REPORT_EXPORTERS.filter(
    (e) => e.format !== 'ai-json',
  );
  const exporterLabels: Record<string, string> = {
    json: messages.scanReport.rawJsonLabel,
    markdown: messages.scanReport.markdownLabel,
    cyclonedx: messages.scanReport.sbomLabel,
  };
  const allClear = isScanAllClear(report);
  const probeIssuesCount = countProbeIssues(report.probeResults);

  return (
    <div className="space-y-6">
      {/* Report Header Card: Full-width identity + right-aligned export dropdown */}
      <SurfaceCard className="relative overflow-visible">
        <div className="space-y-4 p-5 sm:p-6">
          {/* Top navigation & status bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted transition hover:text-fg"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {messages.common.backToHistory}
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                meta={SCAN_STATUS_REGISTRY[report.status]}
                label={messages.enums.scanStatus[report.status]}
              />
              <button
                type="button"
                onClick={() => void handleCopyScanId(report.id)}
                title={t(messages.scanReport.copyIdTitle, { id: report.id })}
                className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-subtle px-2.5 py-0.5 font-mono text-[11px] text-fg-secondary transition hover:border-cyan-500/40 hover:text-fg"
              >
                <span>ID {report.id.slice(0, 8)}</span>
                {copiedId ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3 opacity-70" />
                )}
              </button>
            </div>
          </div>

          {/* Primary Repository & Domain Identity + Right-corner Export Dropdown */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                <FolderGit2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {isHttpRepo ? (
                    <a
                      href={report.repositoryUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={report.repositoryUrl}
                      className="group inline-flex min-w-0 items-center gap-1.5 text-lg font-bold tracking-tight text-fg transition hover:text-cyan-700 sm:text-xl dark:hover:text-cyan-300"
                    >
                      <span className="break-all sm:break-normal">
                        {repoDisplay.displayName}
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 opacity-60 transition group-hover:opacity-100" />
                    </a>
                  ) : (
                    <h1 className="break-all text-lg font-bold tracking-tight text-fg sm:text-xl">
                      {repoDisplay.displayName}
                    </h1>
                  )}
                </div>

                {/* Structured metadata chips */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-surface-subtle px-2.5 py-1 font-mono text-[11px] font-medium text-fg-secondary">
                    <GitBranch className="h-3.5 w-3.5 text-fg-muted" />
                    {report.branch}
                  </span>

                  {targetHost && report.targetUrl ? (
                    <a
                      href={report.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={report.targetUrl}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {t(messages.scanReport.targetPrefix, {
                          host: targetHost,
                        })}
                      </span>
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-fg-muted">
                      <Globe className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      {messages.scanReport.scaOnlyBadge}
                    </span>
                  )}

                  {report.ecosystems.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-surface-subtle px-2.5 py-1 font-mono text-[11px] font-medium text-fg-secondary">
                      <Layers className="h-3.5 w-3.5 text-fg-muted" />
                      {report.ecosystems.join(', ')}
                    </span>
                  ) : null}

                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-surface-subtle px-2.5 py-1 text-[11px] text-fg-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(
                      report.completedAt ?? report.createdAt,
                    ).toLocaleString(intlLocale, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right-corner Export Dropdown Menu (PDF first -> AI JSON -> others) */}
            <div ref={exportMenuRef} className="relative shrink-0 self-end sm:self-start">
              <button
                type="button"
                disabled={exportingPdf}
                aria-haspopup="menu"
                aria-expanded={exportMenuOpen}
                onClick={() => setExportMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
              >
                {exportingPdf ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileDown className="h-3.5 w-3.5" />
                )}
                <span>
                  {exportingPdf
                    ? messages.scanReport.generatingPdf
                    : messages.scanReport.exportReportLabel}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    exportMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {exportMenuOpen ? (
                <div
                  role="menu"
                  aria-label={messages.scanReport.exportDropdownMenuLabel}
                  className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-subtle bg-surface p-1.5 shadow-xl sm:w-80"
                >
                  {allClear ? (
                    <div className="mb-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-[11px] font-medium leading-snug text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                      {messages.scanReport.exportOnlyPdfHint}
                    </div>
                  ) : null}

                  {/* 1. Executive PDF (always enabled) */}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={exportingPdf}
                    title={messages.scanReport.executivePdfTitle}
                    onClick={() => {
                      setExportMenuOpen(false);
                      void handleDownloadPdf(report);
                    }}
                    className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-cyan-50 dark:hover:bg-cyan-500/10 disabled:opacity-50"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950">
                      <FileDown className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-fg">
                        {messages.scanReport.executivePdf}
                      </span>
                      <span className="block text-[11px] leading-snug text-fg-muted">
                        {messages.scanReport.executivePdfMenuHint}
                      </span>
                    </span>
                  </button>

                  {/* 2. AI Remediation JSON (download + copy) */}
                  {aiExporter ? (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={allClear}
                        title={messages.scanReport.aiJsonTitle}
                        onClick={() => {
                          if (allClear) return;
                          setExportMenuOpen(false);
                          triggerDownload(aiExporter, report);
                        }}
                        className="mt-0.5 flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent dark:hover:bg-emerald-500/10"
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950">
                          <Sparkles className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2 text-xs font-semibold text-fg">
                            <span>{messages.scanReport.aiJson}</span>
                            {allClear ? (
                              <span className="rounded-md bg-surface-subtle px-1.5 py-0.5 text-[10px] font-medium text-fg-muted">
                                {messages.scanReport.disabledNoErrorsBadge}
                              </span>
                            ) : null}
                          </span>
                          <span className="block text-[11px] leading-snug text-fg-muted">
                            {messages.scanReport.aiJsonMenuHint}
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        disabled={allClear}
                        title={messages.scanReport.copyAiJsonTitle}
                        onClick={() => {
                          if (allClear) return;
                          void handleCopyAiJson(aiExporter, report);
                        }}
                        className="mt-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-fg-secondary transition hover:bg-surface-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                      >
                        {copiedAiJson ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 shrink-0 text-fg-muted" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-fg">
                            {copiedAiJson
                              ? messages.scanReport.copiedAiJsonLabel
                              : messages.scanReport.copyAiJsonLabel}
                          </span>
                          <span className="block text-[11px] text-fg-muted">
                            {messages.scanReport.copyAiJsonMenuHint}
                          </span>
                        </span>
                      </button>
                    </>
                  ) : null}

                  <div className="my-1.5 border-t border-subtle" />
                  <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                    {messages.scanReport.otherExportsLabel}
                  </div>

                  {/* 3. Other technical formats (JSON Completo, Markdown, SBOM) */}
                  {secondaryExporters.map((exporter) => {
                    const shortLabel =
                      exporterLabels[exporter.format] ??
                      exporter.label.replace(/^Exportar\s+/i, '');
                    return (
                      <button
                        key={exporter.format}
                        type="button"
                        role="menuitem"
                        disabled={allClear}
                        onClick={() => {
                          if (allClear) return;
                          setExportMenuOpen(false);
                          triggerDownload(exporter, report);
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-fg transition hover:bg-surface-hover hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-fg dark:hover:text-cyan-300"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Download className="h-3.5 w-3.5 text-fg-muted" />
                          <span>{shortLabel}</span>
                        </span>
                        {allClear ? (
                          <span className="rounded-md bg-surface-subtle px-1.5 py-0.5 text-[10px] font-medium text-fg-muted">
                            {messages.scanReport.disabledNoErrorsBadge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </SurfaceCard>

      {/* Celebratory All-Clear Banner when every SCA & Safe Probe check passed with zero issues */}
      {allClear ? (
        <SurfaceCard className="border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-cyan-50/60 p-5 sm:p-6 dark:border-emerald-500/35 dark:from-emerald-500/15 dark:via-teal-500/10 dark:to-cyan-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-slate-950">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                  <Sparkles className="h-3 w-3" />
                  <span>{messages.scanReport.allClearBadge}</span>
                </div>
                <h2 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                  {messages.scanReport.allClearTitle}
                </h2>
                <p className="text-xs leading-relaxed text-emerald-900/80 sm:text-sm dark:text-emerald-200/85">
                  {report.probeResults.length > 0
                    ? t(messages.scanReport.allClearBodyWithProbes, {
                        deps: report.totalDependencies,
                        probes: report.probeResults.length,
                      })
                    : t(messages.scanReport.allClearBodyScaOnly, {
                        deps: report.totalDependencies,
                      })}
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      {/* Pipeline stepper */}
      <SurfaceCard className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isDone =
              report.status === 'COMPLETED' ||
              (currentStageIdx > -1 && idx < currentStageIdx);
            const isCurrent =
              report.status === 'RUNNING' && stage.key === report.currentStage;
            const stageLabel =
              messages.enums.pipelineStage[
                stage.key as keyof typeof messages.enums.pipelineStage
              ] ?? stage.label;
            return (
              <div
                key={stage.key}
                className={`rounded-xl border px-3 py-2 text-xs transition ${
                  isDone
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : isCurrent
                      ? 'border-cyan-400 bg-cyan-50 text-cyan-800 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-200'
                      : 'border-subtle bg-surface-subtle text-fg-muted'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium">
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  ) : null}
                  <span className="truncate">{stageLabel}</span>
                </div>
              </div>
            );
          })}
        </div>

        {report.errorMessage ? (
          <div className="mt-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
            {t(messages.scanReport.executionError, {
              message: report.errorMessage,
            })}
          </div>
        ) : null}

        {report.warnings.length > 0 ? (
          <div className="mt-3 space-y-1 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {report.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        ) : null}
      </SurfaceCard>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <KpiStatCard
          label={messages.scanReport.kpiDependencies}
          value={report.totalDependencies}
        />
        <KpiStatCard
          label={messages.scanReport.kpiCritical}
          value={report.criticalCount}
          accentClass="text-rose-600 dark:text-rose-300"
        />
        <KpiStatCard
          label={messages.scanReport.kpiHigh}
          value={report.highCount}
          accentClass="text-orange-600 dark:text-orange-300"
        />
        <KpiStatCard
          label={messages.scanReport.kpiMedium}
          value={report.mediumCount}
          accentClass="text-amber-600 dark:text-amber-300"
        />
        <KpiStatCard
          label={messages.scanReport.kpiConfirmed}
          value={report.confirmedActiveCount}
          accentClass="text-cyan-600 dark:text-cyan-300"
        />
      </div>

      {/* Segmented Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-subtle bg-surface-subtle p-1">
        {(
          [
            [
              'findings',
              t(messages.scanReport.tabFindings, {
                count: report.findings.length,
              }),
            ],
            [
              'dependencies',
              t(messages.scanReport.tabDependencies, {
                count: report.dependencies.length,
              }),
            ],
            [
              'probes',
              t(messages.scanReport.tabProbes, {
                count: report.probeResults.length,
              }),
            ],
            [
              'compliance',
              t(messages.scanReport.tabCompliance, {
                score: complianceSummaryScore,
              }),
            ],
            [
              'audit',
              t(messages.scanReport.tabAudit, {
                count: report.auditLogs.length,
              }),
            ],
          ] as Array<[ReportTab, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              tab === key
                ? 'bg-surface text-cyan-700 shadow-sm ring-1 ring-black/5 dark:text-cyan-300 dark:ring-white/10'
                : 'text-fg-secondary hover:text-fg'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'findings' ? (
        <div className="space-y-4">
          <SurfaceCard className="flex flex-wrap items-center gap-3 p-3.5">
            <input
              type="text"
              placeholder={messages.scanReport.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-[220px] flex-1 rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs text-fg placeholder-fg-muted focus:border-cyan-500 focus:outline-none"
            />
            <select
              value={severityFilter}
              onChange={(e) =>
                setSeverityFilter(e.target.value as SeverityLevel | 'ALL')
              }
              className="rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs text-fg"
            >
              <option value="ALL">{messages.scanReport.allSeverities}</option>
              <option value="CRITICAL">
                {messages.enums.severity.CRITICAL}
              </option>
              <option value="HIGH">{messages.enums.severity.HIGH}</option>
              <option value="MEDIUM">{messages.enums.severity.MEDIUM}</option>
              <option value="LOW">{messages.enums.severity.LOW}</option>
            </select>
            <select
              value={verdictFilter}
              onChange={(e) =>
                setVerdictFilter(e.target.value as FindingVerdict | 'ALL')
              }
              className="rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs text-fg"
            >
              <option value="ALL">{messages.scanReport.allVerdicts}</option>
              <option value="CONFIRMED_ACTIVE">
                {messages.enums.verdict.CONFIRMED_ACTIVE}
              </option>
              <option value="POTENTIALLY_EXPOSED">
                {messages.enums.verdict.POTENTIALLY_EXPOSED}
              </option>
              <option value="DEPENDENCY_ONLY">
                {messages.enums.verdict.DEPENDENCY_ONLY}
              </option>
            </select>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-fg-secondary">
              <input
                type="checkbox"
                checked={onlyKev}
                onChange={(e) => setOnlyKev(e.target.checked)}
                className="rounded border-strong"
              />
              {messages.scanReport.onlyKev}
            </label>
          </SurfaceCard>

          {report.findings.length === 0 ? (
            <SurfaceCard
              className={`p-8 text-center text-sm ${
                probeIssuesCount > 0
                  ? 'border-amber-300/60 bg-amber-50/40 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                  : 'border-emerald-300/60 bg-emerald-50/40 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
              }`}
            >
              <div className="inline-flex items-center gap-2 font-semibold">
                {probeIssuesCount > 0 ? (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                )}
                <span>
                  {probeIssuesCount > 0
                    ? t(messages.scanReport.noVulnsButProbeFindings, {
                        count: probeIssuesCount,
                      })
                    : t(messages.scanReport.noVulnsCleanState, {
                        deps: report.totalDependencies,
                      })}
                </span>
              </div>
            </SurfaceCard>
          ) : filteredFindings.length === 0 ? (
            <SurfaceCard className="p-8 text-center text-sm text-fg-secondary">
              {messages.scanReport.noFindingsFiltered}
            </SurfaceCard>
          ) : (
            <div className="space-y-3">
              {filteredFindings.map((f) => (
                <SurfaceCard key={f.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                          meta={SEVERITY_REGISTRY[f.severity]}
                          label={messages.enums.severity[f.severity]}
                        />
                        <StatusPill
                          meta={VERDICT_REGISTRY[f.verdict]}
                          label={messages.enums.verdict[f.verdict]}
                        />
                        {f.isKnownExploited ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:border-rose-500/50 dark:bg-rose-500/20 dark:text-rose-200">
                            <Flame className="h-3 w-3" />
                            {messages.scanReport.kevBadge}
                          </span>
                        ) : null}
                        <span className="font-mono text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                          {f.cveId ?? f.advisoryId}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-fg">
                        {f.title}
                      </h3>
                      <p className="font-mono text-xs text-fg-secondary">
                        {f.ecosystem}: {f.packageName}@{f.packageVersion}
                        {f.fixedVersion ? (
                          <span className="ml-2 font-semibold text-emerald-700 dark:text-emerald-300">
                            {t(messages.scanReport.upgradeTo, {
                              version: f.fixedVersion,
                            })}
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <div className="shrink-0 text-right text-xs text-fg-secondary">
                      {f.cvssScore !== null ? (
                        <div>
                          CVSS:{' '}
                          <span className="font-mono font-semibold text-fg">
                            {f.cvssScore.toFixed(1)}
                          </span>
                        </div>
                      ) : null}
                      {f.epssScore !== null ? (
                        <div>
                          EPSS:{' '}
                          <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                            {(f.epssScore * 100).toFixed(1)}%
                          </span>
                        </div>
                      ) : null}
                      <div className="mt-0.5 text-[11px] text-fg-muted">
                        {f.source}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-fg-secondary">
                    {f.description}
                  </p>

                  {f.references.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formatReferenceLinks(f.references, 4).map((ref) => (
                        <a
                          key={ref.url}
                          href={ref.url}
                          target="_blank"
                          rel="noreferrer"
                          title={ref.url}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-cyan-700 transition hover:border-cyan-500/40 hover:bg-surface-hover dark:text-cyan-300"
                        >
                          <span>{ref.label}</span>
                          <ExternalLink className="h-3 w-3 opacity-80" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </SurfaceCard>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'dependencies' ? (
        <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-subtle bg-surface-subtle/80 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                <tr>
                  <th className="px-5 py-3">
                    {messages.scanReport.sbomColLibrary}
                  </th>
                  <th className="px-4 py-3">
                    {messages.scanReport.sbomColVersion}
                  </th>
                  <th className="px-4 py-3">
                    {messages.scanReport.sbomColEcosystem}
                  </th>
                  <th className="px-4 py-3">
                    {messages.scanReport.sbomColSource}
                  </th>
                  <th className="px-5 py-3">
                    {messages.scanReport.sbomColPurl}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {report.dependencies.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-hover/50">
                    <td className="px-5 py-3 font-mono font-medium text-fg">
                      {d.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-700 dark:text-cyan-300">
                      {d.version}
                    </td>
                    <td className="px-4 py-3 text-fg-secondary">
                      {d.ecosystem}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-secondary">
                      {d.sourceFile}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-fg-muted">
                      {d.purl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      ) : null}

      {tab === 'probes' ? (
        <div className="space-y-3">
          {report.probeResults.length === 0 ? (
            <SurfaceCard className="p-8 text-center text-sm text-fg-secondary">
              {messages.scanReport.noProbesExecuted}
            </SurfaceCard>
          ) : (
            report.probeResults.map((p) => (
              <SurfaceCard key={p.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill
                      meta={PROBE_OUTCOME_REGISTRY[p.status]}
                      label={messages.enums.probeOutcome[p.status]}
                    />
                    <StatusPill
                      meta={SEVERITY_REGISTRY[p.severity]}
                      label={messages.enums.severity[p.severity]}
                    />
                    <h3 className="text-sm font-semibold text-fg">{p.title}</h3>
                  </div>
                  <span className="font-mono text-xs text-fg-muted">
                    {p.probeId}
                  </span>
                </div>
                <p className="mt-2 text-xs text-fg-secondary">
                  <strong className="text-fg">
                    {messages.scanReport.evidenceLabel}
                  </strong>{' '}
                  {p.evidence}
                </p>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  <strong>{messages.scanReport.recommendationLabel}</strong>{' '}
                  {p.recommendation}
                </p>
              </SurfaceCard>
            ))
          )}
        </div>
      ) : null}

      {tab === 'compliance' ? (
        <ComplianceScorecardTab
          report={report}
          linkedAssessment={linkedAssessment}
        />
      ) : null}

      {tab === 'audit' ? (
        <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-subtle bg-surface-subtle/80 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                <tr>
                  <th className="px-4 py-3">
                    {messages.scanReport.auditColTimestamp}
                  </th>
                  <th className="px-4 py-3">
                    {messages.scanReport.auditColOutcome}
                  </th>
                  <th className="px-4 py-3">
                    {messages.scanReport.auditColMethodPath}
                  </th>
                  <th className="px-4 py-3">
                    {messages.scanReport.auditColHttp}
                  </th>
                  <th className="px-4 py-3">
                    {messages.scanReport.auditColDetails}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {report.auditLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-fg-secondary"
                    >
                      {messages.scanReport.noAuditEvents}
                    </td>
                  </tr>
                ) : (
                  report.auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-hover/50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-fg-muted">
                        {new Date(log.createdAt).toLocaleString(intlLocale)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-cyan-700 dark:text-cyan-300">
                        {log.outcome}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-fg">
                        {log.httpMethod} {log.requestPath}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-fg-secondary">
                        {log.statusCode ?? '-'} ({log.durationMs}ms)
                      </td>
                      <td className="px-4 py-3 text-fg-secondary">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
