/**
 * Tier表の感性・スタッフ集計 & 数理相関診断エンジン (Android版 TierAnalysisEngine.kt に完全準拠)
 */
import { TierTableConfig, StaffAffinityScore, TasteCorrelationResult } from '../../types/tier';
import { StaffNameResolver } from '../../utils/nameResolver';

export const DEPARTMENT_KEYS = [
  'all',
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

export const TierAnalysisEngine = {
  /**
   * Tier表の配置情報から、スタッフおよび制作会社の好みを重み付け集計する
   */
  calculateStaffAffinity(
    config: TierTableConfig,
    targetRole: string = 'all',
    isEn: boolean = false
  ): StaffAffinityScore[] {
    const rows = config.rows;
    const totalRows = rows.length;
    if (totalRows === 0) return [];

    interface StaffEntry {
      name: string;
      role: string;
      score: number;
      works: Set<string>;
    }

    const map = new Map<string, StaffEntry>();

    rows.forEach((row, rowIndex) => {
      // 上位Tierほど高い重み (例: 7行の場合 14, 12, 10, 8, 6, 4, 2)
      const weight = Math.max(1.0, (totalRows - rowIndex) * 2.0);

      for (const anime of row.items) {
        const workDisplayTitle = isEn && anime.titleEn ? anime.titleEn : anime.title;

        // 1. staffJson 解析
        try {
          if (anime.staffJson) {
            const root = JSON.parse(anime.staffJson);
            for (const [role, arr] of Object.entries(root)) {
              if (targetRole !== 'all' && targetRole !== role) {
                if (!(targetRole === 'studio' && role === 'studio')) continue;
              }
              if (!Array.isArray(arr)) continue;

              for (const item of arr) {
                const rawName = typeof item === 'object' && item !== null ? String(item.name || '').trim() : String(item).trim();
                if (!rawName) continue;

                const displayName = role === 'studio'
                  ? StaffNameResolver.getStudioName(rawName, isEn)
                  : StaffNameResolver.getStaffName(rawName, isEn);

                const entryKey = `${role}:${displayName}`;
                let entry = map.get(entryKey);
                if (!entry) {
                  entry = { name: displayName, role, score: 0, works: new Set() };
                  map.set(entryKey, entry);
                }
                entry.score += weight;
                entry.works.add(workDisplayTitle);
              }
            }
          }
        } catch {}

        // 2. charactersJson (CV) 解析
        if (targetRole === 'all' || targetRole === 'cv') {
          try {
            if (anime.charactersJson) {
              const arr = JSON.parse(anime.charactersJson);
              if (Array.isArray(arr)) {
                for (const item of arr) {
                  const actorName = String(item.actor_name || '').trim();
                  if (!actorName) continue;

                  const displayName = StaffNameResolver.getStaffName(actorName, isEn);
                  const entryKey = `cv:${displayName}`;
                  let entry = map.get(entryKey);
                  if (!entry) {
                    entry = { name: displayName, role: 'cv', score: 0, works: new Set() };
                    map.set(entryKey, entry);
                  }
                  entry.score += weight;
                  entry.works.add(workDisplayTitle);
                }
              }
            }
          } catch {}
        }
      }
    });

    return Array.from(map.values())
      .map((entry) => ({
        staffName: entry.name,
        roleKey: entry.role,
        weightedScore: entry.score,
        workCount: entry.works.size,
        works: Array.from(entry.works)
      }))
      .sort((a, b) => b.weightedScore - a.weightedScore || b.workCount - a.workCount);
  },

  /**
   * ユーザー主観Tier配置と客観偏差値のSpearman順位相関および感性診断
   */
  calculateTasteCorrelation(config: TierTableConfig): TasteCorrelationResult {
    const rankedItems: Array<[number, number]> = []; // [userScore, deviationScore]
    const avgDevPerTier: Record<string, number> = {};
    const countPerTier: Record<string, number> = {};

    const totalRows = config.rows.length;
    config.rows.forEach((row, rowIndex) => {
      const userScore = totalRows - rowIndex;
      const devs = row.items.map((it) => it.deviationScore);
      countPerTier[row.name] = row.items.length;
      if (devs.length > 0) {
        const avg = devs.reduce((sum, v) => sum + v, 0) / devs.length;
        avgDevPerTier[row.name] = avg;
        for (const d of devs) {
          rankedItems.push([userScore, d]);
        }
      } else {
        avgDevPerTier[row.name] = 0;
      }
    });

    const sampleSize = rankedItems.length;
    if (sampleSize < 3) {
      return {
        spearmanRho: 0.0,
        sampleSize,
        avgDeviationPerTier: avgDevPerTier,
        countPerTier,
        diagnosisTitleJa: 'データ蓄積中（最低3作品必要）',
        diagnosisTitleEn: 'Accumulating Data (Min 3 anime needed)',
        diagnosisDescJa: '作品をTier表に配置すると、客観的数理指標との相関診断が自動計算されます。',
        diagnosisDescEn: 'Place anime on the Tier list to compute mathematical correlation and taste profile.'
      };
    }

    // 順位相関計算 (同順位の平均ランク補正付き Pearson)
    const userRanks = this.computeRanks(rankedItems.map((it) => it[0]));
    const devRanks = this.computeRanks(rankedItems.map((it) => it[1]));
    const rho = this.computePearson(userRanks, devRanks);

    let titleJa = '';
    let descJa = '';
    let titleEn = '';
    let descEn = '';

    if (rho >= 0.50) {
      titleJa = '王道・客観指標一致型（Mainstream Connoisseur）';
      descJa = 'あなたの主観評価は、時代補正後の客観偏差値や作品完成度指標と極めて高く連動しています。歴史的評価の定まった傑作や、洗練された演出・脚本を持つ本質的な名作を的確に見抜く高い鑑賞眼を持っています。';
      titleEn = 'Mainstream Connoisseur (Objective Alignment)';
      descEn = 'Your taste strongly aligns with era-adjusted objective quality metrics. You have an exceptional appreciation for universally acclaimed masterpieces, structural narrative excellence, and sophisticated direction.';
    } else if (rho >= 0.15) {
      titleJa = '独自審美眼・ハイブリッド型（Discerning Eclectic）';
      descJa = '世間・時代の高評価作を押さえつつも、特定の監督やスタジオ、作家性の強い隠れた名作を自身の感性で見出して上位に据える、バランスの取れた独自の審美眼を持っています。';
      titleEn = 'Discerning Eclectic (Balanced Independent)';
      descEn = 'While acknowledging widely acclaimed works, you champion auteur-driven titles and personal favorites with a mature, independent aesthetic perspective.';
    } else if (rho >= -0.15) {
      titleJa = '完全個人主義・カルト嗜好型（Autonomous Individualist）';
      descJa = '世間の平均的評価やトレンドに左右されず、自身固有の美的感覚、特定ジャンルへの愛着、あるいは作家への共鳴によって純粋に評価を行っています。';
      titleEn = 'Autonomous Individualist (Cult & Niche Devotee)';
      descEn = 'Your ranking is decoupled from mainstream consensus, governed purely by personal resonance, niche genres, or devotion to specific creative voices.';
    } else {
      titleJa = '孤高・オルタナティブ探求型（Iconoclast Specialist）';
      descJa = '一般的に評価の分かれる尖った作品や、実験的な表現を試みた異色作、過小評価された作品に強い魅力を感じる、探求心に満ちた鑑賞スタイルを持っています。';
      titleEn = 'Iconoclast Specialist (Alternative Explorer)';
      descEn = 'You find profound merit in polarizing, avant-garde, or overlooked productions that challenge conventional formulas, valuing creative audacity over safe consensus.';
    }

    return {
      spearmanRho: rho,
      sampleSize,
      avgDeviationPerTier: avgDevPerTier,
      countPerTier,
      diagnosisTitleJa: titleJa,
      diagnosisTitleEn: titleEn,
      diagnosisDescJa: descJa,
      diagnosisDescEn: descEn
    };

  },

  computeRanks(values: number[]): number[] {
    const n = values.length;
    const indexed = values.map((v, i) => ({ val: v, idx: i })).sort((a, b) => a.val - b.val);
    const ranks = new Array(n);

    let i = 0;
    while (i < n) {
      let j = i;
      while (j < n - 1 && indexed[j + 1].val === indexed[j].val) {
        j++;
      }
      const avgRank = (i + 1 + j + 1) / 2.0;
      for (let k = i; k <= j; k++) {
        ranks[indexed[k].idx] = avgRank;
      }
      i = j + 1;
    }
    return ranks;
  },

  computePearson(xs: number[], ys: number[]): number {
    const n = xs.length;
    if (n === 0) return 0;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let denX = 0;
    let denY = 0;

    for (let i = 0; i < n; i++) {
      const dx = xs[i] - meanX;
      const dy = ys[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    const denom = Math.sqrt(denX * denY);
    return denom === 0 ? 0 : num / denom;
  },

  exportToMarkdown(config: TierTableConfig, isEn: boolean = false): string {
    const correlation = this.calculateTasteCorrelation(config);
    const topDirectors = this.calculateStaffAffinity(config, "director", isEn).slice(0, 5);
    const topComps = this.calculateStaffAffinity(config, "series_comp", isEn).slice(0, 5);
    const topStudios = this.calculateStaffAffinity(config, "studio", isEn).slice(0, 5);
    const topCvs = this.calculateStaffAffinity(config, "cv", isEn).slice(0, 5);

    let md = '# CreditDB Anime Taste & Tier Evaluation Profile\n\n';
    md += '## 1. CreditDB 数理指標モデルの定義 (Mathematical Metric Specification)\n';
    md += '- **Local Z-Score (Z_i)**: 同年代作品群（平均0, 標準偏差1）の中での相対標準化得点。\n';
    md += '- **Deviation Score (T_i = 50 + 10 * Z_i)**: 同年代作品群における客観クオリティ偏差値。\n';
    md += '- **Predicted Score (Z_hat)**: 参加スタッフ過去実績に基づく事前期待値。\n';
    md += '- **Residual (Z_i - Z_hat)**: 事前期待値に対する実績乖離度（サプライズ上振れ/下振れ）。\n\n';
    md += '---\n\n';

    md += '## 2. ユーザー主観 Tier表 (User Tier Placements)\n\n';
    for (const row of config.rows) {
      const avgDev = correlation.avgDeviationPerTier[row.name] ?? 0;
      md += `### Tier [ ${row.name} ] (作品数: ${row.items.length}件, 平均偏差値: ${avgDev.toFixed(1)})\n`;
      if (row.items.length === 0) {
        md += '*(作品なし)*\n\n';
      } else {
        md += '| 作品名 | 放送年 | 偏差値 (T_i) | 乖離度 (Residual) |\n';
        md += '| :--- | :---: | :---: | :---: |\n';
        for (const item of row.items) {
          const title = (isEn && item.titleEn) ? item.titleEn : (item.title || item.titleEn);
          const dev = item.deviationScore != null ? item.deviationScore.toFixed(1) : '-';
          const res = item.residual != null ? (item.residual >= 0 ? `+${item.residual.toFixed(2)}` : item.residual.toFixed(2)) : '-';
          md += `| **${title}** | ${item.year || '-'} | ${dev} | ${res} |\n`;
        }
        md += '\n';
      }
    }

    md += '---\n\n';
    md += '## 3. スタッフ・スタジオ好み集計 (Staff & Studio Affinity)\n\n';

    md += '### 監督 (Directors)\n';
    if (topDirectors.length === 0) md += '- なし\n';
    else topDirectors.forEach((s, i) => {
      md += `${i + 1}. **${s.staffName}** (${s.weightedScore.toFixed(1)} pts, ${s.workCount}作: ${s.works.slice(0, 3).join(', ')})\n`;
    });
    md += '\n';

    md += '### シリーズ構成・脚本 (Series Composition)\n';
    if (topComps.length === 0) md += '- なし\n';
    else topComps.forEach((s, i) => {
      md += `${i + 1}. **${s.staffName}** (${s.weightedScore.toFixed(1)} pts, ${s.workCount}作: ${s.works.slice(0, 3).join(', ')})\n`;
    });
    md += '\n';

    md += '### 制作スタジオ (Studios)\n';
    if (topStudios.length === 0) md += '- なし\n';
    else topStudios.forEach((s, i) => {
      md += `${i + 1}. **${s.staffName}** (${s.weightedScore.toFixed(1)} pts, ${s.workCount}作: ${s.works.slice(0, 3).join(', ')})\n`;
    });
    md += '\n';

    md += '### 声優 (Cast)\n';
    if (topCvs.length === 0) md += '- なし\n';
    else topCvs.forEach((s, i) => {
      md += `${i + 1}. **${s.staffName}** (${s.weightedScore.toFixed(1)} pts, ${s.workCount}作: ${s.works.slice(0, 3).join(', ')})\n`;
    });
    md += '\n';

    md += '---\n\n';
    md += '## 4. AI深層プロンプト (Prompt for LLM)\n';
    md += '以下のTier表とスタッフ好みデータに基づき、私の好みの深層プロファイリング、好みの演出・作劇傾向、および次に観るべき隠れた名作・おすすめアニメを推薦してください。\n';

    return md;
  }
};

