/**
 * 作品のカバーサムネイル画像を解決するユーティリティ (Android版 WorkImageResolver.kt に準拠)
 */

import { getAssetPath } from '../db/database';

let workCoverMap: Record<string, number | string> = {};
let isCoversLoaded = false;
let loadPromise: Promise<void> | null = null;

export async function loadWorkCovers(): Promise<void> {
  if (isCoversLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch(getAssetPath('data/work_covers.json'));
      if (res.ok) {
        workCoverMap = await res.json();
        isCoversLoaded = true;
      }
    } catch (e) {
      console.warn('Failed to load work_covers.json:', e);
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export function getCoverImageUrl(workId: string): string | null {
  if (!isCoversLoaded && !loadPromise) {
    loadWorkCovers();
  }
  const val = workCoverMap[workId];
  if (!val) return null;
  if (typeof val === 'string' && val.startsWith('http')) {
    return val;
  }
  return `https://api.bgm.tv/v0/subjects/${val}/image?type=medium`;
}

export const ensureCoversLoaded = loadWorkCovers;

export const workImageResolver = {
  initialize: loadWorkCovers,
  getCoverImageUrl
};

