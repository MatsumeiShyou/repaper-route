import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/client';

export const useSharedReasons = (isOpen: boolean) => {
    const [savedReasons, setSavedReasons] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchReasons = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('manual_injection_reasons')
                .select('reason_text')
                .order('usage_count', { ascending: false });

            if (fetchError) throw fetchError;
            if (data) {
                setSavedReasons(data.map(r => r.reason_text));
            }
        } catch (err: any) {
            console.error('Failed to fetch reasons:', err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchReasons();
        }
    }, [isOpen, fetchReasons]);

    const recordReasonUsage = async (reasonText: string, shouldSaveToList: boolean) => {
        if (!reasonText) return;

        try {
            const { data: existing, error: selectError } = await supabase
                .from('manual_injection_reasons')
                .select('id, usage_count')
                .eq('reason_text', reasonText)
                .maybeSingle();

            if (selectError) throw selectError;

            if (existing) {
                const { error: updateError } = await supabase
                    .from('manual_injection_reasons')
                    .update({
                        usage_count: (existing.usage_count || 0) + 1,
                        last_used_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                if (updateError) throw updateError;
            } else if (shouldSaveToList) {
                const { error: insertError } = await supabase
                    .from('manual_injection_reasons')
                    .insert({ reason_text: reasonText });

                if (insertError) throw insertError;

                setSavedReasons(prev => {
                    if (!prev.includes(reasonText)) {
                        return [reasonText, ...prev];
                    }
                    return prev;
                });
            }
        } catch (err: any) {
            console.error('Failed to save reason usage:', err);
            throw err;
        }
    };

    return {
        savedReasons,
        isLoading,
        error,
        recordReasonUsage,
        refresh: fetchReasons
    };
};
