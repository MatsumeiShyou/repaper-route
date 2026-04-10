import React from 'react';
import { MasterDataLayout } from '../../components/MasterDataLayout';
import { MASTER_SCHEMAS } from '../../config/masterSchema.ts';

const MasterVehicleList: React.FC = () => {
    return (
        <MasterDataLayout schema={MASTER_SCHEMAS.vehicles} />
    );
};

export default MasterVehicleList;
