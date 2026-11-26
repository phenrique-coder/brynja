'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import {
  COMPLIANCE_FRAMEWORK_IDS,
  COMPLIANCE_FRAMEWORKS,
} from '@/core/catalog/compliance-frameworks.catalog';
import {
  CisImplementationGroup,
  ComplianceFrameworkId,
  GrcAssessment,
  GrcControlResponse,
  GrcManualAttestationStatus,
  ScanReport,
} from '@/core/models/scan.models';
import { useScanReader } from '@/core/providers/gateway-provider';
import { useI18n } from '@/core/providers/i18n-provider';
import { useGrcAssessments, useScanList } from '../hooks/use-scans';
import {
  buildComplianceMatrixCsv,
  evaluateComplianceFramework,
} from '../presenters/compliance.presenter';
import { COMPLIANCE_STATUS_REGISTRY } from '../registries/finding-registries';
import { AuthRequiredCard } from './AuthRequiredCard';
import { StatusPill } from './StatusPill';
import {
  KpiStatCard,
  PageHeader,
  PageLoadingState,
  SurfaceCard,
} from './ui/PagePrimitives';

function makeLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `grc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDraftAssessment(
  defaultName: string,
  linkedScanId: string | null = null,
  repositoryUrl: string | null = null,
): GrcAssessment {
  const now = new Date().toISOString();
  return {
    id: makeLocalId(),
    name: defaultName,
    repositoryUrl,
    linkedScanId,
    targetIg: 'IG2',
    responses: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function GovernanceView({ initialScanId }: { initialScanId?: string }) {
  const { messages, locale, intlLocale, t } = useI18n();
  const scanReader = useScanReader();
  const {
    assessments,
    loading,
    authRequired,
    error,
    saveAssessment,
    deleteAssessment,
  } = useGrcAssessments();
  const { scans } = useScanList(50);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GrcAssessment | null>(null);
  const [linkedReport, setLinkedReport] = useState<ScanReport | null>(null);
  const [frameworkId, setFrameworkId] =
    useState<ComplianceFrameworkId>('cis-v8');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Initialize active assessment once assessments or initialScanId load
  useEffect(() => {
    if (loading || authRequired) return;
    if (draft) return;

    if (initialScanId) {
      const matching = assessments.find((a) => a.linkedScanId === initialScanId);
      if (matching) {
        setActiveId(matching.id);
        setDraft(matching);
        return;
      }
      const scanMatch = scans.find((s) => s.id === initialScanId);
      const created = createDraftAssessment(
        scanMatch
          ? `${messages.compliance.governance.defaultAssessmentName} — ${scanMatch.repositoryUrl.replace(/^https:\/\/github\.com\//i, '')}`
          : messages.compliance.governance.defaultAssessmentName,
        initialScanId,
        scanMatch?.repositoryUrl ?? null,
      );
      setActiveId(created.id);
      setDraft(created);
      return;
    }

    if (assessments.length > 0) {
      setActiveId(assessments[0].id);
      setDraft(assessments[0]);
    }
  }, [
    loading,
    authRequired,
    draft,
    initialScanId,
    assessments,
    scans,
    messages.compliance.governance.defaultAssessmentName,
  ]);

  // Fetch linked full ScanReport whenever draft.linkedScanId changes
  useEffect(() => {
    const scanId = draft?.linkedScanId;
    if (!scanId) {
      setLinkedReport(null);
      return;
    }
    let cancelled = false;
    void scanReader
      .getScanReport(scanId)
      .then((report) => {
        if (!cancelled) setLinkedReport(report);
      })
      .catch(() => {
        if (!cancelled) setLinkedReport(null);
      });
    return () => {
      cancelled = true;
    };
  }, [draft?.linkedScanId, scanReader]);

  const scorecard = useMemo(
    () =>
      evaluateComplianceFramework(linkedReport, {
        frameworkId,
        locale,
        maxCisIg: frameworkId === 'cis-v8' ? draft?.targetIg : undefined,
        assessment: draft,
      }),
    [linkedReport, frameworkId, locale, draft],
  );

  if (authRequired) {
    return (
      <AuthRequiredCard
        returnTo="/governance"
        title={messages.authCard.governanceTitle}
      />
    );
  }

  if (loading && !draft) {
    return <PageLoadingState label={messages.compliance.governance.loading} />;
  }

  function handleSelectAssessment(item: GrcAssessment) {
    setActiveId(item.id);
    setDraft(item);
    setConfirmDeleteId(null);
  }

  function handleCreateNew() {
    const newItem = createDraftAssessment(
      messages.compliance.governance.defaultAssessmentName,
      scans[0]?.id ?? null,
      scans[0]?.repositoryUrl ?? null,
    );
    setActiveId(newItem.id);
    setDraft(newItem);
    setConfirmDeleteId(null);
  }

  function updateControlResponse(
    controlId: string,
    patch: Partial<GrcControlResponse>,
  ) {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev.responses[controlId] ?? {
        controlId,
        status: 'UNANSWERED' as GrcManualAttestationStatus,
        ownerName: '',
        evidenceNote: '',
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        responses: {
          ...prev.responses,
          [controlId]: {
            ...current,
            ...patch,
            controlId,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      const saved = await saveAssessment(draft);
      setActiveId(saved.id);
      setDraft(saved);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteAssessment(id);
    setConfirmDeleteId(null);
    if (activeId === id) {
      const next = assessments.find((a) => a.id !== id) ?? null;
      setActiveId(next?.id ?? null);
      setDraft(next);
    }
  }

  function handleExportCsv() {
    const { filename, content } = buildComplianceMatrixCsv(
      linkedReport,
      locale,
      draft,
    );
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200">
            <ClipboardCheck className="h-3.5 w-3.5" />
            {messages.compliance.governance.badge}
          </span>
        }
        title={messages.compliance.governance.title}
        description={messages.compliance.governance.description}
        actions={
          <>
            {draft ? (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 text-xs font-semibold text-fg-secondary transition hover:border-strong hover:text-fg sm:text-sm"
              >
                <Download className="h-4 w-4" />
                {messages.compliance.governance.exportCsvBtn}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 sm:text-sm"
            >
              <Plus className="h-4 w-4" />
              {messages.compliance.governance.newAssessmentBtn}
            </button>
          </>
        }
      />

      {error ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {!draft ? (
        <SurfaceCard className="p-8 text-center">
          <p className="text-sm font-semibold text-fg">
            {messages.compliance.governance.emptyTitle}
          </p>
          <p className="mx-auto mt-1 max-w-xl text-xs text-fg-secondary">
            {messages.compliance.governance.emptySubtitle}
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 dark:bg-cyan-500 dark:text-slate-950"
          >
            <Plus className="h-4 w-4" />
            {messages.compliance.governance.newAssessmentBtn}
          </button>
        </SurfaceCard>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* Sidebar: Saved Assessments + Metadata Editor */}
          <div className="space-y-4 lg:col-span-4">
            {assessments.length > 0 ? (
              <SurfaceCard className="p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
                  {t(messages.compliance.governance.assessmentsListTitle, {
                    count: assessments.length,
                  })}
                </h2>
                <div className="mt-2.5 space-y-2">
                  {assessments.map((item) => {
                    const selected = item.id === draft.id;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 transition ${
                          selected
                            ? 'border-cyan-500/50 bg-cyan-50/70 dark:bg-cyan-500/10'
                            : 'border-subtle bg-surface-subtle/50 hover:border-strong'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectAssessment(item)}
                          className="w-full text-left"
                        >
                          <p className="truncate text-xs font-semibold text-fg">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-fg-muted">
                            {t(messages.compliance.governance.lastUpdated, {
                              date: new Date(item.updatedAt).toLocaleDateString(
                                intlLocale,
                              ),
                            })}
                          </p>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </SurfaceCard>
            ) : null}

            <SurfaceCard className="space-y-4 p-5">
              <div>
                <label
                  htmlFor="grc-name"
                  className="block text-xs font-semibold text-fg"
                >
                  {messages.compliance.governance.assessmentNameLabel}
                </label>
                <input
                  id="grc-name"
                  type="text"
                  value={draft.name}
                  placeholder={
                    messages.compliance.governance.assessmentNamePlaceholder
                  }
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev,
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs text-fg focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="grc-linked-scan"
                  className="block text-xs font-semibold text-fg"
                >
                  {messages.compliance.governance.linkedScanLabel}
                </label>
                <select
                  id="grc-linked-scan"
                  value={draft.linkedScanId ?? ''}
                  onChange={(e) => {
                    const nextId = e.target.value || null;
                    const scanMatch = scans.find((s) => s.id === nextId);
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            linkedScanId: nextId,
                            repositoryUrl: scanMatch?.repositoryUrl ?? null,
                          }
                        : prev,
                    );
                  }}
                  className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs text-fg"
                >
                  <option value="">
                    {messages.compliance.governance.noLinkedScan}
                  </option>
                  {scans.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.repositoryUrl.replace(/^https:\/\/github\.com\//i, '')}{' '}
                      ({s.branch}) — {s.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="grc-target-ig"
                  className="block text-xs font-semibold text-fg"
                >
                  {messages.compliance.governance.targetIgLabel}
                </label>
                <select
                  id="grc-target-ig"
                  value={draft.targetIg}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            targetIg: e.target.value as CisImplementationGroup,
                          }
                        : prev,
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs text-fg"
                >
                  <option value="IG1">IG1 (Essencial / PME)</option>
                  <option value="IG2">IG2 (Corporativo / SaaS)</option>
                  <option value="IG3">IG3 (Alta Maturidade)</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950"
                >
                  {savedNotice ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {savedNotice
                      ? messages.compliance.governance.savedToast
                      : messages.compliance.governance.saveAssessmentBtn}
                  </span>
                </button>

                {assessments.some((a) => a.id === draft.id) ? (
                  confirmDeleteId === draft.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleDelete(draft.id)}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
                      >
                        {messages.compliance.governance.confirmDeleteBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-xl border border-subtle px-2.5 py-2 text-xs text-fg-secondary"
                      >
                        {messages.compliance.governance.cancelBtn}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(draft.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {messages.compliance.governance.deleteBtn}
                    </button>
                  )
                ) : null}
              </div>
            </SurfaceCard>
          </div>

          {/* Main GRC Control Editor */}
          <div className="space-y-4 lg:col-span-8">
            <SurfaceCard className="space-y-4 p-5">
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

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiStatCard
                  label={messages.compliance.kpiOverallAdherence}
                  value={`${scorecard.summary.overallAdherencePercent}%`}
                  accentClass="text-cyan-600 dark:text-cyan-300"
                />
                <KpiStatCard
                  label={messages.compliance.kpiTechnicalAdherence}
                  value={`${scorecard.summary.technicalAdherencePercent}%`}
                  accentClass="text-indigo-600 dark:text-indigo-300"
                />
                <KpiStatCard
                  label={messages.compliance.kpiCompliant}
                  value={scorecard.summary.compliantCount}
                  accentClass="text-emerald-600 dark:text-emerald-300"
                />
                <KpiStatCard
                  label={messages.compliance.kpiGaps}
                  value={scorecard.summary.gapCount}
                  accentClass={
                    scorecard.summary.gapCount > 0
                      ? 'text-rose-600 dark:text-rose-300'
                      : 'text-fg'
                  }
                />
              </div>
            </SurfaceCard>

            <div className="space-y-3">
              {scorecard.controls.map((ctrl) => {
                const resp = draft.responses[ctrl.controlId];
                return (
                  <SurfaceCard key={ctrl.controlId} className="space-y-3 p-5">
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
                          {linkedReport &&
                          ctrl.assessmentScope !== 'ORGANIZATIONAL' ? (
                            <span className="rounded-md border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                              {messages.compliance.governance.autoEvidenceBadge}
                            </span>
                          ) : null}
                          <StatusPill
                            meta={COMPLIANCE_STATUS_REGISTRY[ctrl.status]}
                            label={messages.compliance.statusLabels[ctrl.status]}
                          />
                        </div>
                        <h3 className="text-sm font-semibold text-fg">
                          {ctrl.title}
                        </h3>
                        <p className="text-xs text-fg-secondary">
                          {ctrl.description}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-subtle bg-surface-subtle/60 p-3 text-xs">
                      <p className="text-fg-secondary">
                        <strong className="text-fg">
                          {messages.compliance.evidencePrefix}
                        </strong>{' '}
                        {ctrl.evidenceSummary}
                      </p>
                      <p className="mt-1 text-emerald-700 dark:text-emerald-300">
                        <strong>{messages.compliance.guidancePrefix}</strong>{' '}
                        {ctrl.guidance}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-fg-muted">
                          {messages.compliance.governance.attestationLabel}
                        </label>
                        <select
                          aria-label={`${ctrl.code} — ${messages.compliance.governance.attestationLabel}`}
                          value={resp?.status ?? 'UNANSWERED'}
                          onChange={(e) =>
                            updateControlResponse(ctrl.controlId, {
                              status: e.target
                                .value as GrcManualAttestationStatus,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-subtle bg-surface-subtle px-2.5 py-1.5 text-xs text-fg"
                        >
                          {(
                            Object.keys(
                              messages.compliance.governance.attestationOptions,
                            ) as GrcManualAttestationStatus[]
                          ).map((opt) => (
                            <option key={opt} value={opt}>
                              {
                                messages.compliance.governance
                                  .attestationOptions[opt]
                              }
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-fg-muted">
                          {messages.compliance.governance.ownerLabel}
                        </label>
                        <input
                          type="text"
                          value={resp?.ownerName ?? ''}
                          placeholder={
                            messages.compliance.governance.ownerPlaceholder
                          }
                          onChange={(e) =>
                            updateControlResponse(ctrl.controlId, {
                              ownerName: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-subtle bg-surface-subtle px-2.5 py-1.5 text-xs text-fg focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-fg-muted">
                          {messages.compliance.governance.noteLabel}
                        </label>
                        <input
                          type="text"
                          value={resp?.evidenceNote ?? ''}
                          placeholder={
                            messages.compliance.governance.notePlaceholder
                          }
                          onChange={(e) =>
                            updateControlResponse(ctrl.controlId, {
                              evidenceNote: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-subtle bg-surface-subtle px-2.5 py-1.5 text-xs text-fg focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
