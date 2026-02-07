import { supabase } from '../../../lib/supabase/client';

/**
 * Creates a Decision Proposal in the SDR 'Brain' layer.
 * @param {string} type - 'move', 'add', 'remove', 'resize'
 * @param {object} snapshot - The proposed data (e.g., new job state)
 * @param {string} userId - The applicant ID
 * @param {string} reason - Optional reason description
 * @returns {Promise<string>} The created proposal_id
 */
export const createProposal = async (type, snapshot, userId, reason = null) => {
    try {
        const { data, error } = await supabase
            .from('decision_proposals')
            .insert({
                proposal_type: type,
                proposed_data: snapshot,
                applicant_id: userId,
                reason_description: reason,
                status: 'pending' // Default status
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
 * @param {string} reasonId - Optional reason ID (if standard reasons used)
 * @returns {Promise<string>} The created decision_id
 */
export const createDecision = async (proposalId, actorId, type = 'confirm', reasonId = null) => {
    try {
        // 1. Create a reason if none provided (Ad-hoc reason for now)
        let finalReasonId = reasonId;
        if (!finalReasonId) {
            // For Phase 4.0 transition, we ensure a generic 'Manual Action' reason exists or create one
            // Ideally we fetch from 'reasons' table, but here we might just insert a placeholder if needed
            // For now, let's assume NULL reason is allowed OR we skip this strict check for the MVP
            // checking schema: reason_id IS FOREIGN KEY. nullable? 
            // supabase_migration_sdr_v1.sql: reason_id UUID REFERENCES reasons(reason_id) -- implies nullable unless NOT NULL specified? 
            // It just says REFERENCES. It doesn't say NOT NULL. So it might be nullable.
            // But let's check: "MUST have a reason" comment exists.
        }

        const { data, error } = await supabase
            .from('decisions')
            .insert({
                proposal_id: proposalId,
                reason_id: finalReasonId,
                decision_type: type,
                actor_id: actorId
            })
            .select('decision_id')
            .single();

        if (error) throw error;

        // 2. Update Proposal Status to Approved (Atomically ideally, but sequentially here)
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

/**
 * Helper to get or create a default reason for manual actions.
 * @returns {Promise<string>} reason_id
 */
export const ensureDefaultReason = async () => {
    // Check for 'MANUAL_OPERATION' category
    const { data } = await supabase
        .from('reasons')
        .select('reason_id')
        .eq('category_code', 'MANUAL_OPERATION')
        .limit(1)
        .maybeSingle();

    if (data) return data.reason_id;

    // Create if missing
    const { data: newData, error } = await supabase
        .from('reasons')
        .insert({
            category_code: 'MANUAL_OPERATION',
            description_text: 'Manual operation on the board'
        })
        .select('reason_id')
        .single();

    return newData ? newData.reason_id : null;
};
