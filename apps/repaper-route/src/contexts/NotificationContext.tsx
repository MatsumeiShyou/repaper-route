import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContainer, ToastItem, ToastType } from '../components/Toast';

interface NotificationContextType {
    showNotification: (message: string, type?: ToastType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<ToastItem[]>([]);

    const showNotification = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message, type }]);

        // Auto remove handled by Toast component itself (via callback), 
        // but adding an extra cleanup here for safety if needed.
    }, []);

    const removeNotification = useCallback((id: number | string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <ToastContainer toasts={notifications} removeToast={removeNotification} />
        </NotificationContext.Provider>
    );
};
