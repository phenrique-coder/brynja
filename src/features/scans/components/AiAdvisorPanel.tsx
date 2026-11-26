'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCode2,
  KeyRound,
  ListChecks,
  Loader2,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  AgentRemediationPlan,
  AiProviderType,
  ByokAiConfig,
  ScanReport,
} from '@/core/models/scan.models';
import { useAiAdvisorPort } from '@/core/providers/gateway-provider';
import { useI18n } from '@/core/providers/i18n-provider';
import { SurfaceCard } from './ui/PagePrimitives';

const BYOK_STORAGE_KEY = 'brynja-ai-byok-v1';

interface StoredByokDraft {
  provider: AiProviderType;
  apiKey: string;
  model: string;
  endpointUrl: string;
}

const DEFAULT_DRAFT: StoredByokDraft = {
  provider: 'openai',
  apiKey: '',
  model: '',
  endpointUrl: '',
};

function readStoredByok(): StoredByokDraft {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_DRAFT;
    }
    const raw = window.localStorage.getItem(BYOK_STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFT;
    const parsed = JSON.parse(raw) as Partial<StoredByokDraft>;
    const provider: AiProviderType =
      parsed.provider === 'gemini' || parsed.provider === 'custom'
        ? parsed.provider
        : 'openai';
    return {
      provider,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: typeof parsed.model === 'string' ? parsed.model : '',
      endpointUrl:
        typeof parsed.endpointUrl === 'string' ? parsed.endpointUrl : '',
    };
  } catch {
    return DEFAULT_DRAFT;
  }
}

function writeStoredByok(draft: StoredByokDraft | null) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (!draft) {
      window.localStorage.removeItem(BYOK_STORAGE_KEY);
    } else {
      window.localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(draft));
    }
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Highlights file paths, headers, and code literals wrapped in backticks or
 * isolated single quotes so remediation steps read cleanly without pulling in a Markdown parser.
 */
