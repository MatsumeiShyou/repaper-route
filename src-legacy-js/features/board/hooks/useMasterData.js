import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase/client';

export const useMasterData = () => {
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [customerItemDefaults, setCustomerItemDefaults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Fetch all master data in parallel
                const [d, v, c, i, cid] = await Promise.all([
                    supabase.from('drivers').select('*').order('display_order', { ascending: true }).order('id', { ascending: true }),
                    supabase.from('vehicles').select('*').order('id'),
                    supabase.from('master_collection_points').select('*').order('location_id'), // Phase 4.0: Switch to SDR table
                    supabase.from('master_items').select('*').order('display_order'),
                    supabase.from('customer_item_defaults').select('*')
                ]);

                // Process Drivers
                const processedDrivers = (d.data || []).map(driver => ({
                    ...driver,
                    defaultCourse: driver.default_course || driver.defaultCourse,
                    defaultVehicle: driver.default_vehicle || driver.defaultVehicle
                }));

                const processedCustomers = (c.data || []).map(point => ({
                    ...point,
                    id: point.location_id, // Adapter: Map location_id -> id for UI compatibility
                }));

                setDrivers(processedDrivers);
                if (v.data) setVehicles(v.data);
                if (c.data) setCustomers(processedCustomers);
                if (i.data) setItems(i.data);
                if (cid.data) setCustomerItemDefaults(cid.data);

                // Debug log
                console.log('Master data loaded (SDR):', {
                    drivers: d.data?.length,
                    vehicles: v.data?.length,
                    collection_points: c.data?.length
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
