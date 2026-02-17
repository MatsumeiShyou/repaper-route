import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'info') => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message, type }]);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 3000);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {/* Simple Floating Notification Portal */}
            <div className="fixed bottom-4 left-4 z-[10000] flex flex-col gap-2">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        onClick={() => removeNotification(n.id)}
                        className={`px-4 py-2 rounded-lg shadow-xl border cursor-pointer animate-in slide-in-from-left duration-300 ${
                            n.type === 'error' 
                                ? 'bg-red-500 text-white border-red-600' 
                                : n.type === 'success'
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : 'bg-slate-800 text-white border-slate-700'
                        }`}
                    >
                        {n.message}
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
