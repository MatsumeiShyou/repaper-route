import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type DeviceMode = 'auto' | 'pc' | 'tablet' | 'mobile';
export type ActiveDeviceMode = 'pc' | 'tablet' | 'mobile';

interface InteractionContextType {
    deviceMode: DeviceMode;
    activeMode: ActiveDeviceMode;
    setDeviceMode: (mode: DeviceMode) => void;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

export const useInteraction = () => {
    const context = useContext(InteractionContext);
    if (!context) {
        throw new Error('useInteraction は InteractionProvider 内で使用する必要があります');
    }
    return context;
};

interface InteractionProviderProps {
    children: ReactNode;
}

export const InteractionProvider: React.FC<InteractionProviderProps> = ({ children }) => {
    // フェーズ 1.1: 初期化と LocalStorage 読み込み
    const [deviceMode, setDeviceModeState] = useState<DeviceMode>(() => {
        const saved = localStorage.getItem('sanctuary_device_mode');
        return (saved as DeviceMode) || 'auto';
    });

    // 実際の有効なモード（'auto' を解釈した結果）
    const [activeMode, setActiveMode] = useState<ActiveDeviceMode>('pc');

    // フェーズ 1.2 & 1.3: 適応型初期化と永続化
    useEffect(() => {
        localStorage.setItem('sanctuary_device_mode', deviceMode);

        if (deviceMode === 'auto') {
            const isTouch = window.matchMedia('(pointer: coarse)').matches;
            const width = window.innerWidth;

            if (isTouch) {
                setActiveMode(width >= 768 ? 'tablet' : 'mobile');
            } else {
                setActiveMode('pc');
            }
        } else {
            setActiveMode(deviceMode);
        }
    }, [deviceMode]);

    // 'auto' モード時のリサイズ/モード切替を動的に処理
    useEffect(() => {
        if (deviceMode !== 'auto') return;

        const handleResize = () => {
            const isTouch = window.matchMedia('(pointer: coarse)').matches;
            const width = window.innerWidth;
            if (isTouch) {
                setActiveMode(width >= 768 ? 'tablet' : 'mobile');
            } else {
                setActiveMode('pc');
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [deviceMode]);

    const setDeviceMode = useCallback((mode: DeviceMode) => {
        setDeviceModeState(mode);
    }, []);

    return (
        <InteractionContext.Provider value={{ deviceMode, activeMode, setDeviceMode }}>
            {children}
        </InteractionContext.Provider>
    );
};
