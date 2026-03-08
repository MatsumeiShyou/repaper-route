import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';
import { MasterVehicle, MasterCustomer, MasterItem, CustomerItemDefault } from '../types';

interface MasterData {
    drivers: any[];
    vehicles: MasterVehicle[];
    customers: MasterCustomer[];
    items: MasterItem[];
    customerItemDefaults: CustomerItemDefault[];
}

interface MasterDataContextType extends MasterData {
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export const MasterDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setData] = useState<MasterData>({
        drivers: [],
        vehicles: [],
        customers: [],
        items: [],
        customerItemDefaults: []
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [d, v, c, i, cid] = await Promise.all([
                supabase.from('drivers').select('*').order('display_order', { ascending: true }),
                supabase.from('vehicles').select('*').order('id'),
                supabase.from('view_master_points').select('*').order('id'),
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
            }));

            setData({
                drivers: processedDrivers,
                vehicles: (v.data || []) as unknown as MasterVehicle[],
                customers: processedCustomers,
                items: (i.data || []) as MasterItem[],
                customerItemDefaults: (cid.data || []) as unknown as CustomerItemDefault[]
            });
        } catch (error) {
            console.error('Master data fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    return (
        <MasterDataContext.Provider value={{ ...data, isLoading, refresh: fetchAll }}>
            {children}
        </MasterDataContext.Provider>
    );
};

export const useMasterDataContext = () => {
    const context = useContext(MasterDataContext);
    if (context === undefined) {
        throw new Error('useMasterDataContext must be used within a MasterDataProvider');
    }
    return context;
};
