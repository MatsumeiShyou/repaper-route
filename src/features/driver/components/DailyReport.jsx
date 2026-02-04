import React, { useState } from 'react';
import { ToastContainer } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';
import { CheckSquare, LogOut } from 'lucide-react';

export const DailyReport = ({
    toasts,
    removeToast,
    modalConfig,
    setModalConfig,
    onSubmit,
    onCancel
}) => {
    const [weightInput, setWeightInput] = useState('');

    const handleSubmit = () => {
        onSubmit(weightInput, () => setWeightInput(''));
    };

    return (
        <div className="bg-gray-100 dark:bg-[#111827] min-h-screen flex flex-col items-center justify-center p-4 transition-colors">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md text-center space-y-6 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckSquare size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">業務終了報告</h2>
                <p className="text-gray-500 dark:text-gray-400">本日の総重量（台貫値）を入力してください</p>

                <div className="relative">
                    <input type="number"
                        className="w-full p-4 text-3xl font-bold text-center border-2 border-blue-500 rounded-lg focus:ring-4 focus:ring-blue-200 outline-none dark:bg-gray-700 dark:text-white dark:border-blue-600"
                        placeholder="0"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">kg</span>
                </div>

                <button onClick={handleSubmit} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-transform">
                    送信して終了
                </button>

                <button onClick={onCancel} className="text-gray-400 underline text-sm hover:text-gray-600">
                    戻る
                </button>
            </div>
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                footer={
                    modalConfig.onConfirm ? (
                        <>
                            <button onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-bold">キャンセル</button>
                            <button onClick={modalConfig.onConfirm} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">OK</button>
                        </>
                    ) : (
                        <button onClick={modalConfig.onClose} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">OK</button>
                    )
                }
            >
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap text-left">{modalConfig.message}</p>
            </Modal>
        </div>
    );
};
