import React from 'react';
import { Shield, User, Loader2, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { Profile } from '../types';

export const ProfilePortal: React.FC = () => {
    const { profiles, login, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
            <div className="w-full max-w-md">
                <div className="bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
                    <div className="p-8 text-center bg-slate-950 border-b border-white/5">
                        <h1 className="text-3xl font-black tracking-tighter mb-1">RePaper Route</h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">TS Sanctuary Portal Access</p>
                    </div>

                    <div className="p-6 space-y-3">
                        {profiles.map((profile: Profile) => (
                            <button
                                key={profile.id}
                                onClick={() => login(profile)}
                                className="w-full p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/5 active:scale-[0.98] border border-white/5 hover:border-blue-500/50 group"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${profile.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                    {profile.role === 'admin' ? <Shield size={22} /> : <User size={22} />}
                                </div>
                                <div className="text-left flex-1">
                                    <h2 className="font-bold text-slate-200">{profile.name}</h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${profile.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'
                                            }`}>
                                            {profile.role}
                                        </span>
                                        {profile.vehicle_info && (
                                            <span className="text-[10px] text-slate-600 flex items-center gap-1 font-mono">
                                                <Truck size={10} /> {profile.vehicle_info}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-950 p-4 text-center border-t border-white/5">
                        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em]">Secondary Auth Layer (TypeScript Edition)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePortal;
