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
    const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
        const saved = localStorage.getItem('repaper_auth_user');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // [AUDIT] ダミー ID (0000...) の残存を物理検知し、あればパージする
                if (parsed?.id && parsed.id.startsWith('00000000-0000')) {
                    console.warn("[Auth] Legacy dummy ID detected - Purging...");
                    localStorage.removeItem('repaper_auth_user');
                    return null;
                }
                return parsed;
            } catch (e) {
                console.error("Failed to parse saved auth user", e);
            }
        }
        return null;
    });
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
                    setProfiles([]);
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

    useEffect(() => {
        // [AUDIT] 100pt Auth Sync
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log(`[Auth Event] ${event}`, session?.user?.id);
            if (event === 'SIGNED_IN' && session?.user) {
                const user = session.user;
                const userData: AppUser = {
                    id: user.id,
                    name: user.user_metadata?.name || user.email || 'User',
                    role: (user.user_metadata?.role as UserRole) || 'driver',
                    allowedApps: user.user_metadata?.allowed_apps || [],
                    vehicle: user.user_metadata?.vehicle_info || undefined
                };
                setCurrentUser(userData);
                localStorage.setItem('repaper_auth_user', JSON.stringify(userData));
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                localStorage.removeItem('repaper_auth_user');
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const login = (user: any) => {
        // [Legacy Support] Keep state for UI but let onAuthStateChange be the master
        const userData: AppUser = {
            id: user.id || user.user_id,
            name: user.name,
            role: (user.role as UserRole),
            allowedApps: user.allowed_apps || [],
            vehicle: user.vehicle_info || user.vehicle || undefined
        };
        setCurrentUser(userData);
        localStorage.setItem('repaper_auth_user', JSON.stringify(userData));
    };

    const logout = async () => {
        console.log("[Auth] Logout requested");
        if (window.confirm('ログアウトしますか？')) {
            console.log("[Auth] Logout confirmed - clearing session");
            await supabase.auth.signOut();
            setCurrentUser(null);
            localStorage.removeItem('repaper_auth_user');
        }
    };

    return (
        <AuthContext.Provider value={{ currentUser, profiles, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
