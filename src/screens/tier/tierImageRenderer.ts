import { TierTableConfig, TierAnimeItem } from '../../types/tier';

export interface TierImageExportOptions {
  scale: number; // 1.0: 1080p, 1.6: 2K, 2.5: 4K
  showTitle: boolean;
  showYear: boolean;
  showDeviationScore: boolean;
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
  const baseRowHeight = 156 * s;
  const headerHeight = 56 * s;
  const margin = 20 * s;
  const rowSpacing = 12 * s;
  const width = Math.round(1160 * s);

  const headerBoxWidth = 118 * s;
  const cardWidth = 96 * s;
  const cardHeight = baseRowHeight - 24 * s;
  const cardSpacing = 12 * s;
  const cardStartX = margin + headerBoxWidth + 16 * s;
  const availableWidthForCards = (width - margin) - cardStartX;
  const cardsPerLine = Math.max(1, Math.floor((availableWidthForCards + cardSpacing) / (cardWidth + cardSpacing)));

  const calculateRowHeight = (itemCount: number): number => {
    if (itemCount === 0) return baseRowHeight;
    const lines = Math.floor((itemCount - 1) / cardsPerLine) + 1;
    return 24 * s + lines * cardHeight + (lines - 1) * cardSpacing;
  };

  const totalRowsHeight = config.rows.reduce((sum, r) => sum + calculateRowHeight(r.items.length), 0);
  const totalHeight = Math.max(
    Math.round(400 * s),
    Math.round(headerHeight + totalRowsHeight + (config.rows.length * rowSpacing) + margin + 10 * s)
  );

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

  // カバー画像
  const img = item.imageUrl ? images.get(item.imageUrl) : null;
  if (img && img.naturalWidth > 0) {
    ctx.drawImage(img, x, y, w, h);
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
