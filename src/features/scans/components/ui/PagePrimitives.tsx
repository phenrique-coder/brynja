import React from 'react';
import { Loader2 } from 'lucide-react';

export interface PageHeaderProps {
  badge?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  topSlot?: React.ReactNode;
}

export function PageHeader({
  badge,
  title,
  description,
  actions,
  topSlot,
}: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-subtle bg-surface p-5 shadow-sm transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0 space-y-1.5">
        {topSlot}
        {badge ? <div>{badge}</div> : null}
        <h1 className="truncate text-xl font-bold tracking-tight text-fg sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-fg-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {actions}
        </div>
      ) : null}
    </section>
  );
}

export interface SurfaceCardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function SurfaceCard({
  children,
  className = '',
  id,
}: SurfaceCardProps) {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-subtle bg-surface shadow-sm transition-colors ${className}`}
    >
      {children}
    </div>
  );
}

export interface KpiStatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  accentClass?: string;
  sublabel?: string;
}

export function KpiStatCard({
  label,
  value,
  icon,
  accentClass = 'text-fg',
  sublabel,
}: KpiStatCardProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-subtle bg-surface p-5 shadow-sm transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
          {label}
        </span>
        {icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-subtle bg-surface-subtle">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className={`text-2xl font-bold tracking-tight sm:text-3xl ${accentClass}`}>
          {value}
        </span>
        {sublabel ? (
          <span className="text-xs text-fg-muted">{sublabel}</span>
        ) : null}
      </div>
    </div>
  );
}

export function PageLoadingState({
  label = 'Carregando...',
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[42vh] items-center justify-center py-16">
      <div className="inline-flex items-center gap-2.5 rounded-2xl border border-subtle bg-surface px-4 py-3 text-sm text-fg-secondary shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
        <span>{label}</span>
      </div>
    </div>
  );
}
