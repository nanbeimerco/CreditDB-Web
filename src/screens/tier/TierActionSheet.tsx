/**
 * Tier作品操作アクションシート (Android版 TierAnimeActionSheet.kt に完全準拠)
 */
import React from 'react';
import { X, ArrowRightLeft, Trash2, ExternalLink } from 'lucide-react';
import { TierRowData, TierAnimeItem } from '../../types/tier';
import { LanguageManager } from '../../theme/languageManager';

interface TierActionSheetProps {
  anime: TierAnimeItem | null;
  currentRow: TierRowData | null;
  allRows: TierRowData[];
  isOpen: boolean;
  onClose: () => void;
  onMoveToRow: (animeId: string, targetRowId: string) => void;
  onRemove: (animeId: string) => void;
  onViewDetail: (workId: string) => void;
}

export const TierActionSheet: React.FC<TierActionSheetProps> = ({
  anime,
  currentRow,
  allRows,
  isOpen,
  onClose,
  onMoveToRow,
  onRemove,
  onViewDetail
}) => {
  if (!isOpen || !anime || !currentRow) return null;
  const isEn = LanguageManager.isEnglish;
  const title = isEn && anime.titleEn ? anime.titleEn : anime.title;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm select-none animate-fade-in">
      <div className="w-full max-w-lg bg-surface rounded-t-3xl border-t border-outlineVariant p-5 max-h-[85vh] flex flex-col space-y-4 animate-slide-up">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-2 border-b border-outlineVariant/30">
          <div>
            <div className="text-sm font-bold text-onSurface truncate max-w-[280px]">
              {title}
            </div>
            <div className="text-[11px] text-onSurfaceVariant">
              {isEn ? `Current Tier: ${currentRow.name}` : `現在のTier: ${currentRow.name}`}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-onSurfaceVariant hover:text-onSurface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. 別のTierへ移動 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-onSurfaceVariant">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            <span>{isEn ? 'Move to another Tier' : '別のTier行へ移動'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allRows.map((r) => {
              const isCurrent = r.id === currentRow.id;
              return (
                <button
                  key={r.id}
                  disabled={isCurrent}
                  onClick={() => {
                    onMoveToRow(anime.id, r.id);
                    onClose();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                    isCurrent
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:scale-105 active:scale-95 text-black'
                  }`}
                  style={{ backgroundColor: r.colorHex }}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 作品詳細を見る */}
        <button
          onClick={() => {
            onViewDetail(anime.id);
            onClose();
          }}
          className="flex items-center justify-between p-3 rounded-xl bg-surfaceContainer hover:bg-surfaceContainerHigh border border-outlineVariant/40 text-xs font-bold text-onSurface transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-primary" />
            <span>{isEn ? 'View Work Details' : '作品詳細を見る'}</span>
          </div>
        </button>

        {/* 3. Tier表から削除 */}
        <button
          onClick={() => {
            onRemove(anime.id);
            onClose();
          }}
          className="flex items-center justify-between p-3 rounded-xl bg-red-900/20 hover:bg-red-900/30 border border-red-500/40 text-xs font-bold text-red-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>{isEn ? 'Remove from Tier List' : 'この作品をTier表から外す'}</span>
          </div>
        </button>
      </div>
    </div>
  );
};
