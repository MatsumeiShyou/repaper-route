import React from 'react';
import { MasterDataLayout } from '../../components/MasterDataLayout';
import { MASTER_SCHEMAS } from '../../config/masterSchema.ts';

const MasterItemList: React.FC = () => {
    return (
        <MasterDataLayout schema={MASTER_SCHEMAS.items} />
    );
};

export default MasterItemList;
