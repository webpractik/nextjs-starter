import React from 'react';

import { useGlobalStore } from '~/lib/stores/Global';

function CounterRSC() {
    return <h1>Counter Server: {useGlobalStore.getState().count}</h1>;
}

export default CounterRSC;
