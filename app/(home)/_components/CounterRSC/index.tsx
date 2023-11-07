import React from 'react';

import { useGlobalStore } from '~/lib/stores/Global';

function CounterRSC() {
    return <h1 style={{ color: 'white' }}>Counter RSC: {useGlobalStore.getState().count}</h1>;
}

export default CounterRSC;
