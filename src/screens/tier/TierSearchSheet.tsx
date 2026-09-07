/**
 * Tier作品追加検索シート (Android版 TierSearchBottomSheet.kt に完全準拠)
 */
import React, { useState, useEffect } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { TierRowData, TierAnimeItem } from '../../types/tier';
import { WorkItem } from '../../types/entities';
import { CreditRepository } from '../../db/repository';
import { TierTheme } from '../../theme/tierTheme';

import { LanguageManager } from '../../theme/languageManager';
import { getCoverImageUrl } from '../../utils/workImageResolver';

interface TierSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  allRows: TierRowData[];
  defaultTargetRowId?: string;
  onAddWorkToRow: (anime: TierAnimeItem, targetRowId: string) => void;
}

export const TierSearchSheet: React.FC<TierSearchSheetProps> = ({
  isOpen,
  onClose,
  allRows,
  defaultTargetRowId,
  onAddWorkToRow
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WorkItem[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string>(
    defaultTargetRowId || (allRows[0]?.id ?? '')
  );

  const isEn = LanguageManager.isEnglish;

  useEffect(() => {
    if (defaultTargetRowId) {
      setSelectedRowId(defaultTargetRowId);
    }
  }, [defaultTargetRowId]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const items = CreditRepository.getWorks(query, 'all', 'all', 'all', 'DEVIATION_DESC', 30, 0);
      setResults(items);
    } catch (e) {
      console.error(e);
    }
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleAdd = (work: WorkItem) => {
    const anime: TierAnimeItem = {
      id: work.id,
      title: work.title,
      titleEn: work.titleEn,
      year: work.year,
      deviationScore: work.deviationScore,
      tier: work.tier,
      residual: work.residual,
      predictedScore: work.predictedScore,
      imageUrl: getCoverImageUrl(work.id),
      staffJson: work.staffJson,
      charactersJson: work.charactersJson
    };
    onAddWorkToRow(anime, selectedRowId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm select-none animate-fade-in">
      <div className="w-full max-w-lg bg-surface rounded-t-3xl border-t border-outlineVariant p-5 max-h-[85vh] flex flex-col animate-slide-up">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-outlineVariant/30">
          <h3 className="text-base font-bold text-onSurface">
            {isEn ? 'Add Anime to Tier List' : 'Tier表に作品を追加'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-onSurfaceVariant hover:text-onSurface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 追加先行セレクター */}
        <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-outlineVariant/20">
          <span className="text-xs font-bold text-onSurfaceVariant flex-shrink-0 mr-1">
            {isEn ? 'Target Tier:' : '追加先:'}
          </span>
          {allRows.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRowId(r.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors flex-shrink-0 ${
                selectedRowId === r.id
                  ? 'border-primary text-black'
                  : 'bg-surfaceContainer border-outlineVariant/40 text-onSurfaceVariant'
              }`}
              style={{
                backgroundColor: selectedRowId === r.id ? r.colorHex : undefined
              }}
            >
              {r.name}
            </button>
          ))}
        </div>

        {/* 検索窓 */}
        <div className="py-2.5">
          <div className="flex items-center h-10 px-3 rounded-full bg-surfaceContainer border border-outlineVariant/60 focus-within:border-primary">
            <Search className="w-4 h-4 text-onSurfaceVariant" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isEn ? 'Search anime title...' : '追加する作品名で検索...'}
              className="w-full bg-transparent border-none outline-none text-xs text-onSurface ml-2"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-onSurfaceVariant">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 検索結果一覧 */}
        <div className="flex-1 overflow-y-auto space-y-1.5 py-1">
          {results.map((work) => {
            const tierSpec = TierTheme.forTier(work.tier);
            const title = isEn && work.titleEn ? work.titleEn : work.title;

            return (
              <div
                key={work.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surfaceContainer/50 border border-outlineVariant/30 hover:border-outlineVariant transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className="text-xs font-black font-sans w-10 text-center"
                    style={{ color: tierSpec.onContainerColor }}
                  >
                    {work.deviationScore.toFixed(1)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-onSurface truncate">
                      {title}
                    </div>
                    <div className="text-[10px] text-onSurfaceVariant">
                      {work.year}年 • {work.mainStaffSummary}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAdd(work)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-onPrimary text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Add' : '追加'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
