import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);

    const showNotification = useCallback((message, type = 'info') => {
        console.log(`[Notification:${type}] ${message}`);
        setNotification({ message, type, id: Date.now() });

        // Auto dismiss
        setTimeout(() => {
            setNotification(current => current?.id === notification?.id ? null : current);
        }, 3000);
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    padding: '16px',
                    background: notification.type === 'error' ? '#fee2e2' : '#dbeafe',
                    color: notification.type === 'error' ? '#991b1b' : '#1e40af',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 9999
                }}>
                    {notification.message}
                </div>
            )}
        </NotificationContext.Provider>
    );
};
