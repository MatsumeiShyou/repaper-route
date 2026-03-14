import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { BoardState } from './useBoardData';
import { BoardJob, BoardDriver, BoardSplit } from '../../../types';
import { boardStore } from '../../../lib/idb/boardStore';

// Simple Cache Store (In-Memory)
const cache: Record<string, BoardState> = {};

export interface SyncResult {
    data: BoardState | null;
    isLoading: boolean;
    error: Error | null;
    mutate: (newData: BoardState) => void;
}

/**
 * useDataSync (Phase 3-2: SWR-like Cache Layer with IDB)
 * Handles remote data fetching, caching (SWR), real-time synchronization, and IndexedDB persistence.
 */
export const useDataSync = (dateKey: string, mapSupabaseToBoardJob: (j: any) => BoardJob, getDefaultDrivers: () => BoardDriver[]): SyncResult => {
    const [data, setData] = useState<BoardState | null>(cache[dateKey] || null);
    const [isLoading, setIsLoading] = useState(!cache[dateKey]);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!dateKey) return;
        
        // 0. Load from IndexedDB first (Offline Recovery / Instant Load)
        if (!data) {
            const localData = await boardStore.get(dateKey);
            if (localData) {
                setData(localData);
                cache[dateKey] = localData;
                setIsLoading(false); // We have something to show
            }
        }

        setIsLoading(true);
        try {
            const fetchRoutePromise = supabase.from('routes').select('*').eq('date', dateKey).maybeSingle();
            const fetchUnassignedJobsPromise = supabase.from('jobs').select('*').is('driver_id', null);

            const [routeRes, jobsRes] = await Promise.all([fetchRoutePromise, fetchUnassignedJobsPromise]);

            if (routeRes.error) throw routeRes.error;
            if (jobsRes.error) throw jobsRes.error;

            const routeData = routeRes.data;
            const fallbackJobs = (jobsRes.data || []).map(mapSupabaseToBoardJob);

            let newState: BoardState;

            if (routeData) {
                const loadedDrivers = (routeData.drivers && Array.isArray(routeData.drivers) && (routeData.drivers as any).length > 0)
                    ? routeData.drivers as unknown as BoardDriver[]
                    : getDefaultDrivers();

                const savedPending = (routeData.pending_jobs || []) as unknown as BoardJob[];
                const masterUnassignedIds = new Set(fallbackJobs.map((j: BoardJob) => j.id));
                const savedIds = new Set(savedPending.map((j: BoardJob) => j.id));
                
                const newUnseenJobs = fallbackJobs.filter((j: BoardJob) => !savedIds.has(j.id));
                const stillUnassignedSavedPending = savedPending.filter((j: BoardJob) => masterUnassignedIds.has(j.id));

                newState = {
                    jobs: (routeData.jobs || []) as unknown as BoardJob[],
                    drivers: loadedDrivers,
                    splits: (routeData.splits || []) as unknown as BoardSplit[],
                    pendingJobs: [...stillUnassignedSavedPending, ...newUnseenJobs]
                };
            } else {
                newState = {
                    jobs: [],
                    drivers: getDefaultDrivers(),
                    splits: [],
                    pendingJobs: fallbackJobs
                };
            }

            cache[dateKey] = newState;
            setData(newState);
            setError(null);

            // 1. Persist to IndexedDB
            boardStore.save(dateKey, newState);

        } catch (err: any) {
            console.error("Fetch Data Error:", err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, [dateKey, mapSupabaseToBoardJob, getDefaultDrivers, data]);

    useEffect(() => {
        fetchData();
        
        // Subscription for real-time updates
        const channel = supabase.channel(`sync_${dateKey}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'routes', 
                filter: `date=eq.${dateKey}` 
            }, (payload) => {
                const newData = payload.new as any;
                if (newData) {
                    const newState: BoardState = {
                        jobs: (newData.jobs || []) as unknown as BoardJob[],
                        drivers: (newData.drivers && (newData.drivers as any).length > 0) ? (newData.drivers as unknown as BoardDriver[]) : (cache[dateKey]?.drivers || getDefaultDrivers()),
                        splits: (newData.splits || []) as unknown as BoardSplit[],
                        pendingJobs: (newData.pending_jobs || []) as unknown as BoardJob[]
                    };
                    cache[dateKey] = newState;
                    setData(newState);
                    
                    // Persist real-time updates to IDB
                    boardStore.save(dateKey, newState);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [dateKey, fetchData, getDefaultDrivers]);

    const mutate = useCallback((newData: BoardState) => {
        cache[dateKey] = newData;
        setData(newData);
        boardStore.save(dateKey, newData);
    }, [dateKey]);

    return { data, isLoading, error, mutate };
};
