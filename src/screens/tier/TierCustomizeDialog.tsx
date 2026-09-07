import React, { useState } from 'react';
import { TierRowData } from '../../types/tier';
import { COLOR_PRESETS } from './tierStorage';
import { useLanguage } from '../../theme/languageManager';
import { AppStrings } from '../../theme/strings';
import { Sparkles, Plus, ArrowUp, ArrowDown, Trash2, Check } from 'lucide-react';


interface TierCustomizeDialogProps {
  rows: TierRowData[];
  onDismiss: () => void;
  onReorderRows: (fromIndex: Int, toIndex: Int) => void;
  onUpdateRow: (rowId: string, name: string, colorHex: string) => void;
  onAddRow: (name: string, colorHex: string) => void;
  onDeleteRow: (rowId: string) => void;
  onHarmonizeColors: () => void;
  onResetToDefault: () => void;
  onClearAllItems: () => void;
}

type Int = number;

export const TierCustomizeDialog: React.FC<TierCustomizeDialogProps> = ({
  rows,
  onDismiss,
  onReorderRows,
  onUpdateRow,
  onAddRow,
  onDeleteRow,
  onHarmonizeColors,
  onResetToDefault,
  onClearAllItems
}) => {
  const { isEn } = useLanguage();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRowName, setNewRowName] = useState('');
  const [newRowColor, setNewRowColor] = useState(COLOR_PRESETS[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] shadow-2xl border border-outlineVariant/35 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-outlineVariant/25">
          <h2 className="text-xl font-bold tracking-tight">
            {AppStrings.tierEditRows(isEn)}
          </h2>
          <button
            onClick={onHarmonizeColors}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:opacity-90 transition-opacity"
            title={isEn ? "Sort Colors" : "色を自動整列"}
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>{isEn ? "Sort Colors" : "色を自動整列"}</span>
          </button>
        </div>

        {/* Scrollable Rows List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {rows.map((row, index) => (
            <RowConfigCard
              key={row.id}
              row={row}
              canMoveUp={index > 0}
              canMoveDown={index < rows.length - 1}
              onMoveUp={() => onReorderRows(index, index - 1)}
              onMoveDown={() => onReorderRows(index, index + 1)}
              onDelete={() => onDeleteRow(row.id)}
              onColorChange={(hex) => onUpdateRow(row.id, row.name, hex)}
              onNameChange={(name) => onUpdateRow(row.id, name, row.colorHex)}
            />
          ))}

          {/* Add New Row Box */}
          {isAddingNew ? (
            <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-outlineVariant/40 space-y-3 animate-fade-in">
              <input
                type="text"
                value={newRowName}
                onChange={(e) => setNewRowName(e.target.value)}
                placeholder={AppStrings.tierRowName(isEn)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--md-sys-color-surface)] border border-outline/40 focus:outline-none focus:border-primary text-[var(--md-sys-color-on-surface)]"
                autoFocus
              />

              {/* Color Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                {COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setNewRowColor(hex)}
                    style={{ backgroundColor: hex }}
                    className={`w-7 h-7 rounded-full shrink-0 transition-transform ${
                      newRowColor === hex ? 'scale-110 ring-2 ring-[var(--md-sys-color-primary)] ring-offset-2 ring-offset-[var(--md-sys-color-surface-container-high)]' : 'hover:scale-105'
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)]"
                >
                  {isEn ? "Cancel" : "キャンセル"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newRowName.trim()) {
                      onAddRow(newRowName.trim(), newRowColor);
                      setNewRowName('');
                      setIsAddingNew(false);
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                >
                  {isEn ? "Add" : "追加"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingNew(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-outline/60 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{AppStrings.tierAddRow(isEn)}</span>
            </button>
          )}

          <div className="pt-2 border-t border-outlineVariant/30 flex gap-2">
            <button
              onClick={onResetToDefault}
              className="flex-1 py-2 text-xs font-semibold rounded-xl border border-outlineVariant/40 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)] transition-colors"
            >
              {AppStrings.tierResetDefault(isEn)}
            </button>
            <button
              onClick={onClearAllItems}
              className="flex-1 py-2 text-xs font-semibold rounded-xl border border-red-500/40 text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error)]/10 transition-colors"
            >
              {AppStrings.tierClearAll(isEn)}
            </button>
          </div>
        </div>

        {/* Footer Done Button */}
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

interface RowConfigCardProps {
  row: TierRowData;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onColorChange: (hex: string) => void;
  onNameChange: (name: string) => void;
}

const RowConfigCard: React.FC<RowConfigCardProps> = ({
  row,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDelete,
  onColorChange,
  onNameChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(row.name);

  return (
    <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-outlineVariant/35 space-y-2.5">
      <div className="flex items-center gap-2.5">
        {/* Color preview badge */}
        <div
          style={{ backgroundColor: row.colorHex }}
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0"
        >
          {row.name.slice(0, 2)}
        </div>

        {/* Name edit / display */}
        {isEditing ? (
          <div className="flex-1 flex items-center gap-1.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 px-2.5 py-1 text-sm rounded-lg bg-[var(--md-sys-color-surface)] border border-outline/40 text-[var(--md-sys-color-on-surface)]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onNameChange(text.trim());
                  setIsEditing(false);
                }
              }}
            />
            <button
              onClick={() => {
                onNameChange(text.trim());
                setIsEditing(false);
              }}
              className="p-1 rounded-md bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="flex-1 font-bold text-sm tracking-wide cursor-pointer hover:underline text-[var(--md-sys-color-on-surface)]"
          >
            {row.name}
          </span>
        )}

        {/* Actions (Up, Down, Delete) */}
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] disabled:opacity-30 hover:bg-[var(--md-sys-color-surface)]"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] disabled:opacity-30 hover:bg-[var(--md-sys-color-surface)]"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error)]/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Color picker row */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {COLOR_PRESETS.map((hex) => {
          const isSelected = row.colorHex.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              onClick={() => onColorChange(hex)}
              style={{ backgroundColor: hex }}
              className={`w-5 h-5 rounded-full shrink-0 transition-transform ${
                isSelected ? 'scale-125 ring-2 ring-[var(--md-sys-color-primary)] ring-offset-1 ring-offset-[var(--md-sys-color-surface-container-high)]' : 'hover:scale-110 opacity-80 hover:opacity-100'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
