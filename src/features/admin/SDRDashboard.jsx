import React, { useState } from 'react';
import { useSDR } from './hooks/useSDR';
import { Check, X, Clock, FileText, Activity } from 'lucide-react';

export default function SDRDashboard() {
    const { proposals, decisions, loading, error, approveProposal, rejectProposal } = useSDR();
    const [activeTab, setActiveTab] = useState('proposals');

    if (loading) return <div className="p-8 text-center text-gray-500">データを読み込んでいます...</div>;
    if (error) return <div className="p-8 text-center text-red-500">エラーが発生しました: {error.message}</div>;

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Activity size={24} className="text-blue-400" />
                        SDR監査ボード
                    </h2>
                    <p className="text-slate-300 text-sm mt-1">State-Decision-Reasoning 意思決定ログモニター</p>
                </div>
                <div className="flex gap-2">
                    <TabButton
                        active={activeTab === 'proposals'}
                        onClick={() => setActiveTab('proposals')}
                        icon={<FileText size={16} />}
                        label={`提案一覧・未承認 (${proposals.filter(p => p.status === 'pending').length})`}
                    />
                    <TabButton
                        active={activeTab === 'decisions'}
                        onClick={() => setActiveTab('decisions')}
                        icon={<Check size={16} />}
                        label={`決定ログ・履歴 (${decisions.length})`}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6 bg-slate-50">
                {activeTab === 'proposals' ? (
                    <ProposalsTable
                        data={proposals}
                        onApprove={approveProposal}
                        onReject={rejectProposal}
                    />
                ) : (
                    <DecisionsTable data={decisions} />
                )}
            </div>
        </div>
    );
}

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${active
            ? 'bg-blue-500 text-white shadow-md'
            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
            }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const ProposalsTable = ({ data, onApprove, onReject }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
                <tr>
                    <th className="px-6 py-3">ステータス</th>
                    <th className="px-6 py-3">日時 (JST)</th>
                    <th className="px-6 py-3">提案者</th>
                    <th className="px-6 py-3">変更内容</th>
                    <th className="px-6 py-3">理由 (Reason)</th>
                    <th className="px-6 py-3 text-right">操作</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">現在の提案情報はありません</td></tr>
                ) : (
                    data.map(item => (
                        <tr key={item.proposal_id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <StatusBadge status={item.status} />
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                                {new Date(item.created_at).toLocaleString('ja-JP')}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">
                                {item.proposer_id}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                                {renderChangeDetails(item.proposed_value)}
                            </td>
                            <td className="px-6 py-4 text-slate-500 italic">
                                "{item.reason || '理由なし'}"
                            </td>
                            <td className="px-6 py-4 text-right">
                                {item.status === 'pending' && (
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onApprove(item.proposal_id, 'admin')}
                                            className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 flex items-center gap-1"
                                            title="承認する"
                                        >
                                            <Check size={16} /> 承認
                                        </button>
                                        <button
                                            onClick={() => onReject(item.proposal_id, 'admin')}
                                            className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex items-center gap-1"
                                            title="却下する"
                                        >
                                            <X size={16} /> 却下
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

const DecisionsTable = ({ data }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
                <tr>
                    <th className="px-6 py-3">種類</th>
                    <th className="px-6 py-3">決定日時 (JST)</th>
                    <th className="px-6 py-3">決定者</th>
                    <th className="px-6 py-3">Proposal ID</th>
                    <th className="px-6 py-3">最終値</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">決定ログはまだありません</td></tr>
                ) : (
                    data.map(item => (
                        <tr key={item.decision_id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <DecisionBadge type={item.decision_type} />
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                                {item.decided_at ? new Date(item.decided_at).toLocaleString('ja-JP') : '-'}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">
                                {item.decider_id}
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                {item.proposal_id.substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-xs font-mono">
                                {JSON.stringify(item.final_value)}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    };
    const labels = {
        pending: '保留中',
        approved: '承認済',
        rejected: '却下済',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
            {labels[status] || status}
        </span>
    );
};

const DecisionBadge = ({ type }) => {
    const styles = {
        approve: 'bg-green-100 text-green-700',
        reject: 'bg-red-100 text-red-700',
        auto_approve: 'bg-blue-100 text-blue-700',
    };
    const labels = {
        approve: '承認',
        reject: '却下',
        auto_approve: '自動承認',
    };
    const normalizeType = type.replace('-', '_');
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[normalizeType] || styles.approve}`}>
            {labels[normalizeType] || type}
        </span>
    );
};

const renderChangeDetails = (value) => {
    if (!value) return "データなし";
    try {
        const { action, target, ...rest } = typeof value === 'string' ? JSON.parse(value) : value;
        return (
            <div>
                <span className="font-semibold text-xs text-slate-500 mr-2">[{action?.toUpperCase()}]</span>
                <span>{target}</span>
            </div>
        );
    } catch (e) {
        return JSON.stringify(value);
    }
};
