import React, { useState, useEffect, useCallback } from 'react';
import { dbManager } from './db/database';
import { updateManager, UpdateCheckResult } from './db/updateManager';
import { staffResolver, characterResolver } from './utils/nameResolver';
import { workImageResolver } from './utils/workImageResolver';
import { TopAppBar } from './components/TopAppBar';
import { NavigationBar, MainTabType } from './components/NavigationBar';
import { NavigationRail } from './components/NavigationRail';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DatabaseUpdateModal } from './components/DatabaseUpdateModal';
import { ThemePaletteBottomSheet } from './components/ThemePaletteBottomSheet';
import { WorksScreen } from './screens/WorksScreen';
import { WorkDetailScreen } from './screens/WorkDetailScreen';
import { StaffScreen } from './screens/StaffScreen';
import { StaffDetailScreen } from './screens/StaffDetailScreen';
import { StudioDetailScreen } from './screens/StudioDetailScreen';
import { GuideScreen } from './screens/GuideScreen';
import { TierScreen } from './screens/tier/TierScreen';
import { SceneSearchScreen } from './screens/SceneSearchScreen';
import { useLanguage } from './theme/languageManager';
import { Database, AlertCircle, RefreshCw } from 'lucide-react';

export type SubScreen =
  | { type: 'work'; id: string }
  | { type: 'staff'; name: string }
  | { type: 'studio'; name: string }
  | { type: 'guide' };

