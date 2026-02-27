import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import { BoardJob, BoardDriver } from '../../../types';
import { MapPin, AlertTriangle, Plus } from 'lucide-react';
import { useSharedReasons } from '../hooks/useSharedReasons';
import { supabase } from '../../../lib/supabase/client';
import { invalidateMasterCache } from '../hooks/useMasterData';

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
    const [searchGroup, setSearchGroup] = useState('全');
    const [selectedPointId, setSelectedPointId] = useState('');
    const [reason, setReason] = useState('');
    const [reasonMode, setReasonMode] = useState<'list' | 'direct' | 'save'>('list');
    const { savedReasons, recordReasonUsage } = useSharedReasons(isOpen);

    // --- 簡易マスタ登録モード ---
    const [isNewPointMode, setIsNewPointMode] = useState(false);
    const [newPointName, setNewPointName] = useState('');
    const [newPointFurigana, setNewPointFurigana] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerError, setRegisterError] = useState<string | null>(null);

    const KANA_GROUPS = ['全', 'あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'];
    const KANA_MAPPING: Record<string, string> = {
        'あ': 'あいうえお',
        'か': 'かきくけこがぎぐげご',
        'さ': 'さしすせそざじずぜぞ',
        'た': 'たちつてとだぢづでど',
        'な': 'なにぬねの',
        'は': 'はひふへほばびぶべぼぱぴぷぺぽ',
        'ま': 'まみむめも',
        'や': 'やゆよ',
        'ら': 'らりるれろ',
        'わ': 'わをん'
    };

    const filteredPoints = masterPoints
        .filter(p => {
            if (searchGroup === '全') return true;
            if (!p.furigana || p.furigana.length === 0) return false;

            // カタカナ（全角/半角）を正規化してひらがなに変換して判定
            const normalized = p.furigana[0].normalize('NFKC');
            const firstChar = normalized.replace(/[\u30a1-\u30f6]/g, (s: string) => {
                return String.fromCharCode(s.charCodeAt(0) - 0x60);
            });

            const groupChars = KANA_MAPPING[searchGroup];
            return groupChars && groupChars.includes(firstChar);
        })
        .sort((a, b) => (a.furigana || '').localeCompare(b.furigana || '', 'ja'));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async () => {
        if (!selectedPointId || !reason || isSubmitting) return;

        const point = masterPoints.find(p => p.id === selectedPointId);
        if (!point || !driver || !time) return;

        setIsSubmitting(true);
        try {
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

            // 先に案件追加（親への通知）を実行
            onAdd(newJob, reason);

            // 理由の保存・更新（同期完了を待機）
            if (reasonMode === 'save' || reasonMode === 'list') {
                await recordReasonUsage(reason, reasonMode === 'save');
            }

            onClose();
            // Reset state
            setSelectedPointId('');
            setReason('');
            setSearchGroup('全');
            setReasonMode('list');
            setIsNewPointMode(false);
            setNewPointName('');
            setNewPointFurigana('');
            setRegisterError(null);
        } catch (error: any) {
            console.error('Failed to inject job or save reason:', error);
            alert(`データベースの保存に失敗しました。\n詳細: ${error?.message || error?.details || 'Unknown Error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="案件の手動追加">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">回収先を読みで選択</label>
                    <div className="grid grid-cols-6 gap-1">
                        {KANA_GROUPS.map(group => (
                            <button
                                key={group}
                                onClick={() => setSearchGroup(group)}
                                className={`h-8 text-xs font-bold rounded border transition-all
                                    ${searchGroup === group
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'}
                                `}
                                data-sada-id={`kana-btn-${group}`}
                            >
                                {group}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-h-56 overflow-y-auto border rounded-lg divide-y divide-slate-50 shadow-inner bg-slate-50/30">
                    {filteredPoints.length > 0 ? filteredPoints.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPointId(p.id)}
                            className={`w-full text-left p-3 text-sm transition-colors flex items-center gap-3
                                ${selectedPointId === p.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-white'}
                            `}
                            data-sada-id={`point-item-${p.id}`}
                        >
                            <MapPin size={14} className={selectedPointId === p.id ? 'text-blue-500' : 'text-slate-300'} />
                            <div>
                                <div className="font-bold text-slate-700">{p.display_name}</div>
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-blue-500 font-medium">{p.furigana || '読みなし'}</span>
                                    <span className="text-slate-400 truncate max-w-[150px]">{p.address}</span>
                                </div>
                            </div>
                        </button>
                    )) : (
                        <div className="p-12 text-center text-slate-400 text-xs">該当する回収先が見つかりません</div>
                    )}
                </div>

                {/* 簡易マスタ登録フォーム */}
                {!isNewPointMode ? (
                    <button
                        onClick={() => setIsNewPointMode(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all"
                        data-sada-id="open-quick-register"
                    >
                        <Plus size={14} />
                        一覧にない場合→新規登録して追加
                    </button>
                ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2" data-sada-id="quick-register-form">
                        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">簡易マスタ登録</p>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={newPointName}
                                onChange={(e) => setNewPointName(e.target.value)}
                                placeholder="名称（必須）"
                                className="border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                data-sada-id="quick-register-name"
                            />
                            <input
                                type="text"
                                value={newPointFurigana}
                                onChange={(e) => setNewPointFurigana(e.target.value)}
                                placeholder="フリガナ"
                                className="border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                data-sada-id="quick-register-furigana"
                            />
                        </div>
                        {registerError && (
                            <p className="text-[10px] text-red-600">{registerError}</p>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setIsNewPointMode(false); setRegisterError(null); }}
                                className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border rounded hover:bg-slate-50"
                            >
                                戻る
                            </button>
                            <button
                                onClick={async () => {
                                    if (!newPointName.trim()) {
                                        setRegisterError('名称は必須です');
                                        return;
                                    }
                                    setIsRegistering(true);
                                    setRegisterError(null);
                                    try {
                                        const newId = `spot-${Date.now()}`;
                                        const { error: rpcErr } = await (supabase as any).rpc('rpc_execute_master_update', {
                                            p_table_name: 'master_collection_points',
                                            p_core_data: {
                                                location_id: newId,
                                                name: newPointName.trim(),
                                                display_name: newPointName.trim(),
                                                furigana: newPointFurigana.trim() || null,
                                                is_active: true
                                            },
                                            p_reason: '配車盤からの簡易マスタ登録（スポット案件対応）'
                                        });
                                        if (rpcErr) throw rpcErr;
                                        invalidateMasterCache();
                                        // 登録成功→即座に選択状態にする
                                        setSelectedPointId(newId);
                                        setIsNewPointMode(false);
                                        setNewPointName('');
                                        setNewPointFurigana('');
                                    } catch (err: any) {
                                        console.error('[QuickRegister] Failed:', err);
                                        setRegisterError(`登録失敗: ${err?.message || err?.details || 'Unknown'}`);
                                    } finally {
                                        setIsRegistering(false);
                                    }
                                }}
                                disabled={isRegistering || !newPointName.trim()}
                                className={`flex-1 px-3 py-1.5 text-xs font-bold text-white rounded transition-all
                                    ${isRegistering || !newPointName.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                                `}
                                data-sada-id="quick-register-submit"
                            >
                                {isRegistering ? '登録中...' : '登録して選択'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">追加の理由 <span className="text-red-500">*</span></label>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            {[
                                { id: 'list', label: 'リスト' },
                                { id: 'direct', label: '入力' },
                                { id: 'save', label: '登録' }
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setReasonMode(mode.id as any)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all
                                        ${reasonMode === mode.id
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'}
                                    `}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {reasonMode === 'list' ? (
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white h-11"
                            data-sada-id="injection-reason-select"
                        >
                            <option value="">--- 理由を選択してください ---</option>
                            {savedReasons.map((r, i) => (
                                <option key={i} value={r}>{r}</option>
                            ))}
                        </select>
                    ) : (
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={reasonMode === 'save' ? "この理由をリストに保存して追加します" : "今回の追加理由を入力してください"}
                            className="w-full border rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            required
                            data-sada-id="injection-reason-input"
                        />
                    )}
                    {reasonMode === 'save' && (
                        <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1">
                            <span className="inline-block w-1 h-1 bg-blue-500 rounded-full"></span>
                            入力した理由はチーム全体の「リスト」に蓄積されます
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!selectedPointId || !reason || isSubmitting}
                        className={`px-6 py-2 text-sm font-bold text-white rounded-md transition-all
                            ${!selectedPointId || !reason || isSubmitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200'}
                        `}
                        data-sada-id="add-job-button"
                    >
                        {isSubmitting ? '処理中...' : '案件を追加'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddJobModal;
