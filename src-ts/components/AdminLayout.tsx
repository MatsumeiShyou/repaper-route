import React from 'react';
import { Sidebar } from './Sidebar';

interface AdminLayoutProps {
    activeView: string;
    onViewChange: (view: string) => void;
    children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ activeView, onViewChange, children }) => {
    return (
        <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
            {/* Sidebar (Fixed Width) */}
            <Sidebar activeView={activeView} onViewChange={onViewChange} />

            {/* Main Content (Flex Grow) */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {children}
            </main>
        </div>
    );
};
