export type Locale = 'pt-BR' | 'en' | 'es';

export const DEFAULT_LOCALE: Locale = 'pt-BR';
export const LOCALE_STORAGE_KEY = 'brynja-locale';

export interface LocaleMeta {
  code: Locale;
  shortLabel: string;
  nativeName: string;
  intlLocale: string;
}

export const SUPPORTED_LOCALES: readonly LocaleMeta[] = [
  {
    code: 'pt-BR',
    shortLabel: 'PT',
    nativeName: 'Português',
    intlLocale: 'pt-BR',
  },
  {
    code: 'en',
    shortLabel: 'EN',
    nativeName: 'English',
    intlLocale: 'en-US',
  },
  {
    code: 'es',
    shortLabel: 'ES',
    nativeName: 'Español',
    intlLocale: 'es-ES',
  },
] as const;

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return value === 'pt-BR' || value === 'en' || value === 'es';
}

export function detectBrowserLocale(navigatorLanguage?: string | null): Locale {
  const raw = (navigatorLanguage ?? '').trim().toLowerCase();
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('pt')) return 'pt-BR';
  return DEFAULT_LOCALE;
}
