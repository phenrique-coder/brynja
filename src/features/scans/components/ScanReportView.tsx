'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
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
} from 'lucide-react';
import {
  FindingVerdict,
  ScanReport,
  SeverityLevel,
} from '@/core/models/scan.models';
import { IReportExporter } from '@/core/ports/scan-gateway.port';
import { downloadScanReportPdf } from '../exporters/scan-pdf.exporter';
import { useScanReport } from '../hooks/use-scans';
import {
  filterAndSortFindings,
  formatReferenceLinks,
  formatRepositoryDisplay,
  formatTargetHost,
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
import { StatusPill } from './StatusPill';
import { KpiStatCard, SurfaceCard } from './ui/PagePrimitives';

type ReportTab = 'findings' | 'dependencies' | 'probes' | 'audit';

export function ScanReportView({ scanId }: { scanId: string }) {
  const { report, loading, authRequired, error } = useScanReport(scanId);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-fg-secondary">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-cyan-500" />
        Carregando relatório...
      </div>
    );
  }

  if (authRequired) {
    return (
      <AuthRequiredCard
        returnTo={`/scans/${scanId}`}
        title="Conecte seu GitHub para abrir este relatório"
      />
    );
  }

  if (error || !report) {
    return (
      <SurfaceCard className="border-rose-300 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        <p>{error ?? 'Relatório não encontrado.'}</p>
        <Link
          href="/"
          className="mt-3 inline-block font-semibold text-cyan-700 underline dark:text-cyan-300"
        >
          Voltar ao painel
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

  return (
    <div className="space-y-6">
      {/* Report Header Card: Full-width identity + clean separated export bar */}
      <SurfaceCard className="overflow-hidden">
        <div className="space-y-4 p-5 sm:p-6">
          {/* Top navigation & status bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted transition hover:text-fg"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao Histórico
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill meta={SCAN_STATUS_REGISTRY[report.status]} />
              <button
                type="button"
                onClick={() => void handleCopyScanId(report.id)}
                title={`Copiar ID completo: ${report.id}`}
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

          {/* Primary Repository & Domain Identity */}
          <div className="flex items-start gap-3">
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
                    <span>Alvo: {targetHost}</span>
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-fg-muted">
                    <Globe className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    Somente SCA (sem alvo staging)
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
                  ).toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Export Toolbar */}
        <div className="flex flex-col gap-2.5 border-t border-subtle bg-surface-subtle/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
            Exportar Relatório
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={exportingPdf}
              onClick={() => void handleDownloadPdf(report)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              {exportingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              {exportingPdf ? 'Gerando PDF...' : 'PDF Executivo'}
            </button>

            <span
              aria-hidden="true"
              className="hidden h-4 w-px bg-subtle sm:inline-block"
            />

            {REPORT_EXPORTERS.map((exporter) => {
              const shortLabel = exporter.label.replace(/^Exportar\s+/i, '');
              return (
                <button
                  key={exporter.format}
                  type="button"
                  onClick={() => triggerDownload(exporter, report)}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-fg transition hover:border-cyan-500/40 hover:text-cyan-700 dark:hover:text-cyan-300"
                >
                  <Download className="h-3.5 w-3.5 text-fg-muted" />
                  {shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </SurfaceCard>

      {/* Pipeline stepper */}
      <SurfaceCard className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isDone =
              report.status === 'COMPLETED' ||
              (currentStageIdx > -1 && idx < currentStageIdx);
            const isCurrent =
              report.status === 'RUNNING' && stage.key === report.currentStage;
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
                  <span className="truncate">{stage.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {report.errorMessage ? (
          <div className="mt-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
            Erro na execução: {report.errorMessage}
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
        <KpiStatCard label="Dependências" value={report.totalDependencies} />
        <KpiStatCard
          label="Críticas"
          value={report.criticalCount}
          accentClass="text-rose-600 dark:text-rose-300"
        />
        <KpiStatCard
          label="Altas"
          value={report.highCount}
          accentClass="text-orange-600 dark:text-orange-300"
        />
        <KpiStatCard
          label="Médias"
          value={report.mediumCount}
          accentClass="text-amber-600 dark:text-amber-300"
        />
        <KpiStatCard
          label="Confirmadas / Sondas"
          value={report.confirmedActiveCount}
          accentClass="text-cyan-600 dark:text-cyan-300"
        />
      </div>

      {/* Segmented Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-subtle bg-surface-subtle p-1">
        {(
          [
            ['findings', `Vulnerabilidades (${report.findings.length})`],
            ['dependencies', `Inventário SBOM (${report.dependencies.length})`],
            ['probes', `Safe Probes (${report.probeResults.length})`],
            ['audit', `Auditoria (${report.auditLogs.length})`],
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
              placeholder="Buscar pacote, CVE ou título..."
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
              <option value="ALL">Todas Severidades</option>
              <option value="CRITICAL">Crítica</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Média</option>
              <option value="LOW">Baixa</option>
            </select>
            <select
              value={verdictFilter}
              onChange={(e) =>
                setVerdictFilter(e.target.value as FindingVerdict | 'ALL')
              }
              className="rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs text-fg"
            >
              <option value="ALL">Todos Vereditos</option>
              <option value="CONFIRMED_ACTIVE">Confirmada em Runtime</option>
              <option value="POTENTIALLY_EXPOSED">Potencial / KEV Ativa</option>
              <option value="DEPENDENCY_ONLY">Apenas no Manifesto</option>
            </select>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-fg-secondary">
              <input
                type="checkbox"
                checked={onlyKev}
                onChange={(e) => setOnlyKev(e.target.checked)}
                className="rounded border-strong"
              />
              Apenas CISA KEV
            </label>
          </SurfaceCard>

          {filteredFindings.length === 0 ? (
            <SurfaceCard className="p-8 text-center text-sm text-fg-secondary">
              Nenhuma vulnerabilidade encontrada para os filtros aplicados.
            </SurfaceCard>
          ) : (
            <div className="space-y-3">
              {filteredFindings.map((f) => (
                <SurfaceCard key={f.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill meta={SEVERITY_REGISTRY[f.severity]} />
                        <StatusPill meta={VERDICT_REGISTRY[f.verdict]} />
                        {f.isKnownExploited ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:border-rose-500/50 dark:bg-rose-500/20 dark:text-rose-200">
                            <Flame className="h-3 w-3" />
                            CISA KEV (Exploração Ativa)
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
                            → Atualizar para ≥ {f.fixedVersion}
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
                  <th className="px-5 py-3">Biblioteca</th>
                  <th className="px-4 py-3">Versão</th>
                  <th className="px-4 py-3">Ecossistema</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-5 py-3">PURL</th>
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
              Nenhuma sonda ativa foi executada nesta varredura.
            </SurfaceCard>
          ) : (
            report.probeResults.map((p) => (
              <SurfaceCard key={p.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill meta={PROBE_OUTCOME_REGISTRY[p.status]} />
                    <StatusPill meta={SEVERITY_REGISTRY[p.severity]} />
                    <h3 className="text-sm font-semibold text-fg">{p.title}</h3>
                  </div>
                  <span className="font-mono text-xs text-fg-muted">
                    {p.probeId}
                  </span>
                </div>
                <p className="mt-2 text-xs text-fg-secondary">
                  <strong className="text-fg">Evidência:</strong> {p.evidence}
                </p>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  <strong>Recomendação:</strong> {p.recommendation}
                </p>
              </SurfaceCard>
            ))
          )}
        </div>
      ) : null}

      {tab === 'audit' ? (
        <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-subtle bg-surface-subtle/80 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Desfecho</th>
                  <th className="px-4 py-3">Método / Path</th>
                  <th className="px-4 py-3">HTTP</th>
                  <th className="px-4 py-3">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {report.auditLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-fg-secondary"
                    >
                      Nenhum evento de sonda registrado para este scan.
                    </td>
                  </tr>
                ) : (
                  report.auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-hover/50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-fg-muted">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
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
