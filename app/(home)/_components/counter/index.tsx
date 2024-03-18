import StoreInitializer from 'components/shared/utilities/store-initializer';
import React from 'react';

import CounterButtons from '@/(home)/_components/counter/buttons';
import CounterClient from '@/(home)/_components/counter/client';
import CounterRSC from '@/(home)/_components/counter/rsc';
import { useGlobalStore } from '~/lib/stores/global';

const DEFAULT_STATE = { count: 10 };

export function Counter() {
    // server-side store initialization
    useGlobalStore.setState(DEFAULT_STATE);

    return (
        <div className="flex flex-col items-center gap-4">
            {/* client-side store initialization */}
            <CounterClient />
            <CounterRSC />
            <CounterButtons />
            <StoreInitializer initialState={DEFAULT_STATE} />
        </div>
    );
}
