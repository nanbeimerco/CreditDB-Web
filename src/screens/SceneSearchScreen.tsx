/**
 * アニメシーン特定画面 (SceneSearchScreen)
 * trace.moe API を用いて、スクショ画像・Ctrl+V 貼り付けから
 * タイトル・話数・再生位置・シーンプレビュー動画を特定し、作品詳細へジャンプ
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Camera,
  UploadCloud,
  Clipboard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Film,
  Sparkles,
  ChevronRight,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { TraceMoeService, TraceMoeItem, formatTimestamp } from '../services/traceMoeService';
import { CreditRepository } from '../db/repository';
import { WorkDetail } from '../types/entities';
import { TierBadge } from '../components/CommonComponents';
import { LanguageManager } from '../theme/languageManager';
import { AppStrings } from '../theme/strings';

interface SceneSearchScreenProps {
  onNavigateToWork: (workId: string) => void;
}

export const SceneSearchScreen: React.FC<SceneSearchScreenProps> = ({ onNavigateToWork }) => {
  const isEn = LanguageManager.isEnglish;

  // 状態管理
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<TraceMoeItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [matchedWork, setMatchedWork] = useState<WorkDetail | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 検索実行関数
  const handleSearchImage = useCallback(async (blob: Blob) => {
    setIsSearching(true);
    setSearchError(null);
    setResults([]);
    setSelectedIndex(0);
    setMatchedWork(null);

    // プレビュー表示用URL作成
    const previewUrl = URL.createObjectURL(blob);
    setSelectedImage(previewUrl);

    try {
      const items = await TraceMoeService.searchScene(blob);
      if (!items || items.length === 0) {
        setSearchError(isEn ? 'No matching anime scenes found.' : '該当するアニメシーンが見つかりませんでした。');
      } else {
        setResults(items);
        // 最有力候補の AniList ID から本アプリDBの作品情報を取得
        const top = items[0];
        if (top && top.anilist) {
          const work = CreditRepository.getWorkDetail(`anime_${top.anilist}`);
          setMatchedWork(work);
        }
      }
    } catch (e: any) {
      console.error('Scene search failed:', e);
      setSearchError(e.message || (isEn ? 'Failed to search scene.' : 'シーンの検索中にエラーが発生しました。'));
    } finally {
      setIsSearching(false);
    }
  }, [isEn]);

  // 候補切り替え時のDB取得
  const handleSelectCandidate = (idx: number) => {
    setSelectedIndex(idx);
    const item = results[idx];
    if (item && item.anilist) {
      const work = CreditRepository.getWorkDetail(`anime_${item.anilist}`);
      setMatchedWork(work);
    } else {
      setMatchedWork(null);
    }
  };

  // ファイル選択ハンドラ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSearchImage(file);
    }
  };

  // クリップボードからの貼り付けハンドラ (Ctrl+V)
  const handlePasteEvent = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleSearchImage(file);
          break;
        }
      }
    }
  }, [handleSearchImage]);

  // クリップボードボタンクリック (navigator.clipboard)
  const handleClipboardButtonClick = async () => {
    try {
      if (!navigator.clipboard?.read) {
        alert(isEn ? 'Clipboard access not supported. Please press Ctrl+V directly.' : 'お使いのブラウザではクリップボード直接読み取りがサポートされていません。直接 Ctrl + V キーで貼り付けてください。');
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            handleSearchImage(blob);
            return;
          }
        }
      }
      alert(isEn ? 'No image found in clipboard.' : 'クリップボードに画像がありませんでした。スクショをコピーしてから押してください。');
    } catch (e) {
      console.warn('Clipboard read permission denied:', e);
      alert(isEn ? 'Press Ctrl + V directly on this page.' : 'ページ上で直接 Ctrl + V を押して貼り付けてください。');
    }
  };

  // ドラッグ＆ドロップハンドラ
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleSearchImage(file);
    }
  };

  // リセット
  const handleReset = () => {
    setSelectedImage(null);
    setResults([]);
    setSearchError(null);
    setMatchedWork(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // グローバルな Ctrl+V 貼り付けリスナー登録
  useEffect(() => {
    window.addEventListener('paste', handlePasteEvent);
    return () => {
      window.removeEventListener('paste', handlePasteEvent);
    };
  }, [handlePasteEvent]);

  const activeResult = results[selectedIndex] || null;

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* 1. ヘッダーエリア */}
      <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primaryContainer text-onPrimaryContainer shadow-sm">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-onSurface tracking-tight">
                {isEn ? AppStrings.sceneTitleEn : AppStrings.sceneTitle}
              </h1>
              <p className="text-xs text-onSurfaceVariant">
                {isEn ? AppStrings.sceneSubtitleEn : AppStrings.sceneSubtitle}
              </p>
            </div>
          </div>

          {selectedImage && !isSearching && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-onSurfaceVariant hover:text-onSurface bg-surfaceContainer hover:bg-surfaceContainerHigh rounded-xl transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isEn ? 'New Search' : '別の画像で検索'}</span>
            </button>
          )}
        </div>

        {/* 2. 入力エリア (未検索またはエラー時) */}
        {!selectedImage && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-3xl transition-all select-none ${
              isDragging
                ? 'border-primary bg-primaryContainer/10 scale-[1.01]'
                : 'border-outlineVariant/50 bg-surfaceContainer/40 hover:bg-surfaceContainer/70'
            }`}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-surfaceContainerHigh text-primary mb-4 shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h2 className="text-base sm:text-lg font-bold text-onSurface text-center mb-1">
              {isEn ? AppStrings.sceneDropzoneEn : AppStrings.sceneDropzone}
            </h2>
            <p className="text-xs text-onSurfaceVariant text-center mb-6 max-w-sm">
              {isEn ? AppStrings.scenePasteHintEn : AppStrings.scenePasteHint}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* ファイル選択ボタン */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-onPrimary font-bold text-sm rounded-2xl shadow-sm hover:brightness-110 active:scale-95 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isEn ? AppStrings.sceneSelectFileEn : AppStrings.sceneSelectFile}</span>
              </button>

              {/* クリップボード貼り付けボタン */}
              <button
                onClick={handleClipboardButtonClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-surfaceContainerHigh hover:bg-surfaceContainerHighest text-onSurface font-bold text-sm rounded-2xl border border-outlineVariant/40 active:scale-95 transition-all"
              >
                <Clipboard className="w-4 h-4 text-primary" />
                <span>{isEn ? 'Paste (Ctrl+V)' : 'クリップボードから貼付'}</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* ヒントフッター */}
            <div className="mt-8 pt-4 border-t border-outlineVariant/30 flex items-center gap-2 text-[11px] text-onSurfaceVariant/80">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>
                {isEn
                  ? 'Powered by trace.moe. Supports TV series, movies, and OVAs from 1950 to 2026.'
                  : 'trace.moe API連携。TVシリーズ、劇場版、OVA等、膨大なアニメシーンから秒単位で特定します。'}
              </span>
            </div>
          </div>
        )}

        {/* 3. 検索中のローディング画面 */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-16 bg-surfaceContainer/30 border border-outlineVariant/30 rounded-3xl">
            {selectedImage && (
              <div className="relative w-48 h-28 rounded-2xl overflow-hidden mb-6 shadow-md border border-outlineVariant/40">
                <img src={selectedImage} alt="Search Target" className="w-full h-full object-cover filter blur-[1px]" />
                <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
                </div>
              </div>
            )}
            <h3 className="text-base font-bold text-onSurface mb-1 animate-pulse">
              {isEn ? AppStrings.sceneSearchingEn : AppStrings.sceneSearching}
            </h3>
            <p className="text-xs text-onSurfaceVariant">
              {isEn ? 'Matching frames and calculating scene timestamps...' : 'フレーム照合・話数および再生秒数を特定しています...'}
            </p>
          </div>
        )}

        {/* 4. エラー表示 */}
        {searchError && (
          <div className="p-4 mt-4 bg-errorContainer/20 border border-error/40 rounded-2xl flex items-start gap-3 text-error">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-bold">{searchError}</p>
              <button
                onClick={handleReset}
                className="mt-2 px-3 py-1 bg-error text-onError font-bold rounded-lg text-xs hover:brightness-110"
              >
                {isEn ? 'Try Another Image' : '別の画像で試す'}
              </button>
            </div>
          </div>
        )}

        {/* 5. 検索結果表示エリア */}
        {results.length > 0 && activeResult && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* メインの最有力候補カード */}
            <div className="bg-surfaceContainer border border-outlineVariant/40 rounded-3xl overflow-hidden shadow-sm">
              {/* 動画・画像プレビュー */}
              <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                {activeResult.video ? (
                  <video
                    src={activeResult.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={activeResult.image}
                    alt="Scene Frame"
                    className="w-full h-full object-contain"
                  />
                )}

                {/* 一致率バッジ (左上オーバーレイ) */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/75 backdrop-blur rounded-full flex items-center gap-1.5 border border-white/20">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${activeResult.similarity >= 0.87 ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-xs font-black text-white font-['Montserrat']">
                    {(activeResult.similarity * 100).toFixed(1)}% {isEn ? 'Match' : '一致'}
                  </span>
                </div>
              </div>

              {/* カード本文 */}
              <div className="p-5 sm:p-6 flex flex-col gap-4">
                {/* タイトルと本DBバッジ */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {matchedWork && (
                      <>
                        <TierBadge tier={matchedWork.tier} />
                        <span className="text-xs font-bold text-primary font-['Montserrat']">
                          {isEn ? `Dev: ${matchedWork.deviationScore.toFixed(1)}` : `偏差値 ${matchedWork.deviationScore.toFixed(1)}`}
                        </span>
                        <span className="text-xs text-onSurfaceVariant font-['Montserrat']">
                          ({matchedWork.year})
                        </span>
                        {matchedWork.studio && (
                          <span className="px-2 py-0.5 bg-surfaceContainerHighest text-onSurface text-[11px] font-bold rounded-md">
                            {matchedWork.studio}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-onSurface leading-snug">
                    {matchedWork?.title || activeResult.filename}
                  </h2>
                  {matchedWork?.titleEn && (
                    <p className="text-xs text-onSurfaceVariant font-medium mt-0.5">
                      {matchedWork.titleEn}
                    </p>
                  )}
                </div>

                {/* 話数 ＆ タイムスタンプ情報 */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-surfaceContainerHigh rounded-2xl border border-outlineVariant/30">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-surfaceContainer text-primary">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-onSurfaceVariant font-bold uppercase">
                        {isEn ? AppStrings.sceneEpisodeEn : AppStrings.sceneEpisode}
                      </div>
                      <div className="text-sm font-extrabold text-onSurface">
                        {activeResult.episode !== null
                          ? isEn ? `Episode ${activeResult.episode}` : `第 ${activeResult.episode} 話`
                          : (isEn ? 'Movie / Special' : '映画 / 単発')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-surfaceContainer text-primary">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-onSurfaceVariant font-bold uppercase">
                        {isEn ? AppStrings.sceneTimeEn : AppStrings.sceneTime}
                      </div>
                      <div className="text-sm font-extrabold text-onSurface font-['Montserrat']">
                        {formatTimestamp(activeResult.at)}
                        <span className="text-[11px] font-normal text-onSurfaceVariant ml-1">
                          ({formatTimestamp(activeResult.from)} - {formatTimestamp(activeResult.to)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 作品詳細へ移動ボタン (主アクション) */}
                <div className="pt-2">
                  {matchedWork ? (
                    <button
                      onClick={() => onNavigateToWork(matchedWork.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-onPrimary font-bold text-sm rounded-2xl shadow-sm hover:brightness-110 active:scale-[0.99] transition-all"
                    >
                      <Film className="w-4 h-4" />
                      <span>{isEn ? AppStrings.sceneViewDetailsEn : AppStrings.sceneViewDetails}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-surfaceContainerHigh rounded-2xl text-xs text-onSurfaceVariant">
                      <span>{isEn ? 'AniList Media ID:' : 'AniList作品ID:'} {activeResult.anilist}</span>
                      <a
                        href={`https://anilist.co/anime/${activeResult.anilist}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-bold text-primary hover:underline"
                      >
                        <span>AniList</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 他の候補リスト (複数ヒットした場合) */}
            {results.length > 1 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider px-1">
                  {isEn ? 'Other Matching Candidates' : '他の類似シーン候補'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {results.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={`${item.anilist}-${item.episode}-${item.at}-${idx}`}
                        onClick={() => handleSelectCandidate(idx)}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-primaryContainer/30 border-primary shadow-sm'
                            : 'bg-surfaceContainer hover:bg-surfaceContainerHigh border-outlineVariant/30'
                        }`}
                      >
                        <div className="relative w-20 h-12 rounded-xl overflow-hidden bg-black flex-shrink-0">
                          <img src={item.image} alt="Thumb" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black text-primary font-['Montserrat']">
                              {(item.similarity * 100).toFixed(1)}%
                            </span>
                            <span className="text-[11px] font-bold text-onSurface truncate">
                              {item.episode !== null ? `第${item.episode}話` : '映画/単発'}
                            </span>
                          </div>
                          <div className="text-[10px] text-onSurfaceVariant font-['Montserrat']">
                            {formatTimestamp(item.at)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-onSurfaceVariant flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
