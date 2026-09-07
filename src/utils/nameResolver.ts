/**
 * スタッフ・声優・制作スタジオ・キャラクターの英語名解決＆ローマ字検索ユーティリティ
 * (Android版 StaffNameResolver.kt & CharacterNameResolver.kt に完全準拠)
 */

export const STUDIO_EN_MAP: Record<string, string> = {
  "スタジオジブリ": "Studio Ghibli",
  "MADHOUSE": "MADHOUSE",
  "京都アニメーション": "Kyoto Animation",
  "ボンズ": "Bones",
  "シャフト": "Shaft",
  "サンライズ": "Sunrise",
  "WIT STUDIO": "WIT STUDIO",
  "CloverWorks": "CloverWorks",
  "A-1 Pictures": "A-1 Pictures",
  "MAPPA": "MAPPA",
  "ufotable": "ufotable",
  "TRIGGER": "TRIGGER",
  "スタジオ地図": "Studio Chizu",
  "コミックス・ウェーブ・フィルム": "CoMix Wave Films",
  "Production I.G": "Production I.G",
  "東映アニメーション": "Toei Animation",
  "スタジオぴえろ": "Pierrot",
  "トムス・エンタテインメント": "TMS Entertainment",
  "J.C.STAFF": "J.C.STAFF",
  "P.A.WORKS": "P.A.WORKS",
  "動画工房": "Doga Kobo",
  "SILVER LINK.": "SILVER LINK.",
  "キネマシトラス": "Kinema Citrus",
  "サイエンスSARU": "Science SARU",
  "スタジオディーン": "Studio Deen",
  "OLM": "OLM",
  "AIC": "AIC",
  "GONZO": "GONZO",
  "XEBEC": "XEBEC",
  "TROYCA": "TROYCA",
  "Lerche": "Lerche",
  "feel.": "feel.",
  "タツノコプロ": "Tatsunoko Production",
  "GAINAX": "GAINAX",
  "david production": "David Production",
  "スタジオバインド": "Studio Bind",
  "スタジオヴォルン": "Studio VOLN",
  "Nexus": "Nexus",
  "C-Station": "C-Station",
  "テレコム・アニメーションフィルム": "Telecom Animation Film",
  "シンエイ動画": "Shin-Ei Animation",
  "日本アニメーション": "Nippon Animation",
  "ライデンフィルム": "LIDENFILMS",
  "WHITE FOX": "WHITE FOX"
};

let staffEnMap: Record<string, string> = {};
let characterEnMap: Record<string, string> = {};
let reverseRomajiIndex: Array<[string, string]> = []; // [normalizedRomaji, kanjiName]
let isDictionariesLoaded = false;

function normalizeRomaji(str: string): string {
  return str.toLowerCase()
    .replace(/ou/g, 'o')
    .replace(/oo/g, 'o')
    .replace(/uu/g, 'u')
    .replace(/ā/g, 'a')
    .replace(/ē/g, 'e')
    .replace(/ī/g, 'i')
    .replace(/ō/g, 'o')
    .replace(/ū/g, 'u')
    .replace(/[^a-z0-9]/g, '');
}

import { getAssetPath } from '../db/database';

export async function loadNameDictionaries(): Promise<void> {
  if (isDictionariesLoaded) return;
  try {
    const [staffRes, charRes] = await Promise.all([
      fetch(getAssetPath('data/staff_en_names.json')),
      fetch(getAssetPath('data/character_en_names.json'))
    ]);


    if (staffRes.ok) {
      staffEnMap = await staffRes.json();
      reverseRomajiIndex = Object.entries(staffEnMap).map(([kanji, en]) => [
        normalizeRomaji(en),
        kanji
      ]);
    }
    if (charRes.ok) {
      characterEnMap = await charRes.json();
    }
    isDictionariesLoaded = true;
  } catch (e) {
    console.warn('Failed to load name dictionaries:', e);
  }
}

export const StaffNameResolver = {
  getStaffName(name: string, isEnglish: boolean): string {
    if (!isEnglish || !name) return name;
    return staffEnMap[name.trim()] || name;
  },

  getStudioName(name: string, isEnglish: boolean): string {
    if (!isEnglish || !name) return name;
    return STUDIO_EN_MAP[name.trim()] || name;
  },

  searchKanjiByRomaji(query: string, maxResults: number = 100): string[] {
    const cleanQ = normalizeRomaji(query);
    if (!cleanQ || cleanQ.length < 2) return [];
    const matched: string[] = [];
    for (const [romaji, kanji] of reverseRomajiIndex) {
      if (romaji.includes(cleanQ)) {
        matched.push(kanji);
        if (matched.length >= maxResults) break;
      }
    }
    return Array.from(new Set(matched));
  },

  searchStudiosByRomaji(query: string): string[] {
    const cleanQ = normalizeRomaji(query);
    if (!cleanQ) return [];
    return Object.entries(STUDIO_EN_MAP)
      .filter(([_, en]) => normalizeRomaji(en).includes(cleanQ))
      .map(([ja]) => ja);
  }
};

export const CharacterNameResolver = {
  getCharacterName(name: string | null | undefined, isEnglish: boolean): string {
    if (!name) return '';
    const trimmed = name.trim();
    if (!isEnglish) return trimmed;
    return characterEnMap[trimmed] || trimmed;
  },

  formatTopCharacter(topChar: string | null | undefined, isEnglish: boolean): string {
    if (!topChar) return '';
    const trimmed = topChar.trim();
    if (!isEnglish) return trimmed;

    const match = trimmed.match(/^(.*?)\s*\((主角|配角|客串)\)$/);
    if (match) {
      const cName = match[1].trim();
      const rel = match[2];
      const enName = this.getCharacterName(cName, true);
      const enRel = rel === '主角' ? 'Main' : rel === '配角' ? 'Supporting' : 'Guest';
      return `${enName} (${enRel})`;
    }
    return this.getCharacterName(trimmed, true);
  }
};

export const staffResolver = {
  ...StaffNameResolver,
  initialize: loadNameDictionaries
};

export const characterResolver = {
  ...CharacterNameResolver,
  initialize: loadNameDictionaries
};

