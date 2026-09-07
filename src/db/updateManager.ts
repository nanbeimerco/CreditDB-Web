/**
 * Web最適化 データベース更新マネージャー (Smart Delta Check & Hot Swapping)
 */
import {
  getCachedDbMetadata,
  initializeDatabase,
  swapDatabase,
  clearDbCache,
  getAssetPath
} from './database';


export interface RemoteVersionInfo {
  version: string;
  updatedAt: string;
  totalWorks: number;
  totalStaff: number;
  totalCv: number;
  yearMin: number;
  yearMax: number;
  globalMean: number;
  dbFileName: string;
  dbSizeCompressed: number;
  dbSizeUncompressed: number;
  sha256: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  localVersion?: string;
  localUpdatedAt?: string;
  remoteVersion?: string;
  remoteUpdatedAt?: string;
  remoteWorksCount?: number;
  remoteSizeMb?: string;
  error?: string;
}

export const UpdateManager = {
  /**
   * サーバー側の version.json を軽量チェックして更新の有無を判定
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      const [remoteRes, localMeta] = await Promise.all([
        fetch(getAssetPath('data/version.json'), { cache: 'no-cache' }),
        getCachedDbMetadata()
      ]);


      if (!remoteRes.ok) {
        return { hasUpdate: false, error: 'サーバーからバージョン情報を取得できませんでした。' };
      }

      const remoteData: RemoteVersionInfo = await remoteRes.json();
      const localSha = localMeta?.sha256;
      const localVer = localMeta?.version || '1.0.0';
      const localUp = localMeta?.updatedAt || '初期キャッシュ';

      const hasUpdate = !localSha || localSha !== remoteData.sha256;

      return {
        hasUpdate,
        localVersion: localVer,
        localUpdatedAt: localUp,
        remoteVersion: remoteData.version,
        remoteUpdatedAt: remoteData.updatedAt,
        remoteWorksCount: remoteData.totalWorks,
        remoteSizeMb: (remoteData.dbSizeCompressed / (1024 * 1024)).toFixed(1)
      };
    } catch (e: any) {
      return { hasUpdate: false, error: e.message || '通信エラーが発生しました' };
    }
  },

  /**
   * 最新データベースをダウンロードしてホットスワップ
   */
  async performUpdate(
    onProgress: (percent: number, statusText: string) => void
  ): Promise<boolean> {
    try {
      await initializeDatabase(onProgress, true);
      return true;
    } catch (e) {
      console.error('Update failed:', e);
      return false;
    }
  },

  /**
   * キャッシュを全消去して再初期化
   */
  async forceResetCache(
    onProgress: (percent: number, statusText: string) => void
  ): Promise<boolean> {
    try {
      onProgress(10, '既存キャッシュをクリア中...');
      await clearDbCache();
      onProgress(30, 'データベースを再取得中...');
      await initializeDatabase(onProgress, true);
      return true;
    } catch (e) {
      console.error('Reset failed:', e);
      return false;
    }
  },

  /**
   * ユーザーの手元にあるカスタム SQLite ファイル (.db) を読み込んでホットスワップ
   */
  async importLocalDatabaseFile(
    file: File,
    onProgress: (percent: number, statusText: string) => void
  ): Promise<boolean> {
    try {
      onProgress(20, `${file.name} を読み込み中...`);
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      onProgress(60, 'SQLite データベースを検証中...');
      await swapDatabase(bytes, {
        version: 'custom',
        updatedAt: new Date().toISOString(),
        sha256: `custom_${file.name}_${file.size}`
      });

      onProgress(100, 'カスタムデータベースを適用しました！');
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }
};

export const updateManager = UpdateManager;

