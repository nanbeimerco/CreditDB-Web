/**
 * 作品フィルタ & ソート ModalBottomSheet (Android版 WorkFilterBottomSheet に完全準拠)
 */
import React from 'react';
import { X } from 'lucide-react';
import { WorksSortOption } from '../types/entities';
import { LanguageManager } from '../theme/languageManager';
import { AppStrings } from '../theme/strings';

interface WorkFilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sortOption: WorksSortOption;
  onSortChange: (sort: WorksSortOption) => void;
  verdictFilter: string;
  onVerdictChange: (verdict: string) => void;
  tierFilter: string;
  onTierChange: (tier: string) => void;
  eraFilter: string;
  onEraChange: (era: string) => void;
  onReset: () => void;
}

export const WorkFilterBottomSheet: React.FC<WorkFilterBottomSheetProps> = ({
  isOpen,
  onClose,
  sortOption,
  onSortChange,
  verdictFilter,
  onVerdictChange,
  tierFilter,
  onTierChange,
  eraFilter,
  onEraChange,
  onReset
}) => {
  if (!isOpen) return null;
  const isEn = LanguageManager.isEnglish;

  const availableSorts: WorksSortOption[] = [
    'DEVIATION_DESC',
    'DEVIATION_ASC',
    'PRED_DESC',
    'RAW_DESC',
    'YEAR_DESC',
    'TITLE_ASC'
  ];

  const verdicts = isEn
    ? [
        { key: 'all', label: 'All' },
        { key: 'サプライズ名作', label: '★ Exceeded Expectations' },
        { key: '期待外れ', label: '▼ Below Potential' },
        { key: '概ねスタッフ前評判通り', label: '● As Expected' }
      ]
    : [
        { key: 'all', label: 'すべて' },
        { key: 'サプライズ名作', label: '★ サプライズ名作 (期待以上)' },
        { key: '期待外れ', label: '▼ 期待外れ (未達)' },
        { key: '概ねスタッフ前評判通り', label: '● 前評判通り' }
      ];

  const tiers = ['all', 'S+', 'S', 'A+', 'A', 'B+', 'B', 'C', 'D'];

  const eras = isEn
    ? [
        { key: 'all', label: 'All Eras' },
        { key: '2020s', label: '2020s' },
        { key: '2010s', label: '2010s' },
        { key: '2000s', label: '2000s' },
        { key: '1990s', label: '1990s' },
        { key: '1980s', label: '1980s & Earlier' }
      ]
    : [
        { key: 'all', label: '全年代' },
        { key: '2020s', label: '2020年代' },
        { key: '2010s', label: '2010年代' },
        { key: '2000s', label: '2000年代' },
        { key: '1990s', label: '1990年代' },
        { key: '1980s', label: '1980年代以前' }
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm select-none animate-fade-in">
      <div className="w-full max-w-lg bg-surface rounded-t-3xl border-t border-outlineVariant p-5 max-h-[85vh] overflow-y-auto animate-slide-up">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-outlineVariant/40">
          <h3 className="text-base font-bold text-onSurface">
            {isEn ? 'Filter & Sort Works' : '作品絞込 & 並び替え'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="text-xs font-bold text-primary hover:underline px-2 py-1"
            >
              {isEn ? 'Reset' : 'リセット'}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-onSurfaceVariant hover:text-onSurface"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 py-3">
          {/* 1. 並び替え */}
          <div>
            <label className="block text-xs font-bold text-onSurfaceVariant mb-2">
              {isEn ? 'Sort Criteria' : '並び替え基準'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableSorts.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onSortChange(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    sortOption === opt
                      ? 'bg-primaryContainer text-onPrimaryContainer border-primary'
                      : 'bg-surfaceContainer border-outlineVariant/50 text-onSurfaceVariant hover:text-onSurface'
                  }`}
                >
                  {AppStrings.sortDisplayName(opt, isEn)}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 総合判定 */}
          <div>
            <label className="block text-xs font-bold text-onSurfaceVariant mb-2">
              {isEn ? 'Performance Verdict' : '総合パフォーマンス判定'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {verdicts.map((v) => (
                <button
                  key={v.key}
                  onClick={() => onVerdictChange(v.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    verdictFilter === v.key
                      ? 'bg-primaryContainer text-onPrimaryContainer border-primary'
                      : 'bg-surfaceContainer border-outlineVariant/50 text-onSurfaceVariant hover:text-onSurface'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Tier */}
          <div>
            <label className="block text-xs font-bold text-onSurfaceVariant mb-2">
              {isEn ? 'Tier (Deviation Range)' : 'Tier (偏差値区分)'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tiers.map((t) => (
                <button
                  key={t}
                  onClick={() => onTierChange(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    tierFilter === t
                      ? 'bg-primaryContainer text-onPrimaryContainer border-primary'
                      : 'bg-surfaceContainer border-outlineVariant/50 text-onSurfaceVariant hover:text-onSurface'
                  }`}
                >
                  {t === 'all' ? (isEn ? 'All Tiers' : '全Tier') : t}
                </button>
              ))}
            </div>
          </div>

          {/* 4. 公開年代 */}
          <div>
            <label className="block text-xs font-bold text-onSurfaceVariant mb-2">
              {isEn ? 'Release Era' : '公開年代'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {eras.map((era) => (
                <button
                  key={era.key}
                  onClick={() => onEraChange(era.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    eraFilter === era.key
                      ? 'bg-primaryContainer text-onPrimaryContainer border-primary'
                      : 'bg-surfaceContainer border-outlineVariant/50 text-onSurfaceVariant hover:text-onSurface'
                  }`}
                >
                  {era.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="w-full mt-2 py-3 rounded-xl bg-primary text-onPrimary font-bold text-sm hover:opacity-90 transition-opacity"
        >
          {isEn ? 'Apply & Close' : '適用して閉じる'}
        </button>
      </div>
    </div>
  );
};
