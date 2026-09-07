/**
 * Tier専用カラーパレット & 説明仕様 (Android版 TierTheme.kt に完全準拠)
 */

export interface TierColorSpec {
  containerColor: string;
  onContainerColor: string;
  borderColor: string;
  tierName: string;
  descriptionJa: string;
  descriptionEn: string;
}

export const TierThemeMap: Record<string, TierColorSpec> = {
  'S+': {
    containerColor: 'rgba(234, 199, 101, 0.15)',
    onContainerColor: '#EAC765', // M3 Classic Gold
    borderColor: 'rgba(234, 199, 101, 0.4)',
    tierName: 'S+',
    descriptionJa: '同年代の中で極めて突出した歴史的メガヒット・超名作水準（上位約2.3%以内）',
    descriptionEn: 'Historic masterpiece / massive breakout hit standing far above its era (Top ~2.3%)'
  },
  'S': {
    containerColor: 'rgba(139, 211, 167, 0.15)',
    onContainerColor: '#8BD3A7', // M3 Soft Emerald
    borderColor: 'rgba(139, 211, 167, 0.4)',
    tierName: 'S',
    descriptionJa: 'その時代を代表する大傑作。高いクオリティと広範な支持を獲得した作品（上位約6.7%以内）',
    descriptionEn: 'Era-defining masterpiece with exceptional craft and broad acclaim (Top ~6.7%)'
  },
  'A+': {
    containerColor: 'rgba(139, 197, 227, 0.15)',
    onContainerColor: '#8BC5E3', // M3 Slate Cyan
    borderColor: 'rgba(139, 197, 227, 0.4)',
    tierName: 'A+',
    descriptionJa: '同年代の上位15%に位置する確かな完成度と魅力を誇る秀作（上位約15.9%以内）',
    descriptionEn: 'Outstanding production in the top 15% with proven polish and appeal (Top ~15.9%)'
  },
  'A': {
    containerColor: 'rgba(163, 179, 231, 0.15)',
    onContainerColor: '#A3B3E7', // M3 Cool Indigo
    borderColor: 'rgba(163, 179, 231, 0.4)',
    tierName: 'A',
    descriptionJa: '平均を明確に上回り、ファン層から根強く支持される良作水準（上位約30.9%以内）',
    descriptionEn: 'Solid work distinctly above average with strong audience support (Top ~30.9%)'
  },
  'B+': {
    containerColor: 'rgba(147, 204, 204, 0.15)',
    onContainerColor: '#93CCCC', // M3 Sage Teal
    borderColor: 'rgba(147, 204, 204, 0.4)',
    tierName: 'B+',
    descriptionJa: '年代の平均水準以上を堅実に維持している安定作',
    descriptionEn: 'Reliable title consistently performing above era-average benchmarks'
  },
  'B': {
    containerColor: 'rgba(174, 178, 186, 0.15)',
    onContainerColor: '#AEB2BA', // M3 Neutral Slate
    borderColor: 'rgba(174, 178, 186, 0.4)',
    tierName: 'B',
    descriptionJa: '年代の平均的ボリュームゾーンに位置する標準的な作品',
    descriptionEn: 'Standard production situated within the era’s average volume zone'
  },
  'C': {
    containerColor: 'rgba(197, 166, 193, 0.15)',
    onContainerColor: '#C5A6C1', // M3 Muted Plum
    borderColor: 'rgba(197, 166, 193, 0.4)',
    tierName: 'C',
    descriptionJa: '同年代の平均的な評価を下回った作品群',
    descriptionEn: 'Productions scoring below the era-average consensus'
  },
  'D': {
    containerColor: 'rgba(222, 161, 169, 0.15)',
    onContainerColor: '#DEA1A9', // M3 Muted Rose
    borderColor: 'rgba(222, 161, 169, 0.4)',
    tierName: 'D',
    descriptionJa: '同年代の平均的な評価を大きく下回った作品群',
    descriptionEn: 'Productions scoring significantly below the era-average baseline'
  }
};

export const TierTheme = {
  forTier(tier: string | null | undefined): TierColorSpec {
    const key = (tier || 'B').trim().toUpperCase();
    return TierThemeMap[key] || TierThemeMap['B'];
  }
};
