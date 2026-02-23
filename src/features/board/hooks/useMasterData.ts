import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { MasterVehicle, MasterCustomer, MasterItem, CustomerItemDefault } from '../../../types';

// モジュールレベルのキャッシュ
let masterCache: {
    drivers: any[];
    vehicles: MasterVehicle[];
    customers: MasterCustomer[];
    items: MasterItem[];
    customerItemDefaults: CustomerItemDefault[];
} | null = null;

export function invalidateMasterCache() {
    masterCache = null;
}

export const useMasterData = () => {
    const [drivers, setDrivers] = useState<any[]>(masterCache?.drivers || []);
    const [vehicles, setVehicles] = useState<MasterVehicle[]>(masterCache?.vehicles || []);
    const [customers, setCustomers] = useState<MasterCustomer[]>(masterCache?.customers || []);
    const [items, setItems] = useState<MasterItem[]>(masterCache?.items || []);
    const [customerItemDefaults, setCustomerItemDefaults] = useState<CustomerItemDefault[]>(masterCache?.customerItemDefaults || []);
    const [isLoading, setIsLoading] = useState(!masterCache);

    useEffect(() => {
        const fetchAll = async () => {
            if (masterCache) {
                setIsLoading(false);
                return;
            }
            try {
                // Fetch all master data in parallel with Type Safety
                const [d, v, c, i, cid] = await Promise.all([
                    supabase.from('drivers').select('*').order('display_order', { ascending: true }),
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

                const newCache = {
                    drivers: processedDrivers,
                    vehicles: (v.data || []) as MasterVehicle[],
                    customers: processedCustomers,
                    items: (i.data || []) as MasterItem[],
                    customerItemDefaults: (cid.data || []) as unknown as CustomerItemDefault[]
                };

                masterCache = newCache;

                setDrivers(newCache.drivers);
                setVehicles(newCache.vehicles);
                setCustomers(newCache.customers);
                setItems(newCache.items);
                setCustomerItemDefaults(newCache.customerItemDefaults);

                console.log('Master data loaded and cached (TS):', {
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
