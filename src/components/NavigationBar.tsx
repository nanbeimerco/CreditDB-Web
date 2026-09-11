/**
 * Material 3 NavigationBar (作品DB / 制作・声優 / Tier表 の3タブ構成)
 * ※ 予測編成(Predict)は指示に基づき完全に除外
 */
import React from 'react';
import { Film, Trophy, BarChart3, Camera } from 'lucide-react';
import { LanguageManager } from '../theme/languageManager';
import { AppStrings } from '../theme/strings';

export type MainTabType = 'works' | 'staff' | 'tier' | 'scene';

interface NavigationBarProps {
  currentTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ currentTab, onTabChange }) => {
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around h-16 bg-surfaceContainer border-t border-outlineVariant/30 max-w-lg mx-auto select-none">
      {tabs.map((tab) => {
        const isSelected = currentTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center flex-1 py-1 focus:outline-none transition-transform active:scale-95"
          >
            {/* M3 ピル型インジケーター */}
            <div
              className={`flex items-center justify-center w-14 h-8 rounded-full transition-colors ${
                isSelected ? 'bg-primaryContainer text-onPrimaryContainer' : 'text-onSurfaceVariant'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            {/* ラベル */}
            <span
              className={`text-[11px] mt-0.5 font-medium transition-colors ${
                isSelected ? 'text-primary font-bold' : 'text-onSurfaceVariant'
              }`}
            >
              {renderTabLabel(tab.id, tab.label)}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
