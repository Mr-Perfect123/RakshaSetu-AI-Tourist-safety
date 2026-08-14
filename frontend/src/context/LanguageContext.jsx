import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';
import api from '../services/api';

const LanguageContext = createContext();

export const LanguageProvider = ({ children, tourist }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('rakshasetu_app_language') || tourist?.preferred_language || 'English';
  });

  useEffect(() => {
    if (tourist?.preferred_language && tourist.preferred_language !== language) {
      setLanguageState(tourist.preferred_language);
      localStorage.setItem('rakshasetu_app_language', tourist.preferred_language);
    }
  }, [tourist]);

  const changeLanguage = async (newLang) => {
    setLanguageState(newLang);
    localStorage.setItem('rakshasetu_app_language', newLang);

    // Save language preference to backend database if tourist is logged in
    if (tourist?.id) {
      try {
        await api.put(`/auth/profile`, { preferred_language: newLang });
      } catch (err) {
        console.warn('Could not persist language preference to backend profile');
      }
    }
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
