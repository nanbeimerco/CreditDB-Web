/**
 * Tier表内の作品カード (Android版 TierAnimeCard.kt に完全準拠 + ドラッグ＆ドロップ対応)
 */
import React, { useState } from 'react';
import { TierAnimeItem } from '../../types/tier';
import { LanguageManager } from '../../theme/languageManager';
import { MoreVertical, GripVertical } from 'lucide-react';

interface TierAnimeCardProps {
  anime: TierAnimeItem;
  index: number;
  rowId: string;
  isDragging?: boolean;
  onClick: () => void;
  onActionClick: () => void;
  onDragStart?: (e: React.DragEvent, animeId: string, rowId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onCardDragOver?: (e: React.DragEvent, rowId: string, targetIndex: number) => void;
}

export const TierAnimeCard: React.FC<TierAnimeCardProps> = ({
  anime,
  index,
  rowId,
  isDragging = false,
  onClick,
  onActionClick,
  onDragStart,
  onDragEnd,
  onCardDragOver
}) => {
  const [imgError, setImgError] = useState(false);
  const isEn = LanguageManager.isEnglish;
  const title = isEn && anime.titleEn ? anime.titleEn : anime.title;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ animeId: anime.id, fromRowId: rowId }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(e, anime.id, rowId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isAfter = e.clientX > rect.left + rect.width / 2;
    const targetIndex = isAfter ? index + 1 : index;
    onCardDragOver?.(e, rowId, targetIndex);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onClick={onClick}
      className={`group relative flex-shrink-0 w-20 sm:w-24 rounded-xl overflow-hidden bg-surfaceContainer border transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-30 scale-95 border-primary/60 shadow-inner ring-2 ring-primary/40'
          : 'border-outlineVariant/35 hover:border-primary/60 hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      {/* サムネイル画像 */}
      <div className="relative aspect-[3/4] bg-surfaceVariant/60 flex items-center justify-center overflow-hidden">
        {anime.imageUrl && !imgError ? (
          <img
            src={anime.imageUrl}
            alt={title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="p-1.5 text-center text-[10px] font-bold text-onSurfaceVariant/80 leading-tight">
            {title}
          </div>
        )}

        {/* 偏差値バッジ (左上: Gotham Bold) */}
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur text-[9px] font-black text-white font-sans tracking-tight shadow">
          {anime.deviationScore.toFixed(1)}
        </div>

        {/* ドラッグインジケータアイコン (ホバー時のみ左下に微かに表示) */}
        <div className="absolute bottom-1 left-1 p-0.5 rounded bg-black/50 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <GripVertical className="w-3 h-3" />
        </div>

        {/* アクションメニューボタン (右上) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onActionClick();
          }}
          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white/90 hover:text-white hover:bg-black/90 transition-colors"
          title="Actions"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* タイトル */}
      <div className="p-1.5 bg-surface">
        <div className="text-[10px] font-bold text-onSurface truncate leading-tight font-sans">
          {title}
        </div>
      </div>
    </div>
  );
};
