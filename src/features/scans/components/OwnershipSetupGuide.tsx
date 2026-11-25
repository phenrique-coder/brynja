'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Globe,
  HelpCircle,
  Laptop,
  Loader2,
  RotateCcw,
  Server,
  Terminal,
} from 'lucide-react';
import { VerificationMethod } from '@/core/models/scan.models';
import { useI18n } from '@/core/providers/i18n-provider';
import {
  buildOwnershipGuideSnippets,
  ReverseProxyServer,
} from '../presenters/ownership-guide.presenter';
import { SurfaceCard } from './ui/PagePrimitives';

export interface OwnershipGuideTarget {
  origin: string;
  hostname: string;
  challengeToken?: string | null;
  isDraft?: boolean;
}

export interface OwnershipSetupGuideProps {
  activeTarget: OwnershipGuideTarget | null;
  method: VerificationMethod;
  onSelectMethod: (method: VerificationMethod) => void;
  resolvingToken?: boolean;
  onEnsureTokenReady?: (origin: string) => Promise<string | null>;
}

type FileHostingTab = 'ssh' | 'web';

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to textarea fallback
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }

  return false;
}

function CopyableCodeBlock({
  label,
  code,
  resolveCode,
  caption,
  copyLabel,
  copiedLabel,
  copyingLabel,
}: {
  label: string;
  code: string;
  resolveCode?: () => Promise<string>;
  caption?: string;
  copyLabel: string;
  copiedLabel: string;
  copyingLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    if (copying) return;
    try {
      let textToCopy = code;
      if (resolveCode) {
        setCopying(true);
        textToCopy = await resolveCode();
      }
      const ok = await copyTextToClipboard(textToCopy);
      if (ok) {
        setCopied(true);
        if (resetTimerRef.current !== null) {
          window.clearTimeout(resetTimerRef.current);
        }
        resetTimerRef.current = window.setTimeout(() => {
          setCopied(false);
          resetTimerRef.current = null;
        }, 1800);
      }
    } catch {
      // clipboard unavailable in restricted environments
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-subtle bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3.5 py-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-300">
          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
          {label}
        </span>
        <button
          type="button"
          disabled={copying}
          onClick={() => void handleCopy()}
          aria-label={`${copyLabel} — ${label}`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:border-cyan-500/60 hover:text-cyan-300 disabled:opacity-60"
        >
          {copying ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
              <span>{copyingLabel ?? copyLabel}</span>
            </>
          ) : copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span>{copiedLabel}</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>{copyLabel}</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-cyan-100">
        <code>{code}</code>
      </pre>
      {caption ? (
        <div className="border-t border-slate-800/80 bg-slate-900/50 px-3.5 py-2 text-[11px] leading-relaxed text-slate-400">
          {caption}
        </div>
      ) : null}
    </div>
  );
}

function ReverseProxyToggle({
  value,
  onChange,
  ariaLabel,
  nginxLabel,
  apacheLabel,
}: {
  value: ReverseProxyServer;
  onChange: (next: ReverseProxyServer) => void;
  ariaLabel: string;
  nginxLabel: string;
  apacheLabel: string;
}) {
  const options: Array<{ id: ReverseProxyServer; label: string }> = [
    { id: 'nginx', label: nginxLabel },
    { id: 'apache', label: apacheLabel },
  ];

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex shrink-0 rounded-xl border border-subtle bg-surface-subtle p-0.5 text-xs"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
              active
                ? 'bg-surface text-cyan-700 shadow-sm dark:text-cyan-300'
                : 'text-fg-secondary hover:text-fg'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function OwnershipSetupGuide({
  activeTarget,
  method,
  onSelectMethod,
  resolvingToken = false,
  onEnsureTokenReady,
}: OwnershipSetupGuideProps) {
  const { messages, t } = useI18n();
  const g = messages.setupGuide;
  const [fileTab, setFileTab] = useState<FileHostingTab>('ssh');
  const [reverseProxy, setReverseProxy] = useState<ReverseProxyServer>('nginx');
  const [dnsTokenCopied, setDnsTokenCopied] = useState(false);
  const [dnsTokenCopying, setDnsTokenCopying] = useState(false);
  const dnsTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (dnsTimerRef.current !== null) {
        window.clearTimeout(dnsTimerRef.current);
      }
    };
  }, []);

  const origin = activeTarget?.origin ?? g.placeholderOrigin;
  const hostname = activeTarget?.hostname ?? g.placeholderHost;
  const token = activeTarget?.challengeToken || g.placeholderToken;
  const hasRealToken = Boolean(activeTarget?.challengeToken);
  const isDraft = Boolean(activeTarget?.isDraft);
  const needsTokenOnCopy =
    !hasRealToken && Boolean(activeTarget?.origin) && Boolean(onEnsureTokenReady);

  const snippets = buildOwnershipGuideSnippets({
    origin,
    hostname,
    token,
    dnsAltComment: g.dnsAltComment,
  });

  async function resolveTokenOnDemand(): Promise<string> {
    if (hasRealToken) return token;
    if (activeTarget?.origin && onEnsureTokenReady) {
      const freshToken = await onEnsureTokenReady(activeTarget.origin);
      if (freshToken) return freshToken;
    }
    return token;
  }

  async function handleCopyDnsToken() {
    if (dnsTokenCopying) return;
    try {
      let textToCopy = token;
      if (needsTokenOnCopy) {
        setDnsTokenCopying(true);
        textToCopy = await resolveTokenOnDemand();
      }
      const ok = await copyTextToClipboard(textToCopy);
      if (ok) {
        setDnsTokenCopied(true);
        if (dnsTimerRef.current !== null) {
          window.clearTimeout(dnsTimerRef.current);
        }
        dnsTimerRef.current = window.setTimeout(() => {
          setDnsTokenCopied(false);
          dnsTimerRef.current = null;
        }, 1800);
      }
    } finally {
      setDnsTokenCopying(false);
    }
  }

  const subtitleDetail = hasRealToken
    ? isDraft
      ? t(g.subtitleDraftReady, { origin })
      : g.subtitleReady
    : resolvingToken && activeTarget
      ? t(g.subtitleResolving, { origin })
      : g.subtitlePlaceholder;

  return (
    <SurfaceCard
      id="guia-configuracao-posse"
      className="overflow-hidden scroll-mt-20"
    >
      {/* Header */}
      <div className="border-b border-subtle bg-surface-subtle/60 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              <BookOpen className="h-4 w-4" />
              {g.eyebrow}
            </div>
            <h2 className="mt-1 text-base font-bold text-fg">{g.title}</h2>
            <p className="mt-0.5 text-xs text-fg-secondary">
              {g.subtitlePrefix} {subtitleDetail}
            </p>
          </div>

          {activeTarget ? (
            <div
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs ${
                hasRealToken
                  ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10'
              }`}
            >
              <div
                className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                  hasRealToken
                    ? 'text-emerald-800 dark:text-emerald-300'
                    : 'text-cyan-800 dark:text-cyan-300'
                }`}
              >
                {resolvingToken ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : hasRealToken ? (
                  <Check className="h-3 w-3" />
                ) : null}
                <span>
                  {resolvingToken ? g.resolvingTokenFor : g.commandsReadyFor}
                </span>
              </div>
              <div className="font-mono font-semibold text-fg">{origin}</div>
              {hasRealToken ? (
                <div className="mt-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                  {g.tokenReadyBadge}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* 3-step high-level overview for beginners */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-[11px] font-bold text-white dark:bg-cyan-500 dark:text-slate-950">
              1
            </span>
            <div className="mt-1.5 text-xs font-semibold text-fg">
              {g.step1Title}
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-fg-secondary">
              {g.step1Body}
            </p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-[11px] font-bold text-white dark:bg-cyan-500 dark:text-slate-950">
              2
            </span>
            <div className="mt-1.5 text-xs font-semibold text-fg">
              {g.step2Title}
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-fg-secondary">
              {g.step2Body}
            </p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white dark:bg-emerald-500 dark:text-slate-950">
              3
            </span>
            <div className="mt-1.5 text-xs font-semibold text-fg">
              {g.step3Title}
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-fg-secondary">
              {g.step3Body}
            </p>
          </div>
        </div>

        {/* Method Tabs */}
        <div className="mt-4 flex flex-wrap gap-1.5 rounded-xl border border-subtle bg-surface p-1">
          {(
            [
              {
                id: 'WELL_KNOWN_FILE',
                label: g.tabWellKnown,
                icon: Server,
              },
              {
                id: 'DNS_TXT',
                label: g.tabDns,
                icon: Globe,
              },
              {
                id: 'LOCAL_DEV_SANDBOX',
                label: g.tabSandbox,
                icon: Laptop,
              },
            ] as Array<{
              id: VerificationMethod;
              label: string;
              icon: React.ComponentType<{ className?: string }>;
            }>
          ).map((tab) => {
            const Icon = tab.icon;
            const active = method === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectMethod(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-cyan-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950'
                    : 'text-fg-secondary hover:bg-surface-subtle hover:text-fg'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Method Content */}
      <div className="space-y-5 p-5 sm:p-6">
        {method === 'WELL_KNOWN_FILE' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs leading-relaxed text-fg-secondary">
                {g.wellKnownIntroPrefix}{' '}
                <code className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                  {snippets.wellKnownUrl}
                </code>{' '}
                {g.wellKnownIntroSuffix}
              </p>

              <div className="inline-flex rounded-xl border border-subtle bg-surface-subtle p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFileTab('ssh')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                    fileTab === 'ssh'
                      ? 'bg-surface text-cyan-700 shadow-sm dark:text-cyan-300'
                      : 'text-fg-secondary hover:text-fg'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  {g.subtabSsh}
                </button>
                <button
                  type="button"
                  onClick={() => setFileTab('web')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                    fileTab === 'web'
                      ? 'bg-surface text-cyan-700 shadow-sm dark:text-cyan-300'
                      : 'text-fg-secondary hover:text-fg'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  {g.subtabWeb}
                </button>
              </div>
            </div>

            {fileTab === 'ssh' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                    {g.sshStep1Title}
                  </h3>
                  <p className="text-xs text-fg-secondary">{g.sshStep1Body}</p>
                  <CopyableCodeBlock
                    label={g.sshStep1Label}
                    code={snippets.sshConnectCmd}
                    caption={g.sshStep1Caption}
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                    {g.sshStep2Title}
                  </h3>
                  <p className="text-xs text-fg-secondary">{g.sshStep2Body}</p>
                  <CopyableCodeBlock
                    label={g.sshStep2Label}
                    code={snippets.sshCreateFileCmd}
                    resolveCode={
                      needsTokenOnCopy
                        ? async () => {
                            const resolvedToken = await resolveTokenOnDemand();
                            return buildOwnershipGuideSnippets({
                              origin,
                              hostname,
                              token: resolvedToken,
                              dnsAltComment: g.dnsAltComment,
                            }).sshCreateFileCmd;
                          }
                        : undefined
                    }
                    caption={g.sshStep2Caption}
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
                    copyingLabel={g.copyingToken}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                      {g.sshStep3Title}
                    </h3>
                    <ReverseProxyToggle
                      value={reverseProxy}
                      onChange={setReverseProxy}
                      ariaLabel={g.proxySelectorAriaStep3}
                      nginxLabel={g.proxyNginx}
                      apacheLabel={g.proxyApache}
                    />
                  </div>
                  {reverseProxy === 'nginx' ? (
                    <>
                      <p className="text-xs text-fg-secondary">
                        {g.sshStep3BodyBefore}
                        <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                          proxy_pass
                        </code>
                        {g.sshStep3BodyMiddle}{' '}
                        <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                          server &#123; ... &#125;
                        </code>{' '}
                        {g.sshStep3BodyAfter}{' '}
                        <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                          /etc/nginx/sites-available/
                        </code>
                        :
                      </p>
                      <CopyableCodeBlock
                        label={g.sshStep3Label}
                        code={snippets.reverseProxy.nginx.snippet}
                        copyLabel={messages.common.copy}
                        copiedLabel={messages.common.copied}
                      />
                      <CopyableCodeBlock
                        label={g.sshStep3ReloadLabel}
                        code={snippets.reverseProxy.nginx.reloadCmd}
                        copyLabel={messages.common.copy}
                        copiedLabel={messages.common.copied}
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-fg-secondary">
                        {g.sshStep3ApacheBodyBefore}
                        <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                          ProxyPass
                        </code>
                        {g.sshStep3ApacheBodyMiddle}{' '}
                        <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                          &lt;VirtualHost *:443&gt;
                        </code>{' '}
                        {g.sshStep3ApacheBodyAfter}{' '}
                        <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                          /etc/apache2/sites-available/
                        </code>{' '}
                        {g.sshStep3ApacheBodyOr}{' '}
                        <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                          /etc/httpd/conf.d/
                        </code>
                        :
                      </p>
                      <CopyableCodeBlock
                        label={g.sshStep3ApacheLabel}
                        code={snippets.reverseProxy.apache.snippet}
                        caption={g.sshStep3ApacheCaption}
                        copyLabel={messages.common.copy}
                        copiedLabel={messages.common.copied}
                      />
                      <CopyableCodeBlock
                        label={g.sshStep3ApacheReloadLabel}
                        code={snippets.reverseProxy.apache.reloadCmd}
                        caption={g.sshStep3ApacheReloadCaption}
                        copyLabel={messages.common.copy}
                        copiedLabel={messages.common.copied}
                      />
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                    {g.sshStep4Title}
                  </h3>
                  <p className="text-xs text-fg-secondary">{g.sshStep4Body}</p>
                  <CopyableCodeBlock
                    label={g.sshStep4Label}
                    code={snippets.curlVerifyCmd}
                    caption={t(g.sshStep4Caption, { token })}
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
                  />
                </div>

                {/* Step 5: Optional full rollback / cleanup */}
                <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-50/40 p-4 dark:bg-amber-500/5">
                  <div className="flex items-start gap-2">
                    <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                        {g.sshStep5Title}
                      </h3>
                      <p className="text-xs leading-relaxed text-fg-secondary">
                        {g.sshStep5Body}
                      </p>
                    </div>
                  </div>

                  <CopyableCodeBlock
                    label={g.sshStep5RemoveFileLabel}
                    code={snippets.sshCleanupFileCmd}
                    caption={g.sshStep5RemoveFileCaption}
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {reverseProxy === 'nginx' ? (
                      <p className="flex-1 text-xs leading-relaxed text-fg-secondary">
                        {g.sshStep5NginxBodyBefore}{' '}
                        <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                          location ^~ /.well-known/ &#123; ... &#125;
                        </code>{' '}
                        {g.sshStep5NginxBodyAfter}
                      </p>
                    ) : (
                      <p className="flex-1 text-xs leading-relaxed text-fg-secondary">
                        {g.sshStep5ApacheBodyBefore}{' '}
                        <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                          ProxyPass /.well-known/ !
                        </code>{' '}
                        /{' '}
                        <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                          Alias /.well-known/
                        </code>{' '}
                        /{' '}
                        <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                          &lt;Directory /var/www/html/.well-known&gt;
                        </code>{' '}
                        {g.sshStep5ApacheBodyAfter}
                      </p>
                    )}

                    <ReverseProxyToggle
                      value={reverseProxy}
                      onChange={setReverseProxy}
                      ariaLabel={g.proxySelectorAriaStep5}
                      nginxLabel={g.proxyNginx}
                      apacheLabel={g.proxyApache}
                    />
                  </div>

                  <CopyableCodeBlock
                    label={
                      reverseProxy === 'nginx'
                        ? g.sshStep5NginxFindLabel
                        : g.sshStep5ApacheFindLabel
                    }
                    code={snippets.reverseProxy[reverseProxy].findBlockCmd}
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
                  />

                  <CopyableCodeBlock
                    label={
                      reverseProxy === 'nginx'
                        ? g.sshStep5NginxReloadLabel
                        : g.sshStep5ApacheReloadLabel
                    }
                    code={snippets.reverseProxy[reverseProxy].reloadCmd}
                    caption={
                      reverseProxy === 'apache'
                        ? g.sshStep3ApacheReloadCaption
                        : undefined
                    }
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
                  />

                  <CopyableCodeBlock
                    label={g.sshStep5VerifyLabel}
                    code={snippets.curlCleanupVerifyCmd}
                    caption={g.sshStep5VerifyCaption}
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2.5 rounded-xl border border-subtle bg-surface-subtle/60 p-4">
                    <h3 className="text-xs font-bold text-fg">
                      {g.webOptionATitle}
                    </h3>
                    <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-fg-secondary">
                      <li>{g.webOptionAStep1}</li>
                      <li>{g.webOptionAStep2}</li>
                      <li>{g.webOptionAStep3}</li>
                      <li>
                        {t(g.webOptionAStep4, { url: snippets.wellKnownUrl })}
                      </li>
                    </ol>
                    <CopyableCodeBlock
                      label={g.webOptionACodeLabel}
                      code={snippets.fileContent}
                      resolveCode={
                        needsTokenOnCopy ? resolveTokenOnDemand : undefined
                      }
                      copyLabel={messages.common.copy}
                      copiedLabel={messages.common.copied}
                      copyingLabel={g.copyingToken}
                    />
                  </div>

                  <div className="space-y-2.5 rounded-xl border border-subtle bg-surface-subtle/60 p-4">
                    <h3 className="text-xs font-bold text-fg">
                      {g.webOptionBTitle}
                    </h3>
                    <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-fg-secondary">
                      <li>{g.webOptionBStep1}</li>
                      <li>{g.webOptionBStep2}</li>
                      <li>{g.webOptionBStep3}</li>
                      <li>{g.webOptionBStep4}</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-2.5 rounded-xl border border-amber-500/30 bg-amber-50/40 p-4 dark:bg-amber-500/5">
                  <div className="flex items-start gap-2">
                    <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-fg">
                        {g.webCleanupTitle}
                      </h3>
                      <p className="text-xs leading-relaxed text-fg-secondary">
                        {g.webCleanupBody}
                      </p>
                    </div>
                  </div>
                  <CopyableCodeBlock
                    label={g.webCleanupCodeLabel}
                    code={snippets.webCleanupCmd}
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}

        {method === 'DNS_TXT' ? (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-fg-secondary">
              {g.dnsIntro}
            </p>

            <div className="overflow-x-auto rounded-xl border border-subtle">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-subtle bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  <tr>
                    <th className="px-4 py-2.5">{g.dnsColType}</th>
                    <th className="px-4 py-2.5">{g.dnsColName}</th>
                    <th className="px-4 py-2.5">{g.dnsColValue}</th>
                    <th className="px-4 py-2.5">{g.dnsColTtl}</th>
                  </tr>
                </thead>
                <tbody className="bg-surface font-mono text-xs text-fg">
                  <tr>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-cyan-700 dark:text-cyan-300">
                      TXT
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      _brynja
                      <span className="block font-sans text-[11px] text-fg-muted">
                        {t(g.dnsHostAlt, { hostname })}
                      </span>
                    </td>
                    <td className="break-all px-4 py-3 text-amber-700 dark:text-amber-300">
                      <div className="flex items-center gap-2">
                        <span>{token}</span>
                        <button
                          type="button"
                          disabled={dnsTokenCopying}
                          onClick={() => void handleCopyDnsToken()}
                          title={g.copyDnsTokenTitle}
                          aria-label={g.copyDnsTokenTitle}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-subtle bg-surface-subtle px-2 py-1 font-sans text-[11px] font-medium text-fg-secondary transition hover:border-cyan-500/60 hover:text-cyan-700 dark:hover:text-cyan-300 disabled:opacity-60"
                        >
                          {dnsTokenCopying ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : dnsTokenCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              <span>{messages.common.copied}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>{messages.common.copy}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-fg-secondary">
                      {g.dnsTtlValue}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                {g.dnsCheckTitle}
              </h3>
              <p className="text-xs text-fg-secondary">{g.dnsCheckBody}</p>
              <CopyableCodeBlock
                label={g.dnsCheckLabel}
                code={snippets.dnsVerifyCmd}
                caption={t(g.dnsCheckCaption, { token })}
                copyLabel={messages.common.copy}
                copiedLabel={messages.common.copied}
              />
            </div>
          </div>
        ) : null}

        {method === 'LOCAL_DEV_SANDBOX' ? (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-fg-secondary">
              {g.sandboxIntro}
            </p>

            <CopyableCodeBlock
              label={g.sandboxCodeLabel}
              code={snippets.sandboxEnvLine}
              caption={g.sandboxCodeCaption}
              copyLabel={messages.common.copy}
              copiedLabel={messages.common.copied}
            />
          </div>
        ) : null}

        {/* Quick beginner troubleshooting footer */}
        <div className="rounded-xl border border-subtle bg-surface-subtle/60 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-fg">
            <HelpCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
            {g.troubleshootingTitle}
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-fg-secondary">
            <li>
              • <strong>{g.tip1Lead}</strong> {g.tip1Body}
            </li>
            <li>
              • <strong>{g.tip2Lead}</strong> {g.tip2Body}
            </li>
            <li>
              • <strong>{g.tip3Lead}</strong> {g.tip3Body}
            </li>
          </ul>
        </div>
      </div>
    </SurfaceCard>
  );
}
