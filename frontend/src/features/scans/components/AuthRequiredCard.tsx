'use client';

import React from 'react';
import { Github, History, Lock, ShieldCheck } from 'lucide-react';
import { useGitHubIntegration } from '@/core/providers/gateway-provider';
import { SurfaceCard } from './ui/PagePrimitives';

export function AuthRequiredCard({
  returnTo = '/',
  title = 'Conecte seu GitHub para iniciar esta sessão',
}: {
  returnTo?: string;
  title?: string;
}) {
  const github = useGitHubIntegration();
  const connectUrl = github.getGitHubConnectUrl(returnTo);

  return (
    <div className="mx-auto max-w-2xl py-6">
      <SurfaceCard className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-fg sm:text-2xl">
          {title}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-fg-secondary">
          Para garantir isolamento multi-usuário, nenhum token OAuth fica salvo
          no banco de dados entre sessões. Ao entrar com seu GitHub, um novo
          token efêmero é gerado para esta sessão e seu histórico de avaliações é
          carregado automaticamente.
        </p>

        <div className="mt-6 grid gap-2.5 text-left sm:grid-cols-3">
          <div className="rounded-xl border border-subtle bg-surface-subtle p-3">
            <Lock className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
            <div className="mt-1.5 text-xs font-semibold text-fg">
              Token Efêmero
            </div>
            <div className="mt-0.5 text-[11px] text-fg-secondary">
              Descartado ao sair ou fechar o navegador.
            </div>
          </div>
          <div className="rounded-xl border border-subtle bg-surface-subtle p-3">
            <History className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            <div className="mt-1.5 text-xs font-semibold text-fg">
              Histórico Salvo
            </div>
            <div className="mt-0.5 text-[11px] text-fg-secondary">
              Suas varreduras ficam isoladas na sua conta.
            </div>
          </div>
          <div className="rounded-xl border border-subtle bg-surface-subtle p-3">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
            <div className="mt-1.5 text-xs font-semibold text-fg">
              Guardrails Ativos
            </div>
            <div className="mt-0.5 text-[11px] text-fg-secondary">
              Safe probes só em alvos com posse verificada.
            </div>
          </div>
        </div>

        <a
          href={connectUrl}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <Github className="h-4 w-4" />
          Entrar com GitHub
        </a>
      </SurfaceCard>
    </div>
  );
}
