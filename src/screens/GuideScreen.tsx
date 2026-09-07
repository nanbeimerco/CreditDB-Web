/**
 * 数理解説ガイド画面 (誠実・客観的かつ敬意ある表現に推敲済み)
 */
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { LanguageManager } from '../theme/languageManager';
import { TierThemeMap } from '../theme/tierTheme';

interface GuideScreenProps {
  onBack?: () => void;
  onBackClick?: () => void;
}

export const GuideScreen: React.FC<GuideScreenProps> = (props) => {
  const onBackClick = props.onBackClick || props.onBack || (() => {});
  const isEn = LanguageManager.isEnglish;

  return (
    <div className="flex flex-col h-full bg-background select-none overflow-y-auto">
      {/* TopBar */}
      <header className="sticky top-0 z-20 flex items-center h-14 px-3 bg-background/95 backdrop-blur border-b border-outlineVariant/30">
        <button
          onClick={onBackClick}
          className="p-2 rounded-full text-onSurfaceVariant hover:text-onSurface hover:bg-surfaceVariant/40 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-base text-onSurface ml-2">
          {isEn ? 'Mathematical Guide' : '数理解説ガイド'}
        </h2>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto w-full pb-20 text-xs text-onSurfaceVariant leading-relaxed">
        {/* ========================================== */}
        {/* 第1章: アニメ作品の評価指標について */}
        {/* ========================================== */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-outlineVariant/40 pb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-onPrimary font-bold text-xs">
              1
            </span>
            <h3 className="text-sm font-bold text-onSurface">
              {isEn ? 'Anime Evaluation Metrics' : 'アニメ作品の評価指標について'}
            </h3>
          </div>

          <p>
            {isEn
              ? 'CreditDB organizes public audience ratings into three core metrics: Standard Score (Deviation), Raw Score (AniList), and Quality Tier, helping users intuitively grasp each work’s relative standing.'
              : 'CreditDB では、作品の評価傾向を直感的に把握できるよう、公開指標を「偏差値」「AniList素点」「Tier」の3点に整理して表示しています。'}
          </p>

          {/* 偏差値カード */}
          <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/40 space-y-2">
            <div className="font-bold text-primary text-xs">
              {isEn ? '📊 Standard Score (Era-Relative Benchmark)' : '📊 偏差値（年代相対スコア）'}
            </div>
            <p>
              {isEn
                ? 'Measures where a title was situated among anime released around the same era, standardized to a mean of 50.0 and standard deviation of 10.0 using statistical Z-scores.'
                : '「その作品が公開された年代のアニメ作品群の中で、どのような相対的評価位置にあったか」を統計的な標準偏差単位で算出し、平均 50.0、標準偏差 10.0 に標準化した指標です。'}
            </p>
            <div className="p-2 rounded-lg bg-surfaceVariant/60 font-mono text-center text-[11px] font-bold text-onSurface">
              偏差値 = 50.0 + 10.0 × Z_i
            </div>
            <p className="text-[10px] text-onSurfaceVariant/80">
              {isEn
                ? '※ By adjusting for era-specific score distributions, works from different decades can be referenced on a consistent relative benchmark.'
                : '※ 年代ごとのスコア分布（インフレ・デフレ傾向）を平準化しているため、公開時期が異なる作品同士でも相対的な評価水準を比較しやすくなっています。'}
            </p>
          </div>

          {/* AniList素点カード */}
          <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/40 space-y-2">
            <div className="font-bold text-secondary text-xs">
              {isEn ? '🌐 AniList Raw Score (Global User Reviews)' : '🌐 AniList素点（全世界レビュー実績）'}
            </div>
            <p>
              {isEn
                ? 'The weighted average rating (out of 100) submitted by anime fans across the globe on AniList.'
                : '全世界のアニメデータベース AniList に投稿されたユーザーレビューの加重平均点（100点満点）です。'}
            </p>
          </div>

          {/* Tier判定基準表 */}
          <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/40 space-y-2.5">
            <div className="font-bold text-onSurface text-xs">
              {isEn ? '🏆 Quality Tier Classification' : '🏆 クオリティTier判定基準表'}
            </div>
            <div className="space-y-1.5">
              {Object.entries(TierThemeMap).map(([tKey, spec]) => (
                <div key={tKey} className="flex items-start gap-2 p-2 rounded-xl bg-surface border border-outlineVariant/20">
                  <span
                    className="font-black text-xs font-mono px-2 py-0.5 rounded border"
                    style={{ color: spec.onContainerColor, backgroundColor: spec.containerColor, borderColor: spec.borderColor }}
                  >
                    {tKey}
                  </span>
                  <p className="text-[11px] leading-tight text-onSurfaceVariant">
                    {isEn ? spec.descriptionEn : spec.descriptionJa}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 第2章: 年代補正Z値（Zi）の二段階数理モデル */}
        {/* ========================================== */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-outlineVariant/40 pb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-onPrimary font-bold text-xs">
              2
            </span>
            <h3 className="text-sm font-bold text-onSurface">
              {isEn ? 'Two-Stage Normalization Model (Zi)' : '年代補正Z値（Z_i）の二段階数理モデル'}
            </h3>
          </div>

          <p>
            {isEn
              ? 'Raw review scores often reflect systematic factors such as era-dependent score inflation and reviewer selection tendencies. CreditDB applies a two-stage statistical approach to adjust for and mitigate these variances.'
              : 'ネット上のレビュー点数には、「近年のスコアインフレ傾向」や「作品ごとの投票者層の偏り（選択バイアス）」などの系統的な影響が含まれがちです。CreditDB では二段階の数理処理を適用することで、これらの偏りを統計的に緩和・調整しています。'}
          </p>

          <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/40 space-y-2">
            <div className="font-bold text-primary text-xs">
              {isEn ? 'Step 1: Item-User Bias Decomposition (ALS)' : '第1段階: ユーザー・作品バイアス分解 (ALS)'}
            </div>
            <p>
              {isEn
                ? 'Decomposes observed ratings into a global mean, reviewer rating tendencies (c_u), and work-specific rating components (b_i) using Alternating Least Squares (ALS).'
                : '観測されたスコアから、全体のベース水準やレビュアーごとの採点傾向（甘口・辛口バイアス c_u）を分離し、作品固有の評価成分（b_i）を交互最小二乗法（ALS）により推計します。'}
            </p>
            <div className="p-2 rounded-lg bg-surfaceVariant/60 font-mono text-center text-[11px] font-bold text-onSurface">
              r_ui = μ + c_u + b_i + ε_ui
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/40 space-y-2">
            <div className="font-bold text-primary text-xs">
              {isEn ? 'Step 2: Local Moving-Window Standardization (Z_i)' : '第2段階: 年代局所移動窓による標準化 (Z_i)'}
            </div>
            <p>
              {isEn
                ? 'Standardizes work components (b_i) against rolling window statistics across release years to yield era-adjusted relative Z-scores (Z_i).'
                : '各公開年の前後を含む移動窓を用いて、年代ごとの平均値とばらつきに基づいて標準化を行い、時代間での相対的な立ち位置を示すZ値（Z_i）を算出します。'}
            </p>
            <div className="p-2 rounded-lg bg-surfaceVariant/60 font-mono text-center text-[11px] font-bold text-onSurface">
              Z_i = (b_i − μ_era) / σ_era
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 第3章: 制作陣・声優のクレジット分析モデル */}
        {/* ========================================== */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-outlineVariant/40 pb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-onPrimary font-bold text-xs">
              3
            </span>
            <h3 className="text-sm font-bold text-onSurface">
              {isEn ? 'Creator & Cast Statistical Metric Model' : '制作陣・声優のクレジット分析モデル'}
            </h3>
          </div>

          <p>
            {isEn
              ? 'Creator and cast profiles are summarized through two complementary statistical perspectives: the Bayesian Rating S(a) reflecting average work reception, and Lifetime Cumulative Impact ΣZ reflecting career breadth.'
              : '制作陣・声優の参加作品における評価傾向や活動実績は、「関与作品における平均的な評価水準（ベイズ推定レーティング）」と「キャリアを通じた通算の参加実績（生涯累積Z値）」の2つの統計的視点から客観的に可視化しています。'}
          </p>

          <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/40 space-y-2">
            <div className="font-bold text-primary text-xs">
              {isEn ? '🎯 Bayesian Rating S(a) (Empirical Bayesian Shrinkage)' : '🎯 ベイズ推定レーティング S(a)（経験的ベイズ平滑化）'}
            </div>
            <p>
              {isEn
                ? 'Applies empirical Bayesian shrinkage to moderate statistical outliers from small sample sizes toward role-specific baselines, providing a stable indicator of average work reception.'
                : '参加作品数が少ない場合の統計的な極端値（少数の作品による過大・過小推計）を抑えるため、担当役職全体の事前分布に向けて平滑化を行い、継続的・安定的な評価水準を客観的に推計する指標です。'}
            </p>
            <div className="p-2 rounded-lg bg-surfaceVariant/60 font-mono text-center text-[11px] font-bold text-onSurface">
              S(a) = (n × Z_mean + m_role × Z_prior) / (n + m_role)
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/40 space-y-2">
            <div className="font-bold text-primary text-xs">
              {isEn ? '🏛️ Career Cumulative Impact ΣZ (Lifetime Credit Volume)' : '🏛️ 生涯累積実績 ΣZ（通算キャリア実績量）'}
            </div>
            <p>
              {isEn
                ? 'Aggregates positive era-adjusted evaluations across a career, reflecting the cumulative volume and reception of credited creative works.'
                : '長年にわたり多数の作品に携わり、アニメーション文化を支えてきた制作陣・声優の活動実績と、関与作品が獲得してきた評価の蓄積を通算値として算出する指標です。'}
            </p>
            <div className="p-2 rounded-lg bg-surfaceVariant/60 font-mono text-center text-[11px] font-bold text-onSurface">
              ΣZ = ∑ max(0, Z_i)
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
