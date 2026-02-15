import React from 'react';
import { BoardDriver } from '../../../types';
import { User, Truck, PlusCircle } from 'lucide-react';

interface DriverHeaderProps {
    drivers: BoardDriver[];
    onEditHeader: (driverId: string) => void;
    onAddColumn: () => void;
    canEditBoard: boolean;
    stickyTop?: string;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
    drivers,
    onEditHeader,
    onAddColumn,
    canEditBoard,
    stickyTop = 'top-0'
}) => {
    return (
        <div className={`flex border-b border-white bg-black text-white sticky ${stickyTop} z-40 shadow-sm min-w-max`}>
            {/* 時間軸ラベル - 64px 固定 */}
            <div
                style={{ width: '64px', minWidth: '64px', flexShrink: 0 }}
                className="border-r border-white bg-gray-900 flex items-center justify-center font-bold sticky left-0 z-50 text-xs text-slate-400"
            >
                時間
            </div>
            <div className="flex">
                {drivers.map(driver => {
                    return (
                        <div
                            key={driver.id}
                            style={{ width: '180px', minWidth: '180px', flexShrink: 0 }}
                            className="border-r border-white text-center font-bold flex flex-col cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => onEditHeader(driver.id)}
                        >
                            {/* ★紙ベースを再現したコース名の黄色い帯（アルファベットのみ） */}
                            <div className="bg-yellow-400 text-black text-[11px] py-0.5 border-b border-black/20 font-bold tracking-widest uppercase">
                                {driver.course || driver.name.charAt(0)}
                            </div>
                            {/* ドライバー・車両情報 - JS版の1行スタイル */}
                            <div className="py-2 text-sm truncate px-1">
                                {driver.driverName || '未割当'} <span className="text-xs text-gray-500">/</span> {driver.currentVehicle}
                            </div>
                        </div>
                    );
                })}

                {/* Add Column Button */}
                {canEditBoard && (
                    <div
                        style={{ width: '50px', minWidth: '50px', flexShrink: 0 }}
                        className="flex items-center justify-center bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors border-r border-white"
                        onClick={onAddColumn}
                        title="コースを追加"
                    >
                        <PlusCircle size={20} className="text-gray-400 hover:text-white" />
                    </div>
                )}
            </div>
        </div>
    );
};
