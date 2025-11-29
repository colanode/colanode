import React, { createContext, useContext, useEffect } from 'react';

import { useMetadata } from '@colanode/ui/hooks/use-metadata';
import ar from '@colanode/ui/locales/ar.json';
import de from '@colanode/ui/locales/de.json';
import en from '@colanode/ui/locales/en.json';
import es from '@colanode/ui/locales/es.json';
import fr from '@colanode/ui/locales/fr.json';
import zh from '@colanode/ui/locales/zh.json';

export type LanguageCode = 'en' | 'fr' | 'de' | 'es' | 'zh' | 'ar';

type TranslationKeys = typeof en;

interface I18nContextType {
  locale: LanguageCode;
  setLocale: (locale: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: Record<LanguageCode, TranslationKeys> = {
  en,
  fr,
  de,
  es,
  zh,
  ar,
};

const detectBrowserLocale = (): LanguageCode => {
  const browserLang = navigator.language.toLowerCase();

  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('de')) return 'de';
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('ar')) return 'ar';

  return 'en';
};

const useApplyLocale = (locale: LanguageCode) => {
  useEffect(() => {
    try {
      const doc = globalThis as unknown as { document: Document };
      doc.document.documentElement.lang = locale;
      if (locale === 'ar') {
        doc.document.documentElement.dir = 'rtl';
      } else {
        doc.document.documentElement.dir = 'ltr';
      }
    } catch {
      // Document not available
    }
  }, [locale]);
};

const createTranslationFunction =
  (locale: LanguageCode) =>
  (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (!params) {
      return value;
    }

    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? String(params[paramKey]) : match;
    });
  };

const I18nProviderInitialized = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [storedLocale, setStoredLocale] = useMetadata<LanguageCode>(
    'app',
    'locale'
  );

  const locale = storedLocale ?? detectBrowserLocale();

  useApplyLocale(locale);

  const setLocale = (newLocale: LanguageCode) => {
    setStoredLocale(newLocale);
  };

  const t = createTranslationFunction(locale);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

const I18nProviderUninitialized = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const locale = detectBrowserLocale();

  useApplyLocale(locale);

  const setLocale = (_newLocale: LanguageCode) => {
    // No-op when uninitialized
  };

  const t = createTranslationFunction(locale);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

interface I18nProviderProps {
  children: React.ReactNode;
  initialized?: boolean;
}

export const I18nProvider = ({
  children,
  initialized = false,
}: I18nProviderProps) => {
  if (!initialized) {
    return <I18nProviderUninitialized>{children}</I18nProviderUninitialized>;
  }

  return <I18nProviderInitialized>{children}</I18nProviderInitialized>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
