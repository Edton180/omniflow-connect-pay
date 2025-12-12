import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { translations, TranslationKeys } from '@/i18n/translations';
import { languages, Language, getLanguageByCode, getDefaultLanguage } from '@/i18n/languages';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  availableLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'omniflow_language';

// Get nested value from object using dot notation
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return key if not found
    }
  }
  
  return typeof result === 'string' ? result : path;
};

// Detect browser language
const detectBrowserLanguage = (): Language => {
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    const detected = getLanguageByCode(browserLang);
    if (detected) return detected;
    
    // Try to match just the language code (e.g., 'en' from 'en-GB')
    const langCode = browserLang.split('-')[0];
    const fallback = getLanguageByCode(langCode);
    if (fallback) return fallback;
  }
  
  return getDefaultLanguage();
};

// Get saved language from localStorage
const getSavedLanguage = (): Language | null => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const lang = getLanguageByCode(saved);
      if (lang) return lang;
    }
  }
  return null;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Priority: 1. Saved preference, 2. Browser detection, 3. Default
    const saved = getSavedLanguage();
    if (saved) return saved;
    
    return detectBrowserLanguage();
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang.code);
    }
    // Update document lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang.code;
    }
  }, []);

  // Update document lang on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language.code;
    }
  }, [language]);

  const t = useCallback((key: string): string => {
    const translation = translations[language.code];
    if (!translation) {
      // Fallback to pt-BR
      return getNestedValue(translations['pt-BR'], key);
    }
    return getNestedValue(translation, key);
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    availableLanguages: languages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default useLanguage;
