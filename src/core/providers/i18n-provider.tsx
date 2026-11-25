'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_LOCALE,
  detectBrowserLocale,
  getLocaleMeta,
  getMessages,
  interpolate,
  isSupportedLocale,
  Locale,
  LOCALE_STORAGE_KEY,
  Messages,
} from '../i18n';

export interface II18nController {
  locale: Locale;
  intlLocale: string;
  messages: Messages;
  setLocale: (next: Locale) => void;
  t: (
    template: string,
    values?: Record<string, string | number>,
  ) => string;
}

const I18nContext = createContext<II18nController | null>(null);

const FALLBACK_CONTROLLER: II18nController = {
  locale: DEFAULT_LOCALE,
  intlLocale: getLocaleMeta(DEFAULT_LOCALE).intlLocale,
  messages: getMessages(DEFAULT_LOCALE),
  setLocale: () => {},
  t: (template, values) => (values ? interpolate(template, values) : template),
};

export function I18nProvider({
  children,
  defaultLocale,
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
}) {
  const initialLocale = defaultLocale ?? DEFAULT_LOCALE;
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    let resolved: Locale = initialLocale;
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isSupportedLocale(stored)) {
        resolved = stored;
      } else if (
        !defaultLocale &&
        typeof navigator !== 'undefined' &&
        navigator.language
      ) {
        resolved = detectBrowserLocale(navigator.language);
      }
    } catch {
      // ignore storage errors in restricted environments
    }
    setLocaleState(resolved);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = resolved;
    }
  }, [defaultLocale, initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const value = useMemo<II18nController>(
    () => ({
      locale,
      intlLocale: getLocaleMeta(locale).intlLocale,
      messages: getMessages(locale),
      setLocale,
      t: (template, values) =>
        values ? interpolate(template, values) : template,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Consumes active i18n controller. Falls back safely to pt-BR when components
 * are rendered in isolation (e.g. unit tests without I18nProvider).
 */
export function useI18n(): II18nController {
  return useContext(I18nContext) ?? FALLBACK_CONTROLLER;
}
