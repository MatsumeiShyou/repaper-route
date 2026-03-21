import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/client';
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
    getDefaultDrivers: () => BoardDriver[]
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
                supabase.from('routes').select('*').eq('date', date).maybeSingle(),
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

            const routeData = routesRes.data;

            if (routeData) {
                // Data Upgrade / Re-mapping Logic (Self-Healing)
                const savedPending = Array.isArray(routeData?.pending) ? routeData.pending : [];
                const savedJobs = Array.isArray(routeData?.jobs) ? routeData.jobs : [];

                const upgradedSavedPending = savedPending.map((j: any) => JobAdapter.mapToBoardJob(j));
                const upgradedSavedJobs = savedJobs.map((j: any) => JobAdapter.mapToBoardJob(j));

                const existingLocationIds = new Set(
                    [...upgradedSavedJobs, ...upgradedSavedPending]
                        .map(j => j.location_id)
                        .filter(Boolean) 
                );

                const mergedPendingJobs = [...upgradedSavedPending];
                autoImportedJobs.forEach(job => {
                    if (!job.location_id || !existingLocationIds.has(job.location_id)) {
                        mergedPendingJobs.push(job);
                        if (job.location_id) existingLocationIds.add(job.location_id);
                    }
                });

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
