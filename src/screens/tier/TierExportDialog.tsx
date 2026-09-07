import React, { useState, useMemo } from 'react';
import { TierTableConfig } from '../../types/tier';
import { useLanguage } from '../../theme/languageManager';
import { AppStrings } from '../../theme/strings';
import { TierImageExportOptions, renderTierCanvas, calculateOptimalTierLayout } from './tierImageRenderer';
import { TierAnalysisEngine } from './tierAnalysisEngine';
import {
  Sliders,
  Image,
  FileText,
  Sparkles,
  Download,
  Upload,
  X,
  Loader2,
  Maximize2
} from 'lucide-react';

interface TierExportDialogProps {
  config: TierTableConfig;
  onDismiss: () => void;
  onImportConfig: (newConfig: TierTableConfig) => void;
  onShowSnackbar: (message: string) => void;
}

export const TierExportDialog: React.FC<TierExportDialogProps> = ({
  config,
  onDismiss,
  onImportConfig,
  onShowSnackbar
}) => {
  const { isEn } = useLanguage();

  const [selectedResolution, setSelectedResolution] = useState<'1080p' | '2K' | '4K'>('2K');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'4:3' | 'classic'>('4:3');
  const [showTitle, setShowTitle] = useState(true);
  const [showYear, setShowYear] = useState(true);
  const [showDevScore, setShowDevScore] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const getOptions = (): TierImageExportOptions => {
    const scale = selectedResolution === '1080p' ? 1.0 : selectedResolution === '4K' ? 2.5 : 1.6;
    return {
      scale,
      showTitle,
      showYear,
      showDeviationScore: showDevScore,
      aspectRatio: selectedAspectRatio
    };
  };

  const previewLayout = useMemo(() => {
    const scale = selectedResolution === '1080p' ? 1.0 : selectedResolution === '4K' ? 2.5 : 1.6;
    return calculateOptimalTierLayout(config, scale, selectedAspectRatio);
  }, [config, selectedResolution, selectedAspectRatio]);


  // 1. 画像保存 (PNGダウンロード)
  const handleDownloadImage = async () => {
    setIsProcessing(true);
    try {
      const canvas = await renderTierCanvas(config, isEn, getOptions());
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `CreditDB_TierList_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onShowSnackbar(isEn ? "Tier List image downloaded!" : "Tier表の画像を保存しました！");
      onDismiss();
    } catch (e) {
      console.error(e);
      onShowSnackbar(isEn ? "Failed to generate image" : "画像の生成に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. 画像をクリップボードにコピー
  const handleCopyImage = async () => {
    setIsProcessing(true);
    try {
      const canvas = await renderTierCanvas(config, isEn, getOptions());
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Blob creation failed');
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          onShowSnackbar(isEn ? "Copied image to clipboard!" : "画像をクリップボードにコピーしました！");
          onDismiss();
        } catch (clipErr) {
          console.error(clipErr);
          // クリップボードに非対応環境ならフォールバックでダウンロードを促す
          onShowSnackbar(isEn ? "Clipboard copy not supported. Please download image." : "クリップボードコピー非対応環境です。ダウンロードをお試しください。");
        } finally {
          setIsProcessing(false);
        }
      }, 'image/png');
    } catch (e) {
      console.error(e);
      onShowSnackbar(isEn ? "Failed to copy image" : "画像のコピーに失敗しました");
      setIsProcessing(false);
    }
  };

  // 3. クリーンテキストをコピー
  const handleCopyCleanText = () => {
    let text = isEn ? "# Anime Tier List\n\n" : "# アニメTier表\n\n";
    for (const row of config.rows) {
      text += `[ ${row.name} ]\n`;
      if (row.items.length === 0) {
        text += isEn ? "- (None)\n" : "- （なし）\n";
      } else {
        for (const item of row.items) {
          const title = (isEn && item.titleEn) ? item.titleEn : (item.title || item.titleEn);
          text += `- ${title} (${item.year})\n`;
        }
      }
      text += '\n';
    }

    navigator.clipboard.writeText(text.trim());
    onShowSnackbar(isEn ? "Copied Tier list text to clipboard" : "Tier表テキストをクリップボードにコピーしました");
    onDismiss();
  };

  // 4. AI分析用Markdownをコピー
  const handleCopyMarkdown = () => {
    const md = TierAnalysisEngine.exportToMarkdown(config, isEn);
    navigator.clipboard.writeText(md);
    onShowSnackbar(isEn ? "Copied AI Markdown prompt to clipboard" : "AI分析用Markdownをクリップボードにコピーしました");
    onDismiss();
  };

  // 5. JSON エクスポート
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creditdb_tier_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowSnackbar(isEn ? "Exported backup JSON file" : "Tier表バックアップJSONを出力しました");
  };

  // 6. JSON インポート
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.rows)) {
          onImportConfig(parsed);
          onShowSnackbar(isEn ? "Successfully restored Tier list!" : "Tier表データを復元しました！");
          onDismiss();
        } else {
          onShowSnackbar(isEn ? "Invalid Tier JSON format" : "無効なTier JSONファイルです");
        }
      } catch (err) {
        onShowSnackbar(isEn ? "Failed to parse JSON file" : "JSONファイルの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] shadow-2xl border border-outlineVariant/35 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-outlineVariant/25">
          <h2 className="text-xl font-bold tracking-tight">
            {AppStrings.tierExport(isEn)}
          </h2>
          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 1. 画像エクスポート設定カード */}
          <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-outlineVariant/35 space-y-3">
            <div className="flex items-center gap-2 text-[var(--md-sys-color-primary)] font-bold text-sm">
              <Sliders className="w-4 h-4" />
              <span>{isEn ? "Image Export Options" : "画像出力・表示設定"}</span>
            </div>

            {/* 解像度選択 */}
            <div>
              <label className="text-xs text-[var(--md-sys-color-on-surface-variant)] block mb-1.5">
                {isEn ? "Resolution (Quality)" : "出力解像度"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['1080p', '2K', '4K'] as const).map((res) => {
                  const label = res === '1080p' ? 'FHD' : res === '2K' ? '2K QHD' : '4K UHD';
                  const isSelected = selectedResolution === res;
                  return (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setSelectedResolution(res)}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[var(--md-sys-color-primary-container)] border-primary text-[var(--md-sys-color-on-primary-container)] shadow-sm'
                          : 'border-outlineVariant/40 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* アスペクト比選択 */}
            <div className="pt-2 border-t border-outlineVariant/25">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 font-bold">
                  <Maximize2 className="w-3.5 h-3.5 text-primary" />
                  <span>{isEn ? "Aspect Ratio" : "画像の比率"}</span>
                </label>
                <span className="text-[10px] font-bold text-primary font-mono">
                  {previewLayout.width} × {previewLayout.height} px
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAspectRatio('4:3')}
                  className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all flex flex-col items-center ${
                    selectedAspectRatio === '4:3'
                      ? 'bg-[var(--md-sys-color-primary-container)] border-primary text-[var(--md-sys-color-on-primary-container)] shadow-sm'
                      : 'border-outlineVariant/40 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)]'
                  }`}
                >
                  <span>{isEn ? "4:3 (Auto Optimal)" : "4:3（自動最適化）"}</span>
                  <span className="text-[9px] opacity-75 font-normal">
                    {isEn ? "Balanced for SNS sharing" : "作品数に応じた構図調整"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAspectRatio('classic')}
                  className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all flex flex-col items-center ${
                    selectedAspectRatio === 'classic'
                      ? 'bg-[var(--md-sys-color-primary-container)] border-primary text-[var(--md-sys-color-on-primary-container)] shadow-sm'
                      : 'border-outlineVariant/40 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)]'
                  }`}
                >
                  <span>{isEn ? "Classic (Fixed Width)" : "固定幅 (1160px)"}</span>
                  <span className="text-[9px] opacity-75 font-normal">
                    {isEn ? "Traditional wide row" : "従来の標準横幅固定"}
                  </span>
                </button>
              </div>
            </div>

            {/* 表示項目チェックボックス */}
            <div className="pt-2 border-t border-outlineVariant/25 space-y-2">
              <label className="text-xs text-[var(--md-sys-color-on-surface-variant)] block">
                {isEn ? "Card Contents" : "作品カード内の表示項目"}
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showTitle}
                  onChange={(e) => setShowTitle(e.target.checked)}
                  className="rounded text-[var(--md-sys-color-primary)] focus:ring-0"
                />
                <span>{isEn ? "Show Title" : "作品名を表示"}</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showYear}
                  onChange={(e) => setShowYear(e.target.checked)}
                  className="rounded text-[var(--md-sys-color-primary)] focus:ring-0"
                />
                <span>{isEn ? "Show Release Year" : "放送年を表示"}</span>
              </label>

              <label className="flex items-start gap-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDevScore}
                  onChange={(e) => setShowDevScore(e.target.checked)}
                  className="rounded text-[var(--md-sys-color-primary)] focus:ring-0 mt-0.5"
                />
                <div>
                  <span>{isEn ? "Show Deviation Score" : "偏差値を表示"}</span>
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]/70">
                    {isEn ? "CreditDB metric (OFF recommended for SNS)" : "CreditDB独自指標（SNS等外部共有時はOFF推奨）"}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 2. エクスポートアクション */}
          <div className="space-y-2.5">
            {/* 画像ダウンロード */}
            <button
              onClick={handleDownloadImage}
              disabled={isProcessing}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-outlineVariant/35 hover:bg-[var(--md-sys-color-surface-container-highest)] text-left transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)]/15 text-[var(--md-sys-color-primary)] flex items-center justify-center shrink-0">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                  {AppStrings.tierExportImage(isEn)}
                </div>
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
                  {isEn ? "Download high-resolution PNG image" : "設定した解像度でPNG画像をダウンロード"}
                </div>
              </div>
            </button>

            {/* 画像クリップボードコピー */}
            <button
              onClick={handleCopyImage}
              disabled={isProcessing}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-outlineVariant/35 hover:bg-[var(--md-sys-color-surface-container-highest)] text-left transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-secondary)]/15 text-[var(--md-sys-color-secondary)] flex items-center justify-center shrink-0">
                <Image className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                  {isEn ? "Copy Image to Clipboard" : "画像をクリップボードにコピー"}
                </div>
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
                  {isEn ? "Paste directly into Discord, X, etc." : "DiscordやTwitter(X)等に直接貼り付け可能"}
                </div>
              </div>
            </button>

            {/* テキストコピー */}
            <button
              onClick={handleCopyCleanText}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-outlineVariant/35 hover:bg-[var(--md-sys-color-surface-container-highest)] text-left transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-tertiary)]/15 text-[var(--md-sys-color-tertiary)] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                  {isEn ? "Copy Tier List (Text)" : "Tier表テキストをコピー"}
                </div>
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
                  {isEn ? "Clean text list for SNS / chat" : "偏差値などの内部指標を含まないシンプルな共有用テキスト"}
                </div>
              </div>
            </button>

            {/* AI 分析用 Markdown */}
            <button
              onClick={handleCopyMarkdown}
              disabled={isProcessing}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-outlineVariant/35 hover:bg-[var(--md-sys-color-surface-container-highest)] text-left transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                  {AppStrings.tierExportMarkdownCopy(isEn)}
                </div>
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
                  {isEn ? "Full statistical data & prompt for ChatGPT / Claude" : "数理定義・全スタッフデータ・AIプロンプト付き詳細Markdown"}
                </div>
              </div>
            </button>

            {/* JSON バックアップ / リストア */}
            <div className="pt-2 border-t border-outlineVariant/25 grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJson}
                className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl border border-outlineVariant/40 text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface)]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isEn ? "Backup JSON" : "JSON保存"}</span>
              </button>

              <label className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl border border-outlineVariant/40 text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface)] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{isEn ? "Restore JSON" : "JSON復元"}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outlineVariant/25 bg-[var(--md-sys-color-surface-container)]">
          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl border border-outlineVariant/40 text-[var(--md-sys-color-on-surface)] font-bold text-sm hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
          >
            {isEn ? "Close" : "閉じる"}
          </button>
        </div>
      </div>
    </div>
  );
};
