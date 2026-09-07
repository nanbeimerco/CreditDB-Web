/**
 * テーマ＆言語設定 ModalBottomSheet (Android版 ThemePaletteBottomSheet.kt に完全準拠)
 */
import React from 'react';
import { X, Check, Sun, Moon } from 'lucide-react';
import { LanguageManager } from '../theme/languageManager';
import { ThemeManager } from '../theme/themeManager';
import { ALL_PRESETS, ColorPresetSpec } from '../theme/colors';

interface ThemePaletteBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemePaletteBottomSheet: React.FC<ThemePaletteBottomSheetProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;
  const isEn = LanguageManager.isEnglish;
  const currentLang = LanguageManager.currentLanguage;
  const currentPreset = ThemeManager.currentPreset;
  const isDarkMode = ThemeManager.isDarkMode;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm select-none animate-fade-in">
      <div className="w-full max-w-lg bg-surfaceContainer rounded-t-3xl border-t border-outlineVariant p-5 max-h-[88vh] overflow-y-auto animate-slide-up">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-outlineVariant/30">
          <h3 className="text-base font-bold text-onSurface">
            {isEn ? 'Appearance & Language' : '表示テーマ・言語設定'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-onSurfaceVariant hover:text-onSurface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 py-4">
          {/* 1. 言語設定 */}
          <div>
            <h4 className="text-sm font-bold text-onSurface mb-2">
              {isEn ? 'Language Settings' : '言語設定 (Language)'}
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => LanguageManager.setLanguage('SYSTEM')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  currentLang === 'SYSTEM'
                    ? 'bg-primaryContainer text-onPrimaryContainer border-primary'
                    : 'bg-surface border-outlineVariant/50 text-onSurfaceVariant hover:text-onSurface'
                }`}
              >
                {isEn ? 'System Default' : '端末設定依存'}
              </button>
              <button
                onClick={() => LanguageManager.setLanguage('JAPANESE')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  currentLang === 'JAPANESE'
                    ? 'bg-primaryContainer text-onPrimaryContainer border-primary'
                    : 'bg-surface border-outlineVariant/50 text-onSurfaceVariant hover:text-onSurface'
                }`}
              >
                日本語 (JP)
              </button>
              <button
                onClick={() => LanguageManager.setLanguage('ENGLISH')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  currentLang === 'ENGLISH'
                    ? 'bg-primaryContainer text-onPrimaryContainer border-primary'
                    : 'bg-surface border-outlineVariant/50 text-onSurfaceVariant hover:text-onSurface'
                }`}
              >
                English (EN)
              </button>
            </div>
          </div>

          {/* 2. 明暗モード切り替え (Webならではの便利機能) */}
          <div>
            <h4 className="text-sm font-bold text-onSurface mb-2">
              {isEn ? 'Theme Mode' : 'テーマモード'}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => ThemeManager.setDarkMode(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  isDarkMode
                    ? 'bg-primaryContainer text-onPrimaryContainer border-primary'
                    : 'bg-surface border-outlineVariant/50 text-onSurfaceVariant hover:text-onSurface'
                }`}
              >
                <Moon className="w-4 h-4" />
                {isEn ? 'Deep Dark (Default)' : 'ディープダーク (標準)'}
              </button>
              <button
                onClick={() => ThemeManager.setDarkMode(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  !isDarkMode
                    ? 'bg-primaryContainer text-onPrimaryContainer border-primary'
                    : 'bg-surface border-outlineVariant/50 text-onSurfaceVariant hover:text-onSurface'
                }`}
              >
                <Sun className="w-4 h-4" />
                {isEn ? 'Light Mode' : 'ライトモード'}
              </button>
            </div>
          </div>

          {/* 3. M3 カラープリセット */}
          <div>
            <h4 className="text-sm font-bold text-onSurface mb-1">
              {isEn ? 'Color Theme Presets' : 'カラーテーマ・プリセット'}
            </h4>
            <p className="text-xs text-onSurfaceVariant mb-3">
              {isEn
                ? 'Select presets based on Material 3 color harmonies. Tier grade colors remain consistent.'
                : 'Material 3のカラー調和原則（Primary/Secondary/Tertiary）に基づいた上質なプリセットを選択できます。Tier格付けの色分けは維持されます。'}
            </p>

            <div className="space-y-2">
              {ALL_PRESETS.map((preset: ColorPresetSpec) => {
                const isSelected = preset.id === currentPreset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => ThemeManager.selectPreset(preset)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-surfaceVariant/50 border-primary ring-1 ring-primary'
                        : 'bg-surface border-outlineVariant/40 hover:border-outlineVariant'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border border-black/20 flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: preset.previewDot }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-black" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-onSurface">
                          {preset.name}
                        </div>
                        <div className="text-[11px] text-onSurfaceVariant">
                          {isEn ? preset.descriptionEn : preset.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 py-3 rounded-xl bg-primary text-onPrimary font-bold text-sm hover:opacity-90 transition-opacity"
        >
          {isEn ? 'Close' : '閉じる'}
        </button>
      </div>
    </div>
  );
};
