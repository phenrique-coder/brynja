'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Loader2,
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

  const [expanded, setExpanded] = useState(Boolean(report.aiRemediationPlan));
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
      setExpanded(true);
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
    <SurfaceCard className="overflow-hidden border-violet-500/20">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300">
            <Bot className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800 dark:bg-violet-500/15 dark:text-violet-200">
                <Sparkles className="h-3 w-3" />
                {copy.badge}
              </span>
              {plan ? (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                  {t(copy.generatedByLabel, { model: plan.generatedBy })}
                </span>
              ) : null}
            </div>
            <h2 className="mt-1 text-sm font-semibold text-fg sm:text-base">
              {copy.title}
            </h2>
            <p className="text-xs text-fg-secondary">{copy.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs font-semibold text-fg transition hover:border-violet-500/40"
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
        <div className="space-y-4 border-t border-subtle px-5 py-4 sm:px-6">
          {expanded ? (
            <form onSubmit={(e) => void handleGenerate(e)} className="space-y-3">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-[11px] leading-relaxed text-fg-secondary">
                {copy.securityNotice}
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
                    className="w-full rounded-xl border border-subtle bg-surface-subtle px-3 py-2 text-xs text-fg focus:border-violet-500 focus:outline-none"
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
                    className="w-full rounded-xl border border-subtle bg-surface-subtle px-3 py-2 font-mono text-xs text-fg placeholder-fg-muted focus:border-violet-500 focus:outline-none"
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
                    className="w-full rounded-xl border border-subtle bg-surface-subtle px-3 py-2 font-mono text-xs text-fg placeholder-fg-muted focus:border-violet-500 focus:outline-none"
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
                    className="w-full rounded-xl border border-subtle bg-surface-subtle px-3 py-2 font-mono text-xs text-fg placeholder-fg-muted focus:border-violet-500 focus:outline-none"
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
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
                      className="inline-flex items-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-medium text-fg-secondary transition hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
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
            <div className="space-y-3 rounded-xl border border-subtle bg-surface-subtle p-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  {copy.summaryTitle}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-fg sm:text-sm">
                  {plan.summary}
                </p>
              </div>

              {plan.reachabilityHits && plan.reachabilityHits.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    {copy.reachabilityTitle}
                  </h4>
                  <ul className="mt-1.5 space-y-1 text-xs text-fg-secondary">
                    {plan.reachabilityHits.map((hit, idx) => (
                      <li key={idx} className="font-mono text-[11px]">
                        • {hit}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {plan.prioritizedSteps.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                    {copy.stepsTitle}
                  </h4>
                  <ol className="mt-1.5 list-decimal space-y-1.5 pl-4 text-xs text-fg-secondary sm:text-sm">
                    {plan.prioritizedSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
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
