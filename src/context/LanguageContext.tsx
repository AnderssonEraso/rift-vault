import React, { createContext, useContext, useMemo, useState } from 'react';
import { SupportedLanguage, TRANSLATIONS } from '@/constants/translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: typeof TRANSLATIONS.es;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: TRANSLATIONS.es,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('es');

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'es' ? 'en' : 'es'));
  };

  const t = useMemo(() => TRANSLATIONS[language], [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
