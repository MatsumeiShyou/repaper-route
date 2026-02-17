import React from 'react';

export const MasterPlaceholder = ({ title, icon: Icon }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-gray-50 border-4 border-dashed border-gray-200 rounded-xl m-8">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                {Icon && <Icon size={48} className="text-slate-300" />}
            </div>
            <h2 className="text-2xl font-bold text-slate-600 mb-2">{title}</h2>
            <p className="text-slate-400 max-w-sm text-center">
                このマスタ管理機能は現在準備中です。
                <br />
                DBスキーマは既に定義されており、近日中にUIが実装されます。
            </p>
            <div className="mt-8 flex gap-2">
                <span className="px-3 py-1 bg-gray-200 rounded text-xs font-mono">SCHEMA: READY</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-mono">UI: PENDING</span>
            </div>
        </div>
    );
};
