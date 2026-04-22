import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { nativeSupabaseFetch } from '../lib/supabase/nativeFetch';
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
            // supabase.from のデッドロックを避けるため、全て nativeSupabaseFetch で並列取得する
            const [dRes, vRes, cRes, iRes, cidRes] = await Promise.all([
                nativeSupabaseFetch('drivers', 'select=*&order=display_order.asc'),
                nativeSupabaseFetch('vehicles', 'select=*&order=id.asc'),
                nativeSupabaseFetch('master_collection_points', 'select=*&order=id.asc'),
                nativeSupabaseFetch('master_items', 'select=*&order=display_order.asc'),
                nativeSupabaseFetch('customer_item_defaults', 'select=*')
            ]);

            const processedDrivers = (dRes.data || []).map((driver: any) => ({
                ...driver,
                defaultCourse: driver.default_course || driver.defaultCourse,
                defaultVehicle: driver.default_vehicle || driver.defaultVehicle
            }));

            setData({
                drivers: processedDrivers,
                vehicles: (vRes.data || []) as unknown as MasterVehicle[],
                customers: (cRes.data || []) as MasterCustomer[],
                items: (iRes.data || []) as MasterItem[],
                customerItemDefaults: (cidRes.data || []) as unknown as CustomerItemDefault[]
            });
        } catch (error) {
            console.error('Master data fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // マウント時に一度取得。トークンがまだない場合でも、
        // 公開マスタが取得できる可能性があるため実行するが、
        // 失敗しても isLoading を false にしてハングを防止する。
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
