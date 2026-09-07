/**
 * Tier表および診断に関する型定義 (Android版 TierModels.kt に完全準拠)
 */

export interface TierAnimeItem {
  id: string;
  title: string;
  titleEn?: string | null;
  year: number;
  deviationScore: number;
  tier: string;
  residual: number;
  predictedScore: number;
  imageUrl?: string | null;
  staffJson: string;
  charactersJson: string;
}

export interface TierRowData {
  id: string;
  name: string;
  colorHex: string;
  items: TierAnimeItem[];
}

export interface TierTableConfig {
  version: number;
  title: string;
  rows: TierRowData[];
}

export interface StaffAffinityScore {
  staffName: string;
  roleKey: string;
  weightedScore: number;
  workCount: number;
  works: string[];
}

export interface TasteCorrelationResult {
  spearmanRho: number;
  sampleSize: number;
  avgDeviationPerTier: Record<string, number>;
  countPerTier: Record<string, number>;
  diagnosisTitleEn: string;
  diagnosisTitleJa: string;
  diagnosisDescEn: string;
  diagnosisDescJa: string;
}
