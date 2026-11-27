'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  Code2,
  Container,
  FileJson2,
  KeyRound,
  Package,
  Radar,
  ShieldCheck,
} from 'lucide-react';
import {
  CROSS_STACK_LAYERS,
  CrossStackLayerId,
  ECOSYSTEMS_CATALOG,
} from '@/core/catalog/ecosystems.catalog';
import { useI18n } from '@/core/providers/i18n-provider';
import { SurfaceCard } from './ui/PagePrimitives';

export type EcosystemSupportFilter = 'ALL' | 'NATIVE_SAST' | 'SCA_EXTERNAL';

export interface SupportedEcosystemsSectionProps {
  id?: string;
}

const CROSS_STACK_ICON_MAP: Record<
  CrossStackLayerId,
  React.ComponentType<{ className?: string }>
> = {
  'iac-cicd': Container,
  'secrets-posture': KeyRound,
  'safe-probes': Radar,
  'external-imports': FileJson2,
};

/**
 * Compact one-row strip for DashboardView highlighting all 8 supported SCA
 * ecosystems plus SAST/IaC/Probes coverage, linking directly to the full
 * interactive matrix on `/scans/new#ecosystems-catalog`.
 */
export function SupportedEcosystemsBar() {
  const { messages, t } = useI18n();
  const cat = messages.ecosystemsCatalog;

  return (
    <SurfaceCard className="px-4 py-3.5 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-2.5 sm:items-center">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Boxes className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-fg">
                {cat.compactTitle}
              </span>
              <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
                {t(cat.countBadge, { count: ECOSYSTEMS_CATALOG.length })}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-fg-secondary">
              {cat.compactSubtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ECOSYSTEMS_CATALOG.map((item) => {
            const copy = cat.items[item.id];
            return (
              <span
                key={item.id}
                title={`${copy.language} (${item.manifests.join(', ')})`}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[11px] font-semibold transition ${
                  item.sastSupport === 'native'
                    ? 'border-cyan-500/35 bg-cyan-50/80 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200'
                    : 'border-subtle bg-surface-subtle text-fg-secondary'
                }`}
              >
                <span>{item.id}</span>
                {item.sastSupport === 'native' ? (
                  <span className="font-sans text-[9px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                    +SAST
                  </span>
                ) : null}
              </span>
            );
          })}

          <Link
            href="/scans/new#ecosystems-catalog"
            className="ml-1 inline-flex items-center gap-1 rounded-lg border border-subtle bg-surface px-2.5 py-1 text-[11px] font-semibold text-cyan-700 transition hover:border-cyan-500/40 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            <span>{cat.compactExploreLink}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </SurfaceCard>
  );
}

/**
 * Full interactive catalog of supported package ecosystems, manifest/lockfile
 * formats, SAST/Reachability language scope, and language-agnostic layers.
 */
export function SupportedEcosystemsSection({
  id = 'ecosystems-catalog',
}: SupportedEcosystemsSectionProps) {
  const { messages, t } = useI18n();
  const cat = messages.ecosystemsCatalog;
  const [filter, setFilter] = useState<EcosystemSupportFilter>('ALL');

  const nativeCount = useMemo(
    () => ECOSYSTEMS_CATALOG.filter((e) => e.sastSupport === 'native').length,
    [],
  );
  const externalCount = ECOSYSTEMS_CATALOG.length - nativeCount;

  const visibleEcosystems = useMemo(() => {
    if (filter === 'NATIVE_SAST') {
      return ECOSYSTEMS_CATALOG.filter((e) => e.sastSupport === 'native');
    }
    if (filter === 'SCA_EXTERNAL') {
      return ECOSYSTEMS_CATALOG.filter((e) => e.sastSupport === 'external-import');
    }
    return ECOSYSTEMS_CATALOG;
  }, [filter]);

  return (
    <SurfaceCard id={id} className="space-y-5 p-5 sm:p-6">
      {/* Header Row */}
      <div className="flex flex-col gap-3 border-b border-subtle pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Boxes className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold tracking-tight text-fg">
              {cat.title}
            </h2>
            <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
              {t(cat.countBadge, { count: ECOSYSTEMS_CATALOG.length })}
            </span>
            <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              {cat.sbomBadge}
            </span>
          </div>
          <p className="max-w-3xl text-xs leading-relaxed text-fg-secondary">
            {cat.subtitle}
          </p>
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-3 py-1.5 text-xs font-medium text-fg-secondary">
            <Code2 className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
            <span>{cat.sastScopePill}</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        role="tablist"
        aria-label={cat.title}
        className="flex flex-wrap items-center gap-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            filter === 'ALL'
              ? 'border-cyan-500/50 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200'
              : 'border-subtle bg-surface-subtle text-fg-secondary hover:border-strong hover:text-fg'
          }`}
        >
          {t(cat.filterAll, { count: ECOSYSTEMS_CATALOG.length })}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={filter === 'NATIVE_SAST'}
          onClick={() => setFilter('NATIVE_SAST')}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            filter === 'NATIVE_SAST'
              ? 'border-cyan-500/50 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200'
              : 'border-subtle bg-surface-subtle text-fg-secondary hover:border-strong hover:text-fg'
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>{t(cat.filterWithNativeSast, { count: nativeCount })}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={filter === 'SCA_EXTERNAL'}
          onClick={() => setFilter('SCA_EXTERNAL')}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            filter === 'SCA_EXTERNAL'
              ? 'border-cyan-500/50 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200'
              : 'border-subtle bg-surface-subtle text-fg-secondary hover:border-strong hover:text-fg'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          <span>{t(cat.filterScaExternal, { count: externalCount })}</span>
        </button>
      </div>

      {/* 8 Ecosystem Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {visibleEcosystems.map((item) => {
          const copy = cat.items[item.id];
          const isNativeSast = item.sastSupport === 'native';

          return (
            <article
              key={item.id}
              data-ecosystem={item.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-subtle bg-surface-subtle/70 p-4 transition hover:border-cyan-500/40"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-snug text-fg">
                      {copy.language}
                    </h3>
                    <span className="mt-1 inline-flex items-center rounded border border-indigo-500/30 bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
                      {item.id}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {cat.scaBadge}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                      isNativeSast
                        ? 'border-cyan-500/35 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200'
                        : 'border-subtle bg-surface text-fg-muted'
                    }`}
                  >
                    {isNativeSast ? cat.nativeSastBadge : cat.externalSastBadge}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-fg-secondary">
                  {copy.description}
                </p>
              </div>

              <div className="space-y-1.5 border-t border-subtle/70 pt-2.5">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                  {cat.manifestsLabel}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.manifests.map((manifest) => (
                    <code
                      key={manifest}
                      className="rounded-md border border-subtle bg-surface px-2 py-0.5 font-mono text-[10px] text-fg-secondary"
                    >
                      {manifest}
                    </code>
                  ))}
                  {item.sastLanguages.map((ext) => (
                    <code
                      key={ext}
                      className="rounded-md border border-cyan-500/30 bg-cyan-50/70 px-1.5 py-0.5 font-mono text-[10px] text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200"
                    >
                      {ext}
                    </code>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Cross-Stack / Language-Agnostic Capabilities */}
      <div className="space-y-3 border-t border-subtle pt-4">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{cat.crossStackTitle}</span>
          </h3>
          <span className="text-[11px] text-fg-muted">
            {cat.crossStackSubtitle}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CROSS_STACK_LAYERS.map((layer) => {
            const copy = cat.crossStack[layer.id];
            const Icon = CROSS_STACK_ICON_MAP[layer.id];

            return (
              <div
                key={layer.id}
                data-cross-stack={layer.id}
                className="flex flex-col justify-between gap-2.5 rounded-xl border border-subtle bg-surface-subtle/50 p-3.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-fg">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-300" />
                    <span>{copy.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-fg-secondary">
                    {copy.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {layer.artifacts.map((artifact) => (
                    <code
                      key={artifact}
                      className="rounded border border-subtle bg-surface px-1.5 py-0.5 font-mono text-[10px] text-fg-muted"
                    >
                      {artifact}
                    </code>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SurfaceCard>
  );
}
