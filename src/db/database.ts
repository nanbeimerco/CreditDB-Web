/**
 * SQLite WebAssembly (sql.js) 接続管理 & IndexedDB 永続キャッシュ & ホットスワップ
 */
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

export function getAssetPath(path: string): string {
  const base = (import.meta.env.BASE_URL || './').replace(/\/+$/, '') + '/';
  return `${base}${path.replace(/^\/+/, '')}`;
}


const DB_INDEXED_DB_NAME = 'creditdb_web_cache';
const DB_STORE_NAME = 'sqlite_db_store';
const DB_CACHE_KEY = 'creditdb_raw_bytes';
const DB_METADATA_KEY = 'creditdb_metadata';

let SQL: SqlJsStatic | null = null;
let currentDb: Database | null = null;

// IndexedDB ヘルパー
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_INDEXED_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        db.createObjectStore(DB_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getCachedDbBytes(): Promise<Uint8Array | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE_NAME, 'readonly');
      const store = tx.objectStore(DB_STORE_NAME);
      const req = store.get(DB_CACHE_KEY);
      req.onsuccess = () => resolve(req.result ? new Uint8Array(req.result) : null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Failed to read from IndexedDB:', e);
    return null;
  }
}

export async function saveDbBytesToCache(bytes: Uint8Array, metadata?: any): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(DB_STORE_NAME);
      store.put(bytes.buffer, DB_CACHE_KEY);
      if (metadata) {
        store.put(metadata, DB_METADATA_KEY);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Failed to save to IndexedDB:', e);
  }
}

export async function getCachedDbMetadata(): Promise<any | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE_NAME, 'readonly');
      const store = tx.objectStore(DB_STORE_NAME);
      const req = store.get(DB_METADATA_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearDbCache(): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(DB_STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
}

/**
 * Gzip 圧縮されたレスポンスをブラウザ標準の DecompressionStream でストリーミング解凍
 */
async function decompressGzipStream(
  response: Response,
  totalCompressedBytes: number,
  onProgress?: (percent: number, statusText: string) => void
): Promise<Uint8Array> {
  if (!response.body) {
    throw new Error('Response body is null');
  }

  // 1. ダウンロードの進捗トラッキング
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      receivedBytes += value.length;
      if (onProgress && totalCompressedBytes > 0) {
        const mbRead = (receivedBytes / (1024 * 1024)).toFixed(1);
        const mbTotal = (totalCompressedBytes / (1024 * 1024)).toFixed(1);
        const pct = Math.min(80, Math.floor((receivedBytes / totalCompressedBytes) * 80));
        onProgress(pct, `ダウンロード中: ${mbRead} MB / ${mbTotal} MB (${pct}%)`);
      }
    }
  }

  onProgress?.(86, 'データベースの形式を検証中...');

  // 連結したバイト配列
  const buffer = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  // 先頭バイトを検証
  // 1. SQLite マジックヘッダー: "SQLite format 3\0"
  const isAlreadySQLite =
    buffer.length >= 16 &&
    buffer[0] === 0x53 && // S
    buffer[1] === 0x51 && // Q
    buffer[2] === 0x4c && // L
    buffer[3] === 0x69 && // i
    buffer[4] === 0x74 && // t
    buffer[5] === 0x65;   // e

  if (isAlreadySQLite) {
    // サーバーが Content-Encoding: gzip を返したため、ブラウザが透過的に自動解凍済み
    onProgress?.(90, 'データベースの展開完了！');
    return buffer;
  }

  // 2. Gzip マジックヘッダー: 0x1F, 0x8B
  const isGzip = buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;

  if (isGzip && typeof DecompressionStream !== 'undefined') {
    onProgress?.(88, 'Gzip アーカイブを展開中...');
    try {
      const ds = new DecompressionStream('gzip');
      const writer = ds.writable.getWriter();
      writer.write(buffer);
      writer.close();

      const decompressedChunks: Uint8Array[] = [];
      const dsReader = ds.readable.getReader();
      let decompressedLen = 0;

      while (true) {
        const { done, value } = await dsReader.read();
        if (done) break;
        if (value) {
          decompressedChunks.push(value);
          decompressedLen += value.length;
        }
      }

      const decompressed = new Uint8Array(decompressedLen);
      let dOffset = 0;
      for (const chunk of decompressedChunks) {
        decompressed.set(chunk, dOffset);
        dOffset += chunk.length;
      }
      return decompressed;
    } catch (e) {
      console.warn('DecompressionStream error, falling back to raw buffer:', e);
      return buffer;
    }
  }

  return buffer;
}


/**
 * sql.js の初期化
 */
