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
        
        // 0. Load from IndexedDB first if not in memory (Offline Recovery / Instant Load)
        if (!cache[dateKey]) {
            const localData = await boardStore.get(dateKey);
            if (localData) {
                setData(localData);
                cache[dateKey] = localData;
                setIsLoading(false);
            }
        }

        // Only show loading if we don't have data at all (prevent flicker on SWR background refresh)
        if (!cache[dateKey]) {
            setIsLoading(true);
        }

        try {
            const { PeriodicJobImporter } = await import('../../../lib/PeriodicJobImporter');
            
            const fetchRoutePromise = supabase.from('routes').select('*').eq('date', dateKey).maybeSingle();
            const fetchUnassignedJobsPromise = supabase.from('jobs').select('*').is('driver_id', null);
            const fetchPeriodicPromise = PeriodicJobImporter.fetchPointsByDate(new Date(dateKey));

            const [routeRes, jobsRes, masterPoints] = await Promise.all([
                fetchRoutePromise, 
                fetchUnassignedJobsPromise,
                fetchPeriodicPromise
            ]);

            if (routeRes.error) throw routeRes.error;
            if (jobsRes.error) throw jobsRes.error;

            const routeData = routeRes.data;
            const fallbackJobs = (jobsRes.data || []).map(mapSupabaseToBoardJob);

            // Map Periodic Master Points to BoardJobs
            const autoImportedJobs: BoardJob[] = masterPoints.map(p => ({
                id: `periodic_${p.location_id}_${dateKey.replace(/-/g, '')}`,
                title: p.name, 
                bucket: p.visit_slot === 'AM' ? 'AM' : 'PM',
                visitSlot: p.visit_slot || undefined,
                duration: (p as any).duration_minutes || 60, 
                area: p.area || p.display_name || '',
                requiredVehicle: p.restricted_vehicle_id ? '要車両' : undefined, 
                note: p.note || undefined,
                isSpot: p.is_spot_only || false, 
                timeConstraint: p.time_constraint_type !== 'NONE' ? '要確認' : undefined,
                taskType: p.special_type === 'NONE' ? 'collection' : 'special', 
                status: 'planned' as const,
                location_id: p.location_id
            }));

            let newState: BoardState;

            if (routeData) {
                const loadedDrivers = (routeData.drivers && Array.isArray(routeData.drivers) && (routeData.drivers as any).length > 0)
                    ? routeData.drivers as unknown as BoardDriver[]
                    : getDefaultDrivers();

                const savedPending = (routeData.pending_jobs || []) as unknown as BoardJob[];
                const savedJobs = (routeData.jobs || []) as unknown as BoardJob[];

                // --- Auto-Merge Logic ---
                // Identify already present locations to avoid duplicates
                const existingLocationIds = new Set([
                    ...savedJobs.map(j => j.location_id),
                    ...savedPending.map(j => j.location_id),
                    ...fallbackJobs.map(j => j.location_id) // Add jobs from 'jobs' table (unassigned)
                ].filter(Boolean));

                const filteredAutoJobs = autoImportedJobs.filter(j => !existingLocationIds.has(j.location_id));

                const masterUnassignedIds = new Set(fallbackJobs.map((j: BoardJob) => j.id));
                const savedIds = new Set(savedPending.map((j: BoardJob) => j.id));
                
                const newUnseenJobs = fallbackJobs.filter((j: BoardJob) => !savedIds.has(j.id));
                const stillUnassignedSavedPending = savedPending.filter((j: BoardJob) => masterUnassignedIds.has(j.id));

                newState = {
                    jobs: savedJobs,
                    drivers: loadedDrivers,
                    splits: (routeData.splits || []) as unknown as BoardSplit[],
                    pendingJobs: [...stillUnassignedSavedPending, ...newUnseenJobs, ...filteredAutoJobs]
                };
            } else {
                // For new routes, merge fallbackJobs (from 'jobs' table) and autoImportedJobs
                const existingLocationIds = new Set(fallbackJobs.map(j => j.location_id).filter(Boolean));
                const filteredAutoJobs = autoImportedJobs.filter(j => !existingLocationIds.has(j.location_id));

                newState = {
                    jobs: [],
                    drivers: getDefaultDrivers(),
                    splits: [],
                    pendingJobs: [...fallbackJobs, ...filteredAutoJobs]
                };
            }

            cache[dateKey] = newState;
            setData(newState);
            setError(null);

            // 1. Persist to IndexedDB
            boardStore.save(dateKey, newState);

        } catch (err: any) {
            console.error("[useDataSync] Fetch Data Error:", err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, [dateKey, mapSupabaseToBoardJob, getDefaultDrivers]);

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
    }, [dateKey, fetchData]);

    const mutate = useCallback((newData: BoardState) => {
        cache[dateKey] = newData;
        setData(newData);
        boardStore.save(dateKey, newData);
    }, [dateKey]);

    return { data, isLoading, error, mutate };
};
