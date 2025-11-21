import React, { createContext, useContext, useState, useEffect } from 'react';

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

const LOCALE_STORAGE_KEY = 'colanode_locale';

const detectBrowserLocale = (): LanguageCode => {
  const browserLang = navigator.language.toLowerCase();

  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('de')) return 'de';
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('ar')) return 'ar';

  return 'en';
};

const isValidLanguageCode = (code: string): code is LanguageCode => {
  return ['en', 'fr', 'de', 'es', 'zh', 'ar'].includes(code);
};

interface I18nProviderProps {
  children: React.ReactNode;
}

export const I18nProvider = ({ children }: I18nProviderProps) => {
  const [locale, setLocaleState] = useState<LanguageCode>(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isValidLanguageCode(stored)) {
      return stored;
    }
    return detectBrowserLocale();
  });

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
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

  const setLocale = (newLocale: LanguageCode) => {
    setLocaleState(newLocale);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
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

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
