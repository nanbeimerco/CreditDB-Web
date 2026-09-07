import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'SYSTEM' | 'JAPANESE' | 'ENGLISH';

const STORAGE_KEY_LANG = 'creditdb_app_language';

let currentLanguage: AppLanguage = 'SYSTEM';
let isEnglish: boolean = false;
const listeners: Set<() => void> = new Set();

function detectSystemIsEnglish(): boolean {
  if (typeof navigator === 'undefined') return false;
  const lang = navigator.language || (navigator as any).userLanguage || 'ja';
  return !lang.toLowerCase().startsWith('ja');
}

function updateState() {
  if (currentLanguage === 'SYSTEM') {
    isEnglish = detectSystemIsEnglish();
  } else {
    isEnglish = currentLanguage === 'ENGLISH';
  }
  listeners.forEach(fn => fn());
}

export function initLanguageManager() {
  const saved = localStorage.getItem(STORAGE_KEY_LANG) as AppLanguage | null;
  if (saved && (saved === 'SYSTEM' || saved === 'JAPANESE' || saved === 'ENGLISH')) {
    currentLanguage = saved;
  } else {
    currentLanguage = 'SYSTEM';
  }
  updateState();
}

export const LanguageManager = {
  get currentLanguage(): AppLanguage {
    return currentLanguage;
  },

  get isEnglish(): boolean {
    return isEnglish;
  },

  setLanguage(lang: AppLanguage) {
    currentLanguage = lang;
    localStorage.setItem(STORAGE_KEY_LANG, lang);
    updateState();
  },

  toggleLanguage() {
    this.setLanguage(isEnglish ? 'JAPANESE' : 'ENGLISH');
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

// React Context & Hook
interface LanguageContextType {
  language: AppLanguage;
  isEn: boolean;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'SYSTEM',
  isEn: false,
  setLanguage: () => {},
  toggleLanguage: () => {}
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<AppLanguage>(() => {
    initLanguageManager();
    return LanguageManager.currentLanguage;
  });
  const [isEn, setIsEn] = useState<boolean>(() => LanguageManager.isEnglish);

  useEffect(() => {
    const unsub = LanguageManager.subscribe(() => {
      setLang(LanguageManager.currentLanguage);
      setIsEn(LanguageManager.isEnglish);
    });
    return unsub;
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language: lang,
        isEn,
        setLanguage: (l) => LanguageManager.setLanguage(l),
        toggleLanguage: () => LanguageManager.toggleLanguage()
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
