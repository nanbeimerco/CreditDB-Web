/**
 * 多言語対訳リソース (Android版 AppStrings.kt に完全準拠)
 */

export const AppStrings = {
  // ナビゲーション (Predict は除外)
  navWorks: 'Works',
  navStaff: 'Creators',
  navTier: 'Tier List',
  navScene: 'Scene',
  navGuide: 'Guide',

  // シーン特定
  sceneTitle: 'シーン特定',
  sceneTitleEn: 'Anime Scene Search',
  sceneSubtitle: 'スクリーンショットからアニメのタイトル・話数・タイムスタンプを特定',
  sceneSubtitleEn: 'Identify anime title, episode & timestamp from screenshot',
  sceneDropzone: '画像をここにドラッグ＆ドロップ',
  sceneDropzoneEn: 'Drag & drop anime screenshot here',
  scenePasteHint: 'または Ctrl + V でクリップボードから貼り付け',
  scenePasteHintEn: 'or press Ctrl + V to paste from clipboard',
  sceneSelectFile: '画像ファイルを選択',
  sceneSelectFileEn: 'Select Image File',
  sceneSearching: 'trace.moe でアニメシーンを照合中...',
  sceneSearchingEn: 'Searching anime scene via trace.moe...',
  sceneEpisode: '話数',
  sceneEpisodeEn: 'Episode',
  sceneTime: '再生位置',
  sceneTimeEn: 'Timestamp',
  sceneSimilarity: '一致度',
  sceneSimilarityEn: 'Similarity',
  sceneViewDetails: '作品詳細へ移動',
  sceneViewDetailsEn: 'View Work Details',

  // 検索
  searchPlaceholder: '作品名・英語名・制作陣・声優名で検索...',
  searchPlaceholderEn: 'Search titles, staff, cast in English/Romaji/JP...',

  // 役職フルネーム
  roleFull(roleKey: string, isEn: boolean): string {
    if (!isEn) {
      switch (roleKey) {
        case 'all': return '全役職';
        case 'director': return '監督';
        case 'series_comp': return 'シリーズ構成 / 脚本';
        case 'char_design': return 'キャラクターデザイン';
        case 'sakkan': return '作画監督';
        case 'genga': return '原画';
        case 'unit_director': return '演出 / 副監督';
        case 'music': return '音楽';
        case 'art_dir': return '美術監督';
        case 'cv': return '声優 / キャスト';
        case 'studio': return '制作スタジオ';
        default: return roleKey;
      }
    } else {
      switch (roleKey) {
        case 'all': return 'All Roles';
        case 'director': return 'Director';
        case 'series_comp': return 'Series Composition / Screenplay';
        case 'char_design': return 'Character Design';
        case 'sakkan': return 'Chief Animation Director / Sakkan';
        case 'genga': return 'Key Animation (Genga)';
        case 'unit_director': return 'Unit Director / Assistant Director';
        case 'music': return 'Music / Soundtrack';
        case 'art_dir': return 'Art Director';
        case 'cv': return 'Voice Cast / CV';
        case 'studio': return 'Animation Studio';
        default: return roleKey;
      }
    }
  },

  // 役職コンパクト名
  roleCompact(roleKey: string, isEn: boolean): string {
    if (!isEn) {
      switch (roleKey) {
        case 'all': return '全体';
        case 'director': return '監督';
        case 'series_comp': return '構成/脚本';
        case 'char_design': return 'キャラデザ';
        case 'sakkan': return '作監';
        case 'genga': return '原画';
        case 'unit_director': return '演出/副監督';
        case 'music': return '音楽';
        case 'art_dir': return '美術監督';
        case 'cv': return '声優';
        case 'studio': return 'スタジオ';
        default: return roleKey;
      }
    } else {
      switch (roleKey) {
        case 'all': return 'All';
        case 'director': return 'Director';
        case 'series_comp': return 'Script';
        case 'char_design': return 'Ch. Design';
        case 'sakkan': return 'Animation';
        case 'genga': return 'Key Anim';
        case 'unit_director': return 'Episode Dir';
        case 'music': return 'Music';
        case 'art_dir': return 'Art Dir';
        case 'cv': return 'Cast';
        case 'studio': return 'Studio';
        default: return roleKey;
      }
    }
  },

  // ソートオプション表示名
  sortDisplayName(opt: string, isEn: boolean): string {
    if (!isEn) {
      switch (opt) {
        case 'DEVIATION_DESC': return '偏差値 (高い順)';
        case 'DEVIATION_ASC': return '偏差値 (低い順)';
        case 'RAW_DESC': return 'AniList素点 (高い順)';
        case 'RAW_ASC': return 'AniList素点 (低い順)';
        case 'PRED_DESC': return '予測スコア (高い順)';
        case 'RESIDUAL_DESC': return '残差 (期待値以上順)';
        case 'RESIDUAL_ASC': return '残差 (ポテンシャル未達順)';
        case 'YEAR_DESC': return '公開年 (新しい順)';
        case 'YEAR_ASC': return '公開年 (古い順)';
        case 'TITLE_ASC': return '作品名 (五十音順)';
        default: return opt;
      }
    } else {
      switch (opt) {
        case 'DEVIATION_DESC': return 'Deviation (High-Low)';
        case 'DEVIATION_ASC': return 'Deviation (Low-High)';
        case 'RAW_DESC': return 'AniList Raw (High-Low)';
        case 'RAW_ASC': return 'AniList Raw (Low-High)';
        case 'PRED_DESC': return 'Predicted (High-Low)';
        case 'RESIDUAL_DESC': return 'Residual (Surprise)';
        case 'RESIDUAL_ASC': return 'Residual (Underperform)';
        case 'YEAR_DESC': return 'Year (Newest)';
        case 'YEAR_ASC': return 'Year (Oldest)';
        case 'TITLE_ASC': return 'Title (A-Z)';
        default: return opt;
      }
    }
  },

  staffSortDisplayName(opt: string, isEn: boolean): string {
    if (!isEn) {
      switch (opt) {
        case 'RATING': return '実力スコア順 S(a)';
        case 'CUMULATIVE': return '生涯累積実績順 ΣZ';
        case 'NEWEST_DEBUT': return '初参加年 (新しい順)';
        case 'OLDEST_DEBUT': return '初参加年 (古い順)';
        case 'WORKS_COUNT': return '参加作品数 (多い順)';
        default: return opt;
      }
    } else {
      switch (opt) {
        case 'RATING': return 'Skill Rating S(a)';
        case 'CUMULATIVE': return 'Cumulative ΣZ';
        case 'NEWEST_DEBUT': return 'Debut Year (Newest)';
        case 'OLDEST_DEBUT': return 'Debut Year (Oldest)';
        case 'WORKS_COUNT': return 'Works Count (High-Low)';
        default: return opt;
      }
    }
  },

  debutEraLabel(filter: string, isEn: boolean): string {
    if (!isEn) {
      switch (filter) {
        case 'all': return '全年代';
        case '2020s': return '2020年代〜';
        case '2015_2019': return '2015〜2019年';
        case '2010s': return '2010年代';
        case '2000s': return '2000年代';
        case 'pre2000': return '1990年代以前';
        default: return filter;
      }
    } else {
      switch (filter) {
        case 'all': return 'All Eras';
        case '2020s': return '2020s~';
        case '2015_2019': return '2015–2019';
        case '2010s': return '2010s';
        case '2000s': return '2000s';
        case 'pre2000': return 'Pre-2000s';
        default: return filter;
      }
    }
  },

  // --- 評価判定 (Full & Compact) ---
  verdictFull(verdict: string, isEn: boolean): string {
    if (isEn) {
      if (verdict.includes("サプライズ")) return "★ Exceeded Expectations (Surprise)";
      if (verdict.includes("期待外れ")) return "▲ Underperformed";
      return "● As Expected";
    }
    return verdict;
  },

  verdictCompact(verdict: string, isEn: boolean): string {
    if (isEn) {
      if (verdict.includes("サプライズ")) return "★ Surprise";
      if (verdict.includes("期待外れ")) return "▲ Below";
      return "● Normal";
    } else {
      if (verdict.includes("サプライズ")) return "★ サプライズ名作";
      if (verdict.includes("期待外れ")) return "▲ 期待外れ";
      return "● 前評判通り";
    }
  },

  // --- Tier表機能 ---
  tierScreenTitle(isEn: boolean) { return isEn ? "Tier List" : "Tier表"; },
  tierScreenSubtitle(isEn: boolean) {
    return isEn
      ? "Rank your anime, analyze creator taste, and diagnose aesthetic correlation."
      : "作品を自由にドラッグ配置。スタッフ好みの集計や数理指標との相関診断を実行。";
  },

  tierAddAnime(isEn: boolean) { return isEn ? "Add Anime" : "作品追加"; },
  tierStaffAnalysis(isEn: boolean) { return isEn ? "Staff Affinity" : "スタッフ分析"; },
  tierCorrelationAnalysis(isEn: boolean) { return isEn ? "Taste Diagnosis" : "相関・診断"; },
  tierEditRows(isEn: boolean) { return isEn ? "Edit Tiers" : "Tier編集"; },
  tierExport(isEn: boolean) { return isEn ? "Export / Share" : "出力・保存"; },

  tierSearchPlaceholder(isEn: boolean) {
    return isEn ? "Search anime to add to Tier list..." : "追加する作品を検索（ローマ字・日本語・英語対応）...";
  },
  tierSearchEmpty(isEn: boolean) { return isEn ? "No anime found" : "該当する作品が見つかりません"; },
  tierAddToTier(isEn: boolean, tierName: string) {
    return isEn ? `Add to ${tierName}` : `${tierName} に追加`;
  },

  tierMoveTo(isEn: boolean) { return isEn ? "Move to Tier..." : "Tierを移動..."; },
  tierRemoveFromList(isEn: boolean) { return isEn ? "Remove from Tier list" : "Tier表から削除"; },
  tierTapToViewDetails(isEn: boolean) { return isEn ? "Tap to view details" : "タップで作品詳細を表示"; },
  tierEmptyRowHint(isEn: boolean) { return isEn ? "No anime in this Tier yet" : "このTierに作品はまだありません"; },

  tierResetDefault(isEn: boolean) { return isEn ? "Reset to Default Tiers" : "デフォルトのTier構成に戻す"; },
  tierClearAll(isEn: boolean) { return isEn ? "Clear All Anime" : "すべての作品をクリア"; },
  tierAddRow(isEn: boolean) { return isEn ? "Add Tier Row" : "新規Tier行を追加"; },
  tierDeleteRow(isEn: boolean) { return isEn ? "Delete This Tier" : "このTier行を削除"; },
  tierRowName(isEn: boolean) { return isEn ? "Tier Name" : "Tier名"; },
  tierRowColor(isEn: boolean) { return isEn ? "Color Accent" : "ラベルカラー"; },
  tierMoveUp(isEn: boolean) { return isEn ? "Move Up" : "上に移動"; },
  tierMoveDown(isEn: boolean) { return isEn ? "Move Down" : "下に移動"; },

  tierExportImage(isEn: boolean) { return isEn ? "Save High-Res Image (PNG)" : "高画質画像として保存 (PNG)"; },
  tierExportImageDesc(isEn: boolean) { return isEn ? "Save the entire Tier board to gallery." : "現在のTier表全体を画像として端末に保存します。"; },
  tierExportMarkdownCopy(isEn: boolean) { return isEn ? "Copy AI Analysis Markdown" : "AI分析用Markdownをコピー"; },
  tierExportMarkdownCopyDesc(isEn: boolean) {
    return isEn
      ? "Ready to paste into ChatGPT, Claude, or Gemini with mathematical definitions."
      : "偏差値等の数理定義付き。ChatGPT / Claude / Gemini にそのまま貼り付けて深層分析。";
  },
  tierExportMarkdownShare(isEn: boolean) { return isEn ? "Share / Download Markdown (.md)" : "Markdownファイルを共有 / 保存"; },

  tierAffinityTitle(isEn: boolean) { return isEn ? "Favorite Staff & Studio Analysis" : "スタッフ・制作会社 好み分析"; },
  tierAffinitySubtitle(isEn: boolean) {
    return isEn
      ? "Calculated from your Tier placements (weighted by Tier ranking)"
      : "Tier表の配置ランクを重み付けして、あなたの真の好みを部門別・総合で集計";
  },

  tierCorrelationTitle(isEn: boolean) { return isEn ? "Taste & Mathematical Correlation" : "数理指標・感性相関診断"; },
  tierCorrelationSubtitle(isEn: boolean) {
    return isEn
      ? "Spearman rank correlation with CreditDB era-adjusted deviation score"
      : "CreditDBの年代補正済み偏差値と、あなたの主観Tier評価との相関係数";
  },

  // 配役
  relationFull(relation: string, isEn: boolean): string {
    if (!isEn) return relation;
    switch (relation) {
      case '主役':
      case '主角': return 'Main Role';
      case '脇役':
      case '配角': return 'Supporting Role';
      case '客演':
      case '客串': return 'Guest Role';
      default: return relation;
    }
  }
};
