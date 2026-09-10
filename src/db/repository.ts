/**
 * データベースリポジトリ (Android版 CreditRepository.kt を完全移植)
 */
import { getDatabase } from './database';
import {
  SummaryInfo,
  WorkItem,
  WorkDetail,
  StaffCredit,
  CharacterCast,
  LeaderboardItem,
  StaffProfile,
  RoleStat,
  BestWork,
  CareerTrajectoryItem,
  StudioWorkItem,
  StaffCandidate,
  WorksSortOption,
  StaffSortOption
} from '../types/entities';
import { normalizeText } from '../utils/textNormalizer';
import { StaffNameResolver } from '../utils/nameResolver';

let workIdToTitleEnCache: Record<string, string> | null = null;
let titleToTitleEnCache: Record<string, string> | null = null;

function getWorkTitleEnMaps(): [Record<string, string>, Record<string, string>] {
  if (workIdToTitleEnCache && titleToTitleEnCache) {
    return [workIdToTitleEnCache, titleToTitleEnCache];
  }
  const db = getDatabase();
  const res = db.exec("SELECT work_id, title, title_en FROM works WHERE title_en IS NOT NULL AND title_en != ''");
  const idMap: Record<string, string> = {};
  const titleMap: Record<string, string> = {};

  if (res.length > 0) {
    for (const row of res[0].values) {
      const wid = String(row[0] || '');
      const jaTitle = String(row[1] || '');
      const enTitle = String(row[2] || '');
      if (wid && enTitle) idMap[wid] = enTitle;
      if (jaTitle && enTitle) titleMap[jaTitle] = enTitle;
    }
  }
  workIdToTitleEnCache = idMap;
  titleToTitleEnCache = titleMap;
  return [idMap, titleMap];
}

function parseStaffCredits(jsonStr: string): Record<string, StaffCredit[]> {
  const result: Record<string, StaffCredit[]> = {};
  try {
    const root = JSON.parse(jsonStr || '{}');
    for (const [roleKey, val] of Object.entries(root)) {
      if (Array.isArray(val)) {
        result[roleKey] = val.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            return {
              name: item.name || '',
              ratingTier: item.rt || 'B',
              cumulativeTier: item.ct || 'B',
              characterName: item.character_name || null,
              relation: item.relation || null
            };
          } else {
            return {
              name: String(item),
              ratingTier: 'B',
              cumulativeTier: 'B'
            };
          }
        });
      }
    }
  } catch {}
  return result;
}

function parseCharacters(jsonStr: string): CharacterCast[] {
  const result: CharacterCast[] = [];
  try {
    const arr = JSON.parse(jsonStr || '[]');
    if (Array.isArray(arr)) {
      for (const el of arr) {
        if (typeof el === 'object' && el !== null) {
          result.push({
            characterName: el.character_name || '',
            relation: el.relation || '脇役',
            actorName: el.actor_name || '',
            ratingTier: el.rt || 'B',
            cumulativeTier: el.ct || 'B'
          });
        }
      }
    }
  } catch {}
  return result;
}

function buildStaffSummary(staffJsonStr: string, charJsonStr: string): string {
  const parts: string[] = [];
  try {
    const staff = parseStaffCredits(staffJsonStr);
    const dir = staff['director'];
    if (dir && dir.length > 0 && dir[0].name) {
      parts.push(`監督: ${dir[0].name}`);
    }
    const comp = staff['series_comp'];
    if (comp && comp.length > 0 && comp[0].name) {
      parts.push(`構成: ${comp[0].name}`);
    }
    const chars = parseCharacters(charJsonStr);
    if (chars.length > 0 && chars[0].actorName) {
      parts.push(`CV: ${chars[0].actorName}`);
    }
  } catch {}
  return parts.length > 0 ? parts.join(' / ') : '制作陣情報あり';
}

