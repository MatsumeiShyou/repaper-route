import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { BoardState, BoardCourse, BoardJob } from '../../../types';

export interface SyncResult {
    data: BoardState | null;
    isLoading: boolean;
    error: string | null;
    mutate: () => void;
}

export const useDataSync = (dateKey: string): SyncResult => {
    const [data, setData] = useState<BoardState | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
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
            const courses: BoardCourse[] = (coursesData || []).map(c => {
                const assign = assignmentsData?.find(a => a.course_id === c.id);
                return {
                    id: c.id,
                    name: c.name,
                    displayColor: c.display_color || '#ccc',
                    displayOrder: c.display_order || 0,
                    staffId: assign?.staff_id,
                    vehicleId: assign?.vehicle_id
                };
            });

            // Fetch jobs
            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .eq('scheduled_date', dateKey);
            
            if (jobsError) throw jobsError;

            const jobs: BoardJob[] = (jobsData || []).map(j => ({
                id: j.id,
                title: j.job_title || '無題',
                bucket: j.bucket_type || 'AM',
                duration: j.duration_minutes || 15,
                area: j.area || '',
                requiredVehicle: undefined,
                note: j.note || '',
                isSpot: j.is_spot || false,
                taskType: 'collection',
                courseId: j.course_id || undefined,
                startTime: j.start_time || undefined,
                status: j.status as any || 'planned',
                location_id: j.location_id || undefined,
                address: j.address || undefined
            }));

            setData({ courses, jobs });
        } catch (err: any) {
            console.error('Data sync error:', err);
            setError(err.message || 'データ取得エラー');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Since it's a viewer, we can setup realtime subscription if we want,
        // but for now, just fetch on mount/date change.
    }, [dateKey]);

    return { data, isLoading, error, mutate: fetchData };
};
