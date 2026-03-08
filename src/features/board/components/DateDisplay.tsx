import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { formatFullDateWithNthDay } from '../utils/dateUtils';
import { CalendarPicker } from './CalendarPicker';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind Class Merger Utility
 */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DateDisplayProps {
    selectedDate: Date;
    onDateChange: (newDate: Date) => void;
}

/**
 * AGENTS.md 准拠: ユーザー指定の表示形式
 * 100pt Version: 日本の祝日対応カスタムカレンダーを統合
 */
export const DateDisplay: React.FC<DateDisplayProps> = ({ selectedDate, onDateChange }) => {
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleToggle = () => {
        setIsPickerOpen(!isPickerOpen);
    };

    // 外部クリックで閉じる処理
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsPickerOpen(false);
            }
        };
        if (isPickerOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isPickerOpen]);

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={handleToggle}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 outline-none",
                    "bg-white border-slate-200 shadow-sm hover:border-slate-300",
                    isPickerOpen && "border-blue-400 ring-2 ring-blue-400/20"
                )}
            >
                <span className="text-sm font-bold text-slate-700 tabular-nums">
                    {formatFullDateWithNthDay(selectedDate)}
                </span>
                <div className="p-1 px-1.5 rounded bg-blue-50">
                    <Calendar size={14} className="text-blue-600" />
                </div>
            </button>

            {/* カスタムカレンダーピッカー */}
            {isPickerOpen && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <CalendarPicker
                        selectedDate={selectedDate}
                        onDateChange={onDateChange}
                        onClose={() => setIsPickerOpen(false)}
                    />
                </div>
            )}
        </div>
    );
};
