/**
 * 制作陣・声優リーダーボード画面 (Android版 StaffScreen.kt に完全準拠)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown, ChevronRight } from 'lucide-react';
import { LeaderboardItem, StaffSortOption, RoleType, ROLE_ORDER } from '../types/entities';
import { CreditRepository } from '../db/repository';
import { SmartSearchBar, DualTierBadge, RoleBadge } from '../components/CommonComponents';
import { TierTheme } from '../theme/tierTheme';
import { LanguageManager } from '../theme/languageManager';
import { AppStrings } from '../theme/strings';
import { StaffNameResolver } from '../utils/nameResolver';

interface StaffScreenProps {
  onStaffClick?: (staffName: string) => void;
  onNavigateToStaff?: (staffName: string) => void;
  onStudioClick?: (studioName: string) => void;
  onNavigateToStudio?: (studioName: string) => void;
}

export const StaffScreen: React.FC<StaffScreenProps> = (props) => {
  const onStaffClick = props.onStaffClick || props.onNavigateToStaff || (() => {});
  const onStudioClick = props.onStudioClick || props.onNavigateToStudio || (() => {});

  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedRole, setSelectedRole] = useState<RoleType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<StaffSortOption>('RATING');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const isEn = LanguageManager.isEnglish;
  const roles: RoleType[] = ['all', ...ROLE_ORDER];

  const loadInitialItems = useCallback(() => {
    setIsLoading(true);
    try {
      const data = CreditRepository.getLeaderboard(
        selectedRole,
        searchQuery,
        sortOption,
        50,
        0
      );
      const count = CreditRepository.getLeaderboardCount(selectedRole, searchQuery);
      setItems(data);
      setTotalCount(count);
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole, searchQuery, sortOption]);

  useEffect(() => {
    loadInitialItems();
  }, [loadInitialItems]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200 && !isLoadingMore && items.length < totalCount) {
      setIsLoadingMore(true);
      setTimeout(() => {
        try {
          const more = CreditRepository.getLeaderboard(
            selectedRole,
            searchQuery,
            sortOption,
            50,
            items.length
          );
          setItems((prev) => [...prev, ...more]);
        } catch (err) {
          console.error('Failed to load more leaderboard items:', err);
        } finally {
          setIsLoadingMore(false);
        }
      }, 100);
    }
  };

  const toggleSort = () => {
    setSortOption((prev) => (prev === 'RATING' ? 'CUMULATIVE' : 'RATING'));
  };

  return (
    <div className="flex flex-col h-full bg-background select-none">
      {/* 1. スマート1行検索バー */}
      <SmartSearchBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        hideFilterButton
        placeholder={
          isEn
            ? 'Search creators, voice cast, studios...'
            : 'スタッフ・声優・制作スタジオ名で検索...'
        }
      />

      {/* 2. 10部門+スタジオ 水平スクロールセレクター */}
      <div className="flex items-center gap-1.5 px-3 py-1 overflow-x-auto no-scrollbar border-b border-outlineVariant/20 flex-shrink-0">
        {roles.map((rKey) => {
          const isSelected = selectedRole === rKey;
          const displayName = AppStrings.roleCompact(rKey, isEn);
          return (
            <button
              key={rKey}
              onClick={() => setSelectedRole(rKey)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors flex-shrink-0 ${
                isSelected
                  ? 'bg-primaryContainer text-onPrimaryContainer border-primary font-bold'
                  : 'bg-surfaceContainer border-outlineVariant/40 text-onSurfaceVariant hover:text-onSurface'
              }`}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      {/* 3. スリムステータスバー (件数 & ソート切り替え) */}
      <div className="flex items-center justify-between px-4 py-1.5 text-xs text-onSurfaceVariant border-b border-outlineVariant/20">
        <span>
          {isEn
            ? selectedRole === 'studio'
              ? `${totalCount} Studios`
              : `${totalCount} Creators & Cast`
            : selectedRole === 'studio'
            ? `${totalCount} スタジオ`
            : `${totalCount} 名のスタッフ・声優`}
        </span>

        {selectedRole !== 'studio' && (
          <button
            onClick={toggleSort}
            className="flex items-center gap-1 text-primary font-bold hover:underline"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>
              {sortOption === 'RATING'
                ? isEn ? 'Power Score S(a)' : '総合実力 S(a) 順'
                : isEn ? 'Cumulative ΣZ' : '生涯累積実績 ΣZ 順'}
            </span>
          </button>
        )}
      </div>

      {/* 4. リーダーボードリスト */}
      <div
        className="flex-1 overflow-y-auto px-3 md:px-6 py-3"
        onScroll={handleScroll}
      >
        <div className="max-w-7xl mx-auto w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-onSurfaceVariant text-sm">
              {isEn
                ? selectedRole === 'studio'
                  ? 'No matching studios found'
                  : 'No matching creators or cast found'
                : selectedRole === 'studio'
                ? '該当する制作スタジオが見つかりませんでした'
                : '該当するスタッフ・声優が見つかりませんでした'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {items.map((staff, idx) => {
                const isStudio = staff.role === 'studio';
                const rank = sortOption === 'RATING' ? staff.ratingRank : staff.cumulativeRank;
                const displayName = isStudio
                  ? StaffNameResolver.getStudioName(staff.name, isEn)
                  : StaffNameResolver.getStaffName(staff.name, isEn);

                const displayScore =
                  sortOption === 'RATING'
                    ? staff.rating > 0 ? `+${staff.rating.toFixed(2)}` : staff.rating.toFixed(2)
                    : staff.cumulativeZ > 0 ? `+${staff.cumulativeZ.toFixed(1)}` : staff.cumulativeZ.toFixed(1);

                const scoreLabel = sortOption === 'RATING' ? 'S(a)' : 'ΣZ';
                const tierSpec = TierTheme.forTier(staff.ratingTier);

                return (
                  <div
                    key={`${staff.role}_${staff.name}_${idx}`}
                    onClick={() => {
                      if (isStudio) {
                        onStudioClick(staff.name);
                      } else {
                        onStaffClick(staff.name);
                      }
                    }}
                    className="flex items-center p-3 rounded-2xl bg-surface border border-outlineVariant/40 hover:border-outlineVariant hover:bg-surfaceContainer/50 active:scale-[0.99] cursor-pointer transition-all"
                  >
                    {/* 左端: 順位 */}
                    <div className="w-10 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-onSurfaceVariant font-sans">
                        #{rank > 0 ? rank : idx + 1}
                      </span>
                    </div>

                    <div className="w-px h-9 bg-outlineVariant/30 mx-2 flex-shrink-0" />

                    {/* 中央: 名前、役職、代表作 */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-onSurface truncate">
                          {displayName}
                        </span>
                        <RoleBadge roleKey={staff.role} isEn={isEn} />
                      </div>

                      <div className="text-[11px] text-onSurfaceVariant truncate mt-0.5">
                        {staff.bestWorkTitle ? (
                          <span>
                            代表作: {isEn && staff.bestWorkTitleEn ? staff.bestWorkTitleEn : staff.bestWorkTitle}
                            {staff.bestWorkYear ? ` (${staff.bestWorkYear})` : ''}
                          </span>
                        ) : (
                          <span>参加作品: {staff.worksCount} 作品</span>
                        )}
                      </div>
                    </div>

                    {/* 右端: スコア or Tier & 矢印 */}
                    <div className="flex items-center gap-2 flex-shrink-0 text-right">
                      {!isStudio && (
                        <div className="flex flex-col items-end">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[9px] text-onSurfaceVariant font-bold font-sans">
                              {scoreLabel}
                            </span>
                            <span
                              className="text-xs font-black font-sans"
                              style={{ color: tierSpec.onContainerColor }}
                            >
                              {displayScore}
                            </span>
                          </div>
                          <DualTierBadge
                            ratingTier={staff.ratingTier}
                            cumulativeTier={staff.cumulativeTier}
                            className="text-[9px] px-1 py-0 mt-0.5"
                          />
                        </div>
                      )}

                      {isStudio && (
                        <span className="text-xs text-onSurfaceVariant font-medium">
                          {staff.worksCount} 作品
                        </span>
                      )}

                      <ChevronRight className="w-4 h-4 text-onSurfaceVariant/40" />
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
    </div>
  );
};
