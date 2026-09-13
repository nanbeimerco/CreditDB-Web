/**
 * Web最適化 データベース更新・管理モーダル (Smart Delta Check & Hot Swapping & Local Import)
 */
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, RefreshCw, Upload, AlertCircle, Database as DbIcon } from 'lucide-react';
import { UpdateManager, UpdateCheckResult } from '../db/updateManager';
import { LanguageManager } from '../theme/languageManager';
import { AppStrings } from '../theme/strings';

interface DatabaseUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatabaseSwapped?: () => void;
}

export const DatabaseUpdateModal: React.FC<DatabaseUpdateModalProps> = ({
  isOpen,
  onClose,
  onDatabaseSwapped
}) => {
  const [activeTab, setActiveTab] = useState<'remote' | 'local'>('remote');
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('待機中...');
  const [checkResult, setCheckResult] = useState<UpdateCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEn = LanguageManager.isEnglish;

  useEffect(() => {
    if (isOpen) {
      checkLatest();
    }
  }, [isOpen]);

  async function checkLatest() {
    setIsChecking(true);
    setErrorMessage(null);
    const res = await UpdateManager.checkForUpdates();
    setCheckResult(res);
    setIsChecking(false);
  }

  async function handleStartUpdate() {
    setIsUpdating(true);
    setProgress(0);
    setStatusText(isEn ? 'Starting database update...' : 'データベース更新開始...');

    const success = await UpdateManager.performUpdate((p, text) => {
      setProgress(p);
      setStatusText(text);
    });

    setIsUpdating(false);
    if (success) {
      checkLatest();
      onDatabaseSwapped?.();
    } else {
      setErrorMessage(isEn ? 'Update failed. Please check network connection.' : '更新に失敗しました。通信環境をご確認ください。');
    }
  }

  async function handleForceReset() {
    if (!confirm(isEn ? 'Clear local database cache and re-download?' : 'ローカルのデータベースキャッシュを消去して再取得しますか？')) return;
    setIsUpdating(true);
    setProgress(0);
    setStatusText(isEn ? 'Resetting database cache...' : 'データベース再同期中...');

    const success = await UpdateManager.forceResetCache((p, text) => {
      setProgress(p);
      setStatusText(text);
    });

    setIsUpdating(false);
    if (success) {
      checkLatest();
      onDatabaseSwapped?.();
    } else {
      setErrorMessage(isEn ? 'Reset failed.' : '再同期に失敗しました。');
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdating(true);
    setProgress(0);
    setStatusText(`${file.name} を読み込み中...`);

    const success = await UpdateManager.importLocalDatabaseFile(file, (p, text) => {
      setProgress(p);
      setStatusText(text);
    });

    setIsUpdating(false);
    if (success) {
      checkLatest();
      onDatabaseSwapped?.();
    } else {
      setErrorMessage(isEn ? 'Failed to import SQLite file.' : 'SQLite ファイルの読み込みに失敗しました。');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in">
      <div className="w-full max-w-md bg-surfaceContainer rounded-3xl border border-outlineVariant p-6 shadow-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-outlineVariant/30">
          <div className="flex items-center gap-2">
            <DbIcon className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-onSurface">
              {isEn ? 'Database Status & Updates' : 'データベース更新・管理'}
            </h3>
          </div>
          {!isUpdating && (
            <button
              onClick={onClose}
              className="p-1 rounded-full text-onSurfaceVariant hover:text-onSurface"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* タブ切り替え */}
        {!isUpdating && (
          <div className="flex border-b border-outlineVariant/20 mt-3">
            <button
              onClick={() => setActiveTab('remote')}
              className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'remote' ? 'border-primary text-primary' : 'border-transparent text-onSurfaceVariant'
              }`}
            >
              {isEn ? 'Cloud Sync (Official)' : '公式クラウド同期'}
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'local' ? 'border-primary text-primary' : 'border-transparent text-onSurfaceVariant'
              }`}
            >
              {isEn ? 'Local SQLite Import' : 'ローカルDB読込'}
            </button>
          </div>
        )}

        {/* プログレスバー表示 (更新中) */}
        {isUpdating ? (
          <div className="py-8 space-y-4 text-center">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-primary animate-spin" />
            </div>
            <div className="text-sm font-bold text-onSurface">{statusText}</div>
            <div className="w-full bg-surfaceVariant rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-onSurfaceVariant font-mono font-bold">
              {progress}%
            </div>
          </div>
        ) : activeTab === 'remote' ? (
          /* 公式クラウド同期タブ */
          <div className="py-4 space-y-4 text-xs">
            {isChecking ? (
              <div className="flex items-center justify-center py-6 gap-2 text-onSurfaceVariant">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isEn ? 'Checking remote database version...' : '最新バージョンを確認中...'}</span>
              </div>
            ) : checkResult ? (
              <div className="space-y-3">
                {/* 状態ステータス */}
                {checkResult.hasUpdate ? (
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-primaryContainer/30 border border-primary/50 text-onSurface">
                    <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-primary">
                        {isEn ? 'New Database Update Available!' : '最新のデータベースが利用可能です！'}
                      </div>
                      <div className="text-[11px] text-onSurfaceVariant mt-0.5">
                        {isEn
                          ? `Release: v${checkResult.remoteVersion} (${checkResult.remoteUpdatedAt}) • ~${checkResult.remoteSizeMb} MB`
                          : `最新バージョン: v${checkResult.remoteVersion} (${checkResult.remoteUpdatedAt}) • 約 ${checkResult.remoteSizeMb} MB`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface border border-outlineVariant/40 text-onSurface">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm">
                        {isEn ? 'Database is up to date' : 'お使いのデータベースは最新です'}
                      </div>
                      <div className="text-[11px] text-onSurfaceVariant">
                        {isEn
                          ? `Current version: v${checkResult.localVersion} (${checkResult.localUpdatedAt})`
                          : `現在のバージョン: v${checkResult.localVersion} (${checkResult.localUpdatedAt})`}
                      </div>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-red-900/20 border border-red-500/50 text-red-300 text-xs">
                    {errorMessage}
                  </div>
                )}

                {/* アクションボタン */}
                <div className="pt-2 space-y-2">
                  {checkResult.hasUpdate ? (
                    <button
                      onClick={handleStartUpdate}
                      className="w-full py-3 rounded-xl bg-primary text-onPrimary font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {isEn ? 'Download & Apply Update' : '最新データベースへ更新する'}
                    </button>
                  ) : (
                    <button
                      onClick={handleForceReset}
                      className="w-full py-2.5 rounded-xl bg-surface border border-outlineVariant/60 text-onSurfaceVariant hover:text-onSurface font-medium text-xs transition-colors"
                    >
                      {isEn ? 'Force Re-download & Rebuild Cache' : 'キャッシュを強制クリアして再取得'}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* ローカルDB読込タブ */
          <div className="py-4 space-y-4 text-xs">
            <p className="text-onSurfaceVariant">
              {isEn
                ? 'Select a custom creditdb.db SQLite file to use in this session.'
                : '手元で生成したカスタム SQLite データベース（creditdb.db）を選択して読み込みます。'}
            </p>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-outlineVariant/60 rounded-2xl cursor-pointer hover:border-primary transition-colors bg-surface">
              <Upload className="w-8 h-8 text-onSurfaceVariant mb-2" />
              <span className="font-bold text-onSurface">
                {isEn ? 'Choose or drop SQLite (.db) file' : 'SQLite (.db) ファイルを選択'}
              </span>
              <span className="text-[10px] text-onSurfaceVariant mt-1">
                {isEn ? 'Max size: ~200MB' : '最大推奨サイズ: ~200MB'}
              </span>
              <input
                type="file"
                accept=".db,.sqlite,.sqlite3"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleForceReset}
              className="w-full py-2.5 rounded-xl bg-surface border border-outlineVariant/60 text-onSurfaceVariant hover:text-onSurface font-medium text-xs transition-colors"
            >
              {isEn ? 'Reset to Official Default DB' : '公式デフォルトデータベースに戻す'}
            </button>
          </div>
        )}

        {/* フッター */}
        {!isUpdating && (
          <div className="pt-3 border-t border-outlineVariant/20 flex items-center justify-between">
            <span className="text-[10px] text-onSurfaceVariant/60 font-medium">
              {AppStrings.datasetAttribution(isEn)}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-onSurfaceVariant hover:text-onSurface"
            >
              {isEn ? 'Close' : '閉じる'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
