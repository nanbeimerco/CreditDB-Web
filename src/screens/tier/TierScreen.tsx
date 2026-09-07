import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TierTableConfig, TierAnimeItem, TierRowData } from '../../types/tier';
import { TierStorageManager } from './tierStorage';
import { TierAnalysisEngine } from './tierAnalysisEngine';
import { TierRowComponent } from './TierRowComponent';
import { TierSearchSheet } from './TierSearchSheet';
import { TierActionSheet } from './TierActionSheet';
import { TierCustomizeDialog } from './TierCustomizeDialog';
import { TierAffinitySheet } from './TierAffinitySheet';
import { TierCorrelationSheet } from './TierCorrelationSheet';
import { TierExportDialog } from './TierExportDialog';
import { useLanguage } from '../../theme/languageManager';
import { Trophy, Sparkles, Sliders, Share2 } from 'lucide-react';

interface TierScreenProps {
  onNavigateToWork: (workId: string) => void;
  onNavigateToStaff: (staffName: string) => void;
  onNavigateToStudio: (studioName: string) => void;
}

export const TierScreen: React.FC<TierScreenProps> = ({
  onNavigateToWork,
  onNavigateToStaff,
  onNavigateToStudio
}) => {
  const { isEn } = useLanguage();

  // Tier Table Configuration State
  const [config, setConfig] = useState<TierTableConfig>(() => TierStorageManager.loadConfig());
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Sheet / Modal visibility
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const [targetRowIdForSearch, setTargetRowIdForSearch] = useState<string | null>(null);

  const [selectedAnimeForAction, setSelectedAnimeForAction] = useState<TierAnimeItem | null>(null);
  const [selectedRowForAction, setSelectedRowForAction] = useState<TierRowData | null>(null);

  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);
  const [showAffinitySheet, setShowAffinitySheet] = useState(false);
  const [showCorrelationSheet, setShowCorrelationSheet] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Drag and Drop State
  const [dragAnimeId, setDragAnimeId] = useState<string | null>(null);
  const [dragFromRowId, setDragFromRowId] = useState<string | null>(null);
  const [hoverRowId, setHoverRowId] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Snackbar Toast
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const showSnackbar = useCallback((msg: string) => {
    setSnackbarMessage(msg);
  }, []);

  useEffect(() => {
    if (snackbarMessage) {
      const timer = setTimeout(() => setSnackbarMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbarMessage]);

  const updateAndPersistConfig = useCallback((newConfig: TierTableConfig) => {
    setConfig(newConfig);
    TierStorageManager.saveConfig(newConfig);
  }, []);

  // Stable Handlers for Row Actions & Navigation
  const handleAnimeClick = useCallback((anime: TierAnimeItem) => {
    onNavigateToWork(anime.id);
  }, [onNavigateToWork]);

  const handleAnimeAction = useCallback((anime: TierAnimeItem, r: TierRowData) => {
    setSelectedAnimeForAction(anime);
    setSelectedRowForAction(r);
  }, []);

  const handleAddAnimeClick = useCallback((r: TierRowData) => {
    setTargetRowIdForSearch(r.id);
    setShowSearchSheet(true);
  }, []);

  const handleToggleExpand = useCallback((rowId: string) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  // Drag and Drop Handlers
  const handleDragStart = useCallback((_e: React.DragEvent, animeId: string, rowId: string) => {
    setDragAnimeId(animeId);
    setDragFromRowId(rowId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragAnimeId(null);
    setDragFromRowId(null);
    setHoverRowId(null);
    setHoverIndex(null);
  }, []);

  const handleCardDragOver = useCallback((_e: React.DragEvent, rowId: string, targetIndex: number) => {
    setHoverRowId(rowId);
    setHoverIndex(targetIndex);
  }, []);

  const handleRowDragOver = useCallback((_e: React.DragEvent, rowId: string) => {
    setHoverRowId(rowId);
    setHoverIndex(prev => prev);
  }, []);

  const handleRowDrop = useCallback((_e: React.DragEvent, targetRowId: string) => {
    if (!dragAnimeId || !dragFromRowId) {
      handleDragEnd();
      return;
    }

    let itemToMove: TierAnimeItem | null = null;
    for (const r of config.rows) {
      const found = r.items.find(it => it.id === dragAnimeId);
      if (found) {
        itemToMove = found;
        break;
      }
    }
    if (!itemToMove) {
      handleDragEnd();
      return;
    }

    const targetIdx = hoverIndex !== null ? hoverIndex : (config.rows.find(r => r.id === targetRowId)?.items.length ?? 0);

    if (dragFromRowId === targetRowId) {
      // 同一行内の並び替え
      const updatedRows = config.rows.map(row => {
        if (row.id === targetRowId) {
          const oldIndex = row.items.findIndex(it => it.id === dragAnimeId);
          if (oldIndex === -1) return row;
          const newItems = [...row.items];
          newItems.splice(oldIndex, 1);
          const insertIdx = oldIndex < targetIdx ? targetIdx - 1 : targetIdx;
          newItems.splice(Math.max(0, Math.min(newItems.length, insertIdx)), 0, itemToMove!);
          return { ...row, items: newItems };
        }
        return row;
      });
      updateAndPersistConfig({ ...config, rows: updatedRows });
    } else {
      // 異なる行間の移動
      const updatedRows = config.rows.map(row => {
        if (row.id === dragFromRowId) {
          return { ...row, items: row.items.filter(it => it.id !== dragAnimeId) };
        }
        if (row.id === targetRowId) {
          const newItems = [...row.items];
          const insertIdx = Math.max(0, Math.min(newItems.length, targetIdx));
          newItems.splice(insertIdx, 0, itemToMove!);
          return { ...row, items: newItems };
        }
        return row;
      });
      updateAndPersistConfig({ ...config, rows: updatedRows });
    }

    handleDragEnd();
  }, [config, dragAnimeId, dragFromRowId, hoverIndex, handleDragEnd, updateAndPersistConfig]);

  // Aggregated Stats
  const totalRankedAnime = useMemo(() => {
    return config.rows.reduce((sum, r) => sum + r.items.length, 0);
  }, [config]);

  const correlation = useMemo(() => {
    return TierAnalysisEngine.calculateTasteCorrelation(config);
  }, [config]);

  const rhoStr = correlation.sampleSize >= 3
    ? (correlation.spearmanRho >= 0 ? `+${correlation.spearmanRho.toFixed(2)}` : correlation.spearmanRho.toFixed(2))
    : '--';


  // Add work to row
  const handleAddAnimeToRow = (animeItem: TierAnimeItem, targetRowId: string) => {
    // Remove from any existing row to avoid duplicates
    const cleanedRows = config.rows.map(row => ({
      ...row,
      items: row.items.filter(item => item.id !== animeItem.id)
    }));

    // Add to target row
    const updatedRows = cleanedRows.map(row => {
      if (row.id === targetRowId) {
        return { ...row, items: [...row.items, animeItem] };
      }
      return row;
    });

    updateAndPersistConfig({ ...config, rows: updatedRows });
    const name = (isEn && animeItem.titleEn) ? animeItem.titleEn : animeItem.title;
    showSnackbar(isEn ? `Added "${name}" to tier` : `「${name}」をTierに追加しました`);
  };

  // Move anime between rows
  const handleMoveAnimeToRow = (animeId: string, targetRowId: string) => {
    let itemToMove: TierAnimeItem | null = null;
    for (const r of config.rows) {
      const found = r.items.find(it => it.id === animeId);
      if (found) {
        itemToMove = found;
        break;
      }
    }
    if (!itemToMove) return;

    const cleanedRows = config.rows.map(row => ({
      ...row,
      items: row.items.filter(item => item.id !== animeId)
    }));

    const updatedRows = cleanedRows.map(row => {
      if (row.id === targetRowId) {
        return { ...row, items: [...row.items, itemToMove!] };
      }
      return row;
    });

    updateAndPersistConfig({ ...config, rows: updatedRows });
    showSnackbar(isEn ? "Moved anime to new tier" : "作品を移動しました");
  };

  // Remove anime from tier
  const handleRemoveAnimeFromTier = (animeId: string) => {
    const updatedRows = config.rows.map(row => ({
      ...row,
      items: row.items.filter(item => item.id !== animeId)
    }));
    updateAndPersistConfig({ ...config, rows: updatedRows });
    showSnackbar(isEn ? "Removed from Tier" : "Tierから削除しました");
  };

  // Row configuration management
  const handleReorderRows = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= config.rows.length || toIndex >= config.rows.length) return;
    const newRows = [...config.rows];
    const [moved] = newRows.splice(fromIndex, 1);
    newRows.splice(toIndex, 0, moved);
    updateAndPersistConfig({ ...config, rows: newRows });
  };

  const handleUpdateRow = (rowId: string, name: string, colorHex: string) => {
    const newRows = config.rows.map(row => {
      if (row.id === rowId) {
        return { ...row, name, colorHex };
      }
      return row;
    });
    updateAndPersistConfig({ ...config, rows: newRows });
  };

  const handleAddRow = (name: string, colorHex: string) => {
    const newRow: TierRowData = {
      id: `row_${Date.now()}`,
      name,
      colorHex,
      items: []
    };
    updateAndPersistConfig({ ...config, rows: [...config.rows, newRow] });
  };

  const handleDeleteRow = (rowId: string) => {
    const newRows = config.rows.filter(r => r.id !== rowId);
    updateAndPersistConfig({ ...config, rows: newRows });
  };

  const handleHarmonizeColors = () => {
    const harmonized = TierStorageManager.harmonizeRowColors(config.rows);
    updateAndPersistConfig({ ...config, rows: harmonized });
    showSnackbar(isEn ? "Harmonized tier colors" : "Tier行の色をグラデーションに自動整列しました");
  };

  const handleResetToDefault = () => {
    const def = TierStorageManager.resetConfig();
    setConfig(def);
    setShowCustomizeDialog(false);
    showSnackbar(isEn ? "Reset to default tiers" : "デフォルトのTier構成に戻しました");
  };

  const handleClearAllItems = () => {
    const cleared = TierStorageManager.clearAllItems(config);
    setConfig(cleared);
    setShowCustomizeDialog(false);
    showSnackbar(isEn ? "Cleared all anime" : "すべての作品をクリアしました");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--md-sys-color-background)] overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outlineVariant/25 bg-[var(--md-sys-color-surface)]/80 backdrop-blur shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--md-sys-color-on-background)] font-sans">
            {isEn ? "Tier List" : "Tier表"}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-sans">
            <span className="font-bold">{isEn ? `${totalRankedAnime} works` : `${totalRankedAnime} 件格付け中`}</span>
            <span>•</span>
            <span className="text-primary font-bold">
              {isEn ? `ρ ${rhoStr}` : `相関 ρ ${rhoStr}`}
            </span>
          </div>
        </div>

        {/* 4 Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAffinitySheet(true)}
            className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
            title={isEn ? "Staff Affinity" : "スタッフ集計"}
          >
            <Trophy className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowCorrelationSheet(true)}
            className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
            title={isEn ? "Taste Correlation" : "数理相関診断"}
          >
            <Sparkles className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowCustomizeDialog(true)}
            className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
            title={isEn ? "Customize Tiers" : "Tier設定"}
          >
            <Sliders className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowExportDialog(true)}
            className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
            title={isEn ? "Export" : "エクスポート"}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Tier Rows Main List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 pb-24 [transform:translateZ(0)] overscroll-contain">
        {config.rows.map(row => (
          <TierRowComponent
            key={row.id}
            row={row}
            isExpanded={expandedRowIds.has(row.id)}
            dragAnimeId={dragAnimeId}
            dragFromRowId={dragFromRowId}
            hoverRowId={hoverRowId}
            hoverIndex={hoverIndex}
            onToggleExpand={handleToggleExpand}
            onAnimeClick={handleAnimeClick}
            onAnimeAction={handleAnimeAction}
            onAddAnimeClick={handleAddAnimeClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onCardDragOver={handleCardDragOver}
            onRowDragOver={handleRowDragOver}
            onRowDrop={handleRowDrop}
          />
        ))}
      </div>

      {/* 3. Toast / Snackbar */}
      {snackbarMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] text-xs font-bold shadow-xl animate-fade-in pointer-events-none">
          {snackbarMessage}
        </div>
      )}

      {/* 4. Modals & Sheets */}
      <TierSearchSheet
        isOpen={showSearchSheet}
        allRows={config.rows}
        defaultTargetRowId={targetRowIdForSearch ?? undefined}
        onClose={() => {
          setShowSearchSheet(false);
          setTargetRowIdForSearch(null);
        }}
        onAddWorkToRow={handleAddAnimeToRow}
      />

      <TierActionSheet
        isOpen={!!selectedAnimeForAction && !!selectedRowForAction}
        anime={selectedAnimeForAction}
        currentRow={selectedRowForAction}
        allRows={config.rows}
        onClose={() => {
          setSelectedAnimeForAction(null);
          setSelectedRowForAction(null);
        }}
        onMoveToRow={(animeId, targetRowId) => {
          handleMoveAnimeToRow(animeId, targetRowId);
          setSelectedAnimeForAction(null);
          setSelectedRowForAction(null);
        }}
        onRemove={(animeId) => {
          handleRemoveAnimeFromTier(animeId);
          setSelectedAnimeForAction(null);
          setSelectedRowForAction(null);
        }}
        onViewDetail={(workId) => {
          setSelectedAnimeForAction(null);
          setSelectedRowForAction(null);
          onNavigateToWork(workId);
        }}
      />

      {showCustomizeDialog && (
        <TierCustomizeDialog
          rows={config.rows}
          onDismiss={() => setShowCustomizeDialog(false)}
          onReorderRows={handleReorderRows}
          onUpdateRow={handleUpdateRow}
          onAddRow={handleAddRow}
          onDeleteRow={handleDeleteRow}
          onHarmonizeColors={handleHarmonizeColors}
          onResetToDefault={handleResetToDefault}
          onClearAllItems={handleClearAllItems}
        />
      )}

      {showAffinitySheet && (
        <TierAffinitySheet
          config={config}
          onDismiss={() => setShowAffinitySheet(false)}
          onStaffClick={(staffName, isStudio) => {
            setShowAffinitySheet(false);
            if (isStudio) onNavigateToStudio(staffName);
            else onNavigateToStaff(staffName);
          }}
        />
      )}

      {showCorrelationSheet && (
        <TierCorrelationSheet
          config={config}
          onDismiss={() => setShowCorrelationSheet(false)}
        />
      )}

      {showExportDialog && (
        <TierExportDialog
          config={config}
          onDismiss={() => setShowExportDialog(false)}
          onImportConfig={(imported) => {
            updateAndPersistConfig(imported);
          }}
          onShowSnackbar={showSnackbar}
        />
      )}
    </div>
  );
};
