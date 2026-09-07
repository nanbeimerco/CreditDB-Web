/**
 * スタッフ詳細画面 (Android版 StaffDetailScreen.kt に完全準拠)
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Award, History, Layers } from 'lucide-react';
import { StaffProfile } from '../types/entities';
import { CreditRepository } from '../db/repository';
import { DualTierBadge, LargeTierBadge, RoleBadge } from '../components/CommonComponents';
import { TierTheme } from '../theme/tierTheme';
import { LanguageManager } from '../theme/languageManager';
import { AppStrings } from '../theme/strings';
import { StaffNameResolver, CharacterNameResolver } from '../utils/nameResolver';

interface StaffDetailScreenProps {
  staffName: string;
  onBack?: () => void;
  onBackClick?: () => void;
  onNavigateToWork?: (workId: string) => void;
  onWorkClick?: (workId: string) => void;
}

export const StaffDetailScreen: React.FC<StaffDetailScreenProps> = (props) => {
  const { staffName } = props;
  const onBackClick = props.onBackClick || props.onBack || (() => {});
  const onWorkClick = props.onWorkClick || props.onNavigateToWork || (() => {});

  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAllRoleStats, setShowAllRoleStats] = useState<boolean>(false);

  const isEn = LanguageManager.isEnglish;

  useEffect(() => {
    setIsLoading(true);
    try {
      const data = CreditRepository.getStaffProfile(staffName);
      setProfile(data);
    } catch (e) {
      console.error('Failed to get staff profile:', e);
    } finally {
      setIsLoading(false);
    }
  }, [staffName]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="flex items-center h-14 px-3 border-b border-outlineVariant/30">
          <button onClick={onBackClick} className="p-2 text-onSurfaceVariant hover:text-onSurface">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm ml-2">{isEn ? 'Creator Details' : 'クリエイター詳細'}</span>
        </header>
        <div className="flex-1 flex items-center justify-center text-sm text-onSurfaceVariant">
          {isEn ? 'Creator information not found' : 'スタッフ情報が見つかりませんでした'}
        </div>
      </div>
    );
  }

  const prof = profile;
  const primaryName = StaffNameResolver.getStaffName(prof.name, isEn);
  const secondaryName = isEn && primaryName !== prof.name ? prof.name : null;

  const rTierSpec = TierTheme.forTier(prof.overallRatingTier);
  const cTierSpec = TierTheme.forTier(prof.overallCumTier);

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
          {isEn ? 'Creator Details' : 'クリエイター詳細'}
        </h2>
      </header>

      <div className="p-4 md:p-6 max-w-6xl mx-auto w-full pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左カラム: ヘッダー、2大サマリー、役職別実績、代表作 (5/12幅) */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. スタッフ名ヘッダーカード */}
            <div className="p-4 rounded-2xl bg-surface border border-outlineVariant/40 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-onSurface tracking-tight">
                  {primaryName}
                </h1>
                <RoleBadge roleKey={prof.primaryRole} isEn={isEn} />
              </div>

              {secondaryName && (
                <div className="text-xs text-onSurfaceVariant font-medium">
                  {secondaryName}
                </div>
              )}

              <div className="text-xs text-onSurfaceVariant/90">
                {isEn
                  ? `Total Participations: ${prof.totalWorks} works`
                  : `通算参加作品数: ${prof.totalWorks} 作品`}
              </div>
            </div>

            {/* 2. 2大サマリーカード: 総合実力 S(a) & 生涯累積実績 ΣZ */}
            <div className="space-y-2.5">
              {/* 総合実力 S(a) */}
              <div className="p-4 rounded-2xl bg-surface border border-outlineVariant/40 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-onSurfaceVariant">
                    {isEn ? '🎯 Power Score S(a)' : '🎯 総合実力'}
                  </span>
                  <div
                    className="text-2xl font-black font-sans"
                    style={{ color: rTierSpec.onContainerColor }}
                  >
                    {(prof.bayesianRating ?? 0) > 0
                      ? `+${(prof.bayesianRating ?? 0).toFixed(3)}`
                      : (prof.bayesianRating ?? 0).toFixed(3)}
                  </div>
                  <div className="text-[11px] text-onSurfaceVariant font-bold font-sans">
                    {isEn ? `Overall #${prof.overallRank}` : `全スタッフ中 #${prof.overallRank} 位`}
                  </div>
                </div>
                <LargeTierBadge tier={prof.overallRatingTier} />
              </div>

              {/* 生涯累積実績 ΣZ */}
              <div className="p-4 rounded-2xl bg-surface border border-outlineVariant/40 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-onSurfaceVariant">
                    {isEn ? '🏛️ Career Cumulative ΣZ' : '🏛️ 生涯累積実績'}
                  </span>
                  <div
                    className="text-2xl font-black font-sans"
                    style={{ color: cTierSpec.onContainerColor }}
                  >
                    {(prof.careerCumulativeZ ?? 0) > 0
                      ? `+${(prof.careerCumulativeZ ?? 0).toFixed(1)}`
                      : (prof.careerCumulativeZ ?? 0).toFixed(1)}
                  </div>
                  <div className="text-[11px] text-onSurfaceVariant font-bold font-sans">
                    {isEn ? `Career #${prof.cumulativeRank}` : `通算貢献順位 #${prof.cumulativeRank} 位`}
                  </div>
                </div>
                <LargeTierBadge tier={prof.overallCumTier} />
              </div>
            </div>

            {/* 3. 役職別実績カード */}
            {prof.allRoleStats && prof.allRoleStats.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-onSurface">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>{isEn ? 'Role-by-Role Breakdown' : '全役職別の実績'}</span>
                  </div>
                  {prof.allRoleStats.length > 2 && (
                    <button
                      onClick={() => setShowAllRoleStats(!showAllRoleStats)}
                      className="text-xs text-primary font-bold hover:underline font-sans"
                    >
                      {showAllRoleStats ? (isEn ? 'Collapse' : '閉じる') : (isEn ? 'Show All' : 'すべて見る')}
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {(showAllRoleStats ? prof.allRoleStats : prof.allRoleStats.slice(0, 3)).map((stat, idx) => {
                    const rating = stat.bayesian_rating ?? 0;
                    const cumZ = stat.career_cumulative_z ?? 0;
                    return (
                      <div
                        key={`${stat.role}_${idx}`}
                        className="p-3 rounded-xl bg-surfaceContainer border border-outlineVariant/30 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-onSurface">
                            <span>{AppStrings.roleFull(stat.role, isEn)}</span>
                            <span className="text-[10px] text-onSurfaceVariant font-bold font-sans">
                              ({stat.works_count ?? 0}作)
                            </span>
                          </div>
                          <div className="text-[10px] text-onSurfaceVariant/80 font-sans mt-0.5">
                            S(a): {rating > 0 ? `+${rating.toFixed(2)}` : rating.toFixed(2)} (#{stat.rating_rank ?? 0}) • ΣZ: {cumZ.toFixed(1)} (#{stat.cumulative_rank ?? 0})
                          </div>
                        </div>
                        <DualTierBadge
                          ratingTier={stat.rating_tier || 'B'}
                          cumulativeTier={stat.cum_tier || 'B'}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. 最高評価代表作カード */}
            {prof.bestWorks && prof.bestWorks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-bold text-onSurface">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>{isEn ? 'Career Masterpieces' : '最高評価代表作'}</span>
                </div>

                <div className="space-y-1.5">
                  {prof.bestWorks.map((bw) => {
                    const bwTitle = isEn && bw.work_title_en ? bw.work_title_en : bw.work_title;
                    const zScore = bw.z_score ?? 0;
                    return (
                      <div
                        key={bw.work_id}
                        onClick={() => onWorkClick(bw.work_id)}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface border border-outlineVariant/40 hover:border-outlineVariant hover:bg-surfaceContainer/50 cursor-pointer transition-all"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold text-onSurface truncate">
                            {bwTitle}
                          </div>
                          <div className="text-[10px] text-onSurfaceVariant">
                            {bw.year}年 • {AppStrings.roleCompact(bw.role, isEn)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs font-black text-primary font-sans">
                            {zScore > 0 ? `+${zScore.toFixed(2)}σ` : `${zScore.toFixed(2)}σ`}
                          </span>
                          <ChevronRight className="w-4 h-4 text-onSurfaceVariant/40" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 右カラム: キャリア参加作品タイムライン年表 (7/12幅) */}
          <div className="lg:col-span-7 space-y-4">
            {prof.careerTrajectory && prof.careerTrajectory.length > 0 && (
              <div className="space-y-2 bg-surface p-4 rounded-2xl border border-outlineVariant/40">
                <div className="flex items-center gap-1.5 text-sm font-bold text-onSurface pb-1 border-b border-outlineVariant/20">
                  <History className="w-4 h-4 text-primary" />
                  <span>{isEn ? 'Career Trajectory' : '参加作品タイムライン年表'}</span>
                  <span className="text-xs text-onSurfaceVariant font-bold font-sans ml-auto">
                    {prof.careerTrajectory.length} 作品
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[700px] overflow-y-auto pr-1">
                  {prof.careerTrajectory.map((item, idx) => {
                    const title = isEn && item.work_title_en ? item.work_title_en : item.work_title;
                    const charName = CharacterNameResolver.getCharacterName(item.character_name, isEn);
                    const zScore = item.z_score ?? 0;

                    return (
                      <div
                        key={`${item.work_id}_${idx}`}
                        onClick={() => onWorkClick(item.work_id)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-surfaceContainer/50 hover:bg-surfaceContainer border border-outlineVariant/20 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="text-[11px] font-bold text-onSurfaceVariant font-sans w-10 flex-shrink-0">
                            {item.year}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-onSurface truncate">
                              {title}
                            </div>
                            <div className="text-[10px] text-onSurfaceVariant truncate">
                              {AppStrings.roleCompact(item.role, isEn)}
                              {charName ? ` (${charName})` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[11px] font-bold text-onSurface font-sans">
                            {zScore > 0 ? `+${zScore.toFixed(2)}` : zScore.toFixed(2)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-onSurfaceVariant/40" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
