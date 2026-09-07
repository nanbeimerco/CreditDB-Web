/**
 * 作品詳細画面 (Android版 WorkDetailScreen.kt に完全準拠)
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { WorkDetail } from '../types/entities';
import { CreditRepository } from '../db/repository';
import { TierBadge, DualTierBadge, VerdictBadge, RoleBadge, MetricCard } from '../components/CommonComponents';
import { TierTheme } from '../theme/tierTheme';
import { VerdictSurprise, VerdictUnderperform } from '../theme/colors';
import { LanguageManager } from '../theme/languageManager';
import { AppStrings } from '../theme/strings';
import { StaffNameResolver } from '../utils/nameResolver';

interface WorkDetailScreenProps {
  workId: string;
  onBack?: () => void;
  onBackClick?: () => void;
  onNavigateToStaff?: (staffName: string) => void;
  onStaffClick?: (staffName: string) => void;
  onNavigateToStudio?: (studioName: string) => void;
  onStudioClick?: (studioName: string) => void;
  onWorkClick?: (workId: string) => void;
}

export const WorkDetailScreen: React.FC<WorkDetailScreenProps> = (props) => {
  const { workId } = props;
  const onBackClick = props.onBackClick || props.onBack || (() => {});
  const onStaffClick = props.onStaffClick || props.onNavigateToStaff || (() => {});
  const onStudioClick = props.onStudioClick || props.onNavigateToStudio || (() => {});
  const [detail, setDetail] = useState<WorkDetail | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdvancedMetricsEnabled, setIsAdvancedMetricsEnabled] = useState<boolean>(false);
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});

  const isEn = LanguageManager.isEnglish;

  useEffect(() => {
    setIsLoading(true);
    try {
      const data = CreditRepository.getWorkDetail(workId);
      setDetail(data);
    } catch (e) {
      console.error('Failed to get work detail:', e);
    } finally {
      setIsLoading(false);
    }
  }, [workId]);

  const toggleExpand = (roleKey: string) => {
    setExpandedRoles((prev) => ({ ...prev, [roleKey]: !prev[roleKey] }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="flex items-center h-14 px-3 border-b border-outlineVariant/30">
          <button onClick={onBackClick} className="p-2 text-onSurfaceVariant hover:text-onSurface">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm ml-2">{isEn ? 'Work Details' : '作品詳細'}</span>
        </header>
        <div className="flex-1 flex items-center justify-center text-sm text-onSurfaceVariant">
          {isEn ? 'Work information not found' : '作品情報が見つかりませんでした'}
        </div>
      </div>
    );
  }

  const work = detail;
  const tierSpec = TierTheme.forTier(work.tier);
  const primaryTitle = isEn && work.titleEn ? work.titleEn : work.title;
  const secondaryTitle = isEn
    ? work.titleEn !== work.title ? work.title : null
    : work.titleEn || null;

  const resColor =
    work.residual > 0.4
      ? VerdictSurprise
      : work.residual < -0.4
      ? VerdictUnderperform
      : 'var(--md-sys-color-on-surface)';

  const roleKeys = [
    'director',
    'series_comp',
    'char_design',
    'sakkan',
    'genga',
    'unit_director',
    'music',
    'art_dir'
  ];

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
          {isEn ? 'Work Details' : '作品詳細'}
        </h2>
      </header>

      <div className="p-4 md:p-6 max-w-6xl mx-auto w-full pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左カラム: タイトル、数理指標、解説、スタジオ (5/12幅) */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. タイトル & 基本情報ヘッダーカード */}
            <div className="p-4 rounded-2xl bg-surface border border-outlineVariant/40 space-y-2.5">
              <div className="flex items-center gap-2">
                <TierBadge tier={work.tier} prefix="Tier " />
              </div>

              <h1 className="text-xl font-black text-onSurface tracking-tight leading-snug">
                {primaryTitle}
              </h1>

              {secondaryTitle && (
                <div className="text-xs text-onSurfaceVariant font-medium">
                  {secondaryTitle}
                </div>
              )}

              <div className="text-xs text-onSurfaceVariant/90">
                {isEn
                  ? `Released: ${work.year} (Top ${work.percentile.toFixed(1)}%)`
                  : `公開年: ${work.year}年 (上位 ${work.percentile.toFixed(1)}%)`}
              </div>
            </div>

            {/* 2. 数理指標グリッド */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-onSurface">
                  {isEn ? 'Metrics & Comparison' : '数理評価・対比指標'}
                </h3>
                <button
                  onClick={() => setIsAdvancedMetricsEnabled(!isAdvancedMetricsEnabled)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                    isAdvancedMetricsEnabled
                      ? 'bg-primaryContainer text-onPrimaryContainer border-primary'
                      : 'bg-surfaceContainer border-outlineVariant/50 text-onSurfaceVariant hover:text-onSurface'
                  }`}
                >
                  {isAdvancedMetricsEnabled && <Check className="w-3 h-3" />}
                  <span>Advanced</span>
                </button>
              </div>

              {/* 基本指標 1行目 */}
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  title={isEn ? 'Deviation Score' : '偏差値'}
                  value={work.deviationScore.toFixed(1)}
                  subValue={isEn ? `Overall #${work.deviationRank}` : `総合 #${work.deviationRank}`}
                  valueColor={tierSpec.onContainerColor}
                />
                <MetricCard
                  title={isEn ? 'AniList Raw' : 'AniList素点'}
                  value={isEn ? `${work.anilistRawScore.toFixed(1)} pts` : `${work.anilistRawScore.toFixed(1)}点`}
                  subValue={isEn ? `Raw #${work.rawRank}` : `素点 #${work.rawRank}`}
                />
              </div>

              {/* Advanced 指標 */}
              {isAdvancedMetricsEnabled && (
                <div className="space-y-2 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <MetricCard
                      title={isEn ? 'Predicted Score' : '前評判予測点'}
                      value={work.predictedScore.toFixed(1)}
                      subValue={isEn ? `Pred #${work.predScoreRank}` : `予測 #${work.predScoreRank}`}
                    />
                    <MetricCard
                      title={isEn ? 'Residual (Delta)' : '残差 (実績 − 予測)'}
                      value={work.residual > 0 ? `+${work.residual.toFixed(2)}` : work.residual.toFixed(2)}
                      valueColor={resColor}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <MetricCard
                      title={isEn ? 'Era-Adjusted Z (Zi)' : '年代補正Z値 (Zi)'}
                      value={work.trueZScore > 0 ? `+${work.trueZScore.toFixed(2)}σ` : `${work.trueZScore.toFixed(2)}σ`}
                    />
                    <MetricCard
                      title={isEn ? 'Debiased Score (bi)' : 'バイアス除去素点 (bi)'}
                      value={`${work.debiasedScore.toFixed(1)}点`}
                    />
                  </div>

                  {/* 総合判定 */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surfaceContainer border border-outlineVariant/40">
                    <span className="text-xs font-bold text-onSurfaceVariant">
                      {isEn ? 'Performance Verdict' : '総合パフォーマンス判定'}
                    </span>
                    <VerdictBadge verdict={work.performanceVerdict} isEn={isEn} />
                  </div>
                </div>
              )}
            </div>

            {/* 3. 判定解説カード */}
            <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/30 space-y-1.5">
              <div className="text-xs font-bold text-primary">
                {isEn ? 'About Evaluation & Tier' : 'Tier評価と判定の解説'}
              </div>
              <p className="text-xs text-onSurfaceVariant leading-relaxed">
                {tierSpec.descriptionJa}
              </p>
            </div>

            {/* 4. 制作スタジオ */}
            {work.studio && (
              <div className="p-3.5 rounded-2xl bg-surface border border-outlineVariant/40">
                <div className="text-xs font-bold text-onSurfaceVariant mb-1.5">
                  {isEn ? 'Animation Studio' : 'アニメーション制作スタジオ'}
                </div>
                <div
                  onClick={() => onStudioClick(work.studio!)}
                  className="flex items-center justify-between p-2 rounded-xl bg-surfaceContainer/60 hover:bg-surfaceContainer border border-outlineVariant/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-onSurface">
                      {StaffNameResolver.getStudioName(work.studio, isEn)}
                    </span>
                    <RoleBadge roleKey="studio" isEn={isEn} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-onSurfaceVariant/50" />
                </div>
              </div>
            )}
          </div>

          {/* 右カラム: 主要制作陣クレジット & キャスト (7/12幅) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 5. 9大部門スタッフクレジット */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-onSurface">
                {isEn ? 'Production Staff Credits' : '主要制作陣クレジット (全9部門)'}
              </h3>

              <div className="space-y-2.5">
                {roleKeys.map((roleKey) => {
                  const staffList = work.staffByRole[roleKey] || [];
                  if (staffList.length === 0) return null;

                  const isExpanded = expandedRoles[roleKey] || false;
                  const maxDisplay = 6;
                  const showAll = isExpanded || staffList.length <= maxDisplay;
                  const displayList = showAll ? staffList : staffList.slice(0, maxDisplay);

                  return (
                    <div
                      key={roleKey}
                      className="p-3.5 rounded-2xl bg-surface border border-outlineVariant/40 space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-outlineVariant/20 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-onSurface">
                            {AppStrings.roleFull(roleKey, isEn)}
                          </span>
                          <span className="text-[11px] text-onSurfaceVariant font-bold font-sans">
                            ({staffList.length})
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {displayList.map((member, idx) => {
                          const staffDisplayName = StaffNameResolver.getStaffName(member.name, isEn);
                          return (
                            <div
                              key={`${member.name}_${idx}`}
                              onClick={() => onStaffClick(member.name)}
                              className="flex items-center justify-between p-2 rounded-xl bg-surfaceContainer/50 hover:bg-surfaceContainer border border-outlineVariant/20 cursor-pointer transition-colors"
                            >
                              <span className="text-xs font-bold text-onSurface truncate pr-2">
                                {staffDisplayName}
                              </span>
                              <DualTierBadge
                                ratingTier={member.ratingTier}
                                cumulativeTier={member.cumulativeTier}
                                className="flex-shrink-0"
                              />
                            </div>
                          );
                        })}
                      </div>

                      {staffList.length > maxDisplay && (
                        <button
                          onClick={() => toggleExpand(roleKey)}
                          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-primary hover:underline font-sans"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>{isEn ? 'Show Less' : '折りたたむ'}</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>{isEn ? `Show All (${staffList.length})` : `すべて引き出す (${staffList.length}名)`}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. 声優・キャスト */}
            {work.characters && work.characters.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-onSurface">
                    {isEn ? 'Voice Cast' : '声優 / キャストクレジット'}
                  </h3>
                  <span className="text-xs text-onSurfaceVariant font-bold font-sans">
                    ({work.characters.length})
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface border border-outlineVariant/40 space-y-1.5 max-h-[600px] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {work.characters.map((cast, idx) => {
                      const actorDisplayName = StaffNameResolver.getStaffName(cast.actorName, isEn);
                      return (
                        <div
                          key={`${cast.actorName}_${idx}`}
                          onClick={() => onStaffClick(cast.actorName)}
                          className="flex items-center justify-between p-2 rounded-xl bg-surfaceContainer/40 hover:bg-surfaceContainer border border-outlineVariant/20 cursor-pointer transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-bold text-onSurface truncate">
                              {actorDisplayName}
                            </div>
                            <div className="text-[10px] text-onSurfaceVariant truncate">
                              {cast.characterName} ({cast.relation})
                            </div>
                          </div>
                          <DualTierBadge
                            ratingTier={cast.ratingTier}
                            cumulativeTier={cast.cumulativeTier}
                            className="flex-shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
