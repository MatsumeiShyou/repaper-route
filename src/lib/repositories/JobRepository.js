import { supabase } from '../supabase/client';
import { timeToMinutes } from '../../features/board/logic/timeUtils';

export class JobRepository {
    /**
     * Fetch jobs for a driver from Supabase 'routes' table (JSON-based).
     * 
     * @param {string} driverId 
     * @returns {Promise<Array>}
     */
    static async fetchJobs(driverId) {
        // 1. Determine Date (Currently hardcoded to match BoardCanvas logic, or use Today)
        const TARGET_DATE = '2025-01-24';

        try {
            const { data, error } = await supabase
                .from('routes')
                .select('jobs, pending')
                .eq('date', TARGET_DATE)
                .single();

            if (error) {
                // eslint-disable-next-line no-console
                console.warn("JobRepository: Fetch failed, falling back to empty/mock", error);
                throw error;
            }

            if (!data || !data.jobs) return [];

            // 2. Filter for this Driver
            const driverJobs = data.jobs.filter(j => j.driverId === driverId);

            // 3. Map keys to DriverApp expectations
            const mappedJobs = driverJobs.map(j => ({
                ...j,
                customer_name: j.title, // Map title -> customer_name
                address: j.area || '',
                special_notes: j.note,
                status: j.status || 'PENDING',
                items: j.items || [] // Ensure items array exists
            }));

            // 4. Sort by Time
            mappedJobs.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

            return mappedJobs;

        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("JobRepository Fetch Error:", e);
            return [];
        }
    }

    /**
     * Update the status of a specific job in the 'routes' table.
     * Performs a Read-Modify-Write cycle (optimistic locking recommended in future).
     * @param {string} jobId 
     * @param {string} newStatus 
     * @param {object} additionalData (optional items, etc)
     */
    static async updateJobStatus(jobId, newStatus, additionalData = {}) {
        const TARGET_DATE = '2025-01-24';
        try {
            // 1. Fetch current (Read)
            const { data, error } = await supabase
                .from('routes')
                .select('*')
                .eq('date', TARGET_DATE)
                .single();

            if (error || !data) throw new Error("Failed to fetch route for update");

            // 2. Modify
            const updatedJobs = data.jobs.map(j => {
                if (j.id === jobId) {
                    return { ...j, status: newStatus, ...additionalData };
                }
                return j;
            });

            // 3. Write
            const { error: writeError } = await supabase
                .from('routes')
                .update({ jobs: updatedJobs, updated_at: new Date().toISOString() })
                .eq('date', TARGET_DATE);

            if (writeError) throw writeError;
            return true;

        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("JobRepository Update Error:", e);
            return false;
        }
    }
}
