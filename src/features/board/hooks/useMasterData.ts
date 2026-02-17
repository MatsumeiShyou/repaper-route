import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { MasterVehicle, MasterCustomer, MasterItem, CustomerItemDefault } from '../../../types';

export const useMasterData = () => {
    const [drivers, setDrivers] = useState<any[]>([]); // Typed as any[] for now as per legacy processed form
    const [vehicles, setVehicles] = useState<MasterVehicle[]>([]);
    const [customers, setCustomers] = useState<MasterCustomer[]>([]);
    const [items, setItems] = useState<MasterItem[]>([]);
    const [customerItemDefaults, setCustomerItemDefaults] = useState<CustomerItemDefault[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Fetch all master data in parallel with Type Safety
                const [d, v, c, i, cid] = await Promise.all([
                    supabase.from('drivers').select('*').order('display_order', { ascending: true }).order('id', { ascending: true }),
                    supabase.from('vehicles').select('*').order('id'),
                    supabase.from('master_collection_points').select('*').order('location_id'),
                    supabase.from('master_items').select('*').order('display_order'),
                    supabase.from('customer_item_defaults').select('*')
                ]);

                // Process Drivers (Adapter)
                const processedDrivers = (d.data || []).map((driver: any) => ({
                    ...driver,
                    defaultCourse: driver.default_course || driver.defaultCourse,
                    defaultVehicle: driver.default_vehicle || driver.defaultVehicle
                }));

                // Process Customers (Adapter)
                const processedCustomers: MasterCustomer[] = (c.data || []).map((point: any) => ({
                    ...point,
                    id: point.location_id, // Map location_id -> id for UI compatibility
                }));

                setDrivers(processedDrivers);
                if (v.data) setVehicles(v.data as MasterVehicle[]);
                if (c.data) setCustomers(processedCustomers);
                if (i.data) setItems(i.data as MasterItem[]);
                if (cid.data) setCustomerItemDefaults(cid.data as CustomerItemDefault[]);

                console.log('Master data loaded (TS):', {
                    drivers: processedDrivers.length,
                    vehicles: v.data?.length,
                    collection_points: processedCustomers.length
                });

            } catch (error) {
                console.error('Master data fetch error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, []);

    return { drivers, vehicles, customers, items, customerItemDefaults, isLoading };
};
