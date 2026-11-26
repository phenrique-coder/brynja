'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
} from 'lucide-react';
import {
  COMPLIANCE_FRAMEWORK_IDS,
  COMPLIANCE_FRAMEWORKS,
} from '@/core/catalog/compliance-frameworks.catalog';
import {
  CisImplementationGroup,
  ComplianceFrameworkId,
  GrcAssessment,
  ScanReport,
} from '@/core/models/scan.models';
import { useI18n } from '@/core/providers/i18n-provider';
import {
  ComplianceControlStatus,
  evaluateComplianceFramework,
} from '../presenters/compliance.presenter';
import { COMPLIANCE_STATUS_REGISTRY } from '../registries/finding-registries';
import { StatusPill } from './StatusPill';
import { KpiStatCard, SurfaceCard } from './ui/PagePrimitives';

export interface ComplianceScorecardTabProps {
  report: ScanReport;
  linkedAssessment?: GrcAssessment | null;
}

export function ComplianceScorecardTab({
  report,
  linkedAssessment = null,
}: ComplianceScorecardTabProps) {
  const { locale, messages, t } = useI18n();
  const [frameworkId, setFrameworkId] =
    useState<ComplianceFrameworkId>('cis-v8');
  const [cisIgFilter, setCisIgFilter] = useState<
    CisImplementationGroup | 'ALL'
  >('ALL');
  const [statusFilter, setStatusFilter] = useState<
    ComplianceControlStatus | 'ALL'
  >('ALL');

  const scorecard = useMemo(
    () =>
      evaluateComplianceFramework(report, {
        frameworkId,
        locale,
        maxCisIg:
          frameworkId === 'cis-v8' && cisIgFilter !== 'ALL'
            ? cisIgFilter
            : undefined,
        assessment: linkedAssessment,
      }),
    [report, frameworkId, locale, cisIgFilter, linkedAssessment],
  );

  const visibleControls = useMemo(() => {
    if (statusFilter === 'ALL') return scorecard.controls;
    return scorecard.controls.filter((c) => c.status === statusFilter);
  }, [scorecard.controls, statusFilter]);

  const scopeLabelMap = {
    TECHNICAL: messages.compliance.scopeTechnical,
    HYBRID: messages.compliance.scopeHybrid,
    ORGANIZATIONAL: messages.compliance.scopeOrganizational,
  };

  return (
    <div className="space-y-4">
      <SurfaceCard className="space-y-4 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-fg">
              {messages.compliance.tabTitle}
            </h2>
            <p className="mt-0.5 text-xs text-fg-secondary">
              {messages.compliance.tabSubtitle}
            </p>
          </div>
          <Link
            href={`/governance?scanId=${encodeURIComponent(report.id)}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-cyan-500/35 bg-cyan-50 px-3.5 py-2 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>{messages.compliance.openGovernanceCta}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {linkedAssessment ? (
          <div className="flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-50 px-3.5 py-2 text-xs font-medium text-teal-800 dark:bg-teal-500/10 dark:text-teal-200">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>
              {t(messages.compliance.linkedAssessmentNote, {
                name: linkedAssessment.name,
              })}
            </span>
          </div>
        ) : null}

        {/* Framework Switcher + Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label={messages.compliance.frameworkSelectorLabel}
            className="flex flex-wrap gap-1.5 rounded-xl border border-subtle bg-surface-subtle p-1"
          >
            {COMPLIANCE_FRAMEWORK_IDS.map((id) => {
              const meta = COMPLIANCE_FRAMEWORKS[id];
              const active = frameworkId === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFrameworkId(id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-surface text-cyan-700 shadow-sm ring-1 ring-black/5 dark:text-cyan-300 dark:ring-white/10'
                      : 'text-fg-secondary hover:text-fg'
                  }`}
                >
                  {meta.copy[locale].shortName}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {frameworkId === 'cis-v8' ? (
              <select
                aria-label={messages.compliance.igFilterLabel}
                value={cisIgFilter}
                onChange={(e) =>
                  setCisIgFilter(
                    e.target.value as CisImplementationGroup | 'ALL',
                  )
                }
                className="rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs font-medium text-fg"
              >
                <option value="ALL">{messages.compliance.igAll}</option>
                <option value="IG1">IG1 (Essencial)</option>
                <option value="IG2">IG1 + IG2</option>
                <option value="IG3">IG1 + IG2 + IG3</option>
              </select>
            ) : null}

            <select
              aria-label={messages.compliance.statusFilterLabel}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as ComplianceControlStatus | 'ALL',
                )
              }
              className="rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs font-medium text-fg"
            >
              <option value="ALL">{messages.compliance.allStatuses}</option>
              {(
                Object.keys(
                  COMPLIANCE_STATUS_REGISTRY,
                ) as ComplianceControlStatus[]
              ).map((st) => (
                <option key={st} value={st}>
                  {messages.compliance.statusLabels[st]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-fg-muted">{scorecard.description}</p>
      </SurfaceCard>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiStatCard
          label={messages.compliance.kpiTechnicalAdherence}
          value={`${scorecard.summary.technicalAdherencePercent}%`}
          accentClass="text-cyan-600 dark:text-cyan-300"
          sublabel={`${scorecard.summary.technicalEvaluatedCount}/${scorecard.summary.applicableControls}`}
        />
        <KpiStatCard
          label={messages.compliance.kpiOverallAdherence}
          value={`${scorecard.summary.overallAdherencePercent}%`}
          accentClass="text-indigo-600 dark:text-indigo-300"
          sublabel={scorecard.version}
        />
        <KpiStatCard
          label={messages.compliance.kpiCompliant}
          value={scorecard.summary.compliantCount}
          accentClass="text-emerald-600 dark:text-emerald-300"
          icon={
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          }
        />
        <KpiStatCard
          label={`${messages.compliance.kpiGaps} / ${messages.compliance.kpiPending}`}
          value={`${scorecard.summary.gapCount} / ${scorecard.summary.pendingManualOrNotEvaluatedCount}`}
          accentClass={
            scorecard.summary.gapCount > 0
              ? 'text-rose-600 dark:text-rose-300'
              : 'text-fg'
          }
          icon={
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          }
        />
      </div>

      {/* Domain Breakdown */}
      <SurfaceCard className="p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
          {messages.compliance.domainBreakdownTitle}
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {scorecard.domains.map((domain) => {
            const pct =
              domain.total > 0
                ? Math.round(
                    ((domain.compliant + domain.partial * 0.5) / domain.total) *
                      100,
                  )
                : 0;
            return (
              <div
                key={domain.domainKey}
                className="rounded-xl border border-subtle bg-surface-subtle/60 p-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-fg">
                    {domain.domainLabel}
                  </span>
                  <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-300">
                    {pct}%
                  </span>
                </div>
                <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-surface">
                  {domain.total > 0 ? (
                    <>
                      <div
                        className="bg-emerald-500"
                        style={{
                          width: `${(domain.compliant / domain.total) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-amber-400"
                        style={{
                          width: `${(domain.partial / domain.total) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-rose-500"
                        style={{
                          width: `${(domain.gaps / domain.total) * 100}%`,
                        }}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </SurfaceCard>

      {/* Controls List */}
      {visibleControls.length === 0 ? (
        <SurfaceCard className="p-8 text-center text-sm text-fg-secondary">
          {messages.compliance.emptyFiltered}
        </SurfaceCard>
      ) : (
        <div className="space-y-3">
          {visibleControls.map((ctrl) => (
            <SurfaceCard key={ctrl.controlId} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-cyan-500/30 bg-cyan-50 px-2 py-0.5 font-mono text-xs font-bold text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200">
                      {ctrl.code}
                    </span>
                    {ctrl.implementationGroup ? (
                      <span className="rounded-md border border-subtle bg-surface-subtle px-2 py-0.5 font-mono text-[11px] font-semibold text-fg-secondary">
                        {ctrl.implementationGroup}
                      </span>
                    ) : null}
                    <span className="rounded-md border border-subtle bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-fg-muted">
                      {scopeLabelMap[ctrl.assessmentScope]}
                    </span>
                    <StatusPill
                      meta={COMPLIANCE_STATUS_REGISTRY[ctrl.status]}
                      label={messages.compliance.statusLabels[ctrl.status]}
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-fg">
                    {ctrl.title}
                  </h3>
                  <p className="text-xs text-fg-muted">{ctrl.domainLabel}</p>
                </div>
              </div>

              <p className="mt-2.5 text-xs leading-relaxed text-fg-secondary">
                {ctrl.description}
              </p>

              <div className="mt-3 space-y-1.5 rounded-xl border border-subtle bg-surface-subtle/60 p-3 text-xs">
                <p className="text-fg-secondary">
                  <strong className="text-fg">
                    {messages.compliance.evidencePrefix}
                  </strong>{' '}
                  {ctrl.evidenceSummary}
                </p>
                <p className="text-emerald-700 dark:text-emerald-300">
                  <strong>{messages.compliance.guidancePrefix}</strong>{' '}
                  {ctrl.guidance}
                </p>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}
