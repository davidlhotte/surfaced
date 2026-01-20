'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminTranslations, AdminLocale } from './translations';

type AdminLanguageContextType = {
  locale: AdminLocale;
  t: typeof adminTranslations.en | typeof adminTranslations.fr;
};

const AdminLanguageContext = createContext<AdminLanguageContextType | undefined>(undefined);

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<AdminLocale>('en');

  useEffect(() => {
    // Get locale from Shopify's URL parameter
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
      // Fallback: check browser language (for development/testing)
      if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('fr')) {
          setLocale('fr');
        }
      }
    }
  }, [searchParams]);

  const t = adminTranslations[locale];

  return (
    <AdminLanguageContext.Provider value={{ locale, t }}>
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
