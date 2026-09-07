/**
 * 数理解説ガイド画面 (Android版 GuideScreen.kt に完全準拠)
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
              ? 'CreditDB curates public ratings into three core metrics: Standard Score (Deviation), Raw Score (AniList), and Quality Tier, allowing intuitive understanding of each work’s relative standing.'
              : 'CreditDB では、誰でも直感的に作品の評価を把握できるよう、公開指標を「偏差値」「AniList素点」「Tier」の3点に厳選して表示しています。'}
          </p>

          {/* 偏差値カード */}
          <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/40 space-y-2">
            <div className="font-bold text-primary text-xs">
              {isEn ? '📊 Standard Score (Era-Relative Quality)' : '📊 偏差値（年代相対クオリティ）'}
            </div>
            <p>
              {isEn
                ? 'Measures how prominently a title stood out among anime released in the same era, standardized to a mean of 50.0 and standard deviation of 10.0 using statistical Z-scores.'
                : '「その作品が公開された年代のアニメ群の中で、どれだけ突出して評価されたか」を、統計的な標準偏差単位で算出し、平均を 50.0、標準偏差を 10.0 に規格化した指標です。'}
            </p>
            <div className="p-2 rounded-lg bg-surfaceVariant/60 font-mono text-center text-[11px] font-bold text-onSurface">
              偏差値 = 50.0 + 10.0 × Z_i
            </div>
            <p className="text-[10px] text-onSurfaceVariant/80">
              {isEn
                ? '※ Since Z_i eliminates inflation and deflation across eras, 1980s classics and 2020s hits can be compared fairly side-by-side.'
                : '※ 年代ごとのインフレ・デフレが完全に補正されているため、1980年代の名作も2020年代の話題作も公平に横並び比較できます。'}
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
              {isEn ? 'Two-Stage Normalization (Zi)' : '年代補正Z値（Z_i）の二段階数理モデル'}
            </h3>
          </div>

          <p>
            {isEn
              ? 'Raw review scores contain severe systematic biases: modern internet score inflation and reviewer self-selection biases. CreditDB solves this with a two-stage mathematical pipeline.'
              : 'ネット上のレビュー点数には、「近年のインフレ傾向」「熱心なファンしか投票しないマイナー作のバイアス」が存在します。CreditDB は二段階の数理モデルでこれらを完全に除去しています。'}
          </p>

          <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/40 space-y-2">
            <div className="font-bold text-primary text-xs">
              {isEn ? 'Step 1: Item-User Bias ALS Decomposition' : '第1段階: ユーザー・作品バイアス分解 (ALS)'}
            </div>
            <p>
              {isEn
                ? 'Decomposes raw ratings into global mean, reviewer optimism bias (c_u), and intrinsic work quality (b_i).'
                : '観測されたスコアを全体平均、ユーザーの甘口・辛口バイアス、作品本来の実力クオリティ（b_i）に交互最小二乗法（ALS）で分解します。'}
            </p>
            <div className="p-2 rounded-lg bg-surfaceVariant/60 font-mono text-center text-[11px] font-bold text-onSurface">
              r_ui = μ + c_u + b_i + ε_ui
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/40 space-y-2">
            <div className="font-bold text-primary text-xs">
              {isEn ? 'Step 2: Local Moving-Window Standardization' : '第2段階: 年代局所移動窓による標準化 (Z_i)'}
            </div>
            <p>
              {isEn
                ? 'Standardizes b_i using rolling mean and standard deviation over release eras, yielding scale-free, comparable Z-scores.'
                : '各公開年の前後を含む移動窓を用いて、年代ごとの期待値とバラつきを標準偏差単位へ変換し、時代を超越して比較可能な真のZ値（Z_i）を算出します。'}
            </p>
            <div className="p-2 rounded-lg bg-surfaceVariant/60 font-mono text-center text-[11px] font-bold text-onSurface">
              Z_i = (b_i − μ_era) / σ_era
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 第3章: 制作陣・声優の能力評価モデル */}
        {/* ========================================== */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-outlineVariant/40 pb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-onPrimary font-bold text-xs">
              3
            </span>
            <h3 className="text-sm font-bold text-onSurface">
              {isEn ? 'Creator & Cast Evaluation Model' : '制作陣・声優の能力評価モデル'}
            </h3>
          </div>

          <p>
            {isEn
              ? 'Measures creator capability through two complementary dual axes: Empirical Power Score S(a) and Lifetime Career Contribution ΣZ.'
              : 'クリエイターの能力は、「1作あたりの平均的なクオリティの高さ（総合実力）」と「長年のキャリアを通じた通算の貢献総量（生涯累積実績）」の2軸で多角的に評価されます。'}
          </p>

          <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/40 space-y-2">
            <div className="font-bold text-primary text-xs">
              {isEn ? '🎯 Power Score S(a) (Empirical Bayesian Shrinkage)' : '🎯 総合実力 S(a)（経験的ベイズ平滑化）'}
            </div>
            <p>
              {isEn
                ? 'Applies empirical Bayesian shrinkage to prevent lucky 1-hit creators from dominating rankings while honoring consistent high performance.'
                : '参加本数が少ないクリエイターの上振れ・下振れを防ぐため、部門ごとの事前分布中央値へ平滑化し、安定して傑作を生み出し続ける真の実力を測定します。'}
            </p>
            <div className="p-2 rounded-lg bg-surfaceVariant/60 font-mono text-center text-[11px] font-bold text-onSurface">
              S(a) = (n × Z_mean + m_role × Z_prior) / (n + m_role)
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surfaceContainer border border-outlineVariant/40 space-y-2">
            <div className="font-bold text-primary text-xs">
              {isEn ? '🏛️ Career Cumulative ΣZ (Total Era Impact)' : '🏛️ 生涯累積実績 ΣZ（通算キャリア貢献量）'}
            </div>
            <p>
              {isEn
                ? 'Sum of all positive era-adjusted contributions across a career, honoring industry veterans who built the anime landscape.'
                : '長年アニメ業界を支え続け、無数の作品で確かなクオリティを刻み込んできたベテランや大功労者を讃えるための生涯通算指標です。'}
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