function cleanStudio(studioList: StaffCredit[] | undefined): string | null {
  if (!studioList || studioList.length === 0) return null;
  const names = studioList.map(s => s.name.trim()).filter(n => n.length > 0);
  if (names.length === 0) return null;

  const joinedAll = names.join(" ");
  const joinedUpper = joinedAll.toUpperCase();

  // スタジオジブリ
  if (joinedUpper.includes("GHIBLI") || joinedAll.includes("ジブリ") || joinedAll.includes("吉卜力")) {
    return "スタジオジブリ";
  }

  // MADHOUSE
  if (
    names.some(n => n.toUpperCase() === "MAD") ||
    joinedUpper.includes("MADHOUSE") ||
    joinedAll.includes("マッドハウス")
  ) {
    return "MADHOUSE";
  }

  // スタジオ地図
  if (joinedUpper.includes("CHIZU") || joinedAll.includes("スタジオ地図")) {
    return "スタジオ地図";
  }

  // WIT STUDIO
  if (
    (names.some(n => n.toUpperCase() === "WIT") && names.some(n => n.toUpperCase() === "STUDIO")) ||
    joinedUpper.startsWith("WIT")
  ) {
    return "WIT STUDIO";
  }

  // WHITE FOX
  if (
    (names.some(n => n.toUpperCase() === "WHITE") && names.some(n => n.toUpperCase() === "FOX")) ||
    joinedUpper.includes("WHITE FOX")
  ) {
    return "WHITE FOX";
  }

  // ライデンフィルム
  if (
    (names.some(n => n.toUpperCase() === "LIDEN") && names.some(n => n.toUpperCase() === "FILMS")) ||
    joinedAll.includes("ライデンフィルム") ||
    joinedUpper.includes("LIDENFILMS")
  ) {
    return "ライデンフィルム";
  }

  if (joinedUpper.includes("MAPPA")) return "MAPPA";
  if (joinedUpper.includes("UFOTABLE") || joinedAll.includes("ユーフォーテーブル")) return "ufotable";
  if (joinedUpper.includes("BONES") || joinedAll.includes("ボンズ")) return "ボンズ";
  if (joinedUpper.includes("CLOVERWORKS") || joinedAll.includes("クローバーワークス")) return "CloverWorks";
  if (joinedUpper.includes("KYOTO") || joinedAll.includes("京都") || joinedAll.includes("京アニ")) return "京都アニメーション";
  if (joinedUpper.includes("SHAFT") || joinedAll.includes("シャフト")) return "シャフト";
  if (joinedUpper.includes("SUNRISE") || joinedAll.includes("サンライズ")) return "サンライズ";
  if (joinedUpper.includes("TRIGGER") || joinedAll.includes("トリガー")) return "TRIGGER";
  if (joinedUpper.includes("A-1") || joinedUpper.includes("A1")) return "A-1 Pictures";
  if (joinedUpper.includes("J.C.STAFF") || joinedUpper.includes("JCSTAFF") || joinedUpper.includes("J.C.")) return "J.C.STAFF";
  if (joinedUpper.includes("P.A.WORKS") || joinedUpper.includes("PAWORKS") || joinedUpper.includes("P.A.")) return "P.A.WORKS";
  if (joinedUpper.includes("TOEI") || joinedAll.includes("東映")) return "東映アニメーション";
  if (joinedUpper.includes("PIERROT") || joinedAll.includes("ぴえろ")) return "スタジオぴえろ";
  if (joinedUpper.includes("TMS") || joinedAll.includes("トムス")) return "トムス・エンタテインメント";
  if (joinedUpper.includes("DOGA KOBO") || joinedAll.includes("動画工房")) return "動画工房";
  if (joinedUpper.includes("SILVER LINK") || joinedAll.includes("シルバーリンク")) return "SILVER LINK.";
  if (joinedUpper.includes("KINEMA CITRUS") || joinedAll.includes("キネマシトラス")) return "キネマシトラス";
  if (joinedUpper.includes("PRODUCTION I.G") || joinedUpper.includes("PRODUCTION IG") || joinedAll.includes("プロダクションI.G") || joinedAll.includes("プロダクション・アイジー")) return "Production I.G";
  if (joinedUpper.includes("SCIENCE SARU") || joinedAll.includes("サイエンスSARU")) return "サイエンスSARU";
  if (joinedUpper.includes("STUDIO DEEN") || joinedAll.includes("スタジオディーン") || joinedUpper.includes("DEEN")) return "スタジオディーン";
  if (joinedUpper.includes("OLM")) return "OLM";
  if (joinedUpper.includes("AIC")) return "AIC";
  if (joinedUpper.includes("GONZO")) return "GONZO";
  if (joinedUpper.includes("XEBEC") || joinedAll.includes("ジーベック")) return "XEBEC";
  if (joinedUpper.includes("TROYCA") || joinedAll.includes("トロイカ")) return "TROYCA";
  if (joinedUpper.includes("LERCHE") || joinedAll.includes("ラルケ")) return "Lerche";
  if (joinedUpper.includes("COMIX WAVE") || joinedAll.includes("コミックス・ウェーブ")) return "コミックス・ウェーブ・フィルム";
  if (joinedUpper.includes("FEEL") || joinedAll.includes("feel.")) return "feel.";
  if (joinedUpper.includes("TATSUNOKO") || joinedAll.includes("タツノコ")) return "タツノコプロ";
  if (joinedUpper.includes("GAINAX") || joinedAll.includes("ガイナックス")) return "GAINAX";
  if (joinedUpper.includes("DAVID") || joinedAll.includes("デイヴィッドプロダクション")) return "david production";
  if (joinedAll.includes("スタジオバインド") || joinedUpper.includes("STUDIO BIND")) return "スタジオバインド";
  if (joinedAll.includes("スタジオヴォルン") || joinedUpper.includes("VOLN")) return "スタジオヴォルン";
  if (joinedAll.includes("Nexus") || joinedUpper.includes("NEXUS")) return "Nexus";
  if (joinedAll.includes("C-Station") || joinedUpper.includes("C STATION")) return "C-Station";
  if (joinedAll.includes("テレコム")) return "テレコム・アニメーションフィルム";
  if (joinedAll.includes("シンエイ動画")) return "シンエイ動画";
  if (joinedAll.includes("日本アニメーション")) return "日本アニメーション";

  const noise = new Set([
    "振付", "人名", "配角", "Triple", "ON", "PRODUCTION", "Production", "Kim", "Pictures",
    "フジテレビ", "テレビ朝日", "TBS", "日本テレビ", "テレビ東京", "NHK", "TOKYO MX", "MBS", "BS11", "AT-X",
    "松倉友二", "大月俊倫", "丸山正雄", "植田益朗", "川村元気", "読売広告社", "電通", "博報堂", "アニプレックス"
  ]);
  const filtered = names.filter(n => !noise.has(n) && n.length > 1 && !n.startsWith("第"));
  if (filtered.length === 0) return null;

  const candidate = filtered[0];
  const bad = ["振付", "音響", "監督", "原画", "デザイン", "編集", "美術", "制作進行", "テレビ", "放送"];
  if (bad.some(b => candidate.includes(b))) return null;

  return candidate;
}

