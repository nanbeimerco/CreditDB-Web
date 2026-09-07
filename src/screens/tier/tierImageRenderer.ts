import { TierTableConfig, TierAnimeItem } from '../../types/tier';

export interface TierImageExportOptions {
  scale: number; // 1.0: 1080p, 1.6: 2K, 2.5: 4K
  showTitle: boolean;
  showYear: boolean;
  showDeviationScore: boolean;
  aspectRatio?: '4:3' | 'classic'; // デフォルトは '4:3' 自動最適化
}

export interface TierExportLayout {
  width: number;
  height: number;
  cardsPerLine: number;
  cardWidth: number;
  cardHeight: number;
  cardSpacing: number;
  headerBoxWidth: number;
  margin: number;
  headerHeight: number;
  rowSpacing: number;
  cardStartX: number;
  calculateRowHeight: (itemCount: number) => number;
}

/**
 * 階層数や作品数に応じて、画像全体の比率が 4:3 に最も近づくよう
 * 列数・寸法・キャンバスサイズをシミュレーションして自動決定する
 */
export function calculateOptimalTierLayout(
  config: TierTableConfig,
  s: number,
  mode: '4:3' | 'classic' = '4:3'
): TierExportLayout {
  const margin = Math.round(20 * s);
  const headerHeight = Math.round(56 * s);
  const rowSpacing = Math.round(12 * s);
  const headerBoxWidth = Math.round(118 * s);
  const cardSpacing = Math.round(12 * s);
  const gap = Math.round(16 * s);
  const cardStartX = margin + headerBoxWidth + gap;

  // クラシック固定幅モード (1160px基準)
  if (mode === 'classic') {
    const width = Math.round(1160 * s);
    const cardWidth = Math.round(96 * s);
    const cardHeight = Math.round(132 * s);
    const availableWidthForCards = (width - margin) - cardStartX;
    const cardsPerLine = Math.max(1, Math.floor((availableWidthForCards + cardSpacing) / (cardWidth + cardSpacing)));

    const calculateRowHeight = (itemCount: number): number => {
      if (itemCount === 0) return Math.round(156 * s);
      const lines = Math.floor((itemCount - 1) / cardsPerLine) + 1;
      return Math.round(24 * s + lines * cardHeight + (lines - 1) * cardSpacing);
    };

    const totalRowsHeight = config.rows.reduce((sum, r) => sum + calculateRowHeight(r.items.length), 0);
    const height = Math.max(
      Math.round(400 * s),
      Math.round(headerHeight + totalRowsHeight + (config.rows.length * rowSpacing) + margin + 10 * s)
    );

    return {
      width,
      height,
      cardsPerLine,
      cardWidth,
      cardHeight,
      cardSpacing,
      headerBoxWidth,
      margin,
      headerHeight,
      rowSpacing,
      cardStartX,
      calculateRowHeight
    };
  }

  // 4:3 最適化モード
  const baseCardWidth = Math.round(96 * s);
  const baseCardHeight = Math.round(132 * s);
  const TARGET_RATIO = 4 / 3;

  const maxItemsInRow = Math.max(...config.rows.map(r => r.items.length), 0);
  const rowCount = Math.max(config.rows.length, 1);

  // 走査候補の列数 (4列から最大16列)
  const minCols = Math.max(4, Math.min(maxItemsInRow, 5));
  const maxCols = Math.max(16, maxItemsInRow + 1);

  let bestCols = 8;
  let bestScore = Infinity;
  let bestWidth = Math.round(1160 * s);
  let bestHeight = Math.round(870 * s);

  for (let c = minCols; c <= maxCols; c++) {
    // 列数 c における各行の高さを計算
    let currentRowsHeight = 0;
    for (const r of config.rows) {
      const lines = r.items.length === 0 ? 1 : Math.ceil(r.items.length / c);
      const rh = 24 * s + lines * baseCardHeight + (lines - 1) * cardSpacing;
      currentRowsHeight += rh;
    }

    const h = Math.max(
      Math.round(400 * s),
      Math.round(headerHeight + currentRowsHeight + (rowCount * rowSpacing) + margin + 10 * s)
    );

    // c 枚のカードを並べるために最低限必要な幅
    const minW = Math.round(cardStartX + c * baseCardWidth + (c - 1) * cardSpacing + margin);
    // 4:3 を達成するための理想幅
    const idealW = Math.round(h * TARGET_RATIO);

    // キャンバス幅: 理想幅が最低幅以上であれば理想幅を採用し比率4:3を維持
    const w = Math.max(minW, idealW);
    const ratio = w / h;

    const ratioDiff = Math.abs(ratio - TARGET_RATIO);
    const emptyRatio = Math.max(0, (w - minW) / w);
    // スコア関数: 比率の近さを最優先し、同時に無駄な空き領域が広がりすぎない列数を最適解とする
    const score = ratioDiff * 5 + emptyRatio * 1.8;

    if (score < bestScore) {
      bestScore = score;
      bestCols = c;
      bestWidth = w;
      bestHeight = h;
    }
  }

  const cardWidth = baseCardWidth;
  const cardHeight = baseCardHeight;

  const calculateRowHeight = (itemCount: number): number => {
    if (itemCount === 0) return Math.round(156 * s);
    const lines = Math.floor((itemCount - 1) / bestCols) + 1;
    return Math.round(24 * s + lines * cardHeight + (lines - 1) * cardSpacing);
  };

  return {
    width: bestWidth,
    height: bestHeight,
    cardsPerLine: bestCols,
    cardWidth,
    cardHeight,
    cardSpacing,
    headerBoxWidth,
    margin,
    headerHeight,
    rowSpacing,
    cardStartX,
    calculateRowHeight
  };
}

