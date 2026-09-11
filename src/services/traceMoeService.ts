/**
 * trace.moe API 連携サービス
 * アニメスクリーンショット画像からタイトル・話数・タイムスタンプ・プレビュー動画を検索
 */

export interface TraceMoeItem {
  anilist: number;
  filename: string;
  episode: number | null;
  from: number;
  to: number;
  at: number;
  similarity: number;
  video: string;
  image: string;
}

export interface TraceMoeResponse {
  frameCount: number;
  error?: string;
  result: TraceMoeItem[];
}

/**
 * 画像を Canvas を用いて最大 1280px / 高品質 JPEG に自動圧縮
 */
async function compressImageForTraceMoe(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxWidth = 1280;
      const maxHeight = 1280;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(blob);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob);
          } else {
            resolve(blob);
          }
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };

    img.src = url;
  });
}

/**
 * 秒数を HH:MM:SS または MM:SS 形式にフォーマット
 */
export function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  if (hrs > 0) {
    const hh = String(hrs).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export const TraceMoeService = {
  /**
   * 画像 Blob を trace.moe API に送信してアニメシーンを検索
   */
  async searchScene(imageBlob: Blob): Promise<TraceMoeItem[]> {
    const compressed = await compressImageForTraceMoe(imageBlob);

    const response = await fetch('https://api.trace.moe/search?cutBorders=true', {
      method: 'POST',
      body: compressed,
      headers: {
        'Content-Type': 'image/jpeg'
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('APIの利用制限（レート制限）に達しました。しばらく待ってから再試行してください。');
      }
      throw new Error(`trace.moe API error: ${response.status} ${response.statusText}`);
    }

    const data: TraceMoeResponse = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.result || [];
  }
};
