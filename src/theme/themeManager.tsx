import React, { createContext, useContext, useState, useEffect } from 'react';
import { ColorPresetSpec, TITANIUM_SLATE, ALL_PRESETS } from './colors';

const STORAGE_KEY_PRESET = 'creditdb_color_preset_id';
const STORAGE_KEY_DARK = 'creditdb_is_dark_mode';

let currentPreset: ColorPresetSpec = TITANIUM_SLATE;
let isDarkMode: boolean = true;
const listeners: Set<() => void> = new Set();

export function applyThemeToCss() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  if (isDarkMode) {
    root.classList.add('dark');
    root.style.setProperty('--md-sys-color-background', '#111318');
    root.style.setProperty('--md-sys-color-on-background', '#E2E2E6');
    root.style.setProperty('--md-sys-color-surface', '#111318');
    root.style.setProperty('--md-sys-color-on-surface', '#E2E2E6');
    root.style.setProperty('--md-sys-color-surface-variant', '#44474E');
    root.style.setProperty('--md-sys-color-on-surface-variant', '#C4C7C5');
    root.style.setProperty('--md-sys-color-surface-container', '#1D2024');
    root.style.setProperty('--md-sys-color-surface-container-high', '#282A2F');
    root.style.setProperty('--md-sys-color-outline', '#8E918F');
    root.style.setProperty('--md-sys-color-outline-rgb', '142 145 143');
    root.style.setProperty('--md-sys-color-outline-variant', '#444746');
    root.style.setProperty('--md-sys-color-outline-variant-rgb', '68 71 70');
  } else {
    root.classList.remove('dark');
    root.style.setProperty('--md-sys-color-background', '#F8FAFC');
    root.style.setProperty('--md-sys-color-on-background', '#191C20');
    root.style.setProperty('--md-sys-color-surface', '#FAF9FD');
    root.style.setProperty('--md-sys-color-on-surface', '#191C20');
    root.style.setProperty('--md-sys-color-surface-variant', '#E0E2EC');
    root.style.setProperty('--md-sys-color-on-surface-variant', '#44474F');
    root.style.setProperty('--md-sys-color-surface-container', '#F0F0F4');
    root.style.setProperty('--md-sys-color-surface-container-high', '#E8E8EC');
    root.style.setProperty('--md-sys-color-outline', '#74777F');
    root.style.setProperty('--md-sys-color-outline-rgb', '116 119 127');
    root.style.setProperty('--md-sys-color-outline-variant', '#C4C7D0');
    root.style.setProperty('--md-sys-color-outline-variant-rgb', '196 199 208');
  }

  // プリセット動的カラー
  root.style.setProperty('--md-sys-color-primary', currentPreset.primary);
  root.style.setProperty('--md-sys-color-on-primary', currentPreset.onPrimary);
  root.style.setProperty('--md-sys-color-primary-container', currentPreset.primaryContainer);
  root.style.setProperty('--md-sys-color-on-primary-container', currentPreset.onPrimaryContainer);
  root.style.setProperty('--md-sys-color-secondary', currentPreset.secondary);
  root.style.setProperty('--md-sys-color-on-secondary', currentPreset.onSecondary);
  root.style.setProperty('--md-sys-color-secondary-container', currentPreset.secondaryContainer);
  root.style.setProperty('--md-sys-color-on-secondary-container', currentPreset.onSecondaryContainer);
  root.style.setProperty('--md-sys-color-tertiary', currentPreset.tertiary);
  root.style.setProperty('--md-sys-color-on-tertiary', currentPreset.onTertiary);
  root.style.setProperty('--md-sys-color-tertiary-container', currentPreset.tertiaryContainer);
  root.style.setProperty('--md-sys-color-on-tertiary-container', currentPreset.onTertiaryContainer);

  listeners.forEach(fn => fn());
}

export function initThemeManager() {
  const savedPresetId = localStorage.getItem(STORAGE_KEY_PRESET);
  if (savedPresetId) {
    const found = ALL_PRESETS.find(p => p.id === savedPresetId);
    if (found) currentPreset = found;
  }
  const savedDark = localStorage.getItem(STORAGE_KEY_DARK);
  if (savedDark !== null) {
    isDarkMode = savedDark === 'true';
  } else {
    isDarkMode = true; // デフォルトはディープダーク
  }
  applyThemeToCss();
}

export const ThemeManager = {
  get currentPreset(): ColorPresetSpec {
    return currentPreset;
  },

  get isDarkMode(): boolean {
    return isDarkMode;
  },

  selectPreset(preset: ColorPresetSpec) {
    currentPreset = preset;
    localStorage.setItem(STORAGE_KEY_PRESET, preset.id);
    applyThemeToCss();
  },

  setDarkMode(dark: boolean) {
    isDarkMode = dark;
    localStorage.setItem(STORAGE_KEY_DARK, String(dark));
    applyThemeToCss();
  },

  toggleDarkMode() {
    this.setDarkMode(!isDarkMode);
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

// React Context & Hook
interface ThemeContextType {
  preset: ColorPresetSpec;
  isDarkMode: boolean;
  selectPreset: (preset: ColorPresetSpec) => void;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  preset: TITANIUM_SLATE,
  isDarkMode: true,
  selectPreset: () => {},
  setDarkMode: () => {},
  toggleDarkMode: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preset, setPreset] = useState<ColorPresetSpec>(() => {
    initThemeManager();
    return ThemeManager.currentPreset;
  });
  const [dark, setDark] = useState<boolean>(() => ThemeManager.isDarkMode);

  useEffect(() => {
    const unsub = ThemeManager.subscribe(() => {
      setPreset(ThemeManager.currentPreset);
      setDark(ThemeManager.isDarkMode);
    });
    return unsub;
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        preset,
        isDarkMode: dark,
        selectPreset: (p) => ThemeManager.selectPreset(p),
        setDarkMode: (d) => ThemeManager.setDarkMode(d),
        toggleDarkMode: () => ThemeManager.toggleDarkMode()
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
