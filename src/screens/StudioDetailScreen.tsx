/**
 * 制作スタジオ詳細画面 (主要制作陣・アニメーター & 制作作品一覧)
 */
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronRight, Users, Film, Sparkles } from 'lucide-react';
import { StudioWorkItem, StudioStaffMember } from '../types/entities';
import { CreditRepository } from '../db/repository';
import { TierBadge, RoleBadge } from '../components/CommonComponents';
import { TierTheme } from '../theme/tierTheme';
import { LanguageManager } from '../theme/languageManager';
import { StaffNameResolver } from '../utils/nameResolver';
import { AppStrings } from '../theme/strings';

interface StudioDetailScreenProps {
  studioName: string;
  onBack?: () => void;
  onBackClick?: () => void;
  onNavigateToWork?: (workId: string) => void;
  onWorkClick?: (workId: string) => void;
  onNavigateToStaff?: (staffName: string) => void;
  onStaffClick?: (staffName: string) => void;
}

const DEPARTMENTS: { key: string; labelJa: string; labelEn: string }[] = [
  { key: 'all', labelJa: '全体', labelEn: 'All' },
  { key: 'sakkan', labelJa: '作画監督', labelEn: 'Animation' },
  { key: 'genga', labelJa: '原画', labelEn: 'Key Anim' },
  { key: 'director', labelJa: '監督', labelEn: 'Director' },
  { key: 'unit_director', labelJa: '演出・絵コンテ', labelEn: 'Episode Dir' },
  { key: 'char_design', labelJa: 'キャラデザ', labelEn: 'Ch. Design' },
  { key: 'series_comp', labelJa: 'シリーズ構成', labelEn: 'Script' },
  { key: 'art_dir', labelJa: '美術監督', labelEn: 'Art Dir' },
  { key: 'music', labelJa: '音楽', labelEn: 'Music' },
  { key: 'cv', labelJa: '声優・キャスト', labelEn: 'Cast' },
];

