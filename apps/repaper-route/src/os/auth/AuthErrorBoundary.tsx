import { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, LogIn, RefreshCcw } from 'lucide-react';
import { AuthBaseError, NotAuthenticatedError, AppAccessDeniedError, StaffNotFoundError } from './types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * TBNY DXOS : AuthErrorBoundary
 * React 19 の非同期解決 (use) 中に発生した認証・認可エラーを捕捉し、
 * ユーザーに適切なアクションを促すプレミアム UI を提供する。
 */
export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AuthErrorBoundary] Caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  public render() {
    const { error } = this.state;

    if (error) {
      // 認証関連のエラーか判定
      const isAuthError = error instanceof AuthBaseError;
      
      let title = "システムエラー";
      let message = "予期せぬエラーが発生しました。";
      let icon = <ShieldAlert size={40} />;
      let actionLabel = "再読み込み";
      let showLoginButton = false;

      if (isAuthError) {
        if (error instanceof NotAuthenticatedError) {
          title = "認証が必要です";
          message = error.message;
          icon = <LogIn size={40} />;
          actionLabel = "サインイン画面へ";
          showLoginButton = true;
        } else if (error instanceof StaffNotFoundError || error instanceof AppAccessDeniedError) {
          title = "アクセス権限がありません";
          message = error.message;
          icon = <ShieldAlert size={40} />;
        }
      }

      return (
        <div id="auth-error-gate" className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/20 rounded-3xl p-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500">
              {icon}
            </div>
            
            <h2 id="auth-error-title" className="text-2xl font-black text-white mb-4 tracking-tight">
              {title}
            </h2>
            
            <p id="auth-error-message" className="text-slate-400 text-sm leading-relaxed mb-8">
              {message}
            </p>

            <div className="space-y-3">
              <button
                id="auth-error-action-primary"
                onClick={this.handleReset}
                className="w-full h-12 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2"
              >
                {showLoginButton ? <LogIn size={16} /> : <RefreshCcw size={16} />}
                {actionLabel}
              </button>
              
              <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase mt-6">
                Error Code: {isAuthError ? (error as AuthBaseError).code : 'UNKNOWN_EXCEPTION'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
