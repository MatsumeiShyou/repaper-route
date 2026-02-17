import { timeToMinutes } from './timeUtils';

/**
 * Check for collision between a proposed job slot and existing entities.
 * @param {object} params
 * @param {string} params.proposedDriverId
 * @param {number} params.proposedStartMin
 * @param {number} params.proposedDuration
 * @param {string} params.ignoreJobId - ID of the job being moved (to ignore self)
 * @param {Array} params.existingJobs
 * @param {Array} params.splits
 * @param {boolean} params.isResize - If true, relax some constraints or handle differently
 * 
 * @returns {object} result { isOverlapError: boolean, adjustedDuration: number }
 */
export const calculateCollision = ({
    proposedDriverId,
    proposedStartMin,
    proposedDuration,
    ignoreJobId,
    existingJobs,
    splits,
    isResize = false
}) => {
    let newDuration = proposedDuration;
    let isOverlapError = false;

    // 1. Check Split Conflict (Start Time)
    const driverSplits = splits.filter(s => s.driverId === proposedDriverId);
    // Check if start time lands exactly on a split? (Current logic checks this)
    // Actually, simply checking if "Proposed Interval" overlaps with any split
    // Logic from BoardCanvas: "splitAtStart"
    // const splitAtStart = driverSplits.find(s => timeToMinutes(s.time) === proposedStartMin);
    // if (splitAtStart) isOverlapError = true;

    // Better logic: Does the interval overlap any split point?
    // Actually, splits are just points in time, or do they represent breaks?
    // In current BoardCanvas, splits seem to be just markers that you shouldn't overlap?
    // Let's stick to original logic: "if split is at the exact start time, error"
    // and "if split is within the duration, it limits duration"

    // Logic Re-implementation:
    const tentativeEndMin = proposedStartMin + newDuration;

    // Check Start Collision with Jobs
    const otherJobs = existingJobs.filter(j => j.driverId === proposedDriverId && j.id !== ignoreJobId);
    const isStartOverlapping = otherJobs.some(other => {
        const s = timeToMinutes(other.startTime);
        const e = s + other.duration;
        return proposedStartMin >= s && proposedStartMin < e;
    });

    if (isStartOverlapping) {
        return { isOverlapError: true, adjustedDuration: newDuration };
    }

    // Check Duration Collision (Forward)
    // Find nearest obstacle (Job or Split) after start time
    let nearestObstacleStart = 99999;

    // Nearest Job
    const conflictingJob = otherJobs.find(other => {
        const s = timeToMinutes(other.startTime);
        return s >= proposedStartMin && s < tentativeEndMin;
    });
    if (conflictingJob) nearestObstacleStart = timeToMinutes(conflictingJob.startTime);

    // Nearest Split
    const conflictingSplit = driverSplits.find(s => {
        const sMin = timeToMinutes(s.time);
        return sMin > proposedStartMin && sMin < tentativeEndMin;
    });
    if (conflictingSplit) {
        const sMin = timeToMinutes(conflictingSplit.time);
        if (sMin < nearestObstacleStart) nearestObstacleStart = sMin;
    }

    // Adjust Duration
    if (nearestObstacleStart !== 99999) {
        const availableDuration = nearestObstacleStart - proposedStartMin;
        if (availableDuration < 15) {
            isOverlapError = true;
            newDuration = 15;
        } else {
            newDuration = availableDuration;
        }
    }

    return { isOverlapError, adjustedDuration: newDuration };
};

/**
 * Check vehicle compatibility
 */
export const checkVehicleCompatibility = (driverId, startMin, splits, drivers, requiredVehicle) => {
    if (!requiredVehicle) return false;

    // Find current vehicle at this time for this driver
    const driver = drivers.find(d => d.id === driverId);
    let currentVeh = driver?.currentVehicle;

    const driverSplits = splits.filter(s => s.driverId === driverId)
        .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    for (const split of driverSplits) {
        if (timeToMinutes(split.time) <= startMin) currentVeh = split.vehicle;
        else break;
    }

    return currentVeh && currentVeh !== requiredVehicle;
};
