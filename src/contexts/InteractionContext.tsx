import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
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

    // フェーズ 1.2: ウィンドウサイズ/タッチ特性の監視 (派生用)
    const [windowMetrics, setWindowMetrics] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        isTouch: typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowMetrics({
                width: window.innerWidth,
                isTouch: window.matchMedia('(pointer: coarse)').matches
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 実際の有効なモード（F-SSOT: 状態ではなく memo による導出）
    const activeMode = useMemo<ActiveDeviceMode>(() => {
        if (deviceMode !== 'auto') return deviceMode;

        if (windowMetrics.isTouch) {
            return windowMetrics.width >= 768 ? 'tablet' : 'mobile';
        }
        return 'pc';
    }, [deviceMode, windowMetrics]);

    // フェーズ 1.3: 永続化のみを担当する副作用
    useEffect(() => {
        localStorage.setItem('sanctuary_device_mode', deviceMode);
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
