/**
 * Tier表ストレージ管理 (Android版 TierStorageManager.kt に完全準拠)
 */
import { TierTableConfig, TierRowData } from '../../types/tier';

const STORAGE_KEY_TIER_CONFIG = 'creditdb_tier_table_config';

export const DEFAULT_TIER_ROWS: TierRowData[] = [
  { id: 'row_s_plus', name: 'S+', colorHex: '#EAC765', items: [] },
  { id: 'row_s', name: 'S', colorHex: '#8BD3A7', items: [] },
  { id: 'row_a_plus', name: 'A+', colorHex: '#8BC5E3', items: [] },
  { id: 'row_a', name: 'A', colorHex: '#A3B3E7', items: [] },
  { id: 'row_b', name: 'B', colorHex: '#AEB2BA', items: [] },
  { id: 'row_c', name: 'C', colorHex: '#C5A6C1', items: [] },
  { id: 'row_d', name: 'D', colorHex: '#DEA1A9', items: [] }
];

export const DEFAULT_TIER_CONFIG: TierTableConfig = {
  version: 1,
  title: 'My Anime Tier List',
  rows: DEFAULT_TIER_ROWS
};

export const COLOR_PRESETS = [
  "#EAC765", // M3 Gold (S+)
  "#F4B266", // Amber
  "#F29C5B", // Tangerine
  "#F08272", // Coral
  "#E06A7C", // Crimson
  "#DEA1A9", // Muted Rose
  "#D67597", // Berry
  "#C5A6C1", // Muted Plum
  "#B893D6", // Violet
  "#D7AEFB", // Soft Purple
  "#9C9EE8", // Periwinkle
  "#A3B3E7", // Cool Indigo
  "#8AB4F8", // Royal Blue
  "#74C0FC", // Sky Blue
  "#8BC5E3", // Slate Cyan
  "#7DD3FC", // Cyan Glacier
  "#93CCCC", // Sage Teal
  "#7CE0C3", // Mint
  "#8BD3A7", // Soft Emerald
  "#A2D785", // Lime Green
  "#B7D974", // Olive Light
  "#B0B7C6", // Warm Slate
  "#AEB2BA", // Slate Neutral
  "#9497A0"  // Charcoal Slate
];

const HARMONIOUS_GRADIENT = [
  "#EAC765", // 0: Gold
  "#F4B266", // 1: Amber
  "#8BD3A7", // 2: Soft Emerald
  "#7CE0C3", // 3: Mint
  "#8BC5E3", // 4: Slate Cyan
  "#74C0FC", // 5: Sky Blue
  "#A3B3E7", // 6: Cool Indigo
  "#B893D6", // 7: Violet
  "#C5A6C1", // 8: Plum
  "#DEA1A9", // 9: Muted Rose
  "#AEB2BA", // 10: Slate Neutral
  "#9497A0"  // 11: Charcoal Slate
];

export const TierStorageManager = {
  COLOR_PRESETS,

  harmonizeRowColors(rows: TierRowData[]): TierRowData[] {
    if (rows.length === 0) return rows;
    const n = rows.length;
    return rows.map((row, index) => {
      const colorIndex = n === 1 ? 0 : Math.floor((index / (n - 1)) * (HARMONIOUS_GRADIENT.length - 1));
      const newColor = HARMONIOUS_GRADIENT[Math.min(Math.max(colorIndex, 0), HARMONIOUS_GRADIENT.length - 1)];
      return { ...row, colorHex: newColor };
    });
  },

  clearAllItems(config: TierTableConfig): TierTableConfig {
    const updatedRows = config.rows.map(r => ({ ...r, items: [] }));
    const newConfig = { ...config, rows: updatedRows };
    this.saveConfig(newConfig);
    return newConfig;
  },

  loadConfig(): TierTableConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIER_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.rows)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load tier config:', e);
    }
    return DEFAULT_TIER_CONFIG;
  },

  saveConfig(config: TierTableConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY_TIER_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save tier config:', e);
    }
  },

  resetConfig(): TierTableConfig {
    this.saveConfig(DEFAULT_TIER_CONFIG);
    return DEFAULT_TIER_CONFIG;
  }
};

