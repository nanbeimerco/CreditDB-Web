/**
 * 作品のカバーサムネイル画像を解決するユーティリティ (Android版 WorkImageResolver.kt に準拠)
 */

import { getAssetPath } from '../db/database';

let workCoverMap: Record<string, number> = {};
let isCoversLoaded = false;

export async function loadWorkCovers(): Promise<void> {
  if (isCoversLoaded) return;
  try {
    const res = await fetch(getAssetPath('data/work_covers.json'));

    if (res.ok) {
      workCoverMap = await res.json();
      isCoversLoaded = true;
    }
  } catch (e) {
    console.warn('Failed to load work_covers.json:', e);
  }
}

export function getCoverImageUrl(workId: string): string | null {
  const bgmId = workCoverMap[workId];
  if (!bgmId) return null;
  return `https://api.bgm.tv/v0/subjects/${bgmId}/image?type=medium`;
}

export const workImageResolver = {
  initialize: loadWorkCovers,
  getCoverImageUrl
};

