import React from 'react';
import { MasterDataLayout } from '../../components/MasterDataLayout';
import { MASTER_SCHEMAS } from '../../config/masterSchema.ts';

const MasterPointList: React.FC = () => {
    return (
        <MasterDataLayout schema={MASTER_SCHEMAS.points} />
    );
};

export default MasterPointList;
