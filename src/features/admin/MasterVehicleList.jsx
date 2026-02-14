import React from 'react';
import { MasterDataLayout } from '../../components/MasterDataLayout';
import { MASTER_SCHEMAS } from '../../config/masterSchema';

export default function MasterVehicleList() {
    return <MasterDataLayout schema={MASTER_SCHEMAS.vehicles} />;
}
