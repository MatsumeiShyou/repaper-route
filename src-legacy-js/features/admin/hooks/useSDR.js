import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase/client';

export const useSDR = () => {
    const [proposals, setProposals] = useState([]);
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initial Fetch
    const fetchSDRData = async () => {
        setLoading(true);
        try {
            const [p, d] = await Promise.all([
                supabase.from('decision_proposals').select('*').order('created_at', { ascending: false }).limit(100),
                supabase.from('decisions').select('*').order('decided_at', { ascending: false }).limit(100)
            ]);

            if (p.error) throw p.error;
            if (d.error) throw d.error;

            setProposals(p.data || []);
            setDecisions(d.data || []);
        } catch (err) {
            console.error("SDR Data Fetch Error:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    // Real-time Subscription
    useEffect(() => {
        fetchSDRData();

        const channel = supabase
            .channel('sdr-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'decision_proposals' },
                (payload) => {
                    console.log('Proposal Change:', payload);
                    fetchSDRData(); // Refresh on any change
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'decisions' },
                (payload) => {
                    console.log('Decision Created:', payload);
                    fetchSDRData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Actions
    const approveProposal = async (proposalId, approverId) => {
        try {
            const { data: proposal, error: fetchError } = await supabase
                .from('decision_proposals')
                .select('*')
                .eq('proposal_id', proposalId)
                .single();

            if (fetchError) throw fetchError;
            if (proposal.status !== 'pending') throw new Error("Proposal is not pending");

            // Execute Approval (This logic ideally lives in Backend/Edge Function, but Client-side for Phase 4.2)
            // 1. Create Decision
            const { error: decisionError } = await supabase
                .from('decisions')
                .insert([{
                    proposal_id: proposalId,
                    decision_type: 'approve',
                    final_value: proposal.proposed_value,
                    decider_id: approverId,
                    decided_at: new Date().toISOString()
                }]);

            if (decisionError) throw decisionError;

            // 2. Update Proposal Status
            const { error: updateError } = await supabase
                .from('decision_proposals')
                .update({ status: 'approved' })
                .eq('proposal_id', proposalId);

            if (updateError) throw updateError;

            // 3. Apply Change to Reality (Foundation Layer) - if needed (e.g. updating customers table)
            // For now, BoardCanvas reads mostly from daily routes, so persistent changes might need logic here 
            // OR the daily route is updated by the drag operation already.
            // *Wait*, in current Drag&Drop implementation, we create a proposal AND apply the change optimistically? 
            // Actually, the current BoardCanvas `createProposal` logic does NOT block the UI update. 
            // So "Approval" here is mostly for audit logging unless we implement blocking logic.
            // For Phase 4.2, we focus on the Audit Trail.

            return { success: true };
        } catch (err) {
            console.error("Approval Error:", err);
            return { success: false, error: err };
        }
    };

    const rejectProposal = async (proposalId, rejectorId) => {
        try {
            // 1. Create Decision (Reject)
            const { error: decisionError } = await supabase
                .from('decisions')
                .insert([{
                    proposal_id: proposalId,
                    decision_type: 'reject',
                    final_value: null, // Rejected means no change or reverting
                    decider_id: rejectorId,
                    decided_at: new Date().toISOString()
                }]);

            if (decisionError) throw decisionError;

            // 2. Update Proposal Status
            const { error: updateError } = await supabase
                .from('decision_proposals')
                .update({ status: 'rejected' })
                .eq('proposal_id', proposalId);

            if (updateError) throw updateError;

            return { success: true };
        } catch (err) {
            console.error("Rejection Error:", err);
            return { success: false, error: err };
        }
    };

    return {
        proposals,
        decisions,
        loading,
        error,
        approveProposal,
        rejectProposal,
        refresh: fetchSDRData
    };
};
