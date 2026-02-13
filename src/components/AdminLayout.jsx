import React from 'react';
import { Sidebar } from './Sidebar';

export const AdminLayout = ({ activeView, onViewChange, children }) => {
    return (
        <div className="flex h-screen w-screen bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
            {/* Sidebar (Fixed Width) */}
            <Sidebar activeView={activeView} onViewChange={onViewChange} />

            {/* Main Content (Flex Grow) */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* 
                   Note: The children (e.g., BoardCanvas) must handle their own internal scrolling.
                   This container provides the viewport boundaries.
                */}
                {children}
            </main>
        </div>
    );
};
