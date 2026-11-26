'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  FolderGit2,
  GitBranch,
  Globe,
  Layers,
  Loader2,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  ScanSummary,
  resolveScanProbeIssuesCount,
  resolveScanStaticIssuesCount,
} from '@/core/models/scan.models';
import { useI18n } from '@/core/providers/i18n-provider';
import {
  computeSeverityBarSegments,
  formatRepositoryDisplay,
  formatTargetHost,
} from '../presenters/scan.presenter';
import { SCAN_STATUS_REGISTRY } from '../registries/finding-registries';
import { StatusPill } from './StatusPill';

interface ScanHistoryTableProps {
  scans: ScanSummary[];
  onDelete?: (scanId: string) => Promise<void>;
}

export function ScanHistoryTable({ scans, onDelete }: ScanHistoryTableProps) {
  const { messages, intlLocale, t } = useI18n();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(scanId: string) {
    if (!onDelete || deletingId) return;
    setDeletingId(scanId);
    try {
      await onDelete(scanId);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-b border-subtle bg-surface-subtle/80 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
          <tr>
            <th className="py-3 pl-5 pr-3 sm:pl-6">
              {messages.historyTable.colRepository}
            </th>
            <th className="whitespace-nowrap px-3 py-3">
              {messages.historyTable.colStatus}
            </th>
            <th className="whitespace-nowrap px-3 py-3">
              {messages.historyTable.colDependencies}
            </th>
            <th className="whitespace-nowrap px-3 py-3">
              {messages.historyTable.colSeverity}
            </th>
            <th className="whitespace-nowrap px-3 py-3">
              {messages.historyTable.colStagingTarget}
            </th>
            <th className="whitespace-nowrap py-3 pl-3 pr-5 text-right sm:pr-6">
              {messages.historyTable.colAction}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {scans.map((scan) => {
            const repo = formatRepositoryDisplay(scan.repositoryUrl);
            const targetHost = formatTargetHost(scan.targetUrl);
            const probeIssuesCount = resolveScanProbeIssuesCount(scan);
            const staticIssuesCount = resolveScanStaticIssuesCount(scan);
            const barSegments = computeSeverityBarSegments({
              ...scan,
              probeIssuesCount,
              staticIssuesCount,
            });

            return (
              <tr
                key={scan.id}
                className="group transition-colors hover:bg-surface-hover/50"
              >
                {/* Repository */}
                <td className="max-w-[280px] py-3.5 pl-5 pr-3 sm:pl-6 lg:max-w-[320px]">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-subtle bg-surface-subtle text-cyan-700 transition group-hover:border-cyan-500/30 dark:text-cyan-300">
                      <FolderGit2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/scans/${scan.id}`}
                        title={scan.repositoryUrl}
                        className="block truncate font-mono text-[13px] font-semibold text-fg transition hover:text-cyan-700 dark:hover:text-cyan-300"
                      >
                        {repo.displayName}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-fg-muted">
                        <span className="inline-flex items-center gap-1 rounded-md border border-subtle bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] text-fg-secondary">
                          <GitBranch className="h-3 w-3" />
                          {scan.branch}
                        </span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <Clock className="h-3 w-3" />
                          {new Date(scan.createdAt).toLocaleString(intlLocale, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="whitespace-nowrap px-3 py-3.5 align-middle">
                  <StatusPill
                    meta={SCAN_STATUS_REGISTRY[scan.status]}
                    label={messages.enums.scanStatus[scan.status]}
                  />
                </td>

                {/* Dependencies */}
                <td className="whitespace-nowrap px-3 py-3.5 align-middle">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-semibold text-fg">
                      {scan.totalDependencies}
                    </span>
                    {scan.ecosystems.length > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-subtle bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] font-medium text-fg-secondary">
                        <Layers className="h-2.5 w-2.5 text-fg-muted" />
                        {scan.ecosystems.join(', ')}
                      </span>
                    ) : null}
                  </div>
                </td>

                {/* Severity */}
                <td className="whitespace-nowrap px-3 py-3.5 align-middle">
                  <div className="inline-flex flex-col gap-1.5">
                    <div className="flex items-center gap-1 font-mono text-[11px] font-semibold">
                      <span
                        title={t(messages.historyTable.critTitle, {
                          count: scan.criticalCount,
                        })}
                        className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                      >
                        {messages.historyTable.critShort}:{scan.criticalCount}
                      </span>
                      <span
                        title={t(messages.historyTable.highTitle, {
                          count: scan.highCount,
                        })}
                        className="inline-flex items-center rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300"
                      >
                        {messages.historyTable.highShort}:{scan.highCount}
                      </span>
                      <span
                        title={t(messages.historyTable.medTitle, {
                          count: scan.mediumCount,
                        })}
                        className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                      >
                        {messages.historyTable.medShort}:{scan.mediumCount}
                      </span>
                      {scan.lowCount > 0 ? (
                        <span
                          title={t(messages.historyTable.lowTitle, {
                            count: scan.lowCount,
                          })}
                          className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300"
                        >
                          {messages.historyTable.lowShort}:{scan.lowCount}
                        </span>
                      ) : null}
                      {probeIssuesCount > 0 ? (
                        <span
                          title={t(messages.historyTable.probeTitle, {
                            count: probeIssuesCount,
                          })}
                          className="inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300"
                        >
                          {messages.historyTable.probeShort}:{probeIssuesCount}
                        </span>
                      ) : null}
                      {staticIssuesCount > 0 ? (
                        <span
                          title={t(messages.historyTable.staticTitle, {
                            count: staticIssuesCount,
                          })}
                          className="inline-flex items-center rounded-md border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-300"
                        >
                          {messages.historyTable.staticShort}:{staticIssuesCount}
                        </span>
                      ) : null}
                    </div>
                    {barSegments.length > 0 ? (
                      <div
                        aria-hidden="true"
                        data-testid={`severity-bar-${scan.id}`}
                        className="flex h-1 w-full overflow-hidden rounded-full bg-surface-subtle"
                      >
                        {barSegments.map((segment) => (
                          <div
                            key={segment.key}
                            data-segment={segment.key}
                            className={segment.colorClass}
                            style={{ width: `${segment.percentage}%` }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </td>

                {/* Target Staging */}
                <td className="whitespace-nowrap px-3 py-3.5 align-middle">
                  {targetHost ? (
                    <span
                      title={scan.targetUrl ?? undefined}
                      className="inline-flex max-w-[185px] items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{targetHost}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-fg-muted">
                      <Globe className="h-3 w-3 shrink-0 opacity-70" />
                      {messages.common.scaOnly}
                    </span>
                  )}
                </td>

                {/* Action */}
                <td className="whitespace-nowrap py-3.5 pl-3 pr-5 text-right align-middle sm:pr-6">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <Link
                      href={`/scans/${scan.id}`}
                      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-cyan-500/30 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
                    >
                      <span>{messages.historyTable.viewReport}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                    {onDelete ? (
                      <button
                        type="button"
                        disabled={deletingId === scan.id}
                        onClick={() => void handleDelete(scan.id)}
                        aria-label={t(messages.historyTable.deleteAria, {
                          name: repo.displayName,
                        })}
                        title={messages.historyTable.deleteTitle}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-subtle bg-surface-subtle text-fg-muted transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/15 dark:hover:text-rose-300"
                      >
                        {deletingId === scan.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
