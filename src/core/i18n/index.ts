import { EN_MESSAGES } from './dictionaries/en';
import { ES_MESSAGES } from './dictionaries/es';
import { Messages, PT_BR_MESSAGES } from './dictionaries/pt-BR';
import {
  DEFAULT_LOCALE,
  Locale,
  LocaleMeta,
  SUPPORTED_LOCALES,
} from './types';

export * from './types';
export type { Messages };

export const DICTIONARIES: Record<Locale, Messages> = {
  'pt-BR': PT_BR_MESSAGES,
  en: EN_MESSAGES,
  es: ES_MESSAGES,
};

export function getLocaleMeta(locale: Locale): LocaleMeta {
  return (
    SUPPORTED_LOCALES.find((item) => item.code === locale) ??
    SUPPORTED_LOCALES[0]
  );
}

export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
  return DICTIONARIES[locale] ?? PT_BR_MESSAGES;
}

export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}
