/**
 * Master Data Configuration
 * Centralized definition for Vehicles, Drivers, and Customers.
 */
export const MASTER_CONFIG = {
    // 車両マスタ
    vehicles: [
        { id: 'v1', name: '2025PK', type: '2t' },
        { id: 'v2', name: '2267PK', type: '2t' },
        { id: 'v3', name: '2618PK', type: '2t' },
        { id: 'v4', name: '5122PK', type: '2t' },
        { id: 'v5', name: '1111PK', type: '2t' },
        { id: 'v_seino', name: '西濃運輸', type: 'external' },
        { id: 'v_spare', name: '予備車', type: 'spare' },
        { id: 'v_rental', name: 'レンタカー', type: 'rental' }
    ],
    // ドライバーマスタ (基本設定)
    drivers: [
        { id: 'd1', name: '畑澤', defaultCourse: 'A', defaultVehicle: '2025PK' },
        { id: 'd2', name: '菊地', defaultCourse: 'B', defaultVehicle: '2267PK' },
        { id: 'd3', name: '万里', defaultCourse: 'C', defaultVehicle: '2618PK' },
        { id: 'd4', name: '片山', defaultCourse: 'D', defaultVehicle: '5122PK' },
        { id: 'd5', name: '大貴', defaultCourse: 'E', defaultVehicle: '1111PK' },
        { id: 'd6', name: '鈴木', defaultCourse: 'F', defaultVehicle: '西濃運輸' },
        { id: 'd7', name: '佐藤', defaultCourse: 'G', defaultVehicle: '予備車' },
        { id: 'd8', name: '田中', defaultCourse: 'H', defaultVehicle: 'レンタカー' }
    ],
    // 顧客マスタ (簡易版)
    customers: [
        { id: 'c1', name: '富士ロジ長沼', defaultDuration: 45, area: '厚木' },
        { id: 'c2', name: 'ESPOT(スポット)', defaultDuration: 30, area: '伊勢原' },
        { id: 'c3', name: 'リバークレイン', defaultDuration: 45, area: '横浜' },
        { id: 'c4', name: 'ユニマット', defaultDuration: 15, area: '厚木' },
        { id: 'c5', name: '特別工場A', defaultDuration: 60, area: '海老名' },
        { id: 'c99', name: '富士電線', defaultDuration: 30, area: '厚木' },
        { id: 'c98', name: '厚木事業所', defaultDuration: 60, area: '厚木' }
    ]
};
