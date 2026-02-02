import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

/**
 * Toast Component
 * Displays a floating notification.
 * 
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {string} message - Notification text
 * @param {function} onClose - Function to close the toast
 */
export const Toast = ({ type = 'info', message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Auto close after 3s
        return () => clearTimeout(timer);
    }, [onClose]);

    const config = {
        success: { icon: CheckCircle, bg: 'bg-green-500', border: 'border-green-600' },
        error: { icon: AlertCircle, bg: 'bg-red-500', border: 'border-red-600' },
        info: { icon: Info, bg: 'bg-blue-500', border: 'border-blue-600' }
    };

    const { icon: Icon, bg, border } = config[type] || config.info;

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white ${bg} border-b-4 ${border} animate-in slide-in-from-top-4 duration-300 max-w-sm w-full pointer-events-auto`}>
            <Icon size={24} className="flex-shrink-0" />
            <p className="font-bold text-sm flex-grow">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X size={16} />
            </button>
        </div>
    );
};

/**
 * ToastContainer
 * Places toasts fixed on the screen.
 */
export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};
