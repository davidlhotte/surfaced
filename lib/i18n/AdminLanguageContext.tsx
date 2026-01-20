'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminTranslations, AdminLocale } from './translations';

const LANGUAGE_STORAGE_KEY = 'surfaced-admin-language';

type AdminLanguageContextType = {
  locale: AdminLocale;
  t: typeof adminTranslations.en | typeof adminTranslations.fr;
  setLanguage: (lang: AdminLocale) => void;
};

const AdminLanguageContext = createContext<AdminLanguageContextType | undefined>(undefined);

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<AdminLocale>('en');

  useEffect(() => {
    // Priority 1: Check localStorage for user preference
    if (typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as AdminLocale | null;
      if (savedLang && (savedLang === 'en' || savedLang === 'fr')) {
        setLocale(savedLang);
        return;
      }
    }

    // Priority 2: Get locale from Shopify's URL parameter
    const shopifyLocale = searchParams.get('locale');

    if (shopifyLocale) {
      // Shopify passes full locale like 'fr', 'fr-FR', 'en', 'en-US'
      const langCode = shopifyLocale.split('-')[0].toLowerCase();
      if (langCode === 'fr') {
        setLocale('fr');
      } else {
        setLocale('en'); // Default to English for all other languages
      }
    } else {
      // Priority 3: Fallback to browser language (for development/testing)
      if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('fr')) {
          setLocale('fr');
        }
      }
    }
  }, [searchParams]);

  const setLanguage = useCallback((lang: AdminLocale) => {
    setLocale(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  }, []);

  const t = adminTranslations[locale];

  return (
    <AdminLanguageContext.Provider value={{ locale, t, setLanguage }}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAdminLanguage() {
  const context = useContext(AdminLanguageContext);
  if (context === undefined) {
    throw new Error('useAdminLanguage must be used within an AdminLanguageProvider');
  }
  return context;
}
