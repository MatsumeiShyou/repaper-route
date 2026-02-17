import { supabase } from '../supabase/client';

/**
 * RouteRepository
 * Implements SDR (State-Decision-Reason) pattern.
 */
export class RouteRepository {
    /**
     * Save plan with Dual Write (Event Log + State Update)
     * @param {object} plan - The route plan object (State)
     * @param {object} context - { reason: string, user: string }
     */
    static async savePlan(plan, context) {
        if (!plan || !plan.date) throw new Error("Invalid plan data");

        const timestamp = new Date().toISOString();

        // 1. Decision Recording (Immutable History)
        const decisionEvent = {
            event_type: 'PLAN_UPDATE',
            payload: plan,
            reason: context.reason || 'Manual Update',
            user_id: context.user || 'system',
            created_at: timestamp
        };

        const { error: eventError } = await supabase
            .from('route_events')
            .insert(decisionEvent);

        if (eventError) {
            console.error('Failed to log route event:', eventError);
            // Non-blocking error? ideally blocking, but for now we warn.
            // In strict SDR, this should fail the transaction.
            throw new Error(`SDR Violation: Failed to record decision. ${eventError.message}`);
        }

        // 2. State Update (Mutable View)
        const { error: stateError } = await supabase
            .from('routes')
            .upsert({
                date: plan.date,
                data: plan,
                updated_at: timestamp
            }, { onConflict: 'date' });

        if (stateError) {
            console.error('Failed to update route state:', stateError);
            throw stateError;
        }

        return true;
    }

    /**
     * Fetch plan state (View)
     * @param {string} date 
     */
    static async getPlan(date) {
        const { data, error } = await supabase
            .from('routes')
            .select('*')
            .eq('date', date)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Failed to fetch route:', error);
            return null;
        }

        return data ? data.data : null;
    }
}
