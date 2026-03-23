import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { BoardJob } from '../../../types';

/**
 * useGhostTemplate Hook
 * 
 * 未来の空白日に「過去の同時期のデータ」を薄く表示するためのデータを取得する。
 * パフォーマンスのため、300msのデバウンス処理を行い、
 * 過去4週間の同じ曜日のデータから、最新のものを1件採用する。
 */
export const useGhostTemplate = (currentDateKey: string, isVisible: boolean) => {
    const [ghostJobs, setGhostJobs] = useState<BoardJob[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // 表示フラグがOFFの場合は即座にクリア
        if (!isVisible) {
            setGhostJobs([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                // 現在の日付から過去4週間分の「同じ曜日」の日付を算出
                const current = new Date(currentDateKey);
                const pastDates: string[] = [];
                for (let i = 1; i <= 4; i++) {
                    const past = new Date(current);
                    past.setDate(current.getDate() - (i * 7));
                    pastDates.push(past.toISOString().split('T')[0]);
                }

                // routes テーブルから、該当する日付のデータを降順（新しい順）で取得
                const { data, error } = await supabase
                    .from('routes')
                    .select('jobs, date')
                    .in('date', pastDates)
                    .order('date', { ascending: false });

                if (error) throw error;

                // 案件データが存在する最新の1件を探す
                const found = data?.find(row => Array.isArray(row.jobs) && row.jobs.length > 0);
                
                if (found) {
                    const jobs = (found.jobs as any[]).map(j => ({
                        ...j,
                        isGhost: true // UIでの判別用フラグ
                    })) as BoardJob[];
                    setGhostJobs(jobs);
                } else {
                    setGhostJobs([]);
                }
            } catch (err) {
                console.error("[useGhostTemplate] データの取得に失敗しました:", err);
                setGhostJobs([]);
            } finally {
                setIsLoading(false);
            }
        }, 300); // カレンダー切り替え時の負荷軽減（300msデバウンス）

        return () => clearTimeout(timer);
    }, [currentDateKey, isVisible]);

    return { ghostJobs, isLoading };
};
