import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Monitor, Moon, Sun, Laptop } from 'lucide-react';

const SettingsPage = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-8 text-slate-800 dark:text-slate-100">設定 (System Settings)</h1>

            {/* Appearance Section */}
            <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <Monitor className="text-blue-600 dark:text-cyan-400" size={24} />
                    <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">外観設定 (Appearance)</h2>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">テーマ設定</h3>

                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => setTheme('light')}
                            className={`
                                flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                                ${theme === 'light'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-blue-300 dark:border-cyan-400'
                                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 text-slate-500 dark:text-slate-400'
                                }
                            `}
                        >
                            <Sun size={24} />
                            <span className="font-bold text-sm">Light</span>
                        </button>

                        <button
                            onClick={() => setTheme('dark')}
                            className={`
                                flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                                ${theme === 'dark'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-cyan-400 dark:border-cyan-400'
                                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 text-slate-500 dark:text-slate-400'
                                }
                            `}
                        >
                            <Moon size={24} />
                            <span className="font-bold text-sm">Dark</span>
                        </button>

                        <button
                            onClick={() => setTheme('system')}
                            className={`
                                flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                                ${theme === 'system'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-cyan-400 dark:border-cyan-400'
                                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 text-slate-500 dark:text-slate-400'
                                }
                            `}
                        >
                            <Laptop size={24} />
                            <span className="font-bold text-sm">System</span>
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        ※ Systemを選択すると、デバイスの設定に合わせて自動的に切り替わります。
                    </p>
                </div>
            </section>

            {/* Placeholder for future settings */}
            <section className="bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-6 flex items-center justify-center text-slate-400">
                <p>その他の設定項目は順次追加されます...</p>
            </section>
        </div>
    );
};

export default SettingsPage;
