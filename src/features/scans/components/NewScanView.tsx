'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  GitBranch,
  Github,
  Globe,
  Lock,
  LockKeyhole,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useScanCreator } from '@/core/providers/gateway-provider';
import {
  useGitHubRepositories,
  useTargetAuthorizations,
} from '../hooks/use-scans';
import { AuthRequiredCard } from './AuthRequiredCard';
import { PageHeader, SurfaceCard } from './ui/PagePrimitives';

const DEMO_PACKAGE_JSON = JSON.stringify(
  {
    name: 'demo-vulnerable-app',
    version: '1.0.0',
    dependencies: {
      lodash: '4.17.20',
      axios: '0.21.1',
      express: '4.17.1',
    },
  },
  null,
  2,
);

const DEMO_REQUIREMENTS_TXT = `django==3.2.12
requests==2.25.1
pyyaml==5.3.1`;

export function NewScanView() {
  const router = useRouter();
  const creator = useScanCreator();
  const { items: authorizations } = useTargetAuthorizations();
  const {
    status: ghStatus,
    repos: ghRepos,
    loading: ghLoading,
    error: ghError,
    connectUrl,
    refresh: refreshGitHubRepos,
  } = useGitHubRepositories();

  const verifiedTargets = authorizations.filter((a) => a.status === 'VERIFIED');

  const [mode, setMode] = useState<'github' | 'git' | 'manifest'>('github');
  const [repoSearch, setRepoSearch] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [manifestName, setManifestName] = useState('package.json');
  const [manifestContent, setManifestContent] = useState('');
  const [secondaryRequirements, setSecondaryRequirements] = useState('');
  const [selectedAuthId, setSelectedAuthId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAuth = verifiedTargets.find((a) => a.id === selectedAuthId);

  const filteredRepos = useMemo(() => {
    const q = repoSearch.trim().toLowerCase();
    if (!q) return ghRepos;
    return ghRepos.filter((r) => r.fullName.toLowerCase().includes(q));
  }, [ghRepos, repoSearch]);

  if (!ghLoading && ghStatus && ghStatus.configured && !ghStatus.connected) {
    return (
      <AuthRequiredCard
        returnTo="/scans/new"
        title="Conecte seu GitHub para iniciar uma nova varredura"
      />
    );
  }

  function loadVulnerableSample() {
    setMode('manifest');
    setRepositoryUrl('manifest://demo-vulnerable-app');
    setManifestName('package.json');
    setManifestContent(DEMO_PACKAGE_JSON);
    setSecondaryRequirements(DEMO_REQUIREMENTS_TXT);
  }

  function selectGitHubRepo(htmlUrl: string, defaultBranch: string) {
    setRepositoryUrl(htmlUrl);
    setBranch(defaultBranch || 'main');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const manifestFiles: Array<{ path: string; content: string }> = [];
      if (mode === 'manifest') {
        if (manifestContent.trim()) {
          manifestFiles.push({
            path: manifestName,
            content: manifestContent,
          });
        }
        if (secondaryRequirements.trim()) {
          manifestFiles.push({
            path: 'requirements.txt',
            content: secondaryRequirements,
          });
        }
      }

      const created = await creator.createScan({
        repositoryUrl:
          mode === 'manifest'
            ? repositoryUrl.trim() || 'manifest://uploaded-project'
            : repositoryUrl.trim(),
        branch: branch.trim() || 'main',
        targetUrl: selectedAuth ? selectedAuth.origin : null,
        authorizationId: selectedAuth ? selectedAuth.id : null,
        manifestFiles: manifestFiles.length > 0 ? manifestFiles : undefined,
      });

      router.push(`/scans/${created.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível iniciar a varredura.',
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Varredura de Segurança"
        description="Escolha um repositório privado/público da sua conta GitHub, informe uma URL Git pública ou envie manifestos diretamente para análise SCA e verificação ativa controlada."
        actions={
          <button
            type="button"
            onClick={loadVulnerableSample}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Carregar Exemplo Vulnerável
          </button>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-6 lg:grid-cols-12"
      >
        {/* Main Source Selection Column */}
        <SurfaceCard className="space-y-5 p-5 sm:p-6 lg:col-span-8">
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-subtle bg-surface-subtle p-1">
            <button
              type="button"
              onClick={() => setMode('github')}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none sm:text-sm ${
                mode === 'github'
                  ? 'bg-surface text-cyan-700 shadow-sm ring-1 ring-black/5 dark:text-cyan-300 dark:ring-white/10'
                  : 'text-fg-secondary hover:text-fg'
              }`}
            >
              <Github className="h-4 w-4" />
              GitHub OAuth
            </button>

            <button
              type="button"
              onClick={() => setMode('git')}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none sm:text-sm ${
                mode === 'git'
                  ? 'bg-surface text-cyan-700 shadow-sm ring-1 ring-black/5 dark:text-cyan-300 dark:ring-white/10'
                  : 'text-fg-secondary hover:text-fg'
              }`}
            >
              <GitBranch className="h-4 w-4" />
              URL Git Pública
            </button>

            <button
              type="button"
              onClick={() => setMode('manifest')}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none sm:text-sm ${
                mode === 'manifest'
                  ? 'bg-surface text-cyan-700 shadow-sm ring-1 ring-black/5 dark:text-cyan-300 dark:ring-white/10'
                  : 'text-fg-secondary hover:text-fg'
              }`}
            >
              <FileCode2 className="h-4 w-4" />
              Colar Manifestos
            </button>
          </div>

          {mode === 'github' ? (
            <div className="space-y-4">
              {ghLoading ? (
                <p className="py-6 text-center text-sm text-fg-secondary">
                  Verificando status da conexão GitHub...
                </p>
              ) : ghStatus && !ghStatus.configured ? (
                <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <p className="text-sm font-semibold">
                    Configuração do GitHub OAuth / App pendente no .env
                  </p>
                  <p className="leading-relaxed">
                    Cadastre um OAuth App ou GitHub App no GitHub usando o
                    callback abaixo e preencha{' '}
                    <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono dark:bg-slate-900">
                      GITHUB_CLIENT_ID
                    </code>{' '}
                    e{' '}
                    <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono dark:bg-slate-900">
                      GITHUB_CLIENT_SECRET
                    </code>{' '}
                    nas variáveis de ambiente (
                    <code className="rounded bg-black/10 px-1 font-mono dark:bg-slate-900">
                      .env.local
                    </code>{' '}
                    ou Vercel):
                  </p>
                  <div className="rounded-lg border border-subtle bg-surface p-2.5 font-mono text-[11px] text-cyan-700 dark:text-cyan-300">
                    Callback URL: {ghStatus.callbackUrl}
                  </div>
                </div>
              ) : ghStatus && !ghStatus.connected ? (
                <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-subtle bg-surface-subtle p-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-fg">
                      Conectar sua conta GitHub
                    </h3>
                    <p className="mt-1 text-xs text-fg-secondary">
                      Gera token efêmero de sessão para leitura de manifestos em
                      repositórios privados e públicos.
                    </p>
                  </div>
                  <a
                    href={connectUrl}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    <Github className="h-4 w-4" />
                    Conectar GitHub
                  </a>
                </div>
              ) : ghStatus && ghStatus.connected ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                        Selecionar Repositório ({filteredRepos.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => void refreshGitHubRepos()}
                        className="inline-flex items-center gap-1 rounded-lg border border-subtle bg-surface-subtle px-2 py-1 text-[11px] font-medium text-fg-secondary transition hover:border-cyan-500/40 hover:text-cyan-700 dark:hover:text-cyan-300"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Atualizar lista
                      </button>
                    </div>
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder="Filtrar repositórios pessoais ou de organizações..."
                      className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2 text-xs text-fg placeholder-fg-muted focus:border-cyan-500 focus:outline-none"
                    />

                    <div className="mt-2 max-h-60 divide-y divide-subtle overflow-y-auto rounded-xl border border-subtle bg-surface-subtle">
                      {filteredRepos.length === 0 ? (
                        <div className="p-5 text-center text-xs text-fg-muted">
                          Nenhum repositório encontrado.
                        </div>
                      ) : (
                        filteredRepos.map((repo) => {
                          const isSelected = repositoryUrl === repo.htmlUrl;
                          return (
                            <button
                              key={repo.id}
                              type="button"
                              onClick={() =>
                                selectGitHubRepo(
                                  repo.htmlUrl,
                                  repo.defaultBranch,
                                )
                              }
                              className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-xs transition ${
                                isSelected
                                  ? 'bg-cyan-500/15 font-semibold text-cyan-800 dark:text-cyan-200'
                                  : 'text-fg hover:bg-surface-hover'
                              }`}
                            >
                              <span className="truncate font-mono">
                                {repo.fullName}
                              </span>
                              <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-fg-muted">
                                {repo.ownerType === 'Organization' ? (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-indigo-300/70 bg-indigo-50 px-2 py-0.5 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-200">
                                    <Building2 className="h-3 w-3" />
                                    Org
                                  </span>
                                ) : null}
                                {repo.private ? (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
                                    <Lock className="h-3 w-3" />
                                    Privado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-subtle bg-surface px-2 py-0.5 text-fg-secondary">
                                    <Globe className="h-3 w-3" />
                                    Público
                                  </span>
                                )}
                                <span className="font-mono">
                                  ({repo.defaultBranch})
                                </span>
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-col gap-2 rounded-xl border border-subtle bg-surface-subtle/70 p-3 text-[11px] leading-relaxed text-fg-secondary sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2">
                        <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-300" />
                        <span>
                          <strong>Faltou alguma Organização?</strong> No GitHub,
                          organizações bloqueiam OAuth Apps por padrão até você
                          clicar em <strong>Grant</strong> (ou pedir aprovação do
                          admin) nas permissões do app.
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {ghStatus.oauthAppSettingsUrl ? (
                          <a
                            href={ghStatus.oauthAppSettingsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-800 transition hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
                          >
                            <span>Liberar Orgs no GitHub</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                        {!ghStatus.scopes
                          ?.split(/[\s,]+/)
                          .includes('read:org') ? (
                          <a
                            href={connectUrl}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 transition hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-200"
                          >
                            Atualizar escopo read:org
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                        Repositório Selecionado
                      </label>
                      <input
                        type="url"
                        required
                        value={repositoryUrl}
                        onChange={(e) => setRepositoryUrl(e.target.value)}
                        placeholder="https://github.com/usuario/repo-privado"
                        className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 font-mono text-xs text-fg focus:border-cyan-500 focus:outline-none sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                        Branch
                      </label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 font-mono text-xs text-fg focus:border-cyan-500 focus:outline-none sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {ghError ? (
                <p className="text-xs text-rose-600 dark:text-rose-300">
                  {ghError}
                </p>
              ) : null}
            </div>
          ) : mode === 'git' ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  URL do Repositório Público (HTTPS)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/usuario/projeto-publico"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 font-mono text-xs text-fg placeholder-fg-muted focus:border-cyan-500 focus:outline-none sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  Branch
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 font-mono text-xs text-fg focus:border-cyan-500 focus:outline-none sm:text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                    Identificador do Projeto
                  </label>
                  <input
                    type="text"
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="manifest://meu-projeto"
                    className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 font-mono text-xs text-fg focus:border-cyan-500 focus:outline-none sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                    Arquivo Principal
                  </label>
                  <select
                    value={manifestName}
                    onChange={(e) => setManifestName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2.5 text-sm text-fg focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="package.json">package.json (npm)</option>
                    <option value="package-lock.json">
                      package-lock.json (npm)
                    </option>
                    <option value="pnpm-lock.yaml">pnpm-lock.yaml (npm)</option>
                    <option value="requirements.txt">
                      requirements.txt (PyPI)
                    </option>
                    <option value="pyproject.toml">
                      pyproject.toml (PyPI)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  Conteúdo de {manifestName}
                </label>
                <textarea
                  rows={7}
                  required
                  value={manifestContent}
                  onChange={(e) => setManifestContent(e.target.value)}
                  placeholder='{"dependencies": {"lodash": "4.17.20"}}'
                  className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle p-3 font-mono text-xs text-fg focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  requirements.txt adicional (opcional)
                </label>
                <textarea
                  rows={3}
                  value={secondaryRequirements}
                  onChange={(e) => setSecondaryRequirements(e.target.value)}
                  placeholder="django==3.2.12"
                  className="mt-1.5 w-full rounded-xl border border-subtle bg-surface-subtle p-3 font-mono text-xs text-fg focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-subtle pt-4">
            <Link
              href="/"
              className="rounded-xl border border-subtle bg-surface-subtle px-4 py-2.5 text-sm font-medium text-fg-secondary transition hover:border-strong hover:text-fg"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={
                submitting || (mode === 'github' && !repositoryUrl.trim())
              }
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {submitting ? 'Iniciando varredura...' : 'Executar Varredura'}
            </button>
          </div>
        </SurfaceCard>

        {/* Right Companion Column: Safe Probes + Pipeline Summary */}
        <div className="space-y-4 lg:col-span-4">
          <SurfaceCard className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
                <LockKeyhole className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                Safe Probes (Opcional)
              </h2>
              <Link
                href="/authorizations"
                className="shrink-0 text-xs font-semibold text-cyan-700 hover:underline dark:text-cyan-300"
              >
                Autorizar alvo
              </Link>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-fg-secondary">
              Apenas alvos com posse criptográfica verificada aparecem abaixo.
              Sondas executam exclusivamente GET/HEAD com rate limit e auditoria.
            </p>

            <select
              value={selectedAuthId}
              onChange={(e) => setSelectedAuthId(e.target.value)}
              className="mt-3 w-full rounded-xl border border-subtle bg-surface-subtle px-3 py-2.5 text-xs text-fg focus:border-cyan-500 focus:outline-none sm:text-sm"
            >
              <option value="">Somente SCA + CVEs (sem sondas)</option>
              {verifiedTargets.map((auth) => (
                <option key={auth.id} value={auth.id}>
                  {auth.origin} ({auth.method})
                </option>
              ))}
            </select>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Pipeline da Avaliação
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs text-fg-secondary">
              {[
                'Inventário SBOM (npm, pnpm, pip, pyproject)',
                'Consulta em lote na API pública OSV.dev',
                'Enriquecimento CVSS/CWE (NVD 2.0)',
                'Probabilidade real (EPSS) + CISA KEV',
                'Safe Probes autorizados + trilha imutável',
              ].map((step) => (
                <li key={step} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </SurfaceCard>
        </div>
      </form>
    </div>
  );
}
