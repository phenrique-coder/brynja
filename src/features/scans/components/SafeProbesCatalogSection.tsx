'use client';

import React, { useMemo, useState } from 'react';
import {
  Code2,
  Cookie,
  FileWarning,
  Radar,
  ShieldCheck,
  ShieldEllipsis,
} from 'lucide-react';
import {
  SAFE_PROBES_CATALOG,
  SafeProbeCategory,
} from '@/core/catalog/safe-probes.catalog';
import { useI18n } from '@/core/providers/i18n-provider';
import { SEVERITY_REGISTRY } from '../registries/finding-registries';
import { StatusPill } from './StatusPill';
import { SurfaceCard } from './ui/PagePrimitives';

export interface SafeProbesCatalogSectionProps {
  id?: string;
  selectedTargetOrigin?: string | null;
}

const CATEGORY_ORDER: readonly SafeProbeCategory[] = [
  'headers-tls',
  'cookies-cors',
  'exposure',
  'runtime',
];

const CATEGORY_ICON_MAP: Record<SafeProbeCategory, React.ComponentType<{ className?: string }>> = {
  'headers-tls': ShieldCheck,
  'cookies-cors': Cookie,
  exposure: FileWarning,
  runtime: Code2,
};

export function SafeProbesCatalogSection({
  id = 'safe-probes-catalog',
  selectedTargetOrigin = null,
}: SafeProbesCatalogSectionProps) {
  const { messages, t } = useI18n();
  const cat = messages.safeProbesCatalog;
  const [activeCategory, setActiveCategory] = useState<
    SafeProbeCategory | 'ALL'
  >('ALL');

  const categoryCounts = useMemo(() => {
    const counts: Record<SafeProbeCategory, number> = {
      'headers-tls': 0,
      'cookies-cors': 0,
      exposure: 0,
      runtime: 0,
    };
    for (const item of SAFE_PROBES_CATALOG) {
      counts[item.category] += 1;
    }
    return counts;
  }, []);

  const visibleProbes = useMemo(
    () =>
      activeCategory === 'ALL'
        ? SAFE_PROBES_CATALOG
        : SAFE_PROBES_CATALOG.filter((p) => p.category === activeCategory),
    [activeCategory],
  );

  return (
    <SurfaceCard id={id} className="space-y-5 p-5 sm:p-6">
      {/* Header Row */}
      <div className="flex flex-col gap-3 border-b border-subtle pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
              <Radar className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold tracking-tight text-fg">
              {cat.title}
            </h2>
            <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-300">
              {t(cat.countBadge, { count: SAFE_PROBES_CATALOG.length })}
            </span>
            <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              {cat.readOnlyBadge}
            </span>
          </div>
          <p className="max-w-3xl text-xs leading-relaxed text-fg-secondary">
            {cat.subtitle}
          </p>
        </div>

        <div className="shrink-0">
          {selectedTargetOrigin ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[260px]">
                {t(cat.statusActiveForTarget, { origin: selectedTargetOrigin })}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-3 py-1.5 text-xs font-medium text-fg-secondary">
              <ShieldEllipsis className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
              <span>{cat.statusInactiveHint}</span>
            </span>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div
        role="tablist"
        aria-label={cat.title}
        className="flex flex-wrap items-center gap-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === 'ALL'}
          onClick={() => setActiveCategory('ALL')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            activeCategory === 'ALL'
              ? 'border-cyan-500/50 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200'
              : 'border-subtle bg-surface-subtle text-fg-secondary hover:border-strong hover:text-fg'
          }`}
        >
          {t(cat.filterAll, { count: SAFE_PROBES_CATALOG.length })}
        </button>

        {CATEGORY_ORDER.map((category) => {
          const count = categoryCounts[category];
          if (count === 0) return null;
          const Icon = CATEGORY_ICON_MAP[category];
          const active = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategory(category)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'border-cyan-500/50 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200'
                  : 'border-subtle bg-surface-subtle text-fg-secondary hover:border-strong hover:text-fg'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>
                {cat.categories[category]} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Safe Probes Grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {visibleProbes.map((probe) => {
          const copy = cat.items[probe.id];
          const Icon = CATEGORY_ICON_MAP[probe.category];
          const severityMeta = SEVERITY_REGISTRY[probe.maxSeverity];
          const localizedSeverity = messages.enums.severity[probe.maxSeverity];

          return (
            <article
              key={probe.id}
              data-probe-id={probe.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-subtle bg-surface-subtle/70 p-4 transition hover:border-cyan-500/40"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-subtle bg-surface text-cyan-700 dark:text-cyan-300">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-snug text-fg">
                        {copy.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {probe.methods.map((method) => (
                          <span
                            key={method}
                            className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                          >
                            {method}
                          </span>
                        ))}
                        <span className="truncate font-mono text-[10px] text-fg-muted">
                          {probe.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <StatusPill
                      meta={severityMeta}
                      label={t(cat.maxSeverityPrefix, {
                        severity: localizedSeverity,
                      })}
                    />
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-fg-secondary">
                  {copy.summary}
                </p>

                <div className="rounded-lg border border-subtle/80 bg-surface px-3 py-2 text-[11px] leading-relaxed text-fg-secondary">
                  <span className="font-semibold text-fg">
                    {cat.whatItChecksLabel}:{' '}
                  </span>
                  {copy.checks}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {probe.targets.map((target) => (
                  <code
                    key={target}
                    className="rounded-md border border-subtle bg-surface px-2 py-0.5 font-mono text-[10px] text-fg-secondary"
                  >
                    {target}
                  </code>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {/* Defensive Guardrails Footer Note */}
      <div className="flex items-start gap-2 rounded-xl border border-subtle bg-surface-subtle/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-fg-secondary">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>{cat.guardrailsNote}</span>
      </div>
    </SurfaceCard>
  );
}
