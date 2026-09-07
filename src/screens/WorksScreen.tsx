/**
 * 作品DB一覧画面 (Android版 WorksScreen.kt に完全準拠)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { WorkItem, WorksSortOption } from '../types/entities';
import { CreditRepository } from '../db/repository';
import { SmartSearchBar, TierBadge } from '../components/CommonComponents';
import { WorkFilterBottomSheet } from '../components/WorkFilterBottomSheet';
import { TierTheme } from '../theme/tierTheme';
import { LanguageManager } from '../theme/languageManager';
import { AppStrings } from '../theme/strings';

interface WorksScreenProps {
  onWorkClick?: (workId: string) => void;
  onNavigateToWork?: (workId: string) => void;
}

export const WorksScreen: React.FC<WorksScreenProps> = (props) => {
  const onWorkClick = props.onWorkClick || props.onNavigateToWork || (() => {});

  const [works, setWorks] = useState<WorkItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [eraFilter, setEraFilter] = useState<string>('all');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<WorksSortOption>('DEVIATION_DESC');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const isEn = LanguageManager.isEnglish;
  const hasActiveFilters = tierFilter !== 'all' || eraFilter !== 'all' || verdictFilter !== 'all';

  // データ取得
  const loadInitialWorks = useCallback(() => {
    setIsLoading(true);
    try {
      const items = CreditRepository.getWorks(
        searchQuery,
        tierFilter,
        eraFilter,
        verdictFilter,
        sortOption,
        50,
        0
      );
      const count = CreditRepository.getWorksCount(
        searchQuery,
        tierFilter,
        eraFilter,
        verdictFilter
      );
      setWorks(items);
      setTotalCount(count);
    } catch (e) {
      console.error('Failed to load works:', e);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, tierFilter, eraFilter, verdictFilter, sortOption]);

  useEffect(() => {
    loadInitialWorks();
  }, [loadInitialWorks]);

  // 無限スクロール
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200 && !isLoadingMore && works.length < totalCount) {
      setIsLoadingMore(true);
      setTimeout(() => {
        try {
          const more = CreditRepository.getWorks(
            searchQuery,
            tierFilter,
            eraFilter,
            verdictFilter,
            sortOption,
            50,
            works.length
          );
          setWorks((prev) => [...prev, ...more]);
        } catch (err) {
          console.error('Failed to load more:', err);
        } finally {
          setIsLoadingMore(false);
        }
      }, 100);
    }
  };

  const handleResetFilters = () => {
    setTierFilter('all');
    setEraFilter('all');
    setVerdictFilter('all');
    setSortOption('DEVIATION_DESC');
  };

  return (
    <div className="flex flex-col h-full bg-background select-none">
      {/* 1. スマート1行検索バー */}
      <SmartSearchBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onFilterClick={() => setIsFilterSheetOpen(true)}
        hasActiveFilters={hasActiveFilters}
        placeholder={isEn ? AppStrings.searchPlaceholderEn : AppStrings.searchPlaceholder}
      />

      {/* 2. スリムステータスバー */}
      <div className="flex items-center justify-between px-4 py-1 text-xs text-onSurfaceVariant border-b border-outlineVariant/20">
        <span>{isEn ? `${totalCount} works` : `${totalCount} 件の作品`}</span>
        <span className="font-semibold text-primary">
          {AppStrings.sortDisplayName(sortOption, isEn)}
        </span>
      </div>

      {/* 3. 作品リスト */}
      <div
        className="flex-1 overflow-y-auto px-3 md:px-6 py-3"
        onScroll={handleScroll}
      >
        <div className="max-w-7xl mx-auto w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : works.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-onSurfaceVariant text-sm">
              {isEn ? 'No matching works found' : '該当する作品が見つかりませんでした'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {works.map((work) => {
                const tierSpec = TierTheme.forTier(work.tier);
                const primaryTitle = isEn && work.titleEn ? work.titleEn : work.title;
                const secondaryTitle = isEn
                  ? work.titleEn !== work.title ? work.title : null
                  : work.titleEn || null;

                return (
                  <div
                    key={work.id}
                    onClick={() => onWorkClick(work.id)}
                    className="flex items-center p-3 rounded-2xl bg-surface border border-outlineVariant/40 hover:border-outlineVariant hover:bg-surfaceContainer/50 active:scale-[0.99] cursor-pointer transition-all"
                  >
                    {/* 左端: 偏差値 & 順位 & Tier */}
                    <div className="flex flex-col items-center justify-center w-14 flex-shrink-0">
                      <span
                        className="text-lg font-black tracking-tight leading-none font-sans"
                        style={{ color: tierSpec.onContainerColor }}
                      >
                        {work.deviationScore.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-onSurfaceVariant font-bold font-sans mt-0.5">
                        #{work.deviationRank}
                      </span>
                      <div className="mt-1">
                        <TierBadge tier={work.tier} prefix="" className="text-[10px] px-1.5 py-0" />
                      </div>
                    </div>

                    <div className="w-px h-10 bg-outlineVariant/30 mx-2.5 flex-shrink-0" />

                    {/* 中央: タイトル、年、主要スタッフ */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-onSurface truncate">
                          {primaryTitle}
                        </span>
                        <span className="text-xs text-onSurfaceVariant/80 font-bold font-sans flex-shrink-0">
                          {work.year}
                        </span>
                      </div>

                      {secondaryTitle && (
                        <div className="text-[11px] text-onSurfaceVariant/70 truncate leading-tight">
                          {secondaryTitle}
                        </div>
                      )}

                      <div className="text-[11px] text-onSurfaceVariant truncate mt-0.5">
                        {work.mainStaffSummary}
                      </div>
                    </div>

                    {/* 右端: AniList素点 & 矢印 */}
                    <div className="flex items-center gap-1 flex-shrink-0 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-onSurfaceVariant uppercase font-bold font-sans">
                          AniList
                        </span>
                        <span className="text-xs font-black text-onSurface font-sans">
                          {work.anilistRawScore.toFixed(0)}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-onSurfaceVariant/40 ml-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* フィルタBottomSheet */}
      <WorkFilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        sortOption={sortOption}
        onSortChange={setSortOption}
        verdictFilter={verdictFilter}
        onVerdictChange={setVerdictFilter}
        tierFilter={tierFilter}
        onTierChange={setTierFilter}
        eraFilter={eraFilter}
        onEraChange={setEraFilter}
        onReset={handleResetFilters}
      />
    </div>
  );
};
