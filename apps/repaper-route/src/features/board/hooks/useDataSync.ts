import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { nativeSupabaseFetch } from '../../../lib/supabase/nativeFetch';

import { BoardState } from './useBoardData';
import { BoardJob, BoardDriver, BoardSplit } from '../../../types';
import { boardStore } from '../../../lib/idb/boardStore';
import { PeriodicJobImporter } from '../../../lib/PeriodicJobImporter';
import { JobAdapter } from '../logic/JobAdapter';
import { Database } from '../../../types/database.types';

type MasterPoint = Database['public']['Tables']['master_collection_points']['Row'];

// Simple Cache Store (In-Memory)
const cache: Record<string, BoardState> = {};

export interface SyncResult {
    data: BoardState | null;
    isLoading: boolean;
    error: string | null;
    mutate: (newData: BoardState) => void;
}

export const useDataSync = (
    date: string,
    getDefaultDrivers: () => BoardDriver[],
    userRole?: string
): SyncResult => {
    const [data, setData] = useState<BoardState | null>(() => cache[date] || null);
    const [isLoading, setIsLoading] = useState<boolean>(!cache[date]);
    const [error, setError] = useState<string | null>(null);

    const dateKey = date; // date is already YYYY-MM-DD string from useBoardData.ts

    const fetchData = useCallback(async (forceBypassCache: boolean = false) => {
        if (!forceBypassCache && cache[dateKey]) {
            setData(cache[dateKey]);
            setIsLoading(false);
            return;
        }

        // 【100pt 統治】データ層の物理ガードレール
        const isAdmin = userRole === 'admin';
        const target = new Date(dateKey);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const min = new Date(today);
        min.setMonth(today.getMonth() - 1);
        min.setDate(1); 

        const nextMonthView = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const lastDayOfNextMonth = new Date(nextMonthView.getFullYear(), nextMonthView.getMonth() + 1, 0);

        if (!isAdmin && (target < min || target > lastDayOfNextMonth)) {
            console.warn(`[useDataSync] Unauthorized fetch attempt for ${dateKey}. Reverting to localized empty state.`);
            setData({ drivers: getDefaultDrivers(), jobs: [], pendingJobs: [], splits: [] });
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // [Phase 3-1: Load from IDB first (Offline-First preparation)]
            const localData = await boardStore.get(dateKey);
            if (localData && !forceBypassCache) {
                // If local data exists, apply Upgrade Logic via JobAdapter
                const upgradedPending = (localData.pendingJobs || []).map((j: any) => JobAdapter.mapToBoardJob(j));
                const upgradedJobs = (localData.jobs || []).map((j: any) => JobAdapter.mapToBoardJob(j));
                
                const upgradedLocalData: BoardState = {
                    ...localData,
                    pendingJobs: upgradedPending,
                    jobs: upgradedJobs
                };

                setData(upgradedLocalData);
                cache[dateKey] = upgradedLocalData;
                setIsLoading(false);
            }

            // [Phase 3-2: Merge strategy - DB is still primary source of truth for now]
            const [routesRes, masterPoints] = await Promise.all([
                nativeSupabaseFetch('routes', `select=*&date=eq.${date}`),
                PeriodicJobImporter.fetchPointsByDate(new Date(date))
            ]);

            if (routesRes.error) throw routesRes.error;

            const fallbackJobs: BoardJob[] = []; // assigned_date does not exist in jobs table

            // Map Periodic Master Points to BoardJobs
            const autoImportedJobs: BoardJob[] = [];
            
            masterPoints.forEach((p: MasterPoint) => {
                try {
                    const rawPeriodic = {
                        ...p,
                        job_title: p.name,
                        bucket_type: p.visit_slot === 'AM' ? 'AM' : 'PM',
                        duration_minutes: (p as any).duration_minutes || 60,
                        special_notes: p.note,
                        start_time: (p.time_constraint_type && p.time_constraint_type !== 'NONE') ? '要確認' : undefined,
                        task_type: (p.special_type && p.special_type !== 'NONE') ? 'special' : 'collection'
                    };
                    const job = JobAdapter.mapToBoardJob(rawPeriodic, { 
                        idPrefix: `periodic_${dateKey.replace(/-/g, '')}`,
                        defaultStatus: 'planned' 
                    });
                    autoImportedJobs.push(job);
                } catch (mapErr) {
                    console.warn(`[useDataSync] 案件(ID: ${p.id})のマッピングに失敗しました。この案件をスキップします。`, mapErr);
                }
            });

            const routeData = (routesRes.data as any[])?.[0] || null;

            // === 診断ログ：データ消失の追跡 ===
            console.log(`[useDataSync] routeData found: ${!!routeData}`);
            if (routeData) {
                console.log(`[useDataSync] routeData.pending count: ${Array.isArray(routeData.pending) ? routeData.pending.length : 'NOT_ARRAY'}`);
                console.log(`[useDataSync] routeData.jobs count: ${Array.isArray(routeData.jobs) ? routeData.jobs.length : 'NOT_ARRAY'}`);
            }
            console.log(`[useDataSync] autoImportedJobs count: ${autoImportedJobs.length}`);

            if (routeData) {
                // Data Upgrade / Re-mapping Logic (Self-Healing)
                const savedPending = Array.isArray(routeData?.pending) ? routeData.pending : [];
                const savedJobs = Array.isArray(routeData?.jobs) ? routeData.jobs : [];

                const upgradedSavedPending = savedPending.map((j: any) => JobAdapter.mapToBoardJob(j));
                const upgradedSavedJobs = savedJobs.map((j: any) => JobAdapter.mapToBoardJob(j));

                console.log(`[useDataSync] upgradedSavedPending: ${upgradedSavedPending.length}, upgradedSavedJobs: ${upgradedSavedJobs.length}`);

                const existingLocationIds = new Set(
                    [...upgradedSavedJobs, ...upgradedSavedPending]
                        .map(j => j.location_id)
                        .filter(Boolean) 
                );

                /* 【超精密浄化タスク 2-1】一時無効化（データ消失の原因調査）
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                const filteredPending = upgradedSavedPending.filter(j => !uuidRegex.test(j.id));
                const isolatedCount = upgradedSavedPending.length - filteredPending.length;
                
                if (isolatedCount > 0) {
                    console.info(`[Purification-Complete] Isolated and removed ${isolatedCount} ghost jobs from pending list registry.`);
                }
                */
                const filteredPending = upgradedSavedPending; // フィルタなしで全件取得
                const mergedPendingJobs = [...filteredPending];
                autoImportedJobs.forEach(job => {
                    if (!job.location_id || !existingLocationIds.has(job.location_id)) {
                        mergedPendingJobs.push(job);
                        if (job.location_id) existingLocationIds.add(job.location_id);
                    }
                });

                console.log(`[useDataSync] FINAL mergedPendingJobs: ${mergedPendingJobs.length}`);

                const newState: BoardState = {
                    drivers: Array.isArray(routeData.drivers) && (routeData.drivers as any[]).length > 0
                        ? routeData.drivers as unknown as BoardDriver[]
                        : getDefaultDrivers(),
                    jobs: upgradedSavedJobs,
                    pendingJobs: mergedPendingJobs,
                    splits: Array.isArray(routeData.splits) ? routeData.splits as unknown as BoardSplit[] : []
                };

                setData(newState);
                cache[dateKey] = newState;
                
                await boardStore.save(dateKey, newState);

            } else {
                const newState: BoardState = {
                    drivers: getDefaultDrivers(),
                    jobs: fallbackJobs,
                    pendingJobs: autoImportedJobs,
                    splits: []
                };
                setData(newState);
                cache[dateKey] = newState;
                
                await boardStore.save(dateKey, newState);
            }
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [date, dateKey, getDefaultDrivers]);

    useEffect(() => {
        fetchData();
        
        const channel = supabase.channel(`sync_${dateKey}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'routes', filter: `date=eq.${date}` },
                () => {
                    fetchData(true); 
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [date, dateKey, fetchData]);

    const mutate = useCallback((newState: BoardState) => {
        setData(newState);
        cache[dateKey] = newState;
    }, [dateKey]);

    return { data, isLoading, error, mutate };
};