/**
 * CSS の object-fit: cover と同等の中央クリップ画像描画
 * 画像の元アスペクト比を100%維持し、縦横の潰れや引き伸ばしを根絶する
 */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  if (nw <= 0 || nh <= 0) return;

  const imgRatio = nw / nh;
  const targetRatio = dw / dh;

  let sx = 0;
  let sy = 0;
  let sw = nw;
  let sh = nh;

  if (imgRatio > targetRatio) {
    // 画像が目標枠より横長: 左右を等しくトリミング
    sw = nh * targetRatio;
    sx = (nw - sw) / 2;
  } else {
    // 画像が目標枠より縦長: 上下を等しくトリミング
    sh = nw / targetRatio;
    sy = (nh - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * HTML Canvas 上に Android 版と完全に同一の美しさで Tier 表をレンダリングする
 */
export async function renderTierCanvas(
  config: TierTableConfig,
  isEn: boolean,
  options: TierImageExportOptions
): Promise<HTMLCanvasElement> {
  const s = options.scale;
  const mode = options.aspectRatio || '4:3';
  const layout = calculateOptimalTierLayout(config, s, mode);

  const {
    width,
    height: totalHeight,
    cardsPerLine,
    cardWidth,
    cardHeight,
    cardSpacing,
    headerBoxWidth,
    margin,
    headerHeight,
    rowSpacing,
    cardStartX,
    calculateRowHeight
  } = layout;

  // Gotham 等のフォント読み込み完了を確実に待機
  try {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      await Promise.all([
        document.fonts.load(`bold ${Math.round(24 * s)}px "Gotham"`),
        document.fonts.load(`bold ${Math.round(38 * s)}px "Gotham"`),
        document.fonts.load(`bold ${Math.round(10 * s)}px "Gotham"`),
        document.fonts.load(`bold ${Math.round(9.5 * s)}px "Gotham"`),
        document.fonts.load(`normal ${Math.round(9 * s)}px "Gotham"`),
        document.fonts.ready
      ]);
    }
  } catch (fontErr) {
    console.warn('Font loading wait skipped:', fontErr);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  // 1. 背景
  ctx.fillStyle = '#121218';
  ctx.fillRect(0, 0, width, totalHeight);

  // 2. ウォーターマーク (右上: CreditDB)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(24 * s)}px "Gotham", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('CreditDB', width - margin - 4 * s, 32 * s);

  // 画像プリロード
  const allImages = new Map<string, HTMLImageElement>();
  const imagePromises: Promise<void>[] = [];

  for (const row of config.rows) {
    for (const item of row.items) {
      if (item.imageUrl && !allImages.has(item.imageUrl)) {
        const p = new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            allImages.set(item.imageUrl!, img);
            resolve();
          };
          img.onerror = () => {
            resolve(); // 失敗しても描画継続
          };
          img.src = item.imageUrl!;
        });
        imagePromises.push(p);
      }
    }
  }

  // 最大2秒でタイムアウトして描画開始（画像が遅い場合でも固まらない）
  await Promise.race([
    Promise.all(imagePromises),
    new Promise((resolve) => setTimeout(resolve, 2000))
  ]);

  // 3. 各Tier行の描画
  let currentY = headerHeight;

  for (const row of config.rows) {
    const rowHeight = calculateRowHeight(row.items.length);

    // 行背景カード
    ctx.fillStyle = '#1C1C26';
    roundRect(ctx, margin, currentY, width - margin * 2, rowHeight, 14 * s);
    ctx.fill();

    // Tierヘッダーボックス
    ctx.fillStyle = row.colorHex || '#8BD3A7';
    roundRect(ctx, margin, currentY, headerBoxWidth, rowHeight, 14 * s);
    ctx.fill();

    // Tier文字
    ctx.fillStyle = '#121218';
    const tierFontSize = row.name.length > 2 ? Math.round(26 * s) : Math.round(38 * s);
    ctx.font = `bold ${tierFontSize}px "Gotham", -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(row.name, margin + headerBoxWidth / 2, currentY + rowHeight / 2);

    // 作品カード群
    row.items.forEach((item, index) => {
      const line = Math.floor(index / cardsPerLine);
      const col = index % cardsPerLine;
      const cardX = cardStartX + col * (cardWidth + cardSpacing);
      const cardY = currentY + 12 * s + line * (cardHeight + cardSpacing);

      drawAnimeCard(ctx, item, cardX, cardY, cardWidth, cardHeight, s, options, isEn, allImages);
    });

    currentY += rowHeight + rowSpacing;
  }

  return canvas;
}

function drawAnimeCard(
  ctx: CanvasRenderingContext2D,
  item: TierAnimeItem,
  x: number,
  y: number,
  w: number,
  h: number,
  s: number,
  options: TierImageExportOptions,
  isEn: boolean,
  images: Map<string, HTMLImageElement>
) {
  // カード背景
  ctx.save();
  ctx.fillStyle = '#262636';
  roundRect(ctx, x, y, w, h, 8 * s);
  ctx.fill();
  ctx.clip();

  // カバー画像 (drawImageCover でアスペクト比を完全維持)
  const img = item.imageUrl ? images.get(item.imageUrl) : null;
  if (img && (img.naturalWidth > 0 || img.width > 0)) {
    drawImageCover(ctx, img, x, y, w, h);
  } else {
    // プレースホルダーグラデーション
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#35354a');
    grad.addColorStop(1, '#1e1e2d');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }

  // 下部オーバーレイグラデーション（文字視認性向上）
  if (options.showTitle || options.showYear || options.showDeviationScore) {
    const overlayGrad = ctx.createLinearGradient(x, y + h * 0.4, x, y + h);
    overlayGrad.addColorStop(0, 'rgba(18, 18, 24, 0)');
    overlayGrad.addColorStop(1, 'rgba(18, 18, 24, 0.95)');
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(x, y + h * 0.4, w, h * 0.6);
  }

  // 偏差値バッジ (右上)
  if (options.showDeviationScore && item.deviationScore != null) {
    const scoreText = item.deviationScore.toFixed(1);
    ctx.font = `bold ${Math.round(10 * s)}px "Gotham", -apple-system, sans-serif`;
    const textWidth = ctx.measureText(scoreText).width;
    const badgeW = textWidth + 8 * s;
    const badgeH = 16 * s;
    const badgeX = x + w - badgeW - 4 * s;
    const badgeY = y + 4 * s;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4 * s);
    ctx.fill();

    ctx.fillStyle = item.deviationScore >= 60 ? '#8BD3A7' : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scoreText, badgeX + badgeW / 2, badgeY + badgeH / 2);
  }

  // タイトル & 年 (下部)
  let textY = y + h - 6 * s;
  ctx.textAlign = 'left';

  if (options.showYear && item.year) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `bold ${Math.round(9.5 * s)}px "Gotham", -apple-system, sans-serif`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(item.year), x + 6 * s, textY);
    textY -= 12 * s;
  }

  if (options.showTitle) {
    const displayTitle = (isEn && item.titleEn) ? item.titleEn : (item.title || item.titleEn || '');
    ctx.fillStyle = '#FFFFFF';

    ctx.font = `bold ${Math.round(10 * s)}px "Gotham", "Noto Sans JP", -apple-system, sans-serif`;
    ctx.textBaseline = 'bottom';

    // 省略記号対応
    const maxTextWidth = w - 12 * s;
    let titleStr = displayTitle;
    if (ctx.measureText(titleStr).width > maxTextWidth) {
      while (titleStr.length > 0 && ctx.measureText(titleStr + '…').width > maxTextWidth) {
        titleStr = titleStr.slice(0, -1);
      }
      titleStr += '…';
    }
    ctx.fillText(titleStr, x + 6 * s, textY);
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
