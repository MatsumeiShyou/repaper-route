import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCcw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[ErrorBoundary:${this.props.name || 'Global'}]`, error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-red-100 overflow-hidden">
                        <div className="bg-red-600 px-6 py-4 flex items-center gap-3 text-white">
                            <AlertOctagon size={24} />
                            <h1 className="text-lg font-bold">システムエラーが発生しました</h1>
                        </div>

                        <div className="p-6">
                            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                                アプリケーションの実行中に予期せぬエラーが発生しました。
                                {this.state.error?.message && (
                                    <span className="block mt-2 font-mono text-red-500 bg-red-50 p-2 rounded text-xs break-all">
                                        Detail: {this.state.error.message}
                                    </span>
                                )}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={this.handleReload}
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md"
                                >
                                    <RefreshCcw size={18} />
                                    ページを再読み込み
                                </button>
                                <button
                                    onClick={this.handleGoHome}
                                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Home size={18} />
                                    トップに戻る
                                </button>
                            </div>

                            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                                <details className="mt-8">
                                    <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                                        Stack Trace (Dev only)
                                    </summary>
                                    <pre className="mt-2 p-3 bg-slate-900 text-slate-300 text-[10px] rounded overflow-auto max-h-40 leading-tight font-mono">
                                        {this.state.error?.stack}
                                        {"\n\nComponent Stack:\n"}
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
