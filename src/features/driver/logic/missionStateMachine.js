/**
 * Mission State Machine
 * Defines valid states and transitions for the driver workflow.
 */

export const MISSION_STATES = {
    INSPECTION: 'INSPECTION', // Initial state
    READY: 'READY',         // Inspection done, ready to start
    WORKING: 'WORKING',     // Active mission
    REPORTING: 'REPORTING', // End of day report
    COMPLETED: 'COMPLETED'  // All done
};

/**
 * Transition the state based on action
 * @param {string} currentState 
 * @param {string} action 
 * @param {object} payload 
 * @returns {string} nextState
 */
export const transitionMissionState = (currentState, action, payload = {}) => {
    switch (currentState) {
        case MISSION_STATES.INSPECTION:
            if (action === 'COMPLETE_INSPECTION') {
                return MISSION_STATES.WORKING;
                // Note: Original app skipped READY and went straight to WORK. 
                // We can introduce READY if we want a "Start" button after inspection, 
                // but adherence to current flow suggests INSPECTION -> WORKING is fine.
            }
            break;

        case MISSION_STATES.WORKING:
            if (action === 'START_EOD') {
                return MISSION_STATES.REPORTING;
            }
            break;

        case MISSION_STATES.REPORTING:
            if (action === 'SUBMIT_REPORT') {
                return MISSION_STATES.INSPECTION; // Loop back or COMPLETED? Original loops back to inspection.
            }
            if (action === 'CANCEL_REPORT') {
                return MISSION_STATES.WORKING;
            }
            break;

        default:
            return currentState;
    }
    return currentState;
};

/**
 * Hook logic helper (can be expanded to full hook later)
 */
export const canTransition = (currentState, action) => {
    const next = transitionMissionState(currentState, action);
    return next !== currentState;
};
