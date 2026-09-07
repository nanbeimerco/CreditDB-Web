/**
 * 制作スタジオ詳細画面 (Android版 StudioDetailScreen.kt に完全準拠)
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { StudioWorkItem } from '../types/entities';
import { CreditRepository } from '../db/repository';
import { TierBadge, RoleBadge } from '../components/CommonComponents';
import { TierTheme } from '../theme/tierTheme';
import { LanguageManager } from '../theme/languageManager';
import { StaffNameResolver } from '../utils/nameResolver';

interface StudioDetailScreenProps {
  studioName: string;
  onBack?: () => void;
  onBackClick?: () => void;
  onNavigateToWork?: (workId: string) => void;
  onWorkClick?: (workId: string) => void;
}

export const StudioDetailScreen: React.FC<StudioDetailScreenProps> = (props) => {
  const { studioName } = props;
  const onBackClick = props.onBackClick || props.onBack || (() => {});
  const onWorkClick = props.onWorkClick || props.onNavigateToWork || (() => {});
  const [works, setWorks] = useState<StudioWorkItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isEn = LanguageManager.isEnglish;

  useEffect(() => {
    setIsLoading(true);
    try {
      const list = CreditRepository.getStudioWorks(studioName);
      setWorks(list);
    } catch (e) {
      console.error('Failed to get studio works:', e);
    } finally {
      setIsLoading(false);
    }
  }, [studioName]);

  const primaryName = StaffNameResolver.getStudioName(studioName, isEn);
  const secondaryName = isEn && primaryName !== studioName ? studioName : null;

  return (
    <div className="flex flex-col h-full bg-background select-none overflow-y-auto">
      {/* TopBar */}
      <header className="sticky top-0 z-20 flex items-center h-14 px-3 bg-background/95 backdrop-blur border-b border-outlineVariant/30">
        <button
          onClick={onBackClick}
          className="p-2 rounded-full text-onSurfaceVariant hover:text-onSurface hover:bg-surfaceVariant/40 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-base text-onSurface ml-2">
          {isEn ? 'Animation Studio Details' : '制作スタジオ詳細'}
        </h2>
      </header>

      <div className="p-4 md:p-6 max-w-5xl mx-auto w-full pb-24 space-y-4">
        {/* 1. スタジオ名ヘッダーカード */}
        <div className="p-4 rounded-2xl bg-surface border border-outlineVariant/40 space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-onSurface tracking-tight">
              {primaryName}
            </h1>
            <RoleBadge roleKey="studio" isEn={isEn} />
          </div>

          {secondaryName && (
            <div className="text-xs text-onSurfaceVariant font-medium">
              {secondaryName}
            </div>
          )}

          <div className="text-xs text-onSurfaceVariant/90">
            {isEn
              ? `Total Produced Works: ${works.length} works`
              : `通算制作作品数: ${works.length} 作品`}
          </div>

          {/* 理念注記 */}
          <div className="p-2.5 rounded-xl bg-surfaceContainer border border-outlineVariant/30 text-[11px] text-onSurfaceVariant leading-relaxed">
            {isEn
              ? '※ Focusing on individual staff and cast credits, our analytical model does not compute composite ratings or cumulative indices for corporate studio entities.'
              : '※ 本アプリの数理分析モデルは制作スタッフ個人のクレジットに主眼を置いているため、スタジオ単位でのレーティング推計や累計指標の算出は行っていません。'}
          </div>
        </div>

        {/* 2. 手掛けた作品一覧 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-onSurface">
            {isEn ? 'Produced Works (Chronological)' : '制作作品一覧 (公開年順)'}
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : works.length === 0 ? (
            <div className="text-center py-8 text-xs text-onSurfaceVariant">
              {isEn ? 'No works found' : '該当する作品が見つかりませんでした'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {works.map((w) => {
                const tierSpec = TierTheme.forTier(w.tier);
                const title = isEn && w.titleEn ? w.titleEn : w.title;

                return (
                  <div
                    key={w.workId}
                    onClick={() => onWorkClick(w.workId)}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface border border-outlineVariant/40 hover:border-outlineVariant hover:bg-surfaceContainer/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-xs font-bold text-onSurfaceVariant font-sans w-10 flex-shrink-0">
                        {w.year}
                      </span>
                      <span className="text-xs font-bold text-onSurface truncate">
                        {title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-xs font-black font-sans"
                        style={{ color: tierSpec.onContainerColor }}
                      >
                        {w.deviationScore.toFixed(1)}
                      </span>
                      <TierBadge tier={w.tier} prefix="" className="text-[10px] px-1.5 py-0" />
                      <ChevronRight className="w-4 h-4 text-onSurfaceVariant/40" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
