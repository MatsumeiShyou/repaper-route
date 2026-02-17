import { useState, useCallback } from 'react';
import { EventRepository } from '../lib/eventRepository';

// States
const JOB_STATE = {
    PENDING: 'PENDING',
    MOVING: 'MOVING',
    ARRIVED: 'ARRIVED',
    WORKING: 'WORKING',
    COMPLETED: 'COMPLETED'
};

// Events (Transitions)
const TRANSITIONS = {
    [JOB_STATE.PENDING]: { START_MOVE: JOB_STATE.MOVING },
    [JOB_STATE.MOVING]: { ARRIVE: JOB_STATE.ARRIVED, ABORT: JOB_STATE.PENDING },
    [JOB_STATE.ARRIVED]: { START_WORK: JOB_STATE.WORKING, CANCEL_ARRIVAL: JOB_STATE.MOVING },
    [JOB_STATE.WORKING]: { COMPLETE: JOB_STATE.COMPLETED, CANCEL_WORK: JOB_STATE.ARRIVED },
    [JOB_STATE.COMPLETED]: { ROLLBACK: JOB_STATE.WORKING } // Only for correction immediately after
};

/**
 * L1 Constraint State Machine for a single Job.
 * Enforces strict transitions:
 * - Cannot input weight unless ARRIVED/WORKING.
 * - Cannot Complete unless Weight is valid (handled by validation, but state allows entry).
 */
export const useJobStateMachine = (initialState = JOB_STATE.PENDING, jobId, driverId = 'driver_me') => {
    const [status, setStatus] = useState(initialState);
    const [isLoading, setIsLoading] = useState(false);

    const transition = useCallback(async (action, payload = {}) => {
        setIsLoading(true);
        const nextState = TRANSITIONS[status]?.[action];

        if (!nextState) {
            console.warn(`[L1 Block] Invalid transition: ${status} -> ${action}`);
            setIsLoading(false);
            return false;
        }

        // SDR Logging
        console.log(`[Machine] Transitioning ${status} -> ${nextState} via ${action}`);

        try {
            await EventRepository.log(driverId, `JOB_${action}`, {
                job_id: jobId,
                from: status,
                to: nextState,
                ...payload
            });

            // Optimistic Update
            setStatus(nextState);
            return true;
        } catch (e) {
            console.error("State transition failed", e);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [status, jobId, driverId]);

    // Helper checkers for UI
    const canMove = status === JOB_STATE.PENDING;
    const canArrive = status === JOB_STATE.MOVING;
    const canWork = status === JOB_STATE.ARRIVED;
    const isWorking = status === JOB_STATE.WORKING;
    const isCompleted = status === JOB_STATE.COMPLETED;

    return {
        state: status, // Current State
        isLoading,
        actions: {
            startMoving: () => transition('START_MOVE'),
            arrive: () => transition('ARRIVE'),
            startWork: () => transition('START_WORK'),
            completeWork: (resultData) => transition('COMPLETE', resultData),
            abort: () => transition('ABORT')
        },
        can: {
            move: canMove,
            arrive: canArrive,
            work: canWork, // Start working (open form)
            input: isWorking, // Actually inputting data
            complete: isWorking // Submit data
        },
        constants: { JOB_STATE }
    };
};
