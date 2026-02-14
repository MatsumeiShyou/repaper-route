import { supabase } from '../../../lib/supabase/client';

/**
 * Creates a Decision Proposal in the SDR 'Brain' layer.
 * @param {string} type - 'move', 'add', 'remove', 'resize'
 * @param {object} snapshot - The proposed data (e.g., new job state)
 * @param {string} userId - The applicant ID
 * @param {string} reason - REQUIRED reason description
 * @returns {Promise<string>} The created proposal_id
 */
export const createProposal = async (type, snapshot, userId, reason) => {
    if (!reason) {
        console.error('SDR Error: Reason is required for all proposals.');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('decision_proposals')
            .insert({
                proposal_type: type,
                proposed_data: snapshot,
                applicant_id: userId,
                reason_description: reason,
                status: 'pending'
            })
            .select('proposal_id')
            .single();

        if (error) throw error;
        return data.proposal_id;
    } catch (err) {
        console.error('Failed to create proposal:', err);
        return null;
    }
};

/**
 * Creates a Decision (Immutable History) from a Proposal.
 * @param {string} proposalId - The source proposal ID
 * @param {string} actorId - Who executed/approved it
 * @param {string} type - 'confirm', 'swap', etc.
 * @param {string} reasonId - Optional reason ID (standardized)
 * @returns {Promise<string>} The created decision_id
 */
export const createDecision = async (proposalId, actorId, type = 'confirm', reasonId = null) => {
    try {
        const { data, error } = await supabase
            .from('decisions')
            .insert({
                proposal_id: proposalId,
                reason_id: reasonId,
                decision_type: type,
                actor_id: actorId
            })
            .select('decision_id')
            .single();

        if (error) throw error;

        // Update Proposal Status to Approved
        await supabase
            .from('decision_proposals')
            .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: actorId })
            .eq('proposal_id', proposalId);

        return data.decision_id;
    } catch (err) {
        console.error('Failed to create decision:', err);
        return null;
    }
};
