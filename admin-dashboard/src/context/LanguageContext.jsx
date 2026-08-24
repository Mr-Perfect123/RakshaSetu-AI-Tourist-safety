import React, { createContext, useContext, useState } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('rakshasetu_admin_language') || 'English';
  });

  const changeLanguage = (newLang) => {
    setLanguageState(newLang);
    localStorage.setItem('rakshasetu_admin_language', newLang);
  };

  const t = (path, defaultText = '') => {
    const keys = path.split('.');
    let current = translations[language] || translations['English'];
    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        // Fallback to English
        let eng = translations['English'];
        for (const ek of keys) {
          if (eng && eng[ek] !== undefined) eng = eng[ek];
          else return defaultText || path;
        }
        return eng;
      }
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
