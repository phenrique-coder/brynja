'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Globe,
  HelpCircle,
  Laptop,
  Server,
  Terminal,
} from 'lucide-react';
import {
  TargetAuthorization,
  VerificationMethod,
} from '@/core/models/scan.models';
import { useI18n } from '@/core/providers/i18n-provider';
import { SurfaceCard } from './ui/PagePrimitives';

export interface OwnershipSetupGuideProps {
  activeTarget: TargetAuthorization | null;
  method: VerificationMethod;
  onSelectMethod: (method: VerificationMethod) => void;
}

type FileHostingTab = 'ssh' | 'web';

function CopyableCodeBlock({
  label,
  code,
  caption,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  code: string;
  caption?: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable in restricted environments
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
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:border-cyan-500/60 hover:text-cyan-300"
        >
          {copied ? (
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

export function OwnershipSetupGuide({
  activeTarget,
  method,
  onSelectMethod,
}: OwnershipSetupGuideProps) {
  const { messages, t } = useI18n();
  const g = messages.setupGuide;
  const [fileTab, setFileTab] = useState<FileHostingTab>('ssh');

  const origin = activeTarget?.origin ?? g.placeholderOrigin;
  const hostname = activeTarget?.hostname ?? g.placeholderHost;
  const token = activeTarget?.challengeToken ?? g.placeholderToken;
  const hasRealTarget = Boolean(activeTarget?.challengeToken);

  const wellKnownUrl = `${origin}/.well-known/brynja-verify.txt`;
  const sshConnectCmd = `ssh usuario@${hostname}`;
  const sshCreateFileCmd = `sudo mkdir -p /var/www/html/.well-known && printf '%s\\n' '${token}' | sudo tee /var/www/html/.well-known/brynja-verify.txt > /dev/null`;
  const nginxSnippet = `location ^~ /.well-known/ {
    root /var/www/html;
    default_type text/plain;
    allow all;
}`;
  const nginxReloadCmd = `sudo nginx -t && sudo systemctl reload nginx`;
  const curlVerifyCmd = `curl -fsSL ${wellKnownUrl}`;
  const dnsVerifyCmd = `dig +short TXT _brynja.${hostname}\n${g.dnsAltComment}\nnslookup -type=TXT _brynja.${hostname}`;

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
              {g.subtitlePrefix}{' '}
              {hasRealTarget ? g.subtitleReady : g.subtitlePlaceholder}
            </p>
          </div>

          {hasRealTarget ? (
            <div className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-50 px-3 py-2 text-xs dark:bg-cyan-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                {g.commandsReadyFor}
              </div>
              <div className="font-mono font-semibold text-fg">{origin}</div>
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
                  {wellKnownUrl}
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
                    code={sshConnectCmd}
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
                    code={sshCreateFileCmd}
                    caption={g.sshStep2Caption}
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                    {g.sshStep3Title}
                  </h3>
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
                    code={nginxSnippet}
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
                  />
                  <CopyableCodeBlock
                    label={g.sshStep3ReloadLabel}
                    code={nginxReloadCmd}
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                    {g.sshStep4Title}
                  </h3>
                  <p className="text-xs text-fg-secondary">{g.sshStep4Body}</p>
                  <CopyableCodeBlock
                    label={g.sshStep4Label}
                    code={curlVerifyCmd}
                    caption={t(g.sshStep4Caption, { token })}
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2.5 rounded-xl border border-subtle bg-surface-subtle/60 p-4">
                  <h3 className="text-xs font-bold text-fg">
                    {g.webOptionATitle}
                  </h3>
                  <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-fg-secondary">
                    <li>{g.webOptionAStep1}</li>
                    <li>{g.webOptionAStep2}</li>
                    <li>{g.webOptionAStep3}</li>
                    <li>{t(g.webOptionAStep4, { url: wellKnownUrl })}</li>
                  </ol>
                  <CopyableCodeBlock
                    label={g.webOptionACodeLabel}
                    code={token}
                    copyLabel={messages.common.copy}
                    copiedLabel={messages.common.copied}
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
                      {token}
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
                code={dnsVerifyCmd}
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
              code={`ALLOW_LOCAL_LOOPBACK_TARGETS=true`}
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
