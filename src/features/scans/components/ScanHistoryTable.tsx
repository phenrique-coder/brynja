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
import { ScanSummary } from '@/core/models/scan.models';
import {
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
            <th className="py-3 pl-5 pr-3 sm:pl-6">Repositório</th>
            <th className="whitespace-nowrap px-3 py-3">Status</th>
            <th className="whitespace-nowrap px-3 py-3">Dependências</th>
            <th className="whitespace-nowrap px-3 py-3">Severidade</th>
            <th className="whitespace-nowrap px-3 py-3">Alvo Staging</th>
            <th className="whitespace-nowrap py-3 pl-3 pr-5 text-right sm:pr-6">
              Ação
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {scans.map((scan) => {
            const repo = formatRepositoryDisplay(scan.repositoryUrl);
            const targetHost = formatTargetHost(scan.targetUrl);
            const totalFindings =
              scan.criticalCount +
              scan.highCount +
              scan.mediumCount +
              scan.lowCount;
            const critPct =
              totalFindings > 0
                ? (scan.criticalCount / totalFindings) * 100
                : 0;
            const highPct =
              totalFindings > 0 ? (scan.highCount / totalFindings) * 100 : 0;
            const medPct =
              totalFindings > 0 ? (scan.mediumCount / totalFindings) * 100 : 0;
            const lowPct =
              totalFindings > 0 ? (scan.lowCount / totalFindings) * 100 : 0;

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
                          {new Date(scan.createdAt).toLocaleString('pt-BR', {
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
                  <StatusPill meta={SCAN_STATUS_REGISTRY[scan.status]} />
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
                        title={`${scan.criticalCount} Crítica(s)`}
                        className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                      >
                        C:{scan.criticalCount}
                      </span>
                      <span
                        title={`${scan.highCount} Alta(s)`}
                        className="inline-flex items-center rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300"
                      >
                        A:{scan.highCount}
                      </span>
                      <span
                        title={`${scan.mediumCount} Média(s)`}
                        className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                      >
                        M:{scan.mediumCount}
                      </span>
                      {scan.lowCount > 0 ? (
                        <span
                          title={`${scan.lowCount} Baixa(s)`}
                          className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300"
                        >
                          B:{scan.lowCount}
                        </span>
                      ) : null}
                    </div>
                    {totalFindings > 0 ? (
                      <div
                        aria-hidden="true"
                        className="flex h-1 w-full overflow-hidden rounded-full bg-surface-subtle"
                      >
                        {critPct > 0 ? (
                          <div
                            className="bg-rose-500"
                            style={{ width: `${critPct}%` }}
                          />
                        ) : null}
                        {highPct > 0 ? (
                          <div
                            className="bg-orange-500"
                            style={{ width: `${highPct}%` }}
                          />
                        ) : null}
                        {medPct > 0 ? (
                          <div
                            className="bg-amber-400"
                            style={{ width: `${medPct}%` }}
                          />
                        ) : null}
                        {lowPct > 0 ? (
                          <div
                            className="bg-sky-400"
                            style={{ width: `${lowPct}%` }}
                          />
                        ) : null}
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
                      Somente SCA
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
                      <span>Ver Veredito</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                    {onDelete ? (
                      <button
                        type="button"
                        disabled={deletingId === scan.id}
                        onClick={() => void handleDelete(scan.id)}
                        aria-label={`Excluir varredura ${repo.displayName}`}
                        title="Remover do histórico"
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
