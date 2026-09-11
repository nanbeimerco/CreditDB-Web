/**
 * Material 3 Navigation Rail (PC・タブレット用 縦型サイドナビゲーション)
 * ※ メインコンテンツと重ならず、画面左端に常時独立配置
 */
import React from 'react';
import { Film, Trophy, BarChart3, Camera, Globe, Palette, Database, HelpCircle } from 'lucide-react';
import { MainTabType } from './NavigationBar';
import { LanguageManager } from '../theme/languageManager';
import { AppStrings } from '../theme/strings';

interface NavigationRailProps {
  currentTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  onUpdateClick: () => void;
  onThemeClick: () => void;
  onGuideClick: () => void;
  hasUpdateAvailable: boolean;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentTab,
  onTabChange,
  onUpdateClick,
  onThemeClick,
  onGuideClick,
  hasUpdateAvailable
}) => {
  const isEn = LanguageManager.isEnglish;

  const tabs: Array<{
    id: MainTabType;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      id: 'works',
      label: isEn ? AppStrings.navWorks : '作品DB',
      icon: Film
    },
    {
      id: 'staff',
      label: isEn ? AppStrings.navStaff : '制作・声優',
      icon: Trophy
    },
    {
      id: 'tier',
      label: isEn ? AppStrings.navTier : 'Tier表',
      icon: BarChart3
    },
    {
      id: 'scene',
      label: isEn ? AppStrings.navScene : 'シーン特定',
      icon: Camera
    }
  ];

  const renderTabLabel = (id: MainTabType, defaultLabel: string) => {
    if (isEn) {
      return <span className="font-['Gotham']">{defaultLabel}</span>;
    }
    if (id === 'works') {
      return (
        <span className="inline-flex items-center justify-center">
          <span>作品</span>
          <span className="font-['Gotham'] font-bold tracking-tight text-[11px] ml-0.5">DB</span>
        </span>
      );
    }
    if (id === 'tier') {
      return (
        <span className="inline-flex items-center justify-center">
          <span className="font-['Gotham'] font-bold tracking-tight text-[11px] mr-0.5">Tier</span>
          <span>表</span>
        </span>
      );
    }
    if (id === 'scene') {
      return (
        <span className="inline-flex items-center justify-center">
          <span>シーン特定</span>
        </span>
      );
    }
    return <span>{defaultLabel}</span>;
  };

  return (
    <aside className="hidden md:flex flex-col w-[76px] flex-shrink-0 h-full bg-surfaceContainer border-r border-outlineVariant/30 select-none py-3 items-center justify-between z-30">
      {/* 1. 上部: ブランドタイトル (Proなし・ロゴなし) */}
      <div className="flex flex-col items-center justify-center pt-2 pb-1 w-full">
        <span className="text-[13px] font-black tracking-tight text-primary font-['Gotham'] select-none">
          CreditDB
        </span>
      </div>

      {/* 2. 中央: メインタブ (縦並び) */}
      <nav className="flex flex-col items-center gap-4 my-auto">
        {tabs.map((tab) => {
          const isSelected = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="group flex flex-col items-center justify-center w-16 py-1 focus:outline-none transition-transform active:scale-95"
              title={tab.label}
            >
              {/* M3 ピル型インジケーター */}
              <div
                className={`flex items-center justify-center w-14 h-8 rounded-full transition-colors ${
                  isSelected
                    ? 'bg-primaryContainer text-onPrimaryContainer shadow-sm'
                    : 'text-onSurfaceVariant group-hover:text-onSurface group-hover:bg-surfaceContainerHigh/60'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              {/* ラベル (DB と Tier は Gotham フォントで確実に描画) */}
              <span
                className={`text-[11px] mt-1 font-medium transition-colors text-center whitespace-nowrap ${
                  isSelected ? 'text-primary font-bold' : 'text-onSurfaceVariant group-hover:text-onSurface'
                }`}
              >
                {renderTabLabel(tab.id, tab.label)}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 3. 下部: システム設定・ユーティリティボタン */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-outlineVariant/20 w-full px-2">
        {/* 言語切り替え */}
        <button
          onClick={() => LanguageManager.toggleLanguage()}
          className="flex flex-col items-center justify-center w-12 h-10 rounded-xl text-onSurfaceVariant hover:text-onSurface hover:bg-surfaceContainerHigh transition-colors"
          title={isEn ? 'Switch to Japanese' : '英語に切り替え'}
        >
          <Globe className="w-4 h-4" />
          <span className="text-[9px] font-bold font-mono mt-0.5 uppercase">
            {isEn ? 'EN' : 'JA'}
          </span>
        </button>

        {/* テーマ変更 */}
        <button
          onClick={onThemeClick}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-onSurfaceVariant hover:text-onSurface hover:bg-surfaceContainerHigh transition-colors"
          title={isEn ? 'Color Theme' : 'カラーテーマ設定'}
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* DB更新・管理 */}
        <button
          onClick={onUpdateClick}
          className="relative flex items-center justify-center w-10 h-10 rounded-xl text-onSurfaceVariant hover:text-onSurface hover:bg-surfaceContainerHigh transition-colors"
          title={isEn ? 'Database Status & Updates' : 'データベース更新・管理'}
        >
          <Database className="w-4 h-4" />
          {hasUpdateAvailable && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-surfaceContainer" />
          )}
        </button>

        {/* ガイド */}
        <button
          onClick={onGuideClick}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-onSurfaceVariant hover:text-onSurface hover:bg-surfaceContainerHigh transition-colors"
          title={isEn ? 'Evaluation Guide' : '数理解説ガイド'}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
