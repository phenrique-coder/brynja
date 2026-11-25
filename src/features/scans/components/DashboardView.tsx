'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Github,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
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
  const metrics = computeDashboardMetrics(scans);

  if (authRequired) {
    return (
      <AuthRequiredCard
        returnTo="/"
        title="Conecte seu GitHub para acessar seu painel e histórico"
      />
    );
  }

  if (loading && scans.length === 0) {
    return <PageLoadingState label="Verificando sessão e carregando painel..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Pipeline Proativo com Guardrails Não Destrutivos
          </span>
        }
        title="Painel de Vulnerabilidades & Verificação Ativa"
        description="Analise bibliotecas do repositório via OSV.dev, NVD, EPSS e CISA KEV, e execute sondas controladas somente em alvos com posse verificada."
        actions={
          <>
            <Link
              href="/authorizations"
              className="inline-flex items-center gap-2 rounded-xl border border-subtle bg-surface-subtle px-4 py-2.5 text-xs font-semibold text-fg transition hover:border-strong hover:bg-surface-hover sm:text-sm"
            >
              Autorizar Alvo
            </Link>
            <Link
              href="/scans/new"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 sm:text-sm"
            >
              Nova Varredura
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiStatCard
          label="Varreduras"
          value={metrics.totalScans}
          icon={<CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
        />
        <KpiStatCard
          label="Dependências"
          value={metrics.totalDependenciesScanned}
          icon={<Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
        />
        <KpiStatCard
          label="Críticas & Altas"
          value={metrics.criticalAndHighTotal}
          accentClass="text-orange-600 dark:text-orange-300"
          icon={<AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
        />
        <KpiStatCard
          label="Confirmadas / Sondas"
          value={metrics.confirmedActiveTotal}
          accentClass="text-rose-600 dark:text-rose-300"
          icon={<ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
        />
      </section>

      <SurfaceCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-fg">
              Histórico de Varreduras
            </h2>
            <p className="text-xs text-fg-secondary">
              Selecione uma avaliação para inspecionar SBOM, CVEs, EPSS, Safe Probes e baixar o PDF.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-subtle bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-fg transition hover:border-cyan-500/40 hover:text-cyan-700 dark:hover:text-cyan-300"
            >
              Ver histórico completo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-subtle bg-surface-subtle px-3 py-1.5 text-xs font-medium text-fg-secondary transition hover:border-strong hover:text-fg"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
          </div>
        </div>

        {error ? (
          <div className="m-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 sm:m-6">
            {error}
          </div>
        ) : loading ? (
          <div className="p-10 text-center text-sm text-fg-secondary">
            Carregando varreduras...
          </div>
        ) : scans.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-fg">
              Nenhuma varredura executada nesta conta ainda.
            </p>
            <p className="mt-1 text-xs text-fg-secondary">
              Inicie uma varredura selecionando um repositório GitHub ou manifestos de exemplo.
            </p>
            <Link
              href="/scans/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-50 px-4 py-2 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-200 dark:hover:bg-cyan-500/25"
            >
              Criar primeira varredura
            </Link>
          </div>
        ) : (
          <ScanHistoryTable scans={scans.slice(0, 10)} onDelete={removeScan} />
        )}
      </SurfaceCard>

      <footer className="flex justify-center pt-2">
        <a
          href="https://github.com/phenrique-coder/brynja"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface px-3.5 py-1.5 text-xs font-medium text-fg-secondary shadow-sm transition hover:border-cyan-500/40 hover:text-cyan-700 dark:hover:text-cyan-300"
        >
          <Github className="h-3.5 w-3.5 shrink-0" />
          <span>Brynja Open-Source ·</span>
          <span className="font-mono text-cyan-700 dark:text-cyan-300">
            github.com/phenrique-coder/brynja
          </span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
        </a>
      </footer>
    </div>
  );
}
