import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { BoardState, BoardCourse, BoardJob } from '../../../types';

export interface SyncResult {
    data: BoardState | null;
    isLoading: boolean;
    error: string | null;
    mutate: () => void;
}

function getErrorMessage(err: unknown): string {
    if (err instanceof Error) {
        return err.message;
    }
    if (typeof err === 'object' && err !== null) {
        const record = err as Record<string, unknown>;
        if ('message' in record && typeof record.message === 'string') {
            const msg = record.message;
            if (msg.includes('Database connection failed') || msg.includes('Failed to fetch')) {
                return 'データ取得エラー';
            }
            return msg;
        }
    }
    if (typeof err === 'string') {
        if (err.includes('Database connection failed') || err.includes('Failed to fetch')) {
            return 'データ取得エラー';
        }
        return err;
    }
    return 'データ取得エラー';
}

export const useDataSync = (dateKey: string): SyncResult => {
    const [data, setData] = useState<BoardState | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const activeDateRef = useRef(dateKey);
    useEffect(() => {
        activeDateRef.current = dateKey;
    }, [dateKey]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch courses
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('*')
                .order('display_order');
            
            if (coursesError) throw coursesError;

            // Fetch assignments for the date
            const { data: assignmentsData, error: assignmentsError } = await supabase
                .from('course_assignments')
                .select('*')
                .eq('assigned_date', dateKey);

            if (assignmentsError) throw assignmentsError;

            // Combine course & assignments
            const courses: BoardCourse[] = (coursesData || [])
                .filter(Boolean)
                .map((c): BoardCourse | null => {
                    try {
                        const record = c as Record<string, unknown>;
                        if (!record || typeof record !== 'object') {
                            throw new Error('Invalid course record structure');
                        }
                        if (typeof record.id !== 'string') {
                            throw new Error('Missing course id');
                        }
                        const assign = assignmentsData?.find(a => {
                            if (!a || typeof a !== 'object') return false;
                            const r = a as Record<string, unknown>;
                            return r.course_id === record.id;
                        });
                        const assignRecord = assign as Record<string, unknown> | undefined;
                        return {
                            id: record.id,
                            name: (record.name as string) || '無題',
                            displayColor: (record.display_color as string) || '#ccc',
                            displayOrder: (record.display_order as number) || 0,
                            staffId: assignRecord?.staff_id as string | null | undefined,
                            vehicleId: assignRecord?.vehicle_id as string | null | undefined
                        };
                    } catch (e) {
                        console.warn('Skipping corrupt course record:', e);
                        return null;
                    }
                })
                .filter((c): c is BoardCourse => c !== null);

            // Fetch jobs
            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .eq('scheduled_date', dateKey);
            
            if (jobsError) throw jobsError;

            const jobs: BoardJob[] = (jobsData || [])
                .filter(Boolean)
                .map((j: unknown): BoardJob | null => {
                    try {
                        const record = j as Record<string, unknown>;
                        if (!record || typeof record !== 'object') {
                            throw new Error('Invalid job record structure');
                        }
                        if (typeof record.id !== 'string') {
                            throw new Error('Missing job id');
                        }
                        return {
                            id: record.id,
                            title: (record.job_title as string) || '無題',
                            bucket: (record.bucket_type as string) || 'AM',
                            duration: (record.duration_minutes as number) || 15,
                            area: (record.area as string) || '',
                            requiredVehicle: undefined,
                            note: (record.note as string) || '',
                            isSpot: !!record.is_spot,
                            taskType: 'collection' as const,
                            courseId: (record.course_id as string) || undefined,
                            startTime: (record.start_time as string) || undefined,
                            status: (record.status as BoardJob['status']) || 'planned',
                            location_id: (record.location_id as string) || undefined,
                            address: (record.address as string) || undefined
                        };
                    } catch (e) {
                        console.warn('Skipping corrupt job record:', e);
                        return null;
                    }
                })
                .filter((j): j is BoardJob => j !== null);

            if (dateKey !== activeDateRef.current) {
                console.log(`[useDataSync] Discarding stale fetch result for date: ${dateKey}`);
                return;
            }

            setData({ courses, jobs });
        } catch (err: unknown) {
            if (dateKey !== activeDateRef.current) return;
            console.error('Data sync error:', err);
            setError(getErrorMessage(err));
        } finally {
            if (dateKey === activeDateRef.current) {
                setIsLoading(false);
            }
        }
    }, [dateKey]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, mutate: fetchData };
};
