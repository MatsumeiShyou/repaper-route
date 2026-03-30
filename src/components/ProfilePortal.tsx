import React, { useState } from 'react';
import { Shield, Loader2, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase/client';

export const ProfilePortal: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            setError('メールアドレスまたはパスワードが正しくありません。');
            setIsLoading(false);
        }
        // 成功時は AuthProvider の onAuthStateChange が SIGNED_IN を検知し自動遷移
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
            <div className="w-full max-w-sm">
                <div className="bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
                    <div className="p-8 text-center bg-slate-950 border-b border-white/5">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-500">
                            <Shield size={28} />
                        </div>
                        <h1 className="text-2xl font-black tracking-tighter mb-1">RePaper Route</h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                            Sanctuary DXOS Portal Access
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="p-6 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                メールアドレス
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-600"
                                placeholder="staff@example.com"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                パスワード
                            </label>
                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-600"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-rose-900/30 border border-rose-500/30 rounded-xl text-rose-400 text-xs animate-in fade-in">
                                <AlertCircle size={14} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={16} />
                                    ログイン
                                </>
                            )}
                        </button>
                    </form>

                    <div className="bg-slate-950 p-4 text-center border-t border-white/5">
                        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em]">
                            Powered by TBNY DXOS Auth Layer
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePortal;
