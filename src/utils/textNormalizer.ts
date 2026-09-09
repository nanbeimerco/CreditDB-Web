/**
 * 日本語文字列を検索用に正規化するユーティリティ (Android版 TextNormalizer.kt に完全準拠)
 * 1. 全角英数字記号 -> 半角 (NFKC)
 * 2. カタカナ -> ひらがな
 * 3. ゐゑゔ等の変体仮名 -> いえぶ
 * 4. 空白・記号の除去
 * 5. 小文字化
 */

const PUNCTUATION_REGEX = /[\s\-_・:：,，.．!！?？/／★☆♪〜~・()（）「」『』\[\]【】]/g;

// 新旧漢字・異体字の代表新字体マッピング
const KANJI_VARIANTS: Record<string, string> = {
  '惡': '悪', '櫻': '桜', '鐵': '鉄', '國': '国', '龍': '竜',
  '廣': '広', '髙': '高', '﨑': '崎', '壽': '寿', '體': '体',
  '戰': '戦', '畫': '画', '號': '号', '變': '変', '戀': '恋',
  '黑': '黒', '蟲': '虫', '擊': '撃', '寫': '写', '眞': '真',
  '遙': '遥', '條': '条', '齊': '斉', '齋': '斉', '斎': '斉',
  '藪': '薮', '峰': '峯', '嶋': '島', '濱': '浜', '濵': '浜'
};

export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  // 1. 小文字化 & NFKC 正規化 (全角英数記号 -> 半角)
  let s = text.toLowerCase().normalize('NFKC');
  
  // 2. カタカナをひらがなに変換 & 変体仮名 & 異体字変換
  let res = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const code = ch.charCodeAt(0);
    
    if (KANJI_VARIANTS[ch]) {
      res += KANJI_VARIANTS[ch];
    } else if (ch === 'ゐ' || ch === 'ヰ') {
      res += 'い';
    } else if (ch === 'ゑ' || ch === 'ヱ') {
      res += 'え';
    } else if (ch === 'ゔ' || ch === 'ヴ') {
      res += 'ぶ';
    } else if (code >= 0x30a1 && code <= 0x30f6) {
      // カタカナ (0x30A1〜0x30F6) -> ひらがな (差分 0x60)
      res += String.fromCharCode(code - 0x60);
    } else {
      res += ch;
    }
  }
  
  // 3. 記号・空白の除去
  return res.replace(PUNCTUATION_REGEX, '');
}
