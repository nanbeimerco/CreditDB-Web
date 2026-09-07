import React, { useMemo } from 'react';
import { TierTableConfig } from '../../types/tier';
import { TierAnalysisEngine } from './tierAnalysisEngine';
import { useLanguage } from '../../theme/languageManager';
import { AppStrings } from '../../theme/strings';
import { X, Sparkles, BarChart2 } from 'lucide-react';



interface TierCorrelationSheetProps {
  config: TierTableConfig;
  onDismiss: () => void;
}

export const TierCorrelationSheet: React.FC<TierCorrelationSheetProps> = ({
  config,
  onDismiss
}) => {
  const { isEn } = useLanguage();

  const result = useMemo(() => {
    return TierAnalysisEngine.calculateTasteCorrelation(config);
  }, [config]);

  // ρ の値に応じた色・ラベル判定
  const rhoValue = result.spearmanRho;
  const isEnoughSample = result.sampleSize >= 3;

  const rhoColor = !isEnoughSample
    ? 'text-gray-400'
    : rhoValue >= 0.5
    ? 'text-[#8BD3A7]'
    : rhoValue >= 0.15
    ? 'text-[#8BC5E3]'
    : rhoValue >= -0.15
    ? 'text-[#A3B3E7]'
    : 'text-[#DEA1A9]';

  const strengthBadge = !isEnoughSample
    ? {
        label: isEn ? "Insufficient Data" : "標本不足 (最低3作品)",
        bg: "bg-gray-500/15 border-gray-500/30 text-gray-400"
      }
    : rhoValue >= 0.6
    ? {
        label: isEn ? "Strong Positive Correlation" : "強い正の相関（客観指標と連動）",
        bg: "bg-[#8BD3A7]/15 border-[#8BD3A7]/40 text-[#8BD3A7]"
      }
    : rhoValue >= 0.2
    ? {
        label: isEn ? "Moderate Positive Correlation" : "中程度の正の相関（バランス型）",
        bg: "bg-[#8BC5E3]/15 border-[#8BC5E3]/40 text-[#8BC5E3]"
      }
    : rhoValue >= -0.2
    ? {
        label: isEn ? "Low / Independent Correlation" : "無相関（完全独自路線）",
        bg: "bg-[#A3B3E7]/15 border-[#A3B3E7]/40 text-[#A3B3E7]"
      }
    : {
        label: isEn ? "Negative / Inverse Correlation" : "負の相関（カルト・異色作志向）",
        bg: "bg-[#DEA1A9]/15 border-[#DEA1A9]/40 text-[#DEA1A9]"
      };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] shadow-2xl border border-outlineVariant/35 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-outlineVariant/25 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
              <span>{AppStrings.tierCorrelationTitle(isEn)}</span>
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
              {AppStrings.tierCorrelationSubtitle(isEn)}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 1. Spearman Rho Hero Card */}
          <div className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-outlineVariant/35 text-center space-y-2">
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">
              {isEn ? "Spearman Rank Correlation (ρ)" : "スピアマン順位相関係数 (ρ)"}
            </div>

            <div className={`text-5xl font-black tracking-tight ${rhoColor}`}>
              {isEnoughSample ? (rhoValue >= 0 ? `+${rhoValue.toFixed(2)}` : rhoValue.toFixed(2)) : '--'}
            </div>

            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold border border-outlineVariant/35 mt-1 shadow-sm">
              <span className={`px-2 py-0.5 rounded-full border ${strengthBadge.bg}`}>
                {strengthBadge.label}
              </span>
            </div>

            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] pt-1">
              {isEn ? `Ranked: ${result.sampleSize} anime` : `集計対象: ${result.sampleSize} 作品`}
            </div>
          </div>

          {/* 2. Taste Diagnosis Profile Card */}
          <div className="p-4 rounded-2xl bg-[var(--md-sys-color-primary)]/10 border border-primary/30 space-y-2">
            <div className="flex items-center gap-2 text-[var(--md-sys-color-primary)] font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>{isEn ? result.diagnosisTitleEn : result.diagnosisTitleJa}</span>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface)] leading-relaxed">
              {isEn ? result.diagnosisDescEn : result.diagnosisDescJa}
            </p>
          </div>

          {/* 3. Average Deviation Score per Tier */}
          <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-outlineVariant/35 space-y-3">
            <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
              {isEn ? "Average Deviation Score per Tier" : "各Tierの平均偏差値"}
            </h3>

            <div className="space-y-2.5">
              {config.rows.map((row) => {
                const avg = result.avgDeviationPerTier[row.name] ?? 0;
                const count = result.countPerTier[row.name] ?? 0;
                // 30〜80 を 0〜100% にマッピング
                const percent = Math.min(100, Math.max(0, ((avg - 30) / 50) * 100));

                return (
                  <div key={row.id} className="flex items-center gap-3">
                    {/* Row badge */}
                    <div
                      style={{ backgroundColor: row.colorHex }}
                      className="w-9 py-0.5 rounded-md font-black text-xs text-white text-center shrink-0 shadow-sm"
                    >
                      {row.name}
                    </div>

                    {/* Progress bar */}
                    <div className="flex-1 h-3 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
                      <div
                        style={{
                          width: `${percent}%`,
                          backgroundColor: row.colorHex
                        }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>

                    {/* Value */}
                    <div className="w-20 text-right text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">
                      {count > 0 ? `${avg.toFixed(1)} (${count}作)` : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outlineVariant/25 bg-[var(--md-sys-color-surface-container)]">
          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-sm shadow-md hover:opacity-95 transition-opacity"
          >
            {isEn ? "Done" : "完了"}
          </button>
        </div>
      </div>
    </div>
  );
};
