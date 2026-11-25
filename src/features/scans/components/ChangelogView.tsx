'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ExternalLink,
  Github,
  History,
  Sparkles,
  Tag,
} from 'lucide-react';
import { ChangelogRelease } from '@/core/changelog/changelog.parser';
import { useI18n } from '@/core/providers/i18n-provider';
import { PageHeader, SurfaceCard } from './ui/PagePrimitives';

const REPO_URL = 'https://github.com/phenrique-coder/brynja';

const SECTION_STYLE_REGISTRY: Record<string, string> = {
  adicionado:
    'border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
  added:
    'border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
  alterado:
    'border-cyan-500/30 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200',
  changed:
    'border-cyan-500/30 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200',
  corrigido:
    'border-amber-500/30 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
  fixed:
    'border-amber-500/30 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
  segurança:
    'border-indigo-500/30 bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200',
  security:
    'border-indigo-500/30 bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200',
  removido:
    'border-rose-500/30 bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200',
  removed:
    'border-rose-500/30 bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200',
};

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={idx}
          className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[11px] font-medium text-cyan-700 dark:text-cyan-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-fg">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return (
        <em key={idx} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

export interface ChangelogViewProps {
  currentVersion: string;
  ptReleases: ChangelogRelease[];
  enReleases: ChangelogRelease[];
}

export function ChangelogView({
  currentVersion,
  ptReleases,
  enReleases,
}: ChangelogViewProps) {
  const { locale, messages, t } = useI18n();
  const releases = locale === 'pt-BR' ? ptReleases : enReleases;
  const [expandedVersions, setExpandedVersions] = React.useState<Set<string>>(
    () => {
      const latestVersion = releases[0]?.version;
      return latestVersion ? new Set([latestVersion]) : new Set();
    },
  );

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        topSlot={
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted transition hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {messages.common.backToDashboard}
          </Link>
        }
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            {t(messages.changelog.badge, { version: currentVersion })}
          </span>
        }
        title={messages.changelog.title}
        description={messages.changelog.description}
        actions={
          <>
            <a
              href={`${REPO_URL}/blob/main/docs/pt-BR/CHANGELOG.md`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2 text-xs font-semibold text-fg transition hover:border-cyan-500/40 hover:text-cyan-700 dark:hover:text-cyan-300"
            >
              <Github className="h-3.5 w-3.5" />
              {messages.changelog.ptGithub}
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
            <a
              href={`${REPO_URL}/blob/main/CHANGELOG.md`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface-subtle px-3.5 py-2 text-xs font-semibold text-fg transition hover:border-cyan-500/40 hover:text-cyan-700 dark:hover:text-cyan-300"
            >
              <History className="h-3.5 w-3.5" />
              {messages.changelog.enGithub}
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </>
        }
      />

      {locale === 'es' ? (
        <div className="rounded-xl border border-cyan-500/25 bg-cyan-50/70 px-4 py-2.5 text-xs text-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-200">
          {messages.changelog.spanishFallbackNote}
        </div>
      ) : null}

      {releases.length === 0 ? (
        <SurfaceCard className="p-8 text-center text-sm text-fg-secondary">
          {messages.changelog.empty}
        </SurfaceCard>
      ) : (
        <div className="space-y-3">
          {releases.map((release, idx) => {
            const isLatest = idx === 0 || release.version === currentVersion;
            const isExpanded = expandedVersions.has(release.version);
            const panelId = `changelog-panel-${release.version}`;
            return (
              <SurfaceCard key={release.version} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleVersion(release.version)}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  className={`flex w-full flex-wrap items-center justify-between gap-3 bg-surface-subtle/60 px-5 py-4 text-left transition hover:bg-surface-hover/60 sm:px-6 ${
                    isExpanded ? 'border-b border-subtle' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-50 px-3 py-1 font-mono text-sm font-bold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200">
                      <Tag className="h-3.5 w-3.5" />
                      v{release.version}
                    </span>
                    {isLatest ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                        {messages.changelog.latestBadge}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    {release.date ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-fg-muted">
                        <Calendar className="h-3.5 w-3.5" />
                        {release.date}
                      </span>
                    ) : null}
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-4 w-4 text-fg-muted transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isExpanded ? (
                  <div id={panelId} className="space-y-5 p-5 sm:p-6">
                    {release.sections.map((section) => {
                      const style =
                        SECTION_STYLE_REGISTRY[section.title.toLowerCase()] ??
                        'border-subtle bg-surface-subtle text-fg-secondary';
                      return (
                        <div key={section.title} className="space-y-2.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${style}`}
                          >
                            {section.title}
                          </span>
                          <ul className="space-y-2 pl-1 text-xs leading-relaxed text-fg-secondary sm:text-sm">
                            {section.items.map((item, itemIdx) => (
                              <li
                                key={itemIdx}
                                className="flex items-start gap-2.5"
                              >
                                <span
                                  aria-hidden="true"
                                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/70"
                                />
                                <span>{renderInlineMarkdown(item)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </SurfaceCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