export async function getSqlStatic(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  SQL = await initSqlJs({
    locateFile: () => sqlWasmUrl
  });
  return SQL;
}

/**
 * データベースの初期化＆ロード
 */
export async function initializeDatabase(
  onProgress?: (percent: number, statusText: string) => void,
  forceDownload: boolean = false
): Promise<Database> {
  if (currentDb && !forceDownload) {
    return currentDb;
  }

  const sqlStatic = await getSqlStatic();

  // 1. IndexedDB からキャッシュを取得 (強制再ダウンロードでなければ)
  if (!forceDownload) {
    onProgress?.(5, 'ローカルキャッシュを確認中...');
    const cachedBytes = await getCachedDbBytes();
    if (cachedBytes && cachedBytes.length > 0) {
      onProgress?.(60, 'キャッシュからデータベースを起動中...');
      try {
        currentDb = new sqlStatic.Database(cachedBytes);
        // Schema & version check: verify that studios table exists, total_works >= 20000, version == '2.0.0', and first_year column exists
        const checkStudios = currentDb.exec("SELECT 1 FROM sqlite_master WHERE type='table' AND name='studios'");
        const checkWorks = currentDb.exec("SELECT total_works, version FROM summary LIMIT 1");
        const totalWorks = (checkWorks.length > 0 && checkWorks[0].values.length > 0) ? Number(checkWorks[0].values[0][0]) : 0;
        const dbVersion = (checkWorks.length > 0 && checkWorks[0].values.length > 0) ? String(checkWorks[0].values[0][1]) : '';

        const checkCol = currentDb.exec("PRAGMA table_info(leaderboards)");
        const hasFirstYear = checkCol.length > 0 && checkCol[0].values.some(row => row[1] === 'first_year');

        if (checkStudios.length > 0 && checkStudios[0].values.length > 0 && totalWorks >= 20000 && hasFirstYear && dbVersion === '2.1.0') {
          onProgress?.(100, '起動完了');
          return currentDb;
        } else {
          console.warn(`Cached DB is outdated (version=${dbVersion}, totalWorks=${totalWorks}, hasFirstYear=${hasFirstYear}). Purging cache and refetching latest DB...`);
          currentDb.close();
          currentDb = null;
          await clearDbCache();
        }
      } catch (e) {
        console.warn('Corrupted database in cache, purging and refetching...', e);
        await clearDbCache();
        if (currentDb) {
          try { currentDb.close(); } catch {}
          currentDb = null;
        }
      }

    }
  }

  // 2. サーバーから最新の creditdb.db.gz を取得 (キャッシュバスター付与)
  onProgress?.(10, 'データベースをダウンロード中...');
  const res = await fetch(`${getAssetPath('data/creditdb.db.gz')}?v=2.1.0`, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to fetch database: ${res.status} ${res.statusText}`);
  }

  const contentLength = Number(res.headers.get('Content-Length')) || 45447168;
  const dbBytes = await decompressGzipStream(res, contentLength, onProgress);

  onProgress?.(92, 'データベースの整合性を検証中...');
  currentDb = new sqlStatic.Database(dbBytes);

  onProgress?.(96, '高速起動用キャッシュを保存中...');
  // version.json のメタデータも一緒にキャッシュ
  try {
    const vRes = await fetch(`${getAssetPath('data/version.json')}?v=2.1.0`, { cache: 'no-cache' });
    const vJson = vRes.ok ? await vRes.json() : null;
    await saveDbBytesToCache(dbBytes, vJson);
  } catch {
    await saveDbBytesToCache(dbBytes);
  }

  onProgress?.(100, '準備完了！');
  return currentDb;
}


/**
 * 実行中の DB インスタンスを最新のバイトデータにホットスワップ
 */
export async function swapDatabase(
  newDbBytes: Uint8Array,
  metadata?: any
): Promise<Database> {
  const sqlStatic = await getSqlStatic();
  const newDb = new sqlStatic.Database(newDbBytes);

  // 整合性チェック
  const checkResult = newDb.exec('PRAGMA quick_check;');
  if (checkResult.length === 0 || checkResult[0].values[0][0] !== 'ok') {
    throw new Error('SQLite 整合性チェックに失敗しました');
  }

  if (currentDb) {
    try {
      currentDb.close();
    } catch {}
  }

  currentDb = newDb;
  await saveDbBytesToCache(newDbBytes, metadata);
  return currentDb;
}

export function getDatabase(): Database {
  if (!currentDb) {
    throw new Error('Database is not initialized. Call initializeDatabase() first.');
  }
  return currentDb;
}

export const dbManager = {
  initialize: initializeDatabase,
  getDb: getDatabase,
  swap: swapDatabase
};

