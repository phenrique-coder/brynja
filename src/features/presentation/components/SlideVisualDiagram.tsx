'use client';

import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Ban,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  CloudOff,
  Code2,
  Cpu,
  Database,
  FileSpreadsheet,
  FileText,
  Gauge,
  GitBranch,
  Github,
  Globe,
  History,
  KeyRound,
  Laptop,
  Layers,
  Lock,
  Radar,
  Scale,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Upload,
  Users,
} from 'lucide-react';
import type { Locale } from '@/core/i18n/types';
import { BrynjaLogo } from '@/features/scans/components/BrynjaLogo';
import { DIAGRAM_COPY_BY_LOCALE } from '../data/diagram-copy';
import type { SlideVisualKind } from '../models/presentation.models';

export interface SlideVisualDiagramProps {
  visual: SlideVisualKind;
  appVersion: string;
  showTechnicalDetails: boolean;
  locale: Locale;
  compact?: boolean;
}

export function SlideVisualDiagram({
  visual,
  appVersion,
  showTechnicalDetails,
  locale,
  compact = false,
}: SlideVisualDiagramProps) {
  const copy = DIAGRAM_COPY_BY_LOCALE[locale] ?? DIAGRAM_COPY_BY_LOCALE['pt-BR'];

  const wrap = (content: React.ReactNode) =>
    compact ? (
      <div className="presentation-diagram-compact">{content}</div>
    ) : (
      content
    );

  const diagram = (() => {
    switch (visual) {
      case 'hero-cover':
        return null;

      case 'cover':
        return (
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-surface-subtle to-indigo-500/10 p-5 sm:p-6">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left print:flex-row print:text-left">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-cyan-500/30 bg-surface shadow-lg shadow-cyan-950/15">
                <BrynjaLogo className="h-16 w-16 drop-shadow-sm" />
              </div>
              <div className="space-y-3">
                <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:justify-start print:justify-start">
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-0.5 font-mono text-xs font-semibold text-cyan-800 dark:text-cyan-200">
                    v{appVersion}
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    {copy.cover.localFirstBadge}
                  </span>
                  <span className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:text-indigo-200">
                    {copy.cover.defensiveBadge}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 print:grid-cols-4">
                  {copy.cover.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-subtle bg-surface/90 px-3 py-2 text-center"
                    >
                      <div className="text-lg font-bold tracking-tight text-cyan-700 dark:text-cyan-300">
                        {stat.value}
                      </div>
                      <div className="text-[11px] font-medium text-fg-secondary">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'problem': {
        const meta = [
          {
            icon: AlertTriangle,
            color:
              'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
          },
          {
            icon: CloudOff,
            color:
              'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
          },
          {
            icon: Users,
            color:
              'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
          },
        ] as const;

        return (
          <div className="grid gap-3 sm:grid-cols-3 print:grid-cols-3">
            {copy.problem.map((card, i) => {
              const Icon = meta[i].icon;
              return (
                <div
                  key={card.title}
                  className="flex flex-col justify-between rounded-2xl border border-subtle bg-surface-subtle p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${meta[i].color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="rounded-lg bg-surface px-2.5 py-1 text-xs font-bold text-fg">
                      {card.stat}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-bold text-fg">{card.title}</div>
                    <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'chainmail': {
        const meta = [
          {
            icon: Layers,
            accent:
              'border-cyan-500/35 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
          },
          {
            icon: Code2,
            accent:
              'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300',
          },
          {
            icon: Radar,
            accent:
              'border-violet-500/35 bg-violet-500/10 text-violet-700 dark:text-violet-300',
          },
          {
            icon: ClipboardCheck,
            accent:
              'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
          },
        ] as const;

        return (
          <div className="grid gap-3 sm:grid-cols-4 print:grid-cols-4">
            {copy.chainmail.map((item, index) => {
              const Icon = meta[index].icon;
              return (
                <div
                  key={item.ring}
                  className="relative flex flex-col rounded-2xl border border-subtle bg-surface-subtle p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                      {item.ring}
                    </span>
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border ${meta[index].accent}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-bold text-fg">
                    {item.title}
                  </div>
                  <div className="mt-1 text-xs text-fg-secondary">
                    {item.subtitle}
                  </div>
                  {index < 3 ? (
                    <ArrowRight className="pointer-events-none absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-fg-muted sm:block" />
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      }

      case 'local-first':
        return (
          <div className="grid gap-3 md:grid-cols-3 print:grid-cols-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Laptop className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {copy.localFirst.browserTitle}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-fg-secondary">
                {copy.localFirst.browserDesc}
              </p>
              {showTechnicalDetails ? (
                <div className="mt-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                  IndexedDB · ownerGithubUserId
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4">
              <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                <Cpu className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {copy.localFirst.serverTitle}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-fg-secondary">
                {copy.localFirst.serverDesc}
              </p>
              {showTechnicalDetails ? (
                <div className="mt-2 font-mono text-[11px] text-cyan-700 dark:text-cyan-300">
                  Cookie HttpOnly AES-256-GCM
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <Database className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {copy.localFirst.cloudTitle}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {copy.localFirst.cloudHighlight}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                {copy.localFirst.cloudDesc}
              </p>
            </div>
          </div>
        );

      case 'journey-map': {
        const icons = [
          Github,
          Lock,
          Layers,
          ShieldCheck,
          FileText,
          ClipboardCheck,
          History,
        ] as const;

        return (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7 print:grid-cols-7">
            {copy.journeyMap.steps.map((title, idx) => {
              const Icon = icons[idx];
              const num = String(idx + 1).padStart(2, '0');
              return (
                <div
                  key={num}
                  className="flex flex-col items-center rounded-2xl border border-subtle bg-surface-subtle p-3 text-center"
                >
                  <span className="font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
                    {copy.journeyMap.stepPrefix} {num}
                  </span>
                  <span className="mt-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="mt-2 text-xs font-bold leading-tight text-fg">
                    {title}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }

      case 'stage-auth': {
        const icons = [Github, KeyRound, Users] as const;
        return (
          <div className="grid gap-3 sm:grid-cols-3 print:grid-cols-3">
            {copy.stageAuth.map((item, idx) => {
              const Icon = icons[idx];
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-subtle bg-surface-subtle p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-fg-secondary">
                      {item.badge}
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-bold text-fg">
                    {item.title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        );
      }

      case 'stage-authz': {
        const icons = [Globe, Terminal, CheckCircle2, Lock] as const;
        return (
          <div className="grid gap-3 sm:grid-cols-4 print:grid-cols-4">
            {copy.stageAuthz.map((item, idx) => {
              const Icon = icons[idx];
              return (
                <div
                  key={item.step}
                  className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      {item.step}
                    </span>
                    <Icon className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div className="mt-2 text-sm font-bold text-fg">
                    {item.title}
                  </div>
                  <p className="mt-1 text-xs text-fg-secondary">{item.desc}</p>
                </div>
              );
            })}
          </div>
        );
      }

      case 'stage-new-scan':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 print:grid-cols-4">
              {[
                { eco: 'Node.js / JS / TS', files: 'package.json, pnpm, yarn' },
                { eco: 'Python', files: 'requirements.txt, pyproject' },
                { eco: 'Java / Kotlin', files: 'pom.xml, gradle.lockfile' },
                { eco: '.NET (C#)', files: '*.csproj, packages.lock' },
                { eco: 'Go', files: 'go.mod, go.sum' },
                { eco: 'Rust', files: 'Cargo.toml, Cargo.lock' },
                { eco: 'PHP', files: 'composer.json / .lock' },
                { eco: 'Ruby', files: 'Gemfile.lock' },
              ].map((item) => (
                <div
                  key={item.eco}
                  className="rounded-xl border border-subtle bg-surface-subtle px-3 py-2.5"
                >
                  <div className="text-xs font-bold text-fg">{item.eco}</div>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-fg-muted">
                    {item.files}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-3.5 py-2 text-xs text-fg-secondary">
              <span className="font-semibold text-cyan-800 dark:text-cyan-200">
                {copy.stageNewScan.crossStackPrefix}
              </span>
              <span>{copy.stageNewScan.crossStackSummary}</span>
            </div>
          </div>
        );

      case 'layer-sca': {
        const sources = [
          {
            name: 'OSV.dev',
            tone: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200',
          },
          {
            name: 'NVD (NIST)',
            tone: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200',
          },
          {
            name: 'FIRST EPSS',
            tone: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200',
          },
          {
            name: 'CISA KEV',
            tone: 'border-rose-500/35 bg-rose-500/10 text-rose-800 dark:text-rose-200',
          },
          {
            name: 'deps.dev',
            tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
          },
        ] as const;

        return (
          <div className="grid gap-2.5 sm:grid-cols-5 print:grid-cols-5">
            {sources.map((src, idx) => (
              <div
                key={src.name}
                className="flex flex-col rounded-2xl border border-subtle bg-surface-subtle p-3.5"
              >
                <span
                  className={`inline-flex w-fit rounded-lg border px-2 py-0.5 text-xs font-bold ${src.tone}`}
                >
                  {src.name}
                </span>
                <p className="mt-2.5 text-xs leading-relaxed text-fg-secondary">
                  {copy.layerSca[idx]}
                </p>
              </div>
            ))}
          </div>
        );
      }

      case 'layer-static': {
        const meta = [
          { icon: KeyRound, tone: 'text-rose-700 dark:text-rose-300' },
          { icon: Server, tone: 'text-amber-700 dark:text-amber-300' },
          { icon: Code2, tone: 'text-cyan-700 dark:text-cyan-300' },
          { icon: GitBranch, tone: 'text-emerald-700 dark:text-emerald-300' },
        ] as const;

        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
            {copy.layerStatic.map((box, idx) => {
              const Icon = meta[idx].icon;
              return (
                <div
                  key={box.title}
                  className="rounded-2xl border border-subtle bg-surface-subtle p-4"
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${meta[idx].tone}`} />
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-fg-muted">
                      {box.note}
                    </span>
                  </div>
                  <div className="mt-2.5 text-sm font-bold text-fg">
                    {box.title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                    {box.items}
                  </p>
                </div>
              );
            })}
          </div>
        );
      }

      case 'layer-probes': {
        const accents = [
          'border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200',
          'border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200',
          'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200',
          'border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-200',
        ] as const;

        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
            {copy.layerProbes.map((cat, idx) => (
              <div
                key={cat.title}
                className="rounded-2xl border border-subtle bg-surface-subtle p-4"
              >
                <span
                  className={`inline-flex rounded-lg border px-2 py-0.5 text-[11px] font-bold ${accents[idx]}`}
                >
                  {cat.count}
                </span>
                <div className="mt-2.5 text-sm font-bold text-fg">
                  {cat.title}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-fg-secondary">
                  {cat.examples}
                </p>
              </div>
            ))}
          </div>
        );
      }

      case 'guardrails': {
        const icons = [Lock, Ban, ShieldAlert, Gauge] as const;
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
            {copy.guardrails.map((g, idx) => {
              const Icon = icons[idx];
              return (
                <div
                  key={g.title}
                  className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                    <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                      {g.value}
                    </span>
                  </div>
                  <div className="mt-2.5 text-sm font-bold text-fg">
                    {g.title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                    {g.desc}
                  </p>
                </div>
              );
            })}
          </div>
        );
      }

      case 'layer-ai': {
        const meta = [
          { icon: KeyRound, tone: 'text-cyan-700 dark:text-cyan-300' },
          { icon: Shield, tone: 'text-emerald-700 dark:text-emerald-300' },
          { icon: Bot, tone: 'text-violet-700 dark:text-violet-300' },
        ] as const;

        return (
          <div className="grid gap-3 md:grid-cols-3 print:grid-cols-3">
            {copy.layerAi.map((card, idx) => {
              const Icon = meta[idx].icon;
              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-subtle bg-surface-subtle p-4"
                >
                  <div className={`flex items-center gap-2 ${meta[idx].tone}`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {card.title}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-fg-secondary">
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>
        );
      }

      case 'stage-reports': {
        const meta = [
          {
            icon: FileText,
            accent:
              'border-cyan-500/35 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200',
          },
          {
            icon: Sparkles,
            accent:
              'border-violet-500/35 bg-violet-500/10 text-violet-800 dark:text-violet-200',
          },
          {
            icon: Scale,
            accent:
              'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
          },
        ] as const;

        return (
          <div className="grid gap-3 md:grid-cols-3 print:grid-cols-3">
            {copy.stageReports.map((col, idx) => {
              const Icon = meta[idx].icon;
              return (
                <div
                  key={col.audience}
                  className="rounded-2xl border border-subtle bg-surface-subtle p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${meta[idx].accent}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {col.format}
                    </span>
                  </div>
                  <div className="mt-2.5 text-sm font-bold text-fg">
                    {col.audience}
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-fg-secondary">
                    {col.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        );
      }

      case 'stage-governance': {
        const fws = [
          {
            fw: 'CIS Controls v8',
            tone: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200',
          },
          {
            fw: 'NIST CSF 2.0',
            tone: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200',
          },
          {
            fw: 'OWASP ASVS / Top 10',
            tone: 'border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-200',
          },
          {
            fw: 'LGPD & ISO 27001',
            tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
          },
        ] as const;

        return (
          <div className="space-y-3">
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
              {fws.map((item, idx) => (
                <div
                  key={item.fw}
                  className="rounded-2xl border border-subtle bg-surface-subtle p-3.5"
                >
                  <span
                    className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-bold ${item.tone}`}
                  >
                    {item.fw}
                  </span>
                  <p className="mt-2 text-xs text-fg-secondary">
                    {copy.stageGovernance.frameworks[idx]}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-2.5 text-xs">
              <span className="inline-flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200">
                <FileSpreadsheet className="h-4 w-4" />
                {copy.stageGovernance.excelBanner}
              </span>
              <span className="text-fg-secondary">
                {copy.stageGovernance.excelSubtext}
              </span>
            </div>
          </div>
        );
      }

      case 'stage-history-audit': {
        const icons = [Activity, Upload, ShieldCheck] as const;
        return (
          <div className="grid gap-3 md:grid-cols-3 print:grid-cols-3">
            {copy.stageHistoryAudit.map((item, idx) => {
              const Icon = icons[idx];
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-subtle bg-surface-subtle p-4"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                    <span className="rounded-full bg-surface px-2.5 py-0.5 text-[10px] font-bold text-fg-secondary">
                      {item.badge}
                    </span>
                  </div>
                  <div className="mt-2.5 text-sm font-bold text-fg">
                    {item.title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        );
      }

      case 'daily-routine':
        return (
          <div className="grid gap-3 md:grid-cols-2 print:grid-cols-2">
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-800 dark:text-cyan-200">
                <Terminal className="h-4 w-4" />
                {copy.dailyRoutine.itTitle}
              </div>
              <div className="mt-3 space-y-2 text-xs text-fg-secondary">
                {copy.dailyRoutine.itItems.map((row) => (
                  <div key={row.tag} className="flex items-start gap-2">
                    <span className="shrink-0 rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-800 dark:text-cyan-200">
                      {row.tag}
                    </span>
                    <span>{row.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200">
                <ClipboardCheck className="h-4 w-4" />
                {copy.dailyRoutine.boardTitle}
              </div>
              <div className="mt-3 space-y-2 text-xs text-fg-secondary">
                {copy.dailyRoutine.boardItems.map((row) => (
                  <div key={row.tag} className="flex items-start gap-2">
                    <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                      {row.tag}
                    </span>
                    <span>{row.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'pilot-roadmap':
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
            {copy.pilotRoadmap.map((item, idx) => (
              <div
                key={item.week}
                className={`rounded-2xl border p-4 ${
                  idx === 3
                    ? 'border-emerald-500/35 bg-emerald-500/10'
                    : 'border-subtle bg-surface-subtle'
                }`}
              >
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                  {item.week}
                </span>
                <div className="mt-1.5 text-sm font-bold text-fg">
                  {item.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        );
    }
  })();

  return wrap(diagram);
}