export const StudioDetailScreen: React.FC<StudioDetailScreenProps> = (props) => {
  const { studioName } = props;
  const onBackClick = props.onBackClick || props.onBack || (() => {});
  const onWorkClick = props.onWorkClick || props.onNavigateToWork || (() => {});
  const onStaffClick = props.onStaffClick || props.onNavigateToStaff || (() => {});

  const [activeTab, setActiveTab] = useState<'staff' | 'works'>('staff');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'weighted' | 'count'>('weighted');

  const [works, setWorks] = useState<StudioWorkItem[]>([]);
  const [staffList, setStaffList] = useState<StudioStaffMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isEn = LanguageManager.isEnglish;

  useEffect(() => {
    setIsLoading(true);
    try {
      const wList = CreditRepository.getStudioWorks(studioName);
      setWorks(wList);

      const sList = CreditRepository.getStudioStaff(studioName);
      setStaffList(sList);
    } catch (e) {
      console.error('Failed to load studio details:', e);
    } finally {
      setIsLoading(false);
    }
  }, [studioName]);

  const primaryName = StaffNameResolver.getStudioName(studioName, isEn);
  const secondaryName = isEn && primaryName !== studioName ? studioName : null;

  // 部門絞り込みとソート
  const filteredStaff = useMemo(() => {
    if (selectedDept === 'all') {
      const list = [...staffList];
      if (sortOption === 'weighted') {
        list.sort((a, b) => b.weightedScore - a.weightedScore);
      } else {
        list.sort((a, b) => b.totalWorks - a.totalWorks);
      }
      return list;
    } else {
      // 特定部門での参加があるスタッフのみ
      const list = staffList.filter((s) => (s.rolesBreakdown[selectedDept] || 0) > 0);
      list.sort((a, b) => {
        const countA = a.rolesBreakdown[selectedDept] || 0;
        const countB = b.rolesBreakdown[selectedDept] || 0;
        if (countB !== countA) return countB - countA;
        return b.weightedScore - a.weightedScore;
      });
      return list;
    }
  }, [staffList, selectedDept, sortOption]);

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
        <h2 className="font-bold text-base text-onSurface ml-2 truncate">
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

          <div className="flex items-center gap-3 text-xs text-onSurfaceVariant/90">
            <span>
              {isEn
                ? `Total Works: ${works.length}`
                : `通算制作作品数: ${works.length} 作品`}
            </span>
            <span>•</span>
            <span>
              {isEn
                ? `Registered Creators: ${staffList.length}`
                : `クレジット制作陣: ${staffList.length} 名`}
            </span>
          </div>

          {/* 理念注記 */}
          <div className="p-2.5 rounded-xl bg-surfaceContainer border border-outlineVariant/30 text-[11px] text-onSurfaceVariant leading-relaxed">
            {isEn
              ? '※ Focusing on individual staff and cast credits, our analytical model highlights the core animators, directors, and creators shaping each studio.'
              : '※ 本アプリの数理分析モデルは制作スタッフ個人のクレジットに主眼を置いており、スタジオを支える主要アニメーターや監督陣の貢献度を可視化しています。'}
          </div>
        </div>

        {/* 2. セグメント切り替えタブ */}
        <div className="flex rounded-xl bg-surfaceContainer p-1 border border-outlineVariant/30">
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'staff'
                ? 'bg-primary text-onPrimary shadow-sm'
                : 'text-onSurfaceVariant hover:text-onSurface'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isEn ? 'Key Creators & Animators' : '主要アニメーター・制作陣'}</span>
            <span className="text-[10px] opacity-80 font-sans">({staffList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('works')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'works'
                ? 'bg-primary text-onPrimary shadow-sm'
                : 'text-onSurfaceVariant hover:text-onSurface'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>{isEn ? 'Produced Works' : '制作作品一覧'}</span>
            <span className="text-[10px] opacity-80 font-sans">({works.length})</span>
          </button>
        </div>

        {/* 3. タブコンテンツ: 主要スタッフ一覧 */}
        {activeTab === 'staff' && (
          <div className="space-y-3">
            {/* 部門別フィルターチップバー */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {DEPARTMENTS.map((dept) => {
                const isSelected = selectedDept === dept.key;
                return (
                  <button
                    key={dept.key}
                    onClick={() => setSelectedDept(dept.key)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-primary text-onPrimary shadow-sm'
                        : 'bg-surfaceContainer text-onSurfaceVariant hover:bg-surfaceContainerHighest border border-outlineVariant/30'
                    }`}
                  >
                    {isEn ? dept.labelEn : dept.labelJa}
                  </button>
                );
              })}
            </div>

            {/* ソートセレクタ (全体タブの場合のみ) */}
            {selectedDept === 'all' && (
              <div className="flex items-center justify-between px-1 py-0.5">
                <span className="text-[11px] text-onSurfaceVariant font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  {isEn ? 'Sort Order:' : '並び順:'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSortOption('weighted')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      sortOption === 'weighted'
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'text-onSurfaceVariant hover:text-onSurface'
                    }`}
                  >
                    {isEn ? 'Key Contribution (Weighted)' : '主要貢献度順 (役職重み)'}
                  </button>
                  <button
                    onClick={() => setSortOption('count')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      sortOption === 'count'
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'text-onSurfaceVariant hover:text-onSurface'
                    }`}
                  >
                    {isEn ? 'Total Works Count' : '参加作品数順'}
                  </button>
                </div>
              </div>
            )}

            {/* 部門選択時のヒント */}
            {selectedDept !== 'all' && (
              <div className="text-[11px] text-onSurfaceVariant/80 px-1">
                {isEn
                  ? `Showing creators sorted by number of ${DEPARTMENTS.find((d) => d.key === selectedDept)?.labelEn} credits at ${primaryName}`
                  : `${primaryName} での「${DEPARTMENTS.find((d) => d.key === selectedDept)?.labelJa}」担当作品数順に表示中`}
              </div>
            )}

            {/* スタッフカード一覧 */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-12 text-xs text-onSurfaceVariant bg-surfaceContainer/40 rounded-2xl border border-outlineVariant/20">
                {isEn ? 'No staff found for this category' : '該当するスタッフが見つかりませんでした'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredStaff.map((member, index) => {
                  const staffDisplayName = StaffNameResolver.getStaffName(member.name, isEn);
                  const staffSecondary = isEn && staffDisplayName !== member.name ? member.name : null;

                  // その部門での回数
                  const deptCount = selectedDept !== 'all' ? member.rolesBreakdown[selectedDept] || 0 : null;

                  return (
                    <div
                      key={member.name}
                      onClick={() => onStaffClick(member.name)}
                      className="p-3 rounded-xl bg-surface border border-outlineVariant/40 hover:border-outlineVariant hover:bg-surfaceContainer/50 cursor-pointer transition-all space-y-2 group"
                    >
                      {/* 上段: 順位 + 名前 + Tierバッジ + 参加本数 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* 順位バッジ */}
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black font-sans flex-shrink-0 ${
                              index === 0
                                ? 'bg-amber-400/20 text-amber-500 border border-amber-400/40'
                                : index === 1
                                ? 'bg-slate-300/20 text-slate-400 border border-slate-300/40'
                                : index === 2
                                ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                                : 'bg-surfaceContainer text-onSurfaceVariant/70'
                            }`}
                          >
                            {index + 1}
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-extrabold text-onSurface group-hover:text-primary transition-colors truncate">
                                {staffDisplayName}
                              </span>
                              {staffSecondary && (
                                <span className="text-[10px] text-onSurfaceVariant/70 truncate">
                                  ({staffSecondary})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tier & 参加数 */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {member.ratingTier && (
                            <TierBadge tier={member.ratingTier} prefix="" className="text-[10px] px-1.5 py-0" />
                          )}
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-onSurface font-sans">
                              {deptCount !== null
                                ? `${deptCount}作`
                                : `${member.totalWorks}作`}
                            </span>
                            {selectedDept === 'all' && sortOption === 'weighted' && (
                              <span className="text-[9px] text-primary font-bold font-sans">
                                ★{member.weightedScore.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-onSurfaceVariant/40 group-hover:text-primary transition-colors" />
                        </div>
                      </div>

                      {/* 中段: 担当役職の内訳ピル */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {member.primaryRoles.slice(0, 4).map((rKey) => {
                          const count = member.rolesBreakdown[rKey] || 0;
                          const rName = AppStrings.roleCompact(rKey, isEn);
                          const isHighlighted = selectedDept === rKey;
                          return (
                            <span
                              key={rKey}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium font-sans border ${
                                isHighlighted
                                  ? 'bg-primaryContainer text-onPrimaryContainer border-primary/40 font-bold'
                                  : 'bg-surfaceContainer text-onSurfaceVariant/90 border-outlineVariant/30'
                              }`}
                            >
                              <span>{rName}</span>
                              <span className="font-bold opacity-75">{count}</span>
                            </span>
                          );
                        })}
                        {member.primaryRoles.length > 4 && (
                          <span className="text-[9px] text-onSurfaceVariant/60 px-1">
                            +{member.primaryRoles.length - 4}
                          </span>
                        )}
                      </div>

                      {/* 下段: 代表作サマリー */}
                      {member.sampleWorks.length > 0 && (
                        <div className="text-[10px] text-onSurfaceVariant/80 truncate pt-0.5 border-t border-outlineVariant/20">
                          <span className="font-semibold text-onSurfaceVariant/90">
                            {isEn ? 'Works: ' : '代表作: '}
                          </span>
                          <span>{member.sampleWorks.join(' / ')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. タブコンテンツ: 制作作品一覧 */}
        {activeTab === 'works' && (
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
        )}
      </div>
    </div>
  );
};
