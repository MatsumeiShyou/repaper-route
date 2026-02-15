import React from 'react';
import { MasterDataLayout } from '../../components/MasterDataLayout';
import { MASTER_SCHEMAS } from '../../config/masterSchema.ts';

const MasterDriverList: React.FC = () => {
    return <MasterDataLayout schema={MASTER_SCHEMAS.drivers} />;
};

export default MasterDriverList;
