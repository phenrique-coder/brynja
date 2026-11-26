'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Copy,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Plus,
  Save,
  Sparkles,
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
  buildGovernanceAiGapsFile,
  buildGovernanceAiGapsPayload,
} from '../exporters/ai-governance-gaps-json.exporter';
import {
  buildComplianceMatrixExcel,
  evaluateComplianceFramework,
} from '../presenters/compliance.presenter';
import { COMPLIANCE_STATUS_REGISTRY } from '../registries/finding-registries';
import { AuthRequiredCard } from './AuthRequiredCard';
import { GovernanceGuideModal } from './GovernanceGuideModal';
import { StatusPill } from './StatusPill';
import {
  KpiStatCard,
  PageHeader,
  PageLoadingState,
  SurfaceCard,
} from './ui/PagePrimitives';
import {
  downloadBrowserFile,
  useDismissibleMenu,
} from './ui/export-helpers';

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
  const [guideOpen, setGuideOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [copiedAiJson, setCopiedAiJson] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const dismissExportMenu = useCallback(() => setExportMenuOpen(false), []);
  useDismissibleMenu(exportMenuOpen, exportMenuRef, dismissExportMenu);

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

  const aiGapsPayload = useMemo(
    () =>
      draft ? buildGovernanceAiGapsPayload(linkedReport, locale, draft) : null,
    [draft, linkedReport, locale],
  );
  const noGapsDetected = (aiGapsPayload?.summary.totalGaps ?? 0) === 0;

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

  function handleExportExcel() {
    const { filename, mimeType, bytes } = buildComplianceMatrixExcel(
      linkedReport,
      locale,
      draft,
    );
    downloadBrowserFile(filename, mimeType, bytes);
  }

  function handleExportAiGapsJson() {
    const file = buildGovernanceAiGapsFile(linkedReport, locale, draft);
    downloadBrowserFile(file.filename, file.mimeType, file.content);
  }

  async function handleCopyAiGapsJson() {
    try {
      const file = buildGovernanceAiGapsFile(linkedReport, locale, draft);
      await navigator.clipboard.writeText(file.content);
      setCopiedAiJson(true);
      window.setTimeout(() => setCopiedAiJson(false), 1800);
    } catch {
      // ignore clipboard errors
    }
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
        topActions={
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/35 bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:border-cyan-500/60 hover:bg-cyan-50 dark:text-cyan-300 dark:hover:bg-cyan-500/10"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            {messages.compliance.governance.whatIsGovernanceBtn}
          </button>
        }
        title={messages.compliance.governance.title}
        description={messages.compliance.governance.description}
        actions={
          <>
            {draft ? (
              <div ref={exportMenuRef} className="relative shrink-0">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={exportMenuOpen}
                  onClick={() => setExportMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 text-xs font-semibold text-fg-secondary transition hover:border-strong hover:text-fg sm:text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>{messages.compliance.governance.exportBtn}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      exportMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {exportMenuOpen ? (
                  <div
                    role="menu"
                    aria-label={messages.compliance.governance.exportMenuAria}
                    className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-subtle bg-surface p-1.5 shadow-xl sm:w-80"
                  >
                    {noGapsDetected ? (
                      <div className="mb-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-[11px] font-medium leading-snug text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                        {messages.compliance.governance.noGapsHint}
                      </div>
                    ) : null}

                    {/* 1. AI Gaps JSON (failures only) */}
                    <button
                      type="button"
                      role="menuitem"
                      disabled={noGapsDetected}
                      onClick={() => {
                        if (noGapsDetected) return;
                        setExportMenuOpen(false);
                        handleExportAiGapsJson();
                      }}
                      className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent dark:hover:bg-emerald-500/10"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950">
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 text-xs font-semibold text-fg">
                          <span>
                            {messages.compliance.governance.exportAiGapsOption}
                          </span>
                          {noGapsDetected ? (
                            <span className="rounded-md bg-surface-subtle px-1.5 py-0.5 text-[10px] font-medium text-fg-muted">
                              {messages.compliance.governance.noGapsBadge}
                            </span>
                          ) : (
                            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                              {t(
                                messages.compliance.governance
                                  .exportAiGapsCountBadge,
                                { count: aiGapsPayload?.summary.totalGaps ?? 0 },
                              )}
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] leading-snug text-fg-muted">
                          {messages.compliance.governance.exportAiGapsHint}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      disabled={noGapsDetected}
                      onClick={() => {
                        if (noGapsDetected) return;
                        void handleCopyAiGapsJson();
                      }}
                      className="mt-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-fg-secondary transition hover:bg-surface-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                    >
                      {copiedAiJson ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 shrink-0 text-fg-muted" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-fg">
                          {copiedAiJson
                            ? messages.compliance.governance.copiedAiGapsOption
                            : messages.compliance.governance.copyAiGapsOption}
                        </span>
                        <span className="block text-[11px] text-fg-muted">
                          {messages.compliance.governance.copyAiGapsHint}
                        </span>
                      </span>
                    </button>

                    <div className="my-1.5 border-t border-subtle" />

                    {/* 2. Complete Excel Workbook (.xlsx) */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setExportMenuOpen(false);
                        handleExportExcel();
                      }}
                      className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950">
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-fg">
                          {messages.compliance.governance.exportExcelOption}
                        </span>
                        <span className="block text-[11px] leading-snug text-fg-muted">
                          {messages.compliance.governance.exportExcelHint}
                        </span>
                      </span>
                    </button>
                  </div>
                ) : null}
              </div>
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

      <GovernanceGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
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
        <div className="space-y-4">
          {/* Horizontal Assessment Switcher + Options Bar (stacks cleanly on mobile) */}
          <SurfaceCard className="space-y-4 p-4 sm:p-5">
            {assessments.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 border-b border-subtle pb-3.5">
                <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  {t(messages.compliance.governance.assessmentsListTitle, {
                    count: assessments.length,
                  })}
                </span>
                {assessments.map((item) => {
                  const selected = item.id === draft.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectAssessment(item)}
                      className={`inline-flex max-w-full items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition ${
                        selected
                          ? 'border-cyan-500/50 bg-cyan-50/70 text-cyan-900 dark:bg-cyan-500/15 dark:text-cyan-100'
                          : 'border-subtle bg-surface-subtle/60 text-fg-secondary hover:border-strong hover:text-fg'
                      }`}
                    >
                      <span className="truncate text-xs font-semibold text-fg">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-fg-muted">
                        {t(messages.compliance.governance.lastUpdated, {
                          date: new Date(item.updatedAt).toLocaleDateString(
                            intlLocale,
                          ),
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.15fr)_minmax(0,0.9fr)_auto] lg:items-end">
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

              <div className="flex flex-wrap items-center gap-2 sm:self-end sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 sm:flex-initial"
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
                        className="whitespace-nowrap rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
                      >
                        {messages.compliance.governance.confirmDeleteBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="whitespace-nowrap rounded-xl border border-subtle px-2.5 py-2 text-xs text-fg-secondary"
                      >
                        {messages.compliance.governance.cancelBtn}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(draft.id)}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {messages.compliance.governance.deleteBtn}
                    </button>
                  )
                ) : null}
              </div>
            </div>
          </SurfaceCard>

          {/* Main Full-Width GRC Control Editor */}
          <div className="space-y-4">
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
