/**
 * Material 3 固定 TopAppBar (Android版 MainActivity.kt に完全準拠)
 */
import React from 'react';
import { BookOpen, Palette, RefreshCw } from 'lucide-react';
import { LanguageManager } from '../theme/languageManager';

interface TopAppBarProps {
  onGuideClick: () => void;
  onThemeClick: () => void;
  onUpdateClick: () => void;
  hasUpdateAvailable?: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onGuideClick,
  onThemeClick,
  onUpdateClick,
  hasUpdateAvailable = false
}) => {
  const isEn = LanguageManager.isEnglish;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-background/95 backdrop-blur border-b border-outlineVariant/30 select-none">
      {/* タイトル (PROなし) */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-black tracking-tight text-onSurface font-['Montserrat']">
          CreditDB
        </span>
      </div>

      {/* アクションボタングループ */}
      <div className="flex items-center gap-1">
        {/* 言語切り替えトグル (🇯🇵 JP / 🇺🇸 EN) */}
        <button
          onClick={() => LanguageManager.toggleLanguage()}
          className="px-2 py-1 text-xs font-extrabold text-primary hover:bg-surfaceVariant/40 rounded-lg transition-colors"
          title="Toggle Language"
        >
          {isEn ? '🇺🇸 EN' : '🇯🇵 JP'}
        </button>

        {/* 数理解説ガイド画面への遷移ボタン */}
        <button
          onClick={onGuideClick}
          className="p-2 text-onSurfaceVariant hover:text-onSurface hover:bg-surfaceVariant/40 rounded-full transition-colors"
          title={isEn ? 'Mathematical Guide' : '数理解説ガイド'}
        >
          <BookOpen className="w-5 h-5" />
        </button>

        {/* カラーテーマ変更ボタン */}
        <button
          onClick={onThemeClick}
          className="p-2 text-onSurfaceVariant hover:text-onSurface hover:bg-surfaceVariant/40 rounded-full transition-colors"
          title={isEn ? 'Theme Palette' : 'カラーテーマ変更'}
        >
          <Palette className="w-5 h-5" />
        </button>

        {/* データベース更新ボタン (バッジ付き) */}
        <button
          onClick={onUpdateClick}
          className="relative p-2 text-onSurfaceVariant hover:text-onSurface hover:bg-surfaceVariant/40 rounded-full transition-colors"
          title={isEn ? 'Database Status & Update' : 'データベース更新・管理'}
        >
          <RefreshCw className="w-5 h-5" />
          {hasUpdateAvailable && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
};
