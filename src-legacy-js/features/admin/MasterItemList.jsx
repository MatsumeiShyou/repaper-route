import React from 'react';
import MasterDataLayout from '../../components/MasterDataLayout';
import { MASTER_SCHEMAS } from '../../config/masterSchema';

export default function MasterItemList() {
    return <MasterDataLayout schema={MASTER_SCHEMAS.items} />;
}
