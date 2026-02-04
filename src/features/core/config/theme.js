/**
 * Theme & Color Logic
 * Pure functions for UI coloring
 */

export const COLOR_PALETTE = [
    { name: 'Red', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900' },
    { name: 'Orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900' },
    { name: 'Amber', bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900' },
    { name: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
    { name: 'Lime', bg: 'bg-lime-100', border: 'border-lime-300', text: 'text-lime-900' },
    { name: 'Green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' },
    { name: 'Emerald', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900' },
    { name: 'Teal', bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-900' },
    { name: 'Cyan', bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-900' },
    { name: 'Sky', bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-900' },
    { name: 'Blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
    { name: 'Indigo', bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900' },
    { name: 'Violet', bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-900' },
    { name: 'Purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900' },
    { name: 'Fuchsia', bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', text: 'text-fuchsia-900' },
    { name: 'Pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900' },
    { name: 'Rose', bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-900' },
    { name: 'Slate', bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-900' },
];

/**
 * Generate a hash index from a string
 */
export const getHashIndex = (str, max) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % max;
};

/**
 * Generate color map for jobs to avoid adjacent conflicts
 * @param {Array} jobs - List of jobs
 * @param {Array} driverOrder - List of driver IDs in column order
 * @param {Function} timeToMinutes - Helper function (injected to keep this module pure but flexible)
 * @returns {Object} map { [jobId]: colorObject }
 */
export function generateJobColorMap(jobs, driverOrder, timeToMinutes) {
    const map = {};
    const paletteLength = COLOR_PALETTE.length;

    const sortedJobs = [...jobs].sort((a, b) => {
        const driverIndexA = driverOrder.indexOf(a.driverId);
        const driverIndexB = driverOrder.indexOf(b.driverId);
        if (driverIndexA !== driverIndexB) return driverIndexA - driverIndexB;
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    let globalColorIndex = 0;

    sortedJobs.forEach(job => {
        let candidateIndex = globalColorIndex;
        const avoidIndices = new Set();

        const currentJobStart = timeToMinutes(job.startTime);

        // Check same column previous job
        const prevJobInCol = sortedJobs
            .filter(j => j.driverId === job.driverId && timeToMinutes(j.startTime) < currentJobStart)
            .pop();

        if (prevJobInCol && map[prevJobInCol.id]) {
            const prevIdx = COLOR_PALETTE.indexOf(map[prevJobInCol.id]);
            if (prevIdx >= 0) avoidIndices.add(prevIdx);
        }

        // Check left column neighbors (visual adjacency)
        const myDriverIdx = driverOrder.indexOf(job.driverId);
        if (myDriverIdx > 0) {
            const leftDriverId = driverOrder[myDriverIdx - 1];
            const currentJobEnd = currentJobStart + job.duration;
            const leftJobs = sortedJobs.filter(j => j.driverId === leftDriverId);

            leftJobs.forEach(leftJob => {
                const lStart = timeToMinutes(leftJob.startTime);
                const lEnd = lStart + leftJob.duration;
                if (currentJobStart < lEnd && currentJobEnd > lStart) {
                    if (map[leftJob.id]) {
                        const leftIdx = COLOR_PALETTE.indexOf(map[leftJob.id]);
                        if (leftIdx >= 0) avoidIndices.add(leftIdx);
                    }
                }
            });
        }

        let loopCount = 0;
        while (avoidIndices.has(candidateIndex) && loopCount < paletteLength) {
            candidateIndex = (candidateIndex + 1) % paletteLength;
            loopCount++;
        }

        map[job.id] = COLOR_PALETTE[candidateIndex];
        globalColorIndex = (candidateIndex + 1) % paletteLength;
    });

    return map;
}

export const getPendingJobColor = (job) => {
    const seed = job.originalCustomerId || job.id;
    const index = getHashIndex(seed, COLOR_PALETTE.length);
    return COLOR_PALETTE[index];
};
