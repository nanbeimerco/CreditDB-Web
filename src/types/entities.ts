/**
 * 作品・スタッフ・指標に関する型定義 (Android版 Entities.kt に完全準拠)
 */

export interface SummaryInfo {
  totalWorks: number;
  totalStaff: number;
  totalCv: number;
  yearMin: number;
  yearMax: number;
  updatedAt: string;
  version: string;
  globalMean: number;
}

export interface StaffCredit {
  name: string;
  ratingTier: string;
  cumulativeTier: string;
  characterName?: string | null;
  relation?: string | null;
}

export interface CharacterCast {
  characterName: string;
  relation: string;
  actorName: string;
  ratingTier: string;
  cumulativeTier: string;
}

export interface WorkItem {
  id: string;
  title: string;
  titleEn?: string | null;
  year: number;
  deviationScore: number;
  deviationRank: number;
  anilistRawScore: number;
  rawRank: number;
  debiasedScore: number;
  trueZScore: number;
  predictedZScore: number;
  predictedScore: number;
  predScoreRank: number;
  residual: number;
  performanceVerdict: string;
  tier: string;
  percentile: number;
  staffJson: string;
  charactersJson: string;
  mainStaffSummary: string;
}

export interface WorkDetail {
  id: string;
  title: string;
  titleEn?: string | null;
  year: number;
  deviationScore: number;
  deviationRank: number;
  anilistRawScore: number;
  rawRank: number;
  debiasedScore: number;
  trueZScore: number;
  predictedZScore: number;
  predictedScore: number;
  predScoreRank: number;
  residual: number;
  performanceVerdict: string;
  tier: string;
  percentile: number;
  staffByRole: Record<string, StaffCredit[]>;
  characters: CharacterCast[];
  studio?: string | null;
}

export interface StudioWorkItem {
  workId: string;
  title: string;
  year: number;
  deviationScore: number;
  tier: string;
  titleEn?: string | null;
}

export interface LeaderboardItem {
  role: string;
  name: string;
  worksCount: number;
  rating: number;
  cumulativeZ: number;
  ratingRank: number;
  cumulativeRank: number;
  ratingTier: string;
  cumulativeTier: string;
  bestWorkTitle?: string | null;
  bestWorkYear?: number | null;
  bestWorkZ?: number | null;
  topCharacter?: string | null;
  bestWorkTitleEn?: string | null;
}

export interface RoleStat {
  role: string;
  works_count: number;
  bayesian_rating: number;
  career_cumulative_z: number;
  rating_rank: number;
  cumulative_rank: number;
  role_total: number;
  rating_tier: string;
  cum_tier: string;
}

export interface BestWork {
  work_title: string;
  work_id: string;
  year: number;
  role: string;
  z_score: number;
  work_title_en?: string | null;
}

export interface CareerTrajectoryItem {
  year: number;
  work_title: string;
  work_id: string;
  role: string;
  z_score: number;
  character_name?: string | null;
  character_relation?: string | null;
  work_title_en?: string | null;
}

export interface StaffProfile {
  name: string;
  primaryRole: string;
  totalWorks: number;
  bayesianRating: number;
  overallRatingTier: string;
  overallRank: number;
  careerCumulativeZ: number;
  overallCumTier: string;
  cumulativeRank: number;
  allRoleStats: RoleStat[];
  bestWorks: BestWork[];
  careerTrajectory: CareerTrajectoryItem[];
  isFallback: boolean;
}

export type WorksSortOption =
  | 'DEVIATION_DESC'
  | 'DEVIATION_ASC'
  | 'RAW_DESC'
  | 'RAW_ASC'
  | 'PRED_DESC'
  | 'RESIDUAL_DESC'
  | 'RESIDUAL_ASC'
  | 'YEAR_DESC'
  | 'YEAR_ASC'
  | 'TITLE_ASC';

export type StaffSortOption = 'RATING' | 'CUMULATIVE';

export const ROLE_ORDER = [
  'director',
  'series_comp',
  'char_design',
  'sakkan',
  'genga',
  'unit_director',
  'music',
  'art_dir',
  'cv',
  'studio'
] as const;

export type RoleType = typeof ROLE_ORDER[number] | 'all';

export interface StaffCandidate {
  name: string;
  role: string;
  worksCount: number;
  ratingTier: string;
  cumulativeTier: string;
  topCharacter?: string | null;
}

