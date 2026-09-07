/**
 * Tier行コンポーネント (Android版 TierRowComponent.kt に完全準拠 + DnD 挿入アニメーションスロット対応)
 */
import React from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { TierRowData, TierAnimeItem } from '../../types/tier';
import { TierAnimeCard } from './TierAnimeCard';
import { LanguageManager } from '../../theme/languageManager';

interface TierRowComponentProps {
  row: TierRowData;
  isExpanded?: boolean;
  dragAnimeId: string | null;
  dragFromRowId: string | null;
  hoverRowId: string | null;
  hoverIndex: number | null;
  onToggleExpand?: () => void;
  onAnimeClick: (anime: TierAnimeItem) => void;
  onAnimeAction: (anime: TierAnimeItem, row: TierRowData) => void;
  onAddAnimeClick: (row: TierRowData) => void;
  onDragStart: (e: React.DragEvent, animeId: string, rowId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onCardDragOver: (e: React.DragEvent, rowId: string, targetIndex: number) => void;
  onRowDragOver: (e: React.DragEvent, rowId: string) => void;
  onRowDrop: (e: React.DragEvent, rowId: string) => void;
}

export const TierRowComponent: React.FC<TierRowComponentProps> = ({
  row,
  isExpanded = false,
  dragAnimeId,
  dragFromRowId,
  hoverRowId,
  hoverIndex,
  onToggleExpand,
  onAnimeClick,
  onAnimeAction,
  onAddAnimeClick,
  onDragStart,
  onDragEnd,
  onCardDragOver,
  onRowDragOver,
  onRowDrop
}) => {
  const isEn = LanguageManager.isEnglish;
  const isTargetRow = hoverRowId === row.id;

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onRowDragOver(e, row.id);
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRowDrop(e, row.id);
  };

  // ドロッププレースホルダー要素 (左右の作品カードがスライドしてスロットが開くアニメーション)
  const renderDropSlot = (key: string) => (
    <div
      key={key}
      className="flex-shrink-0 w-20 sm:w-24 aspect-[3/4] rounded-xl border-2 border-dashed border-primary bg-primary/15 flex flex-col items-center justify-center text-primary animate-slot-expand transition-all select-none pointer-events-none shadow-inner"
    >
      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-black animate-pulse">
        ↓
      </div>
      <span className="text-[9px] font-extrabold mt-1 font-sans tracking-tight">
        {isEn ? "Insert" : "ここに挿入"}
      </span>
    </div>
  );

  return (
    <div
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
      className={`flex border rounded-2xl overflow-hidden bg-surfaceContainer/50 shadow-sm transition-all duration-200 ${
        isTargetRow
          ? 'border-primary/60 ring-1 ring-primary/30 bg-surfaceContainer/80'
          : 'border-outlineVariant/35 hover:border-outlineVariant/60'
      }`}
    >
      {/* 行ヘッダー (左側) */}
      <div
        onClick={onToggleExpand}
        className="w-16 sm:w-20 flex-shrink-0 flex flex-col items-center justify-center p-2 text-center select-none cursor-pointer hover:opacity-95 transition-opacity"
        style={{ backgroundColor: row.colorHex }}
        title={isExpanded ? (isEn ? "Collapse row" : "1行表示に戻す") : (isEn ? "Expand row" : "全作品を展開表示")}
      >
        <span className="text-lg sm:text-xl font-black text-black tracking-tight leading-none drop-shadow-sm font-sans">
          {row.name}
        </span>
        <span className="text-[10px] font-bold text-black/80 mt-1 font-sans flex items-center gap-0.5">
          {row.items.length}作
          {row.items.length > 4 && (
            isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />
          )}
        </span>
      </div>

      {/* 作品カードリスト & 挿入アニメーションスロット & 追加ボタン (右側) */}
      <div
        className={`flex-1 min-w-0 p-2.5 flex items-center gap-2 ${
          isExpanded ? 'flex-wrap' : 'overflow-x-auto no-scrollbar'
        }`}
      >
        {row.items.map((anime, index) => {
          const isDragging = dragAnimeId === anime.id;
          const isOriginRow = dragFromRowId === row.id;
          // 自カードの位置と完全に重複する冗長なスロット表示を抑止
          const showSlotBefore = isTargetRow && hoverIndex === index && !isDragging && (!isOriginRow || dragAnimeId !== row.items[index]?.id);

          return (
            <React.Fragment key={anime.id}>
              {showSlotBefore && renderDropSlot(`slot_before_${index}`)}
              <TierAnimeCard
                anime={anime}
                index={index}
                rowId={row.id}
                isDragging={isDragging}
                onClick={() => onAnimeClick(anime)}
                onActionClick={() => onAnimeAction(anime, row)}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onCardDragOver={onCardDragOver}
              />
            </React.Fragment>
          );
        })}

        {/* 行末のドロップスロット */}
        {isTargetRow && hoverIndex === row.items.length && renderDropSlot(`slot_end_${row.id}`)}

        {/* 作品追加ボタン (+) */}
        <button
          onClick={() => onAddAnimeClick(row)}
          className="flex-shrink-0 w-20 sm:w-24 aspect-[3/4] rounded-xl border-2 border-dashed border-outlineVariant/50 hover:border-primary hover:bg-surfaceVariant/30 flex flex-col items-center justify-center text-onSurfaceVariant hover:text-primary transition-all cursor-pointer font-sans"
          title={isEn ? 'Add Anime to this Tier' : '作品を追加'}
        >
          <Plus className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1 font-sans">
            {isEn ? 'Add' : '追加'}
          </span>
        </button>
      </div>
    </div>
  );
};
