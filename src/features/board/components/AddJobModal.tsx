import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import { BoardJob, BoardDriver } from '../../../types';
import { Search, MapPin, AlertTriangle } from 'lucide-react';

interface AddJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    driver: BoardDriver | null;
    time: string | null;
    masterPoints: any[];
    onAdd: (job: BoardJob, reason: string) => void;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({
    isOpen,
    onClose,
    driver,
    time,
    masterPoints,
    onAdd
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPointId, setSelectedPointId] = useState('');
    const [reason, setReason] = useState('');

    const filteredPoints = masterPoints.filter(p =>
        p.display_name?.includes(searchQuery) ||
        p.address?.includes(searchQuery)
    ).slice(0, 10);

    const handleAdd = () => {
        if (!selectedPointId || !reason) return;

        const point = masterPoints.find(p => p.id === selectedPointId);
        if (!point || !driver || !time) return;

        const newJob: BoardJob = {
            id: `manual-${Date.now()}`,
            title: point.display_name || point.name,
            bucket: 'スポット', // Manual injection is basically a spot job
            taskType: 'collection',
            driverId: driver.id,
            timeConstraint: time,
            startTime: time,
            duration: 30, // Default duration
            area: point.display_name || point.name,
            location_id: point.id,
            address: point.address,
            item_category: point.target_item_category?.[0] || '一般廃棄物',
            isSpot: true
        };

        onAdd(newJob, reason);
        onClose();
        // Reset state
        setSelectedPointId('');
        setReason('');
        setSearchQuery('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="新規案件の手動追加">
            <div className="space-y-4 p-4 max-w-md" data-sada-id="manual-injection-modal">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                    <div className="text-xs text-amber-800 leading-relaxed">
                        <p className="font-bold mb-1">手動割り込みの記録 (Double Loop)</p>
                        <p>巡回ルート外の案件を手動で追加します。この操作は「イレギュラーな判断」として蓄積され、将来のルート最適化の学習データとなります。</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100">
                    <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">対象車両</label>
                        <div className="text-sm font-bold text-slate-700">{driver?.driverName} ({driver?.currentVehicle})</div>
                    </div>
                    <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">開始予定</label>
                        <div className="text-sm font-bold text-blue-600">{time}</div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">回収先を検索</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="地点名・住所で検索..."
                            className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            data-sada-id="point-search-input"
                        />
                    </div>
                </div>

                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y divide-slate-50">
                    {filteredPoints.length > 0 ? filteredPoints.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPointId(p.id)}
                            className={`w-full text-left p-3 text-sm transition-colors flex items-center gap-3
                                ${selectedPointId === p.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}
                            `}
                            data-sada-id={`point-item-${p.id}`}
                        >
                            <MapPin size={14} className={selectedPointId === p.id ? 'text-blue-500' : 'text-slate-300'} />
                            <div>
                                <div className="font-bold">{p.display_name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{p.address}</div>
                            </div>
                        </button>
                    )) : (
                        <div className="p-8 text-center text-slate-400 text-xs">回収先が見つかりません</div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">追加の理由 <span className="text-red-500">*</span></label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="例: 排出元からの当日電話依頼。急ぎのため。"
                        className="w-full border rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        required
                        data-sada-id="injection-reason-input"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!selectedPointId || !reason}
                        className={`px-6 py-2 text-sm font-bold text-white rounded-md transition-all
                            ${!selectedPointId || !reason ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200'}
                        `}
                        data-sada-id="add-job-button"
                    >
                        案件を追加
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddJobModal;
