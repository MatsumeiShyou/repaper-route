import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';
import { Profile, AppUser, UserRole } from '../types';

interface AuthContextType {
    currentUser: AppUser | null;
    profiles: Profile[];
    isLoading: boolean;
    login: (user: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profiles, setProfiles] = useState<Profile[]>([]);

    useEffect(() => {
        const fetchStaffs = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('role', { ascending: true })
                    .order('name');

                if (data && (data as any[]).length > 0) {
                    // Map Supabase Row to our Profile type
                    const mappedProfiles: Profile[] = (data as any[]).map(p => ({
                        id: p.id,
                        name: p.name,
                        role: (p.role as UserRole) || 'driver',
                        vehicle_info: p.vehicle_info || undefined,
                        can_edit_board: p.can_edit_board || false,
                        updated_at: p.updated_at
                    }));
                    setProfiles(mappedProfiles);
                } else {
                    // EMERGENCY MOCK for recovery
                    const mockProfiles: Profile[] = [
                        { id: '00000000-0000-0000-0000-000000000001', name: 'システム管理者 (Recov)', role: 'admin' as UserRole, can_edit_board: true, updated_at: new Date().toISOString() },
                        { id: '00000000-0000-0000-0000-000000000002', name: 'デモドライバー (Recov)', role: 'driver' as UserRole, vehicle_info: 'R-01', can_edit_board: false, updated_at: new Date().toISOString() }
                    ];
                    setProfiles(mockProfiles);
                }
                if (error) console.error("Staff Fetch Error:", error);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStaffs();
    }, []);

    const login = (user: any) => {
        const userData: AppUser = {
            id: user.id || user.user_id,
            name: user.name,
            role: (user.role as UserRole),
            allowedApps: user.allowed_apps || [],
            vehicle: user.vehicle_info || user.vehicle || undefined
        };
        setCurrentUser(userData);
    };

    const logout = () => {
        console.log("[Auth] Logout requested");
        if (window.confirm('ログアウトしますか？')) {
            console.log("[Auth] Logout confirmed - clearing user");
            setCurrentUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ currentUser, profiles, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
