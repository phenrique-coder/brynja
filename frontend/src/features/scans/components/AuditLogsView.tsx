'use client';

import React from 'react';
import {
  CheckCircle2,
  RefreshCw,
  ScrollText,
  ShieldAlert,
} from 'lucide-react';
import { useAuditLogs } from '../hooks/use-scans';
import { AuthRequiredCard } from './AuthRequiredCard';
import { KpiStatCard, PageHeader, SurfaceCard } from './ui/PagePrimitives';

export function AuditLogsView() {
  const { logs, loading, authRequired, error, refresh } = useAuditLogs();

  if (authRequired) {
    return (
      <AuthRequiredCard
        returnTo="/audit"
        title="Conecte seu GitHub para visualizar sua trilha de auditoria"
      />
    );
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
        title="Trilha Imutável de Auditoria"
        description="Todos os eventos de verificação de posse, bloqueios anti-SSRF, rate limiting e execução de safe probes da sua conta ficam registrados em PostgreSQL."
        actions={
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2 text-xs font-semibold text-fg-secondary transition hover:border-strong hover:text-fg"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </button>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiStatCard
          label="Total de Eventos"
          value={logs.length}
          icon={<ScrollText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
        />
        <KpiStatCard
          label="Autorizados / Executados"
          value={allowedOrExecuted}
          accentClass="text-emerald-600 dark:text-emerald-300"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        />
        <KpiStatCard
          label="Bloqueados por Guardrail"
          value={blockedCount}
          accentClass="text-rose-600 dark:text-rose-300"
          icon={<ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
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
                <th className="px-5 py-3">Data/Hora</th>
                <th className="px-4 py-3">Desfecho</th>
                <th className="px-4 py-3">Alvo</th>
                <th className="px-4 py-3">Sonda / Método</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-fg-secondary"
                  >
                    Carregando logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-fg-secondary"
                  >
                    Nenhum evento registrado até o momento.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-surface-hover/50"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-fg-muted">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
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
