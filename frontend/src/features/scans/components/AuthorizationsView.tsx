'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { VerificationMethod } from '@/core/models/scan.models';
import { useTargetAuthorizer } from '@/core/providers/gateway-provider';
import { useTargetAuthorizations } from '../hooks/use-scans';
import { AUTH_STATUS_REGISTRY } from '../registries/finding-registries';
import { AuthRequiredCard } from './AuthRequiredCard';
import { StatusPill } from './StatusPill';
import { PageHeader, SurfaceCard } from './ui/PagePrimitives';

export function AuthorizationsView() {
  const authorizer = useTargetAuthorizer();
  const { items, loading, authRequired, error, refresh } =
    useTargetAuthorizations();

  const [targetUrl, setTargetUrl] = useState('');
  const [method, setMethod] = useState<VerificationMethod>('WELL_KNOWN_FILE');
  const [instructions, setInstructions] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  if (authRequired) {
    return (
      <AuthRequiredCard
        returnTo="/authorizations"
        title="Conecte seu GitHub para gerenciar seus alvos autorizados"
      />
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setInstructions(null);
    try {
      const res = await authorizer.createAuthorization(targetUrl, method);
      setInstructions(res.instructions);
      setTargetUrl('');
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Erro ao criar desafio.',
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
        err instanceof Error ? err.message : 'Falha na verificação de posse.',
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
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Falha ao revogar e remover autorização.',
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
            Cláusula de Segurança Ativa
          </span>
        }
        title="Alvos Autorizados & Guardrails"
        description="Nenhuma sonda ativa é executada sem comprovação criptográfica de posse do domínio. Todas as verificações são estritamente GET/HEAD não destrutivas, com proteção anti-SSRF, rate limit e auditoria."
      />

      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* Left: Challenge Creation + Guardrail Checklist */}
        <div className="space-y-4 lg:col-span-5">
          <SurfaceCard className="p-5 sm:p-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <h2 className="text-base font-semibold text-fg">
                Registrar Novo Alvo de Staging
              </h2>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  URL Base do Alvo
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://staging.suaempresa.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 font-mono text-xs text-fg focus:border-cyan-500 focus:outline-none sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  Método de Prova
                </label>
                <select
                  value={method}
                  onChange={(e) =>
                    setMethod(e.target.value as VerificationMethod)
                  }
                  className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 text-sm text-fg focus:border-cyan-500 focus:outline-none"
                >
                  <option value="WELL_KNOWN_FILE">
                    Arquivo /.well-known/vereditosec-verify.txt
                  </option>
                  <option value="DNS_TXT">
                    Registro DNS TXT (_vereditosec)
                  </option>
                  <option value="LOCAL_DEV_SANDBOX">
                    Sandbox Loopback Local (dev)
                  </option>
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
              >
                <KeyRound className="h-4 w-4" />
                Gerar Desafio de Posse
              </button>

              {instructions ? (
                <div className="rounded-xl border border-cyan-300 bg-cyan-50 p-3.5 text-xs leading-relaxed text-cyan-900 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100">
                  <strong>Instrução de Verificação:</strong> {instructions}
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
              Guardrails Obrigatórios
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-fg-secondary">
              <li>• Bloqueio SSRF de redes privadas e metadata cloud</li>
              <li>• Somente requisições GET / HEAD não destrutivas</li>
              <li>• Rate limit por scan e circuit breaker em 429 / 5xx</li>
              <li>• Registro imutável de cada sonda em probe_audit_logs</li>
            </ul>
          </SurfaceCard>
        </div>

        {/* Right: Registered Targets List */}
        <SurfaceCard className="overflow-hidden lg:col-span-7">
          <div className="border-b border-subtle px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-fg">
              Alvos Registrados ({items.length})
            </h2>
            <p className="text-xs text-fg-secondary">
              Vinculados exclusivamente à sua conta GitHub.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-fg-secondary">
              Carregando...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-fg-secondary">
              Nenhum alvo registrado ainda. Gere um desafio ao lado para
              habilitar safe probes.
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
                      <StatusPill meta={AUTH_STATUS_REGISTRY[item.status]} />
                      <span className="rounded-md border border-subtle bg-surface-subtle px-2 py-0.5 font-mono text-[11px] text-fg-secondary">
                        {item.method}
                      </span>
                    </div>
                    {item.challengeToken ? (
                      <div className="flex items-center gap-2 font-mono text-xs text-amber-700 dark:text-amber-300">
                        <span className="truncate">
                          Token: {item.challengeToken}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            void navigator.clipboard.writeText(
                              item.challengeToken!,
                            )
                          }
                          title="Copiar token"
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
                            ? 'Removendo...'
                            : 'Remover permanentemente'}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => setConfirmRemoveId(null)}
                          className="inline-flex items-center whitespace-nowrap rounded-xl border border-subtle bg-surface-subtle px-3 py-1.5 text-xs font-medium text-fg-secondary transition hover:text-fg disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        {item.status !== 'VERIFIED' ? (
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => void handleVerify(item.id)}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verificar Posse
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => setConfirmRemoveId(item.id)}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {item.status === 'REVOKED' ? 'Remover' : 'Revogar'}
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
    </div>
  );
}
