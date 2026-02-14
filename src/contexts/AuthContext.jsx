import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profiles, setProfiles] = useState([]);

    // Staffs Fetch (Revised for Base OS)
    useEffect(() => {
        const fetchStaffs = async () => {
            try {
                const { data, error } = await supabase
                    .from('staffs')
                    .select('*')
                    .order('role', { ascending: true }) // ADMIN first
                    .order('name');

                if (data) setProfiles(data); // Keeping variable name 'profiles' for minimal impact on consumers
                if (error) console.error("Staff Fetch Error:", error);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStaffs();
    }, []);

    // Session Persistence (Optional - for now just memory as per current App.jsx)
    // If needed we can add localStorage persistence later.

    const login = (user) => {
        const userData = {
            id: user.id || user.user_id, // Normalize ID
            name: user.name,
            role: user.role,
            allowedApps: user.allowed_apps || [], // Added for Base OS
            vehicle: user.vehicle_info || user.vehicle // Normalize Vehicle
        };
        setCurrentUser(userData);
    };

    const logout = () => {
        if (confirm('ログアウトしますか？')) {
            setCurrentUser(null);
        }
    };

    const value = {
        currentUser,
        profiles,
        isLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
