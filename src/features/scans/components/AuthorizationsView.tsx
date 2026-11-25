'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Copy,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  ChallengeTokenPreview,
  TargetAuthorization,
  VerificationMethod,
} from '@/core/models/scan.models';
import { useTargetAuthorizer } from '@/core/providers/gateway-provider';
import { useI18n } from '@/core/providers/i18n-provider';
import { useTargetAuthorizations } from '../hooks/use-scans';
import { parseDraftTargetUrl } from '../presenters/ownership-guide.presenter';
import { AUTH_STATUS_REGISTRY } from '../registries/finding-registries';
import { AuthRequiredCard } from './AuthRequiredCard';
import {
  OwnershipGuideTarget,
  OwnershipSetupGuide,
} from './OwnershipSetupGuide';
import { StatusPill } from './StatusPill';
import {
  PageHeader,
  PageLoadingState,
  SurfaceCard,
} from './ui/PagePrimitives';

const TOKEN_PREVIEW_DEBOUNCE_MS = 250;

export function AuthorizationsView() {
  const authorizer = useTargetAuthorizer();
  const { messages, t } = useI18n();
  const { items, loading, authRequired, error, refresh } =
    useTargetAuthorizations();

  const [targetUrl, setTargetUrl] = useState('');
  const [method, setMethod] = useState<VerificationMethod>('WELL_KNOWN_FILE');
  const [guideMethod, setGuideMethod] =
    useState<VerificationMethod>('WELL_KNOWN_FILE');
  const [selectedGuideTargetId, setSelectedGuideTargetId] = useState<
    string | null
  >(null);
  const [lastCreatedTarget, setLastCreatedTarget] =
    useState<TargetAuthorization | null>(null);
  const [guideSource, setGuideSource] = useState<'draft' | 'target'>('target');
  const [previewTokensByOrigin, setPreviewTokensByOrigin] = useState<
    Record<string, ChallengeTokenPreview>
  >({});
  const [resolvingToken, setResolvingToken] = useState(false);
  const [instructions, setInstructions] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const previewTokenCacheRef = useRef<Map<string, ChallengeTokenPreview>>(
    new Map(),
  );
  const inFlightPreviewRef = useRef<
    Map<string, Promise<ChallengeTokenPreview | null>>
  >(new Map());

  const draftTarget = useMemo(
    () => parseDraftTargetUrl(targetUrl),
    [targetUrl],
  );

  const activeRegisteredTarget: TargetAuthorization | null = useMemo(() => {
    const selected = selectedGuideTargetId
      ? items.find((i) => i.id === selectedGuideTargetId) ??
        (lastCreatedTarget?.id === selectedGuideTargetId
          ? lastCreatedTarget
          : null)
      : null;

    return (
      selected ??
      items.find((i) => i.status === 'PENDING' && i.challengeToken) ??
      items.find((i) => i.challengeToken) ??
      null
    );
  }, [items, lastCreatedTarget, selectedGuideTargetId]);

  const activeGuideTarget: OwnershipGuideTarget | null = useMemo(() => {
    if (guideSource === 'draft' && draftTarget) {
      const existing = items.find((i) => i.origin === draftTarget.origin);
      const preview = previewTokensByOrigin[draftTarget.origin];

      return {
        origin: draftTarget.origin,
        hostname: draftTarget.hostname,
        challengeToken:
          existing?.challengeToken ?? preview?.challengeToken ?? null,
        isDraft: !existing,
      };
    }

    if (activeRegisteredTarget) {
      const preview = previewTokensByOrigin[activeRegisteredTarget.origin];

      return {
        origin: activeRegisteredTarget.origin,
        hostname: activeRegisteredTarget.hostname,
        challengeToken:
          activeRegisteredTarget.challengeToken ??
          preview?.challengeToken ??
          null,
        isDraft: false,
      };
    }

    return null;
  }, [
    activeRegisteredTarget,
    draftTarget,
    guideSource,
    items,
    previewTokensByOrigin,
  ]);

  const resolveTokenForOrigin = useCallback(
    async (origin: string): Promise<string | null> => {
      const existing = items.find(
        (item) => item.origin === origin && item.challengeToken,
      );
      if (existing?.challengeToken) {
        return existing.challengeToken;
      }

      const cached = previewTokenCacheRef.current.get(origin);
      if (cached?.challengeToken) {
        return cached.challengeToken;
      }

      if (!authorizer.previewChallengeToken) {
        return null;
      }

      const existingPromise = inFlightPreviewRef.current.get(origin);
      if (existingPromise) {
        const resolved = await existingPromise;
        return resolved?.challengeToken ?? null;
      }

      const promise = authorizer
        .previewChallengeToken(origin)
        .then((preview) => {
          previewTokenCacheRef.current.set(origin, preview);
          previewTokenCacheRef.current.set(preview.origin, preview);
          setPreviewTokensByOrigin((prev) => {
            if (
              prev[origin]?.challengeToken === preview.challengeToken &&
              prev[preview.origin]?.challengeToken === preview.challengeToken
            ) {
              return prev;
            }
            return {
              ...prev,
              [origin]: preview,
              [preview.origin]: preview,
            };
          });
          return preview;
        })
        .catch(() => null)
        .finally(() => {
          inFlightPreviewRef.current.delete(origin);
        });

      inFlightPreviewRef.current.set(origin, promise);
      const resolved = await promise;
      return resolved?.challengeToken ?? null;
    },
    [authorizer, items],
  );

  const originNeedingToken =
    !authRequired &&
    !(loading && items.length === 0) &&
    activeGuideTarget &&
    !activeGuideTarget.challengeToken &&
    Boolean(authorizer.previewChallengeToken)
      ? activeGuideTarget.origin
      : null;

  useEffect(() => {
    if (!originNeedingToken) {
      setResolvingToken(false);
      return;
    }

    let cancelled = false;
    setResolvingToken(true);

    const timer = window.setTimeout(() => {
      void resolveTokenForOrigin(originNeedingToken).finally(() => {
        if (!cancelled) {
          setResolvingToken(false);
        }
      });
    }, TOKEN_PREVIEW_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [originNeedingToken, resolveTokenForOrigin]);

  if (authRequired) {
    return (
      <AuthRequiredCard
        returnTo="/authorizations"
        title={messages.authCard.authorizationsTitle}
      />
    );
  }

  if (loading && items.length === 0) {
    return <PageLoadingState label={messages.authorizations.loading} />;
  }

  function openGuideForTarget(item: TargetAuthorization) {
    setSelectedGuideTargetId(item.id);
    setGuideMethod(item.method);
    setGuideSource('target');
    const el = document.getElementById('guia-configuracao-posse');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setInstructions(null);

    const normalized = parseDraftTargetUrl(targetUrl);
    if (!normalized) {
      setActionError(messages.authorizations.invalidTargetUrl);
      return;
    }

    try {
      const res = await authorizer.createAuthorization(
        normalized.origin,
        method,
      );
      setInstructions(res.instructions);
      setLastCreatedTarget(res.authorization);
      setSelectedGuideTargetId(res.authorization.id);
      setGuideMethod(res.authorization.method);
      setGuideSource('target');
      if (res.authorization.challengeToken) {
        const cachedPreview: ChallengeTokenPreview = {
          origin: res.authorization.origin,
          hostname: res.authorization.hostname,
          challengeToken: res.authorization.challengeToken,
        };
        previewTokenCacheRef.current.set(
          res.authorization.origin,
          cachedPreview,
        );
        setPreviewTokensByOrigin((prev) => ({
          ...prev,
          [res.authorization.origin]: cachedPreview,
        }));
      }
      await refresh();
      setTargetUrl('');
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : messages.authorizations.createErrorFallback,
      );
    }
  }

  async function handleVerify(id: string) {
    setActionError(null);
    setBusyId(id);
    try {
      await authorizer.verifyAuthorization(id);
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : messages.authorizations.verifyErrorFallback,
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevokeAndDelete(id: string) {
    setActionError(null);
    setBusyId(id);
    try {
      await authorizer.revokeAuthorization(id);
      setConfirmRemoveId(null);
      if (lastCreatedTarget?.id === id) {
        setLastCreatedTarget(null);
      }
      if (selectedGuideTargetId === id) {
        setSelectedGuideTargetId(null);
      }
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : messages.authorizations.revokeErrorFallback,
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            {messages.authorizations.badge}
          </span>
        }
        title={messages.authorizations.title}
        description={messages.authorizations.description}
      />

      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* Left: Challenge Creation + Guardrail Checklist */}
        <div className="space-y-4 lg:col-span-5">
          <SurfaceCard className="p-5 sm:p-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <h2 className="text-base font-semibold text-fg">
                {messages.authorizations.formTitle}
              </h2>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  {messages.authorizations.targetUrlLabel}
                </label>
                <input
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  placeholder={messages.authorizations.targetUrlPlaceholder}
                  value={targetUrl}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setTargetUrl(nextValue);
                    setGuideSource(nextValue.trim() ? 'draft' : 'target');
                  }}
                  className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 font-mono text-xs text-fg focus:border-cyan-500 focus:outline-none sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  {messages.authorizations.methodLabel}
                </label>
                <select
                  value={method}
                  onChange={(e) => {
                    const next = e.target.value as VerificationMethod;
                    setMethod(next);
                    setGuideMethod(next);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 text-sm text-fg focus:border-cyan-500 focus:outline-none"
                >
                  <option value="WELL_KNOWN_FILE">
                    {messages.authorizations.methodWellKnown}
                  </option>
                  <option value="DNS_TXT">
                    {messages.authorizations.methodDns}
                  </option>
                  <option value="LOCAL_DEV_SANDBOX">
                    {messages.authorizations.methodSandbox}
                  </option>
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
              >
                <KeyRound className="h-4 w-4" />
                {messages.authorizations.generateButton}
              </button>

              {instructions ? (
                <div className="rounded-xl border border-cyan-300 bg-cyan-50 p-3.5 text-xs leading-relaxed text-cyan-900 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100">
                  <strong>{messages.authorizations.instructionPrefix}</strong>{' '}
                  {instructions}
                </div>
              ) : null}

              {actionError || error ? (
                <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{actionError ?? error}</span>
                </div>
              ) : null}
            </form>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              {messages.authorizations.guardrailsTitle}
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-fg-secondary">
              {messages.authorizations.guardrails.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </SurfaceCard>
        </div>

        {/* Right: Registered Targets List */}
        <SurfaceCard className="overflow-hidden lg:col-span-7">
          <div className="border-b border-subtle px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-fg">
              {t(messages.authorizations.registeredTitle, {
                count: items.length,
              })}
            </h2>
            <p className="text-xs text-fg-secondary">
              {messages.authorizations.registeredSubtitle}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-fg-secondary">
              {messages.common.loading}
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-fg-secondary">
              {messages.authorizations.emptyRegistered}
            </div>
          ) : (
            <div className="divide-y divide-subtle">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-mono text-xs font-semibold text-fg sm:text-sm">
                        {item.origin}
                      </span>
                      <StatusPill
                        meta={AUTH_STATUS_REGISTRY[item.status]}
                        label={messages.enums.authStatus[item.status]}
                      />
                      <span className="rounded-md border border-subtle bg-surface-subtle px-2 py-0.5 font-mono text-[11px] text-fg-secondary">
                        {item.method}
                      </span>
                    </div>
                    {item.challengeToken ? (
                      <div className="flex items-center gap-2 font-mono text-xs text-amber-700 dark:text-amber-300">
                        <span className="truncate">
                          {messages.authorizations.tokenPrefix}{' '}
                          {item.challengeToken}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            void navigator.clipboard.writeText(
                              item.challengeToken!,
                            )
                          }
                          title={messages.authorizations.copyTokenTitle}
                          className="shrink-0 text-fg-muted hover:text-fg"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {confirmRemoveId === item.id ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void handleRevokeAndDelete(item.id)}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {busyId === item.id
                            ? messages.authorizations.removing
                            : messages.authorizations.removePermanently}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => setConfirmRemoveId(null)}
                          className="inline-flex items-center whitespace-nowrap rounded-xl border border-subtle bg-surface-subtle px-3 py-1.5 text-xs font-medium text-fg-secondary transition hover:text-fg disabled:opacity-50"
                        >
                          {messages.common.cancel}
                        </button>
                      </>
                    ) : (
                      <>
                        {item.status !== 'VERIFIED' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openGuideForTarget(item)}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-200 dark:hover:bg-cyan-500/25"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              {messages.authorizations.howToSetup}
                            </button>
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => void handleVerify(item.id)}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {messages.authorizations.verifyOwnership}
                            </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => setConfirmRemoveId(item.id)}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {item.status === 'REVOKED'
                            ? messages.authorizations.remove
                            : messages.authorizations.revoke}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>

      {/* Detailed Beginner & Remote SSH Terminal Setup Guide */}
      <OwnershipSetupGuide
        activeTarget={activeGuideTarget}
        method={guideMethod}
        onSelectMethod={setGuideMethod}
        resolvingToken={resolvingToken}
        onEnsureTokenReady={resolveTokenForOrigin}
      />
    </div>
  );
}