export const CreditRepository = {
  getSummary(): SummaryInfo {
    const db = getDatabase();
    const res = db.exec("SELECT total_works, total_staff, total_cv, year_min, year_max, updated_at, version, global_mean FROM summary LIMIT 1");
    if (res.length > 0 && res[0].values.length > 0) {
      const row = res[0].values[0];
      return {
        totalWorks: Number(row[0]),
        totalStaff: Number(row[1]),
        totalCv: Number(row[2]),
        yearMin: Number(row[3]),
        yearMax: Number(row[4]),
        updatedAt: String(row[5]),
        version: String(row[6]),
        globalMean: Number(row[7])
      };
    }
    return {
      totalWorks: 5452,
      totalStaff: 22896,
      totalCv: 5840,
      yearMin: 1950,
      yearMax: 2026,
      updatedAt: '2026-09-07 20:00:00',
      version: '1.3.0',
      globalMean: 65.0
    };
  },

  getWorks(
    query: string = '',
    tierFilter: string = 'all',
    eraFilter: string = 'all',
    verdictFilter: string = 'all',
    sortOption: WorksSortOption = 'DEVIATION_DESC',
    limit: number = 50,
    offset: number = 0
  ): WorkItem[] {
    const db = getDatabase();
    const conditions: string[] = [];
    const args: any[] = [];

    if (query.trim()) {
      const qNorm = normalizeText(query.trim());
      const hasLatin = /[a-zA-Z]/.test(query);
      const matchedKanji = hasLatin && query.trim().length >= 3
        ? StaffNameResolver.searchKanjiByRomaji(query.trim(), 25)
        : [];

      if (matchedKanji.length > 0) {
        const orClauses = ['search_text_norm LIKE ?', ...matchedKanji.map(() => 'search_text_norm LIKE ?')].join(' OR ');
        conditions.push(`(${orClauses})`);
        args.push(`%${qNorm}%`);
        matchedKanji.forEach(k => args.push(`%${k}%`));
      } else {
        conditions.push('search_text_norm LIKE ?');
        args.push(`%${qNorm}%`);
      }
    }

    if (tierFilter !== 'all') {
      conditions.push('tier = ?');
      args.push(tierFilter);
    }

    if (verdictFilter !== 'all') {
      conditions.push('performance_verdict LIKE ?');
      args.push(`%${verdictFilter}%`);
    }

    switch (eraFilter) {
      case '2020s': conditions.push('year >= 2020'); break;
      case '2010s': conditions.push('year >= 2010 AND year < 2020'); break;
      case '2000s': conditions.push('year >= 2000 AND year < 2010'); break;
      case '1990s': conditions.push('year >= 1990 AND year < 2000'); break;
      case '1980s': conditions.push('year < 1990'); break;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    let baseSort = 'deviation_score DESC';
    switch (sortOption) {
      case 'DEVIATION_DESC': baseSort = 'deviation_score DESC'; break;
      case 'DEVIATION_ASC': baseSort = 'deviation_score ASC'; break;
      case 'RAW_DESC': baseSort = 'anilist_raw_score DESC'; break;
      case 'RAW_ASC': baseSort = 'anilist_raw_score ASC'; break;
      case 'PRED_DESC': baseSort = 'predicted_score DESC'; break;
      case 'RESIDUAL_DESC': baseSort = 'residual DESC'; break;
      case 'RESIDUAL_ASC': baseSort = 'residual ASC'; break;
      case 'YEAR_DESC': baseSort = 'year DESC'; break;
      case 'YEAR_ASC': baseSort = 'year ASC'; break;
      case 'TITLE_ASC': baseSort = 'title ASC'; break;
    }

    const orderArgs: any[] = [];
    let orderClause = `ORDER BY ${baseSort}`;

    if (query.trim()) {
      const qTrim = query.trim();
      const qNorm = normalizeText(qTrim);
      orderArgs.push(qTrim, qTrim, qTrim, qTrim, qTrim, qTrim, qNorm);
      orderClause = `ORDER BY 
        CASE
          WHEN lower(title) = lower(?) OR lower(coalesce(title_en, '')) = lower(?) THEN 1
          WHEN lower(title) LIKE lower(?) || '%' OR lower(coalesce(title_en, '')) LIKE lower(?) || '%' THEN 2
          WHEN lower(title) LIKE '%' || lower(?) || '%' OR lower(coalesce(title_en, '')) LIKE '%' || lower(?) || '%' THEN 3
          WHEN search_text_norm LIKE ? || '%' THEN 4
          ELSE 5
        END ASC, ${baseSort}`;
    }

    const sql = `
      SELECT work_id, title, title_en, year, deviation_score, z_score_rank,
             anilist_raw_score, raw_score_rank, debiased_b_i, true_z_score,
             predicted_z_score, predicted_score, pred_score_rank, residual,
             performance_verdict, tier, percentile, staff_json, characters_json
      FROM works ${whereClause} ${orderClause} LIMIT ? OFFSET ?
    `;

    const allArgs = [...args, ...orderArgs, limit, offset];
    const res = db.exec(sql, allArgs);
    const list: WorkItem[] = [];

    if (res.length > 0) {
      for (const row of res[0].values) {
        const staffJson = String(row[17] || '{}');
        const charJson = String(row[18] || '[]');
        list.push({
          id: String(row[0]),
          title: String(row[1]),
          titleEn: row[2] ? String(row[2]) : null,
          year: Number(row[3]),
          deviationScore: Number(row[4]),
          deviationRank: Number(row[5]),
          anilistRawScore: Number(row[6]),
          rawRank: Number(row[7]),
          debiasedScore: Number(row[8]),
          trueZScore: Number(row[9]),
          predictedZScore: Number(row[10]),
          predictedScore: Number(row[11]),
          predScoreRank: Number(row[12]),
          residual: Number(row[13]),
          performanceVerdict: String(row[14] || '概ねスタッフ前評判通り'),
          tier: String(row[15]),
          percentile: Number(row[16]),
          staffJson,
          charactersJson: charJson,
          mainStaffSummary: buildStaffSummary(staffJson, charJson)
        });
      }
    }
    return list;
  },

  getWorksCount(
    query: string = '',
    tierFilter: string = 'all',
    eraFilter: string = 'all',
    verdictFilter: string = 'all'
  ): number {
    const db = getDatabase();
    const conditions: string[] = [];
    const args: any[] = [];

    if (query.trim()) {
      const qNorm = normalizeText(query.trim());
      const hasLatin = /[a-zA-Z]/.test(query);
      const matchedKanji = hasLatin ? StaffNameResolver.searchKanjiByRomaji(query.trim(), 25) : [];
      if (matchedKanji.length > 0) {
        const orClauses = ['search_text_norm LIKE ?', ...matchedKanji.map(() => 'search_text_norm LIKE ?')].join(' OR ');
        conditions.push(`(${orClauses})`);
        args.push(`%${qNorm}%`);
        matchedKanji.forEach(k => args.push(`%${k}%`));
      } else {
        conditions.push('search_text_norm LIKE ?');
        args.push(`%${qNorm}%`);
      }
    }

    if (tierFilter !== 'all') {
      conditions.push('tier = ?');
      args.push(tierFilter);
    }
    if (verdictFilter !== 'all') {
      conditions.push('performance_verdict LIKE ?');
      args.push(`%${verdictFilter}%`);
    }

    switch (eraFilter) {
      case '2020s': conditions.push('year >= 2020'); break;
      case '2010s': conditions.push('year >= 2010 AND year < 2020'); break;
      case '2000s': conditions.push('year >= 2000 AND year < 2010'); break;
      case '1990s': conditions.push('year >= 1990 AND year < 2000'); break;
      case '1980s': conditions.push('year < 1990'); break;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT count(*) FROM works ${whereClause}`;
    const res = db.exec(sql, args);
    return res.length > 0 && res[0].values.length > 0 ? Number(res[0].values[0][0]) : 0;
  },

  getWorkDetail(workId: string): WorkDetail | null {
    const db = getDatabase();
    const sql = `
      SELECT work_id, title, title_en, year, deviation_score, z_score_rank,
             anilist_raw_score, raw_score_rank, debiased_b_i, true_z_score,
             predicted_z_score, predicted_score, pred_score_rank, residual,
             performance_verdict, tier, percentile, staff_json, characters_json
      FROM works WHERE work_id = ? LIMIT 1
    `;
    const res = db.exec(sql, [workId]);
    if (res.length === 0 || res[0].values.length === 0) return null;

    const row = res[0].values[0];
    const staffJsonStr = String(row[17] || '{}');
    const charJsonStr = String(row[18] || '[]');
    const rawStaffMap = parseStaffCredits(staffJsonStr);
    const studioList = rawStaffMap['studio'];
    const cleanedStudio = cleanStudio(studioList);

    const staffMap = { ...rawStaffMap };
    delete staffMap['studio'];

    const charList = parseCharacters(charJsonStr);
    if (charList.length > 0) {
      staffMap['cv'] = charList.map(c => ({
        name: c.actorName,
        ratingTier: c.ratingTier,
        cumulativeTier: c.cumulativeTier,
        characterName: c.characterName,
        relation: c.relation
      }));
    }

    return {
      id: String(row[0]),
      title: String(row[1]),
      titleEn: row[2] ? String(row[2]) : null,
      year: Number(row[3]),
      deviationScore: Number(row[4]),
      deviationRank: Number(row[5]),
      anilistRawScore: Number(row[6]),
      rawRank: Number(row[7]),
      debiasedScore: Number(row[8]),
      trueZScore: Number(row[9]),
      predictedZScore: Number(row[10]),
      predictedScore: Number(row[11]),
      predScoreRank: Number(row[12]),
      residual: Number(row[13]),
      performanceVerdict: String(row[14] || '概ねスタッフ前評判通り'),
      tier: String(row[15]),
      percentile: Number(row[16]),
      staffByRole: staffMap,
      characters: charList,
      studio: cleanedStudio
    };
  },

  getLeaderboard(
    role: string = 'all',
    query: string = '',
    sortOption: StaffSortOption = 'RATING',
    limit: number = 50,
    offset: number = 0
  ): LeaderboardItem[] {
    const db = getDatabase();
    const [, titleToEnMap] = getWorkTitleEnMaps();

    // スタジオ役職
    if (role === 'studio') {
      try {
        const conditions: string[] = [];
        const args: any[] = [];
        if (query.trim()) {
          const qNorm = normalizeText(query.trim());
          const hasLatin = /[a-zA-Z]/.test(query);
          const matchedStudios = hasLatin ? StaffNameResolver.searchStudiosByRomaji(query.trim()) : [];
          if (matchedStudios.length > 0) {
            const ph = matchedStudios.map(() => '?').join(',');
            conditions.push(`(name_norm LIKE ? OR name IN (${ph}))`);
            args.push(`%${qNorm}%`, ...matchedStudios);
          } else {
            conditions.push('name_norm LIKE ?');
            args.push(`%${qNorm}%`);
          }
        }
        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const sql = `
          SELECT name, works_count, best_work_title, best_work_year, best_work_dev, best_work_tier
          FROM studios ${whereClause} ORDER BY works_count DESC LIMIT ? OFFSET ?
        `;
        args.push(limit, offset);
        const res = db.exec(sql, args);
        const list: LeaderboardItem[] = [];
        let rank = offset + 1;
        if (res.length > 0) {
          for (const row of res[0].values) {
            const bwTitle = row[2] ? String(row[2]) : null;
            list.push({
              role: 'studio',
              name: String(row[0]),
              worksCount: Number(row[1]),
              rating: 0.0,
              cumulativeZ: 0.0,
              ratingRank: rank,
              cumulativeRank: rank,
              ratingTier: String(row[5] || 'B'),
              cumulativeTier: 'B',
              bestWorkTitle: bwTitle,
              bestWorkTitleEn: bwTitle ? titleToEnMap[bwTitle] || null : null,
              bestWorkYear: row[3] ? Number(row[3]) : null,
              bestWorkZ: row[4] !== null ? Number(row[4]) : null
            });
            rank++;
          }
        }
        return list;
      } catch (e) {
        console.error('Failed to query studios leaderboard:', e);
        return [];
      }
    }

    // 全役職で検索クエリがある場合、マッチするスタジオを先頭に統合
    const matchedStudios: LeaderboardItem[] = [];
    if (role === 'all' && query.trim() && offset === 0) {
      try {
        const qNorm = normalizeText(query.trim());
        const hasLatin = /[a-zA-Z]/.test(query);
        const matchedStudioNames = hasLatin ? StaffNameResolver.searchStudiosByRomaji(query.trim()) : [];
        const stConditions: string[] = [];
        const stArgs: any[] = [];
        if (matchedStudioNames.length > 0) {
          const ph = matchedStudioNames.map(() => '?').join(',');
          stConditions.push(`(name_norm LIKE ? OR name IN (${ph}))`);
          stArgs.push(`%${qNorm}%`, ...matchedStudioNames);
        } else {
          stConditions.push('name_norm LIKE ?');
          stArgs.push(`%${qNorm}%`);
        }
        const stSql = `
          SELECT name, works_count, best_work_title, best_work_year, best_work_dev, best_work_tier
          FROM studios WHERE ${stConditions.join(' AND ')} ORDER BY works_count DESC LIMIT 3
        `;
        const stRes = db.exec(stSql, stArgs);
        if (stRes.length > 0) {
          for (const row of stRes[0].values) {
            const bwTitle = row[2] ? String(row[2]) : null;
            matchedStudios.push({
              role: 'studio',
              name: String(row[0]),
              worksCount: Number(row[1]),
              rating: 0.0,
              cumulativeZ: 0.0,
              ratingRank: 0,
              cumulativeRank: 0,
              ratingTier: String(row[5] || 'B'),
              cumulativeTier: 'B',
              bestWorkTitle: bwTitle,
              bestWorkTitleEn: bwTitle ? titleToEnMap[bwTitle] || null : null,
              bestWorkYear: row[3] ? Number(row[3]) : null,
              bestWorkZ: row[4] !== null ? Number(row[4]) : null
            });
          }
        }
      } catch (e) {
        console.error('Failed to query matched studios:', e);
      }
    }


    const conditions: string[] = ['role = ?'];
    const args: any[] = [role];

    if (query.trim()) {
      const qNorm = normalizeText(query.trim());
      const hasLatin = /[a-zA-Z]/.test(query);
      const matchedKanji = hasLatin ? StaffNameResolver.searchKanjiByRomaji(query.trim(), 100) : [];
      if (matchedKanji.length > 0) {
        const ph = matchedKanji.map(() => '?').join(',');
        conditions.push(`(name_norm LIKE ? OR name IN (${ph}))`);
        args.push(`%${qNorm}%`, ...matchedKanji);
      } else {
        conditions.push('name_norm LIKE ?');
        args.push(`%${qNorm}%`);
      }
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const orderClause = sortOption === 'RATING' ? 'ORDER BY rating_rank ASC' : 'ORDER BY cumulative_rank ASC';

    const sql = `
      SELECT role, name, works_count, bayesian_rating, career_cumulative_z,
             rating_rank, cumulative_rank, rating_tier, cumulative_tier,
             best_work_title, best_work_year, best_work_z, top_character
      FROM leaderboards ${whereClause} ${orderClause} LIMIT ? OFFSET ?
    `;
    args.push(limit, offset);

    const res = db.exec(sql, args);
    const list: LeaderboardItem[] = [];
    if (res.length > 0) {
      for (const row of res[0].values) {
        const bwTitle = row[9] ? String(row[9]) : null;
        list.push({
          role: String(row[0]),
          name: String(row[1]),
          worksCount: Number(row[2]),
          rating: Number(row[3]),
          cumulativeZ: Number(row[4]),
          ratingRank: Number(row[5]),
          cumulativeRank: Number(row[6]),
          ratingTier: String(row[7]),
          cumulativeTier: String(row[8]),
          bestWorkTitle: bwTitle,
          bestWorkTitleEn: bwTitle ? titleToEnMap[bwTitle] || null : null,
          bestWorkYear: row[10] ? Number(row[10]) : null,
          bestWorkZ: row[11] !== null ? Number(row[11]) : null,
          topCharacter: row[12] ? String(row[12]) : null
        });
      }
    }
    return [...matchedStudios, ...list];
  },

  getLeaderboardCount(role: string = 'all', query: string = ''): number {
    const db = getDatabase();
    if (role === 'studio') {
      try {
        const conditions: string[] = [];
        const args: any[] = [];
        if (query.trim()) {
          const qNorm = normalizeText(query.trim());
          const hasLatin = /[a-zA-Z]/.test(query);
          const matchedStudios = hasLatin ? StaffNameResolver.searchStudiosByRomaji(query.trim()) : [];
          if (matchedStudios.length > 0) {
            const ph = matchedStudios.map(() => '?').join(',');
            conditions.push(`(name_norm LIKE ? OR name IN (${ph}))`);
            args.push(`%${qNorm}%`, ...matchedStudios);
          } else {
            conditions.push('name_norm LIKE ?');
            args.push(`%${qNorm}%`);
          }
        }
        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const sql = `SELECT count(*) FROM studios ${whereClause}`;
        const res = db.exec(sql, args);
        return res.length > 0 && res[0].values.length > 0 ? Number(res[0].values[0][0]) : 0;
      } catch (e) {
        console.error('Failed to count studios:', e);
        return 0;
      }
    }


    const conditions: string[] = ['role = ?'];
    const args: any[] = [role];

    if (query.trim()) {
      const qNorm = normalizeText(query.trim());
      const hasLatin = /[a-zA-Z]/.test(query);
      const matchedKanji = hasLatin ? StaffNameResolver.searchKanjiByRomaji(query.trim(), 100) : [];
      if (matchedKanji.length > 0) {
        const ph = matchedKanji.map(() => '?').join(',');
        conditions.push(`(name_norm LIKE ? OR name IN (${ph}))`);
        args.push(`%${qNorm}%`, ...matchedKanji);
      } else {
        conditions.push('name_norm LIKE ?');
        args.push(`%${qNorm}%`);
      }
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const sql = `SELECT count(*) FROM leaderboards ${whereClause}`;
    const res = db.exec(sql, args);
    return res.length > 0 && res[0].values.length > 0 ? Number(res[0].values[0][0]) : 0;
  },

  getStaffProfile(staffName: string): StaffProfile {
    const db = getDatabase();
    const [workIdToEnMap] = getWorkTitleEnMaps();

    const sql = `
      SELECT p.name, p.primary_role, p.total_works, p.bayesian_rating,
             COALESCE(l.rating_tier, p.overall_rating_tier),
             COALESCE(l.rating_rank, p.overall_rank),
             p.career_cumulative_z,
             COALESCE(l.cumulative_tier, p.overall_cum_tier),
             COALESCE(l.cumulative_rank, p.cumulative_rank),
             p.all_role_stats_json,
             p.career_trajectory_json
      FROM profiles p
      LEFT JOIN leaderboards l ON l.role = 'all' AND l.name = p.name
      WHERE p.name = ? LIMIT 1
    `;
    const res = db.exec(sql, [staffName]);
    if (res.length > 0 && res[0].values.length > 0) {
      try {
        const row = res[0].values[0];
        const rawRoleStats: any[] = JSON.parse(String(row[9] || '[]'));
        const roleStats: RoleStat[] = rawRoleStats.map(r => ({
          role: String(r.role || ''),
          works_count: Number(r.works_count ?? 0),
          bayesian_rating: Number(r.bayesian_rating ?? 0),
          career_cumulative_z: Number(r.career_cumulative_z ?? r.cumulative_z ?? 0),
          rating_rank: Number(r.rating_rank ?? 0),
          cumulative_rank: Number(r.cumulative_rank ?? 0),
          role_total: Number(r.role_total ?? 1000),
          rating_tier: String(r.rating_tier || 'B'),
          cum_tier: String(r.cum_tier || r.cumulative_tier || 'B')
        }));
        const rawTrajectory: CareerTrajectoryItem[] = JSON.parse(String(row[10] || '[]'));
        const trajectory = rawTrajectory.map(item => ({
          ...item,
          work_title_en: workIdToEnMap[item.work_id] || null
        }));
        const bestWorks: BestWork[] = [...trajectory]
          .sort((a, b) => b.z_score - a.z_score)
          .slice(0, 5)
          .map(it => ({
            work_title: it.work_title,
            work_id: it.work_id,
            year: it.year,
            role: it.role,
            z_score: it.z_score,
            work_title_en: it.work_title_en
          }));

        return {
          name: String(row[0] || staffName),
          primaryRole: String(row[1] || 'cv'),
          totalWorks: Number(row[2] ?? trajectory.length),
          bayesianRating: Number(row[3] ?? 0),
          overallRatingTier: String(row[4] || 'B'),
          overallRank: Number(row[5] ?? 99999),
          careerCumulativeZ: Number(row[6] ?? 0),
          overallCumTier: String(row[7] || 'B'),
          cumulativeRank: Number(row[8] ?? 99999),
          allRoleStats: roleStats,
          bestWorks,
          careerTrajectory: trajectory,
          isFallback: false
        };
      } catch (e) {
        console.warn('Error parsing staff profile, fallback to dynamic generation:', e);
      }
    }
    return this.generateFallbackProfile(staffName);
  },

  generateFallbackProfile(staffName: string): StaffProfile {
    const db = getDatabase();
    const [workIdToEnMap] = getWorkTitleEnMaps();

    const lbRes = db.exec(`
      SELECT role, works_count, bayesian_rating, career_cumulative_z,
             rating_rank, cumulative_rank, rating_tier, cumulative_tier
      FROM leaderboards WHERE name = ?
    `, [staffName]);

    let allItem: RoleStat | null = null;
    const roleStats: RoleStat[] = [];
    let primaryRole = 'cv';
    let maxWorks = 0;

    if (lbRes.length > 0) {
      for (const row of lbRes[0].values) {
        const role = String(row[0]);
        const w = Number(row[1]);
        const r = Number(row[2]);
        const z = Number(row[3]);
        const rk = Number(row[4]);
        const ck = Number(row[5]);
        const rt = String(row[6]);
        const ct = String(row[7]);

        const stat: RoleStat = {
          role,
          works_count: w,
          bayesian_rating: r,
          career_cumulative_z: z,
          rating_rank: rk,
          cumulative_rank: ck,
          role_total: 1000,
          rating_tier: rt,
          cum_tier: ct
        };
        if (role === 'all') {
          allItem = stat;
        } else {
          roleStats.push(stat);
          if (w > maxWorks) {
            maxWorks = w;
            primaryRole = role;
          }
        }
      }
    }

    const nameNorm = normalizeText(staffName);
    const wRes = db.exec(`
      SELECT work_id, title, title_en, year, true_z_score, staff_json, characters_json
      FROM works WHERE search_text_norm LIKE ? ORDER BY year ASC
    `, [`%${nameNorm}%`]);

    const trajectory: CareerTrajectoryItem[] = [];
    if (wRes.length > 0) {
      for (const row of wRes[0].values) {
        const staffJson = String(row[5] || '{}');
        const charJson = String(row[6] || '[]');

        // 高速化: JSON 文字列内に直接名前が含まれていない場合はパースをスキップ
        const hasNameRaw = staffJson.includes(staffName) || charJson.includes(staffName);
        if (!hasNameRaw) {
          // 正規化比較が必要な場合も、両方のJSONに検索文字の核が全く含まれていなければスキップ
          if (!staffJson.includes(nameNorm) && !charJson.includes(nameNorm)) {
            continue;
          }
        }

        const wid = String(row[0]);
        const title = String(row[1]);
        const titleEn = row[2] ? String(row[2]) : null;
        const year = Number(row[3]);
        const zScore = Number(row[4]);

        let assignedRole = primaryRole;
        let charName: string | null = null;
        let charRel: string | null = null;
        let isFound = false;

        const chars = parseCharacters(charJson);
        const matchedChar = chars.find(c => c.actorName === staffName || normalizeText(c.actorName) === nameNorm);
        if (matchedChar) {
          assignedRole = 'cv';
          charName = matchedChar.characterName;
          charRel = matchedChar.relation;
          isFound = true;
        } else {
          const staff = parseStaffCredits(staffJson);
          for (const [rKey, members] of Object.entries(staff)) {
            if (members.some(m => m.name === staffName || normalizeText(m.name) === nameNorm)) {
              assignedRole = rKey;
              isFound = true;
              break;
            }
          }
        }

        if (!isFound) {
          continue;
        }

        trajectory.push({
          year,
          work_title: title,
          work_id: wid,
          role: assignedRole,
          z_score: zScore,
          character_name: charName,
          character_relation: charRel,
          work_title_en: titleEn || workIdToEnMap[wid] || null
        });

        if (trajectory.length >= 600) break; // 上限ガード
      }
    }

    const bestWorks: BestWork[] = [...trajectory]
      .sort((a, b) => b.z_score - a.z_score)
      .slice(0, 5)
      .map(it => ({
        work_title: it.work_title,
        work_id: it.work_id,
        year: it.year,
        role: it.role,
        z_score: it.z_score,
        work_title_en: it.work_title_en
      }));

    return {
      name: staffName,
      primaryRole,
      totalWorks: allItem?.works_count || trajectory.length,
      bayesianRating: allItem?.bayesian_rating || 0.0,
      overallRatingTier: allItem?.rating_tier || 'B',
      overallRank: allItem?.rating_rank || 99999,
      careerCumulativeZ: allItem?.career_cumulative_z || trajectory.reduce((acc, it) => acc + it.z_score, 0),
      overallCumTier: allItem?.cum_tier || 'B',
      cumulativeRank: allItem?.cumulative_rank || 99999,
      allRoleStats: roleStats,
      bestWorks,
      careerTrajectory: trajectory,
      isFallback: true
    };
  },

  getStudioWorks(studioName: string): StudioWorkItem[] {
    try {
      const db = getDatabase();
      const [workIdToEnMap] = getWorkTitleEnMaps();

      const sql = `
        SELECT work_id, title, year, deviation_score, tier
        FROM studio_works WHERE studio_name = ? ORDER BY year DESC
      `;
      const res = db.exec(sql, [studioName]);
      const list: StudioWorkItem[] = [];
      if (res.length > 0) {
        for (const row of res[0].values) {
          const wid = String(row[0]);
          list.push({
            workId: wid,
            title: String(row[1]),
            year: Number(row[2]),
            deviationScore: Number(row[3]),
            tier: String(row[4]),
            titleEn: workIdToEnMap[wid] || null
          });
        }
      }
      return list;
    } catch (e) {
      console.error('Failed to get studio works:', e);
      return [];
    }
  },


  getStaffCandidates(role: string, query: string, limit: number = 20): StaffCandidate[] {
    const db = getDatabase();
    const qNorm = normalizeText(query.trim());
    const roleKey = role === 'all' ? 'all' : role;
    const hasLatin = /[a-zA-Z]/.test(query);
    const matchedKanji = hasLatin ? StaffNameResolver.searchKanjiByRomaji(query.trim(), 50) : [];

    const conditions: string[] = ['role = ?'];
    const args: any[] = [roleKey];

    if (matchedKanji.length > 0) {
      const ph = matchedKanji.map(() => '?').join(',');
      conditions.push(`(name_norm LIKE ? OR name IN (${ph}))`);
      args.push(`%${qNorm}%`, ...matchedKanji);
    } else {
      conditions.push('name_norm LIKE ?');
      args.push(`%${qNorm}%`);
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const sql = `
      SELECT name, role, works_count, rating_tier, cumulative_tier, top_character
      FROM leaderboards ${whereClause} ORDER BY rating_rank ASC LIMIT ?
    `;
    args.push(limit);

    const res = db.exec(sql, args);
    const list: StaffCandidate[] = [];
    if (res.length > 0) {
      for (const row of res[0].values) {
        list.push({
          name: String(row[0]),
          role: String(row[1]),
          worksCount: Number(row[2]),
          ratingTier: String(row[3]),
          cumulativeTier: String(row[4]),
          topCharacter: row[5] ? String(row[5]) : null
        });
      }
    }
    return list;
  }
};
