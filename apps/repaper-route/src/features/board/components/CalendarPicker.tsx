import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getHolidayInfo } from '../utils/holidayUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind Class Merger Utility
 */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CalendarPickerProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    onClose: () => void;
    userRole?: string;
}

/**
 * CalendarPicker - AGENTS.md 100pt Version
 * F-SSOT: 「表示月」のみを基本状態とし、グリッドや祝日フラグはすべて純粋派生。
 */
export const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onDateChange, onClose, userRole }) => {
    // 【100pt 統治】管理者判定
    const isAdmin = userRole === 'admin';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDateLimit = new Date(today);
    minDateLimit.setMonth(today.getMonth() - 1);
    minDateLimit.setDate(1); // 1ヶ月前の月初

    const maxDateLimit = new Date(today);
    maxDateLimit.setMonth(today.getMonth() + 1);
    maxDateLimit.setDate(new Date(maxDateLimit.getFullYear(), maxDateLimit.getMonth() + 1, 0).getDate()); // 1ヶ月後の月末

    // SSOT: 現在表示している「年月」
    const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    // UI Mode: 'calendar' | 'month' | 'year'
    const [mode, setMode] = useState<'calendar' | 'month' | 'year'>('calendar');

    // キーボード操作用のフォーカス管理
    const [focusedDate, setFocusedDate] = useState(new Date(selectedDate));

    // ESCキー等のイベントリスナー
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // 派生状態: カレンダーグリッド (F-SSOT準拠)
    const calendarGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }
        return days;
    }, [viewDate]);

    const handlePrev = () => {
        if (!isAdmin) {
            const nextViewMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
            if (nextViewMonth < minDateLimit) return;
        }
        if (mode === 'calendar') {
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
        } else if (mode === 'year') {
            if (!isAdmin) return; // Year navigation restricted for drivers
            setViewDate(new Date(viewDate.getFullYear() - 12, viewDate.getMonth(), 1));
        }
    };

    const handleNext = () => {
        if (!isAdmin) {
            const nextViewMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
            if (nextViewMonth > maxDateLimit) return;
        }
        if (mode === 'calendar') {
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
        } else if (mode === 'year') {
            if (!isAdmin) return; // Year navigation restricted for drivers
            setViewDate(new Date(viewDate.getFullYear() + 12, viewDate.getMonth(), 1));
        }
    };

    const handleToday = () => {
        const today = new Date();
        onDateChange(today);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (mode !== 'calendar') return;

        let nextDate = new Date(focusedDate);
        if (e.key === 'ArrowRight') nextDate.setDate(focusedDate.getDate() + 1);
        else if (e.key === 'ArrowLeft') nextDate.setDate(focusedDate.getDate() - 1);
        else if (e.key === 'ArrowUp') nextDate.setDate(focusedDate.getDate() - 7);
        else if (e.key === 'ArrowDown') nextDate.setDate(focusedDate.getDate() + 7);
        else if (e.key === 'Enter' || e.key === ' ') {
            onDateChange(focusedDate);
            onClose();
            return;
        } else return;

        e.preventDefault();
        setFocusedDate(nextDate);
        // 表示月がズレる場合は更新
        if (nextDate.getMonth() !== viewDate.getMonth() || nextDate.getFullYear() !== viewDate.getFullYear()) {
            setViewDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
        }
    };

    return (
        <div
            className="absolute top-full left-0 mt-3 p-4 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-black/5 z-50 w-72 animate-in fade-in zoom-in duration-200 outline-none"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <button 
                    onClick={handlePrev} 
                    disabled={!isAdmin && (new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1) < minDateLimit)}
                    className="p-1.5 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed rounded-lg transition-colors text-slate-500"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="flex gap-1">
                    <button
                        onClick={() => isAdmin && setMode(mode === 'year' ? 'calendar' : 'year')}
                        className={cn(
                            "text-sm font-bold text-slate-700 hover:bg-slate-100 px-1.5 py-0.5 rounded-md transition-colors",
                            !isAdmin && "cursor-default hover:bg-transparent"
                        )}
                    >
                        {viewDate.getFullYear()}年
                    </button>
                    <button
                        onClick={() => isAdmin && setMode(mode === 'month' ? 'calendar' : 'month')}
                        className={cn(
                            "text-sm font-bold text-slate-700 hover:bg-slate-100 px-1.5 py-0.5 rounded-md transition-colors",
                            !isAdmin && "cursor-default hover:bg-transparent"
                        )}
                    >
                        {viewDate.getMonth() + 1}月
                    </button>
                </div>

                <button 
                    onClick={handleNext} 
                    disabled={!isAdmin && (new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1) > maxDateLimit)}
                    className="p-1.5 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed rounded-lg transition-colors text-slate-500"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {mode === 'calendar' && (
                <>
                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-1">
                        {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                            <span key={d} className={cn(
                                "text-[10px] font-bold text-center py-1 uppercase tracking-wider",
                                i === 0 ? "text-rose-500" : i === 6 ? "text-blue-500" : "text-slate-400"
                            )}>
                                {d}
                            </span>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarGrid.map(({ date, isCurrentMonth }, idx) => {
                            const holiday = getHolidayInfo(date);
                            const isSelected = selectedDate.toDateString() === date.toDateString();
                            const isToday = new Date().toDateString() === date.toDateString();
                            const isFocused = focusedDate.toDateString() === date.toDateString();

                            // 【100pt 統治】ドライバー権限の前後1ヶ月制限チェック
                            const isAdmin = userRole === 'admin';
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const minAllowed = new Date(today);
                            minAllowed.setMonth(today.getMonth() - 1);
                            const maxAllowed = new Date(today);
                            maxAllowed.setMonth(today.getMonth() + 1);

                            const isRestricted = !isAdmin && (date < minAllowed || date > maxAllowed);
                            const restrictionMsg = isRestricted ? "計画は確定されていません" : (holiday?.name || undefined);

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (isRestricted) return; // ガード
                                        onDateChange(date);
                                        onClose();
                                    }}
                                    onMouseEnter={() => !isRestricted && setFocusedDate(date)}
                                    disabled={isRestricted}
                                    title={restrictionMsg}
                                    className={cn(
                                        "relative h-8 w-8 text-xs rounded-lg flex items-center justify-center transition-all duration-200 outline-none",
                                        isRestricted ? "text-slate-200 cursor-not-allowed bg-slate-50/30" : (isCurrentMonth ? "text-slate-700 font-medium" : "text-slate-300"),
                                        isSelected ? "bg-blue-600 text-white font-bold shadow-indigo-200 shadow-lg scale-110 z-10" : (!isRestricted && "hover:bg-slate-100"),
                                        holiday && isCurrentMonth && !isSelected && !isRestricted && "text-rose-500 font-bold bg-rose-50/50",
                                        isToday && !isSelected && "ring-1 ring-blue-200 ring-inset",
                                        !isCurrentMonth && holiday && !isRestricted && "text-rose-200",
                                        isFocused && !isSelected && !isRestricted && "bg-slate-100 ring-2 ring-blue-400/30"
                                    )}
                                >
                                    {date.getDate()}
                                    {holiday && isCurrentMonth && (
                                        <span className={cn(
                                            "absolute bottom-1 w-0.5 h-0.5 rounded-full",
                                            isSelected ? "bg-white" : "bg-rose-400"
                                        )} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {mode === 'month' && (
                <div className="grid grid-cols-3 gap-2 py-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setViewDate(new Date(viewDate.getFullYear(), i, 1));
                                setMode('calendar');
                                setFocusedDate(new Date(viewDate.getFullYear(), i, 1));
                            }}
                            className={cn(
                                "py-3 text-xs font-bold rounded-lg transition-all",
                                viewDate.getMonth() === i ? "bg-blue-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            {i + 1}月
                        </button>
                    ))}
                </div>
            )}

            {mode === 'year' && (
                <div className="grid grid-cols-3 gap-2 py-2">
                    {Array.from({ length: 12 }).map((_, i) => {
                        const targetYear = viewDate.getFullYear() - 5 + i;
                        return (
                            <button
                                key={i}
                                onClick={() => {
                                    setViewDate(new Date(targetYear, viewDate.getMonth(), 1));
                                    setMode('calendar');
                                    setFocusedDate(new Date(targetYear, viewDate.getMonth(), 1));
                                }}
                                className={cn(
                                    "py-3 text-xs font-bold rounded-lg transition-all",
                                    viewDate.getFullYear() === targetYear ? "bg-blue-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
                                )}
                            >
                                {targetYear}年
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                    onClick={handleToday}
                    className="px-3 py-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-all active:scale-95"
                >
                    今日
                </button>
                <button
                    onClick={onClose}
                    className="px-2 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                    閉じる
                </button>
            </div>
        </div>
    );
};
