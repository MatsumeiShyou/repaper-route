import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase/client';

export type DeviceMode = 'auto' | 'pc' | 'tablet' | 'mobile';
export type ActiveDeviceMode = 'pc' | 'tablet' | 'mobile';

interface InteractionContextType {
    deviceMode: DeviceMode;
    activeMode: ActiveDeviceMode;
    setDeviceMode: (mode: DeviceMode) => void;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
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
    const { currentUser } = useAuth();

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
            const isTouch = window.matchMedia
                ? window.matchMedia('(pointer: coarse)').matches
                : false;
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
            const isTouch = window.matchMedia
                ? window.matchMedia('(pointer: coarse)').matches
                : false;
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

    // クラウドから初期値をフェッチ
    useEffect(() => {
        if (!currentUser) return;

        const loadProfileMode = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('device_mode')
                    .eq('id', currentUser.id)
                    .single();

                if (error) {
                    console.error("[InteractionContext] Failed to fetch device_mode from profiles:", error.message);
                    return;
                }

                if (data && data.device_mode && data.device_mode !== deviceMode) {
                    setDeviceModeState(data.device_mode as DeviceMode);
                }
            } catch (err) {
                console.error("[InteractionContext] device_mode fetch error:", err);
            }
        };

        loadProfileMode();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    // モードをセットし、クラウドと同期する
    const syncTimer = useRef<NodeJS.Timeout | null>(null);

    const setDeviceMode = useCallback((mode: DeviceMode) => {
        setDeviceModeState(mode);

        if (!currentUser) return;

        // デバウンスによる Supabase 同期
        if (syncTimer.current) clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(async () => {
            const { error } = await supabase
                .from('profiles')
                .update({ device_mode: mode })
                .eq('id', currentUser.id);

            if (error) {
                console.error("[InteractionContext] device_mode sync error:", error);
            }
        }, 500);
    }, [currentUser]);

    return (
        <InteractionContext.Provider value={{ deviceMode, activeMode, setDeviceMode }}>
            {children}
        </InteractionContext.Provider>
    );
};
