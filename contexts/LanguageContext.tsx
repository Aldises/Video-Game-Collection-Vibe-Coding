import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Language = 'en' | 'fr' | 'de';

interface LanguageContextType {
  language: Language;
  translations: Record<string, any>;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  translations: {},
  setLanguage: () => {},
  t: (key) => key,
});

const loadTranslations = async (language: Language): Promise<Record<string, any>> => {
  try {
    const response = await fetch(`/locales/${language}.json`);
    if (!response.ok) {
        // Fallback to English if a language file is not found
        console.error(`Could not load ${language}.json, falling back to English.`);
        const fallbackResponse = await fetch(`/locales/en.json`);
        return await fallbackResponse.json();
    }
    return await response.json();
  } catch (error) {
    console.error("Error loading translation file:", error);
    // Return an empty object on error to prevent crashes
    return {};
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTranslations = async () => {
      setLoading(true);
      const newTranslations = await loadTranslations(language);
      setTranslations(newTranslations);
      setLoading(false);
    };

    fetchTranslations();
  }, [language]);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
    const keys = key.split('.');
    let result: any = translations;
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    // FIX: Restructured logic to fix type errors on lines 71 and 76.
    // The original `if` condition was flawed and the final `return` was an unsafe cast.
    // This new logic correctly narrows the type to string and provides a safe fallback.
    if (typeof result === 'string') {
        if (options) {
            return result.replace(/\{(\w+)\}/g, (placeholder, placeholderKey) => {
                return options[placeholderKey]?.toString() || placeholder;
            });
        }
        return result;
    }

    console.warn(`Translation for key "${key}" is not a string. Returning key as fallback.`);
    return key;
  }, [translations]);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <LanguageContext.Provider value={{ language, translations, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
