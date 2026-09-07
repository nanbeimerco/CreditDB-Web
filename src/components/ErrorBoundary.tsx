import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 h-full min-h-[300px] bg-background text-onBackground text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-base font-bold text-onSurface">
            {this.props.fallbackTitle || '画面の表示中にエラーが発生しました'}
          </h3>
          <p className="text-xs text-onSurfaceVariant max-w-md font-mono bg-surfaceContainer p-3 rounded-lg border border-outlineVariant/30 text-left overflow-x-auto">
            {this.state.error?.message || '不明なエラー'}
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surfaceContainer border border-outlineVariant/40 text-xs font-bold text-onSurface hover:bg-surfaceContainerHigh transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>戻る</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-onPrimary text-xs font-bold shadow hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              <span>再読み込み</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
