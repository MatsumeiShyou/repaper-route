import React from 'react';
import { Plus } from 'lucide-react';

export const DriverHeader = ({ drivers, onEditHeader, onAddColumn, canEditBoard, stickyTop = 'top-0' }) => {
    return (
        <div className={`flex border-b border-white bg-black text-white sticky ${stickyTop} z-40 shadow-sm min-w-max`}>
            <div className="w-16 flex-shrink-0 border-r border-white bg-gray-900 flex items-center justify-center font-bold sticky left-0 z-50">時間</div>
            <div className="flex">
                {drivers.map(driver => {
                    // Logic: Use callsign if available, fallback to number or the field itself
                    const vehicleDisplay = driver.vehicleCallsign || driver.currentVehicle;

                    return (
                        <div
                            key={driver.id}
                            className="w-[180px] border-r border-white text-center font-bold flex flex-col cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => onEditHeader(driver.id)}
                        >
                            {/* ★紙ベースを再現したコース名の黄色い帯（アルファベットのみ） */}
                            <div className="bg-yellow-400 text-black text-[11px] py-0.5 border-b border-black/20 font-bold tracking-widest uppercase">
                                {driver.course || driver.name.charAt(0)}
                            </div>
                            {/* ドライバー・車両情報 */}
                            <div className="py-2 text-sm">
                                {driver.driverName || '未割当'} <span className="text-xs text-gray-500">/</span> {vehicleDisplay}
                            </div>
                        </div>
                    );
                })}

                {/* Add Column Button */}
                {canEditBoard && (
                    <div
                        className="w-[50px] flex items-center justify-center bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors border-r border-white"
                        onClick={onAddColumn}
                        title="コースを追加"
                    >
                        <Plus size={20} className="text-gray-400 hover:text-white" />
                    </div>
                )}
            </div>
        </div >
    );
};
