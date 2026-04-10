import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import { BoardDriver } from '../../../types';

interface HeaderEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    driver: BoardDriver | null;
    masterDrivers: any[];
    masterVehicles: any[];
    onSave: (updatedDriver: BoardDriver) => void;
    onDelete?: () => void;
}

export const HeaderEditModal: React.FC<HeaderEditModalProps> = ({
    isOpen,
    onClose,
    driver,
    masterDrivers,
    masterVehicles,
    onSave,
    onDelete
}) => {
    const [course, setCourse] = useState('');
    const [selectedDriverId, setSelectedDriverId] = useState('');
    const [vehicleCallsign, setVehicleCallsign] = useState('');

    useEffect(() => {
        if (driver && isOpen) {
            setCourse(driver.course || '');
            setSelectedDriverId(driver.id || '');
            setVehicleCallsign(driver.vehicleCallsign || driver.currentVehicle || '');
        }
    }, [driver, isOpen]);

    const handleSave = () => {
        if (!driver) return;

        const selectedMaster = masterDrivers.find(d => d.id === selectedDriverId);

        const updated: BoardDriver = {
            ...driver,
            course: course,
            id: selectedDriverId, // 実際のIDを更新
            driverName: selectedMaster?.driver_name || selectedMaster?.name || driver.driverName,
            currentVehicle: vehicleCallsign,
            vehicleCallsign: vehicleCallsign
        };

        onSave(updated);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="コース・担当者編集">
            <div className="space-y-4 p-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">コース名</label>
                    <input
                        type="text"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className="w-full border rounded-md p-2 text-sm"
                        placeholder="例: Aコース"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">担当ドライバー</label>
                    <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full border rounded-md p-2 text-sm"
                    >
                        <option value="">（未設定）</option>
                        {masterDrivers.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.driver_name || d.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">使用車両（通称/番号）</label>
                    <select
                        value={vehicleCallsign}
                        onChange={(e) => setVehicleCallsign(e.target.value)}
                        className="w-full border rounded-md p-2 text-sm bg-white"
                    >
                        <option value="">（未選択）</option>
                        {masterVehicles.map(v => (
                            <option key={v.id} value={v.callsign || v.number || v.id}>
                                {v.callsign ? `${v.callsign} (${v.number})` : v.number || v.id}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-between items-center pt-4">
                    <div>
                        {course.toLowerCase().includes('test') && onDelete && (
                            <button
                                onClick={() => {
                                    if (window.confirm('このコース（列）を削除しますか？')) {
                                        onDelete();
                                        onClose();
                                    }
                                }}
                                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 border border-red-200"
                            >
                                コース削除
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            保存
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default HeaderEditModal;
