import React from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { LogicResult } from '../../logic/types';
import { useInteraction } from '../../../contexts/InteractionContext';

interface CellHUDProps {
    // E2.1: 厳格な Prop 型定義。 `children` は受け付けない。
    onAdd: () => void;
    onClose: () => void;
    violation?: LogicResult | null;
}

export const CellHUD: React.FC<CellHUDProps> = ({ onAdd, onClose, violation }) => {
    const { activeMode } = useInteraction();

    // E2.2: デバイスモードに基づき、タッチターゲットのサイズを調整
    const buttonSizeClass = activeMode === 'pc'
        ? 'w-10 h-10'
        : 'w-12 h-12'; // タッチデバイス向けに 48px ターゲットを確保

    const iconSize = activeMode === 'pc' ? 20 : 24;

    return (
        // イベントのバブリングを防ぐため、クリックイベントをキャプチャ
        <div
            className="absolute inset-0 flex items-center justify-center p-1 bg-blue-500/10 backdrop-blur-[1px] rounded transition-all z-50 pointer-events-auto"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            data-sada-id="cell-hud-container"
        >
            {/* E2.4: 予測的バリデーション UI */}
            {violation && !violation.isFeasible && (
                <div className="absolute top-1 left-1 right-1 flex justify-center">
                    <div className="bg-red-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm whitespace-nowrap overflow-hidden">
                        <AlertTriangle size={8} />
                        {violation.reason[0] || '違反'}
                    </div>
                </div>
            )}

            <div className="flex gap-2 relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // 「HUDをタップして追加」の要件を満たす
                        onAdd();
                        onClose();
                    }}
                    className={`${buttonSizeClass} bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95`}
                    title="この時間に追加"
                    data-sada-id="cell-hud-add-btn"
                >
                    <Plus size={iconSize} strokeWidth={2.5} />
                </button>

                {/* 背景インターセプトで不十分な場合に備え、閉じるボタンを追加することも可能だが、
                    ミニマリスト仕様に従い「プラス」ボタンのみに限定。 */}
            </div>

            {/* 
                E2.3: ミニマリスト制約の強制
                汎用的な children やアクション配列のマッピングは行わない。
                これにより、物理的に「操作パネル」が再発することを防ぐ。
            */}
        </div>
    );
};
