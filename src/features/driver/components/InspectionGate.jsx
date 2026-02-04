import React from 'react';
import { ToastContainer } from '../../../components/Toast'; // Assuming shared components stay in src/components or src/shared
import { CheckSquare, Sun, Moon } from 'lucide-react';

export const InspectionGate = ({
    vehicleInfo,
    inspectionItems,
    onCheck,
    onStartWork,
    theme,
    onToggleTheme,
    toasts,
    removeToast
}) => {
    return (
        <div className="bg-white dark:bg-gray-900 min-h-screen flex flex-col transition-colors duration-300">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <header className="bg-gray-800 text-white p-4 text-center shadow-md flex justify-between items-center">
                <div className="w-8"></div>
                <div>
                    <h1 className="text-xl font-bold">{new Date().toLocaleDateString('ja-JP')} 始業前点検</h1>
                    <p className="text-sm text-gray-400">{vehicleInfo}</p>
                </div>
                <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </header>
            <main className="flex-grow p-4 overflow-y-auto space-y-3">
                {inspectionItems.map(item => (
                    <label key={item.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer active:scale-[0.98] transition-transform">
                        <input type="checkbox" className="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={item.checked}
                            onChange={() => onCheck(item.id)}
                        />
                        <span className="ml-4 text-gray-800 dark:text-gray-200 text-lg">{item.text}</span>
                    </label>
                ))}
            </main>
            <footer className="p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900">
                <button onClick={onStartWork} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <CheckSquare /> 点検完了・業務開始
                </button>
            </footer>
        </div>
    );
};
