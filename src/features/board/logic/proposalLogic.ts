export const createProposal = (proposedState: any) => {
    return proposedState; // Basic for now
};

export const createDecision = (decisionType: string, reason: string, data: any) => {
    return {
        type: decisionType,
        reason,
        data,
        timestamp: new Date().toISOString()
    };
};
