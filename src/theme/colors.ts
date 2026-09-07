/**
 * Material 3 カラー定義 & 5大プリセット仕様 (Android版 Color.kt に完全準拠)
 */

export interface ColorPresetSpec {
  id: string;
  name: string;
  description: string;
  descriptionEn: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  previewDot: string;
}

export const TITANIUM_SLATE: ColorPresetSpec = {
  id: 'titanium_slate',
  name: 'Titanium Slate',
  description: '知的でプロフェッショナルなチタンスレート (標準)',
  descriptionEn: 'Intellectual and professional titanium slate (Default)',
  primary: '#A8C7FA',
  onPrimary: '#003062',
  primaryContainer: '#00468A',
  onPrimaryContainer: '#D6E3FF',
  secondary: '#BEC6DC',
  onSecondary: '#283141',
  secondaryContainer: '#3E4759',
  onSecondaryContainer: '#DAE2F9',
  tertiary: '#EFB8C8',
  onTertiary: '#492532',
  tertiaryContainer: '#633B48',
  onTertiaryContainer: '#FFD8E4',
  previewDot: '#A8C7FA'
};

export const MATERIAL_LAVENDER: ColorPresetSpec = {
  id: 'material_lavender',
  name: 'Material Lavender',
  description: 'Google Material 3 公式ベースラインラベンダー',
  descriptionEn: 'Official Google Material 3 baseline lavender',
  primary: '#D0BCFF',
  onPrimary: '#381E72',
  primaryContainer: '#4F378B',
  onPrimaryContainer: '#EADDFF',
  secondary: '#CCC2DC',
  onSecondary: '#332D41',
  secondaryContainer: '#4A4458',
  onSecondaryContainer: '#E8DEF8',
  tertiary: '#EFB8C8',
  onTertiary: '#492532',
  tertiaryContainer: '#633B48',
  onTertiaryContainer: '#FFD8E4',
  previewDot: '#D0BCFF'
};

export const NORDIC_EMERALD: ColorPresetSpec = {
  id: 'nordic_emerald',
  name: 'Nordic Emerald',
  description: '落ち着きと品位のある北欧フォレストグリーン',
  descriptionEn: 'Calm and refined Nordic forest green',
  primary: '#82D9A7',
  onPrimary: '#003822',
  primaryContainer: '#005234',
  onPrimaryContainer: '#A0F5C2',
  secondary: '#B4CCBE',
  onSecondary: '#20352A',
  secondaryContainer: '#364B3F',
  onSecondaryContainer: '#D0E8D9',
  tertiary: '#D3C7A8',
  onTertiary: '#38301B',
  tertiaryContainer: '#4F462F',
  onTertiaryContainer: '#F0E3C3',
  previewDot: '#82D9A7'
};

export const AMBER_BRONZE: ColorPresetSpec = {
  id: 'amber_bronze',
  name: 'Amber Bronze',
  description: '映画的で温かみのあるクラシックアンバー',
  descriptionEn: 'Cinematic and warm classic amber',
  primary: '#F0C068',
  onPrimary: '#422C00',
  primaryContainer: '#5E4100',
  onPrimaryContainer: '#FFDEA4',
  secondary: '#D7C4A8',
  onSecondary: '#3B2F1B',
  secondaryContainer: '#52452F',
  onSecondaryContainer: '#F4E0C3',
  tertiary: '#DEC2B7',
  onTertiary: '#402C26',
  tertiaryContainer: '#58423B',
  onTertiaryContainer: '#FBDBD0',
  previewDot: '#F0C068'
};

export const PURE_MONOCHROME: ColorPresetSpec = {
  id: 'pure_monochrome',
  name: 'Pure Monochrome',
  description: 'Tierの色味のみを最大限に際立たせる白黒ミニマル',
  descriptionEn: 'Black & white minimalist highlighting Tier grade colors',
  primary: '#E2E2E6',
  onPrimary: '#1B1B1F',
  primaryContainer: '#303034',
  onPrimaryContainer: '#E2E2E6',
  secondary: '#C4C7C5',
  onSecondary: '#1B1B1F',
  secondaryContainer: '#303034',
  onSecondaryContainer: '#C4C7C5',
  tertiary: '#909094',
  onTertiary: '#1B1B1F',
  tertiaryContainer: '#303034',
  onTertiaryContainer: '#C4C7C5',
  previewDot: '#E2E2E6'
};

export const ALL_PRESETS = [
  TITANIUM_SLATE,
  MATERIAL_LAVENDER,
  NORDIC_EMERALD,
  AMBER_BRONZE,
  PURE_MONOCHROME
];

export function getPresetById(id: string): ColorPresetSpec {
  return ALL_PRESETS.find(p => p.id === id) || TITANIUM_SLATE;
}

// 判定バッジカラー
export const VerdictSurprise = '#82D9A7';
export const VerdictNormal = '#94A3B8';
export const VerdictUnderperform = '#F28B82';