function renderFormattedInlineTokens(text: string): React.ReactNode {
  const tokenPattern =
    /(`[^`\n]{1,90}`|(?<![A-Za-z0-9])'[^\n']{2,72}'(?![A-Za-z0-9]))/g;
  const parts = text.split(tokenPattern);
  if (parts.length <= 1) return text;

  return parts.map((part, idx) => {
    const isBacktick = part.startsWith('`') && part.endsWith('`') && part.length >= 3;
    const isQuoted =
      part.startsWith("'") && part.endsWith("'") && part.length >= 4;
    if (isBacktick || isQuoted) {
      return (
        <code
          key={idx}
          className="mx-0.5 inline-block rounded-md border border-subtle bg-surface-subtle px-1.5 py-0.5 font-mono text-[11px] font-medium text-cyan-700 dark:text-cyan-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function AiAdvisorPanel({
  report,
  onPlanGenerated,
}: {
  report: ScanReport;
  onPlanGenerated?: () => void;
}) {
  const aiAdvisor = useAiAdvisorPort();
  const { messages, t } = useI18n();
  const copy = messages.scanReport.aiAdvisor;

  const [expanded, setExpanded] = useState(!report.aiRemediationPlan);
  const [draft, setDraft] = useState<StoredByokDraft>(DEFAULT_DRAFT);
  const [saveLocally, setSaveLocally] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<AgentRemediationPlan | null>(
    report.aiRemediationPlan ?? null,
  );

  useEffect(() => {
    const stored = readStoredByok();
    if (stored.apiKey || stored.model || stored.endpointUrl) {
      setDraft(stored);
    }
  }, []);

  useEffect(() => {
    if (report.aiRemediationPlan) {
      setPlan(report.aiRemediationPlan);
    }
  }, [report.aiRemediationPlan]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedKey = draft.apiKey.trim();
    if (!trimmedKey) {
      setError(copy.errorMissingKey);
      return;
    }

    const byokConfig: ByokAiConfig = {
      provider: draft.provider,
      apiKey: trimmedKey,
      model: draft.model.trim() || undefined,
      endpointUrl: draft.endpointUrl.trim() || undefined,
    };

    if (saveLocally) {
      writeStoredByok(draft);
    } else {
      writeStoredByok(null);
    }

    try {
      setGenerating(true);
      const generated = await aiAdvisor.requestAiAdvice(report.id, byokConfig);
      setPlan(generated);
      setExpanded(false);
      onPlanGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errorFallback);
    } finally {
      setGenerating(false);
    }
  }

  function handleClearKey() {
    setDraft(DEFAULT_DRAFT);
    writeStoredByok(null);
    setError(null);
  }

  return (
    <SurfaceCard className="overflow-hidden border-violet-500/25 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-violet-500/[0.06] via-indigo-500/[0.03] to-transparent px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 to-indigo-500/15 text-violet-700 shadow-sm dark:text-violet-300">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800 dark:bg-violet-500/15 dark:text-violet-200">
                <Sparkles className="h-3 w-3" />
                {copy.badge}
              </span>
              {plan ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    {t(copy.generatedByLabel, { model: plan.generatedBy })}
                  </span>
                  {plan.prioritizedSteps.length > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/25 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200">
                      <ListChecks className="h-3 w-3" />
                      {t(copy.stepsCountLabel, {
                        count: plan.prioritizedSteps.length,
                      })}
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
            <h2 className="mt-1.5 text-sm font-semibold text-fg sm:text-base">
              {copy.title}
            </h2>
            <p className="text-xs text-fg-secondary">{copy.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface px-3.5 py-2 text-xs font-semibold text-fg shadow-sm transition hover:border-violet-500/45 hover:text-violet-700 dark:hover:text-violet-300"
        >
          <KeyRound className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
          <span>{expanded ? copy.hideConfig : copy.configureButton}</span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {expanded || plan ? (
        <div className="space-y-4 border-t border-subtle px-5 py-4 sm:px-6 sm:py-5">
          {expanded ? (
            <form
              onSubmit={(e) => void handleGenerate(e)}
              className="space-y-3 rounded-2xl border border-subtle bg-surface-subtle/60 p-4"
            >
              <div className="flex items-start gap-2 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2 text-[11px] leading-relaxed text-fg-secondary">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-300" />
                <span>{copy.securityNotice}</span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-fg-secondary">
                    {copy.providerLabel}
                  </label>
                  <select
                    value={draft.provider}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        provider: e.target.value as AiProviderType,
                      }))
                    }
                    className="w-full rounded-xl border border-subtle bg-surface px-3 py-2 text-xs text-fg focus:border-violet-500 focus:outline-none"
                  >
                    <option value="openai">{copy.providerOpenAi}</option>
                    <option value="gemini">{copy.providerGemini}</option>
                    <option value="custom">{copy.providerCustom}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] font-semibold text-fg-secondary">
                    {copy.apiKeyLabel}
                  </label>
                  <input
                    type="password"
                    autoComplete="off"
                    value={draft.apiKey}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, apiKey: e.target.value }))
                    }
                    placeholder={copy.apiKeyPlaceholder}
                    className="w-full rounded-xl border border-subtle bg-surface px-3 py-2 font-mono text-xs text-fg placeholder-fg-muted focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-fg-secondary">
                    {copy.modelLabel}
                  </label>
                  <input
                    type="text"
                    value={draft.model}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, model: e.target.value }))
                    }
                    placeholder={
                      draft.provider === 'gemini'
                        ? 'gemini-2.5-flash'
                        : 'gpt-4o-mini'
                    }
                    className="w-full rounded-xl border border-subtle bg-surface px-3 py-2 font-mono text-xs text-fg placeholder-fg-muted focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              {draft.provider === 'custom' || draft.provider === 'openai' ? (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-fg-secondary">
                    {copy.endpointLabel}
                  </label>
                  <input
                    type="url"
                    value={draft.endpointUrl}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, endpointUrl: e.target.value }))
                    }
                    placeholder={copy.endpointPlaceholder}
                    className="w-full rounded-xl border border-subtle bg-surface px-3 py-2 font-mono text-xs text-fg placeholder-fg-muted focus:border-violet-500 focus:outline-none"
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-fg-secondary">
                  <input
                    type="checkbox"
                    checked={saveLocally}
                    onChange={(e) => {
                      setSaveLocally(e.target.checked);
                      if (!e.target.checked) writeStoredByok(null);
                    }}
                    className="rounded border-strong"
                  />
                  {copy.saveLocallyLabel}
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  {draft.apiKey ? (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface px-3 py-2 text-xs font-medium text-fg-secondary transition hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {copy.clearSavedKey}
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:opacity-50 dark:bg-violet-500 dark:text-slate-950 dark:hover:bg-violet-400"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {copy.generatingButton}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        {plan ? copy.regenerateButton : copy.generateButton}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {plan ? (
            <div className="space-y-4">
              {/* Executive AI Diagnosis Callout */}
              <div className="rounded-2xl border border-violet-500/25 border-l-4 border-l-violet-500 bg-surface-subtle/60 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <h3>{copy.summaryTitle}</h3>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-fg">
                  {renderFormattedInlineTokens(plan.summary)}
                </p>
              </div>

              {/* Active Code Reachability Hints */}
              {plan.reachabilityHits && plan.reachabilityHits.length > 0 ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-50/70 p-4 dark:bg-amber-500/[0.08]">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    <FileCode2 className="h-3.5 w-3.5" />
                    <h4>{copy.reachabilityTitle}</h4>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {plan.reachabilityHits.map((hit, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-lg border border-amber-500/25 bg-surface px-2.5 py-1 font-mono text-[11px] font-medium text-fg-secondary shadow-sm"
                      >
                        {hit}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Prioritized Action Cards */}
              {plan.prioritizedSteps.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 px-0.5">
                    <h4 className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-fg-muted">
                      <ListChecks className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
                      {copy.stepsTitle}
                    </h4>
                  </div>

                  <ol className="space-y-2">
                    {plan.prioritizedSteps.map((step, idx) => {
                      const isTopPriority = idx < 2;
                      return (
                        <li
                          key={idx}
                          className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 transition ${
                            isTopPriority
                              ? 'border-violet-500/25 bg-violet-500/[0.04] hover:border-violet-500/40'
                              : 'border-subtle bg-surface-subtle/50 hover:border-strong'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-bold ${
                              isTopPriority
                                ? 'border border-violet-500/35 bg-violet-500/15 text-violet-700 dark:text-violet-200'
                                : 'border border-subtle bg-surface text-fg-secondary'
                            }`}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-xs leading-relaxed text-fg sm:text-[13px]">
                            {renderFormattedInlineTokens(step)}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </SurfaceCard>
  );
}
