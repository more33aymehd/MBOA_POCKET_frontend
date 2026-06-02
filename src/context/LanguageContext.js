import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fr from '../i18n/fr';
import en from '../i18n/en';

const TRANSLATIONS = { fr, en };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('fr');

  useEffect(() => {
    AsyncStorage.getItem('lang').then(val => {
      if (val === 'en' || val === 'fr') setLangState(val);
    });
  }, []);

  function setLang(newLang) {
    setLangState(newLang);
    AsyncStorage.setItem('lang', newLang);
  }

  const t = useCallback((path) => {
    const keys = path.split('.');
    let val = TRANSLATIONS[lang];
    for (const k of keys) {
      val = val?.[k];
    }
    return val ?? path;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
