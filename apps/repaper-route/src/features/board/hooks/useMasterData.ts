import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { MasterVehicle, MasterCustomer, MasterItem, CustomerItemDefault } from '../../../types';

export const useMasterData = () => {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<MasterVehicle[]>([]);
    const [customers, setCustomers] = useState<MasterCustomer[]>([]);
    const [items, setItems] = useState<MasterItem[]>([]);
    const [customerItemDefaults, setCustomerItemDefaults] = useState<CustomerItemDefault[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const invalidateMasterCache = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            setIsLoading(true);
            try {
                const [d, v, c, i, cid] = await Promise.all([
                    supabase.from('drivers').select('*').order('display_order', { ascending: true }).order('id', { ascending: true }),
                    supabase.from('vehicles').select('*').order('id'),
                    supabase.from('master_collection_points').select('*').order('location_id'),
                    supabase.from('master_items').select('*').order('display_order'),
                    supabase.from('customer_item_defaults').select('*')
                ]);

                const processedDrivers = (d.data || []).map((driver: any) => ({
                    ...driver,
                    defaultCourse: driver.default_course || driver.defaultCourse,
                    defaultVehicle: driver.default_vehicle || driver.defaultVehicle
                }));

                const processedCustomers: MasterCustomer[] = (c.data || []).map((point: any) => ({
                    ...point,
                    id: point.location_id,
                }));

                setDrivers(processedDrivers);
                if (v.data) setVehicles(v.data as MasterVehicle[]);
                if (c.data) setCustomers(processedCustomers);
                if (i.data) setItems(i.data as MasterItem[]);
                if (cid.data) setCustomerItemDefaults(cid.data as CustomerItemDefault[]);

            } catch (error) {
                console.error('Master data fetch error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, [refreshKey]);

    return { 
        drivers, 
        vehicles, 
        customers, 
        items, 
        customerItemDefaults, 
        isLoading,
        invalidateMasterCache 
    };
};

// Export individual refresh trigger for specific components
export const invalidateMasterCache = () => {
    // This is a placeholder for external singleton triggers if needed,
    // but the primary usage is via the hook.
    window.dispatchEvent(new CustomEvent('invalidate-master-cache'));
};