export const App: React.FC = () => {
  const { isEn } = useLanguage();

  // App Initialization State
  const [isInitializing, setIsInitializing] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  const [initStage, setInitStage] = useState('');
  const [initError, setInitError] = useState<string | null>(null);

  // Modals
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState(false);

  // Navigation State (Native screen stack support)
  const [activeTab, setActiveTab] = useState<MainTabType>('works');
  const [screenStack, setScreenStack] = useState<SubScreen[]>([]);

  // Initialize DB & Resolvers
  const initializeApp = useCallback(async () => {
    setIsInitializing(true);
    setInitError(null);
    try {
      setInitStage(isEn ? 'Checking database...' : 'データベースの確認中...');
      setInitProgress(10);

      // 1. Initialize SQLite Database
      await dbManager.initialize((progress: number, stage: string) => {
        setInitProgress(progress);
        setInitStage(stage);
      });

      // 2. Initialize Name & Image Resolvers in background
      setInitStage(isEn ? 'Loading dictionaries...' : '辞書データを展開中...');
      await Promise.all([
        staffResolver.initialize(),
        characterResolver.initialize(),
        workImageResolver.initialize()
      ]);

      setInitProgress(100);
      setIsInitializing(false);

      // Check for update in background
      updateManager.checkForUpdates().then((res: UpdateCheckResult) => {
        if (res.hasUpdate) {
          setHasUpdateAvailable(true);
        }
      }).catch(console.warn);

    } catch (e: any) {
      console.error('App initialization failed:', e);
      setInitError(e.message || 'Initialization failed');
      setIsInitializing(false);
    }
  }, [isEn]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // グローバルな画像貼り付けリスナー: どこにいても画像がペーストされたらシーン特定タブへ誘導
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          setActiveTab('scene');
          setScreenStack([]);
          break;
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Stack Navigation Handlers
  const pushWork = (workId: string) => {
    setScreenStack((prev) => [...prev, { type: 'work', id: workId }]);
  };

  const pushStaff = (staffName: string) => {
    setScreenStack((prev) => [...prev, { type: 'staff', name: staffName }]);
  };

  const pushStudio = (studioName: string) => {
    setScreenStack((prev) => [...prev, { type: 'studio', name: studioName }]);
  };

  const pushGuide = () => {
    setScreenStack((prev) => [...prev, { type: 'guide' }]);
  };

  const handleBack = () => {
    setScreenStack((prev) => prev.slice(0, -1));
  };

  // Tab Switch
  const handleTabChange = (tab: MainTabType) => {
    setActiveTab(tab);
    setScreenStack([]);
  };

  // Loading Screen
  if (isInitializing) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] animate-fade-in">
        <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-primaryContainer flex items-center justify-center shadow-lg border border-primary/40">
              <Database className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-onBackground font-['Montserrat']">
              CreditDB
            </h1>
            <p className="text-xs text-onSurfaceVariant mt-1">
              Anime Staff & Production Analytics Engine
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-semibold text-onSurfaceVariant">
              <span className="truncate max-w-[200px]">{initStage}</span>
              <span>{Math.round(initProgress)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surfaceContainerHighest overflow-hidden">
              <div
                style={{ width: `${initProgress}%` }}
                className="h-full rounded-full bg-primary transition-all duration-300"
              />
            </div>
          </div>

          <p className="text-[11px] text-onSurfaceVariant/70">
            {isEn
              ? 'WASM SQLite database is initializing in local storage...'
              : 'WASM SQLite データベースをブラウザ内に展開しています...'}
          </p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (initError) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-background text-onBackground">
        <div className="w-full max-w-sm p-6 rounded-3xl bg-surfaceContainer border border-red-500/40 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Initialization Failed</h2>
          <p className="text-xs text-onSurfaceVariant leading-relaxed">
            {initError}
          </p>
          <button
            onClick={initializeApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-onPrimary font-bold text-sm shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  // Main App View
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-background text-onBackground font-sans antialiased selection:bg-primary selection:text-onPrimary">
      {/* 1. PC/Tablet Left Navigation Rail (独立して画面左端に常時配置、メインコンテンツに一切干渉しない) */}
      <NavigationRail
        currentTab={activeTab}
        onTabChange={handleTabChange}
        onUpdateClick={() => setIsUpdateModalOpen(true)}
        onThemeClick={() => setIsThemeModalOpen(true)}
        onGuideClick={pushGuide}
        hasUpdateAvailable={hasUpdateAvailable}
      />

      {/* 2. メイン領域 (PCではRailの右側全体、スマホでは全幅) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* モバイル用 Top App Bar (PCでは左のNavigation Railに集約されているため非表示) */}
        <div className="md:hidden flex-shrink-0">
          <TopAppBar
            onUpdateClick={() => setIsUpdateModalOpen(true)}
            onThemeClick={() => setIsThemeModalOpen(true)}
            onGuideClick={pushGuide}
            hasUpdateAvailable={hasUpdateAvailable}
          />
        </div>

        {/* メインコンテンツエリア */}
        <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          <ErrorBoundary fallbackTitle="画面の表示中にエラーが発生しました" onReset={handleBack}>
            {/* Active Tab Screen */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden ${activeTab === 'works' ? 'block' : 'hidden'}`}>
              <WorksScreen
                onNavigateToWork={pushWork}
              />
            </div>

            <div className={`flex-1 flex flex-col h-full overflow-hidden ${activeTab === 'staff' ? 'block' : 'hidden'}`}>
              <StaffScreen
                onNavigateToStaff={pushStaff}
                onNavigateToStudio={pushStudio}
              />
            </div>

            <div className={`flex-1 flex flex-col h-full overflow-hidden ${activeTab === 'tier' ? 'block' : 'hidden'}`}>
              <TierScreen
                onNavigateToWork={pushWork}
                onNavigateToStaff={pushStaff}
                onNavigateToStudio={pushStudio}
              />
            </div>

            <div className={`flex-1 flex flex-col h-full overflow-hidden ${activeTab === 'scene' ? 'block' : 'hidden'}`}>
              <SceneSearchScreen
                onNavigateToWork={pushWork}
              />
            </div>

            {/* Sub Screens Stack (スタック順に重なり、一番上の画面が最前面に表示される) */}
            {screenStack.map((sub, index) => {
              const zIndex = 40 + index;
              return (
                <div
                  key={`${sub.type}_${'id' in sub ? sub.id : ('name' in sub ? sub.name : 'guide')}_${index}`}
                  className="absolute inset-0 bg-background"
                  style={{ zIndex }}
                >
                  {sub.type === 'work' && (
                    <WorkDetailScreen
                      workId={sub.id}
                      onBack={handleBack}
                      onNavigateToStaff={pushStaff}
                      onNavigateToStudio={pushStudio}
                    />
                  )}
                  {sub.type === 'staff' && (
                    <StaffDetailScreen
                      staffName={sub.name}
                      onBack={handleBack}
                      onNavigateToWork={pushWork}
                    />
                  )}
                  {sub.type === 'studio' && (
                    <StudioDetailScreen
                      studioName={sub.name}
                      onBack={handleBack}
                      onNavigateToWork={pushWork}
                      onNavigateToStaff={pushStaff}
                    />
                  )}
                  {sub.type === 'guide' && (
                    <GuideScreen onBack={handleBack} />
                  )}
                </div>
              );
            })}
          </ErrorBoundary>
        </main>

        {/* モバイル用 ボトムナビゲーションバー (PCでは非表示) */}
        <NavigationBar
          currentTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Database Update Modal */}
      <DatabaseUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onDatabaseSwapped={() => {
          setHasUpdateAvailable(false);
        }}
      />

      {/* Theme & Language Setting Modal */}
      <ThemePaletteBottomSheet
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
};
