'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Layers,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useI18n } from '@/core/providers/i18n-provider';

export type GovernanceGuideTabId =
  | 'overview'
  | 'cis-v8'
  | 'nist-csf-2'
  | 'owasp-asvs'
  | 'lgpd-iso27001';

const TAB_ORDER: readonly GovernanceGuideTabId[] = [
  'overview',
  'cis-v8',
  'nist-csf-2',
  'owasp-asvs',
  'lgpd-iso27001',
];

function getTabIcon(tabId: GovernanceGuideTabId) {
  switch (tabId) {
    case 'overview':
      return <BookOpen className="h-3.5 w-3.5" />;
    case 'cis-v8':
      return <Layers className="h-3.5 w-3.5" />;
    case 'nist-csf-2':
      return <Shield className="h-3.5 w-3.5" />;
    case 'owasp-asvs':
      return <ShieldCheck className="h-3.5 w-3.5" />;
    case 'lgpd-iso27001':
      return <Scale className="h-3.5 w-3.5" />;
  }
}

export interface GovernanceGuideModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: GovernanceGuideTabId;
}

export function GovernanceGuideModal({
  open,
  onClose,
  initialTab = 'overview',
}: GovernanceGuideModalProps) {
  const { messages } = useI18n();
  const guide = messages.compliance.governance.guide;
  const [activeTab, setActiveTab] =
    useState<GovernanceGuideTabId>(initialTab);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const activeContent = guide.tabs[activeTab];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="governance-guide-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-subtle bg-surface shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-subtle bg-surface-subtle/70 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="governance-guide-title"
                className="text-base font-bold text-fg sm:text-lg"
              >
                {guide.modalTitle}
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed text-fg-secondary">
                {guide.modalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={guide.closeBtn}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-subtle bg-surface text-fg-muted transition hover:border-strong hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Segmented Modal Tabs */}
        <div className="border-b border-subtle bg-surface px-5 py-2.5 sm:px-6">
          <div
            role="tablist"
            aria-label={guide.tabsAria}
            className="flex flex-wrap gap-1.5"
          >
            {TAB_ORDER.map((tabId) => {
              const tabCopy = guide.tabs[tabId];
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tabId)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? 'border-cyan-500/50 bg-cyan-50 text-cyan-800 shadow-sm dark:bg-cyan-500/15 dark:text-cyan-200'
                      : 'border-subtle bg-surface-subtle text-fg-secondary hover:border-strong hover:text-fg'
                  }`}
                >
                  {getTabIcon(tabId)}
                  <span>{tabCopy.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Body */}
        <div
          role="tabpanel"
          className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6"
        >
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200">
              {getTabIcon(activeTab)}
              {activeContent.badge}
            </span>
            <h3 className="text-base font-bold text-fg sm:text-lg">
              {activeContent.title}
            </h3>
            <p className="text-xs leading-relaxed text-fg-secondary sm:text-sm">
              {activeContent.intro}
            </p>
          </div>

          <div className="rounded-2xl border border-subtle bg-surface-subtle/60 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-fg-muted">
              {guide.keyPillarsTitle}
            </h4>
            <ul className="mt-3 space-y-2.5">
              {activeContent.pillars.map((pillar, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs leading-relaxed text-fg sm:text-[13px]"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{pillar}</span>
                </li>
              ))}
            </ul>
          </div>

          {activeTab === 'cis-v8' ? (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-fg-muted">
                {guide.cisIgSectionTitle}
              </h4>
              <div className="grid gap-3 md:grid-cols-3">
                {guide.cisIgItems.map((ig) => (
                  <div
                    key={ig.code}
                    className="rounded-xl border border-cyan-500/25 bg-surface-subtle/50 p-3.5"
                  >
                    <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                      {ig.code}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-fg">
                      {ig.subtitle}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-fg-secondary">
                      {ig.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-cyan-500/25 border-l-4 border-l-cyan-500 bg-cyan-50/50 p-4 dark:bg-cyan-500/[0.06]">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              <h4>{guide.brynjaMappingTitle}</h4>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-fg sm:text-[13px]">
              {activeContent.brynjaMapping}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-subtle bg-surface-subtle/60 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
          >
            {guide.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
