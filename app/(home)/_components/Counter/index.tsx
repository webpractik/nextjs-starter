import { Box } from 'core/Box';
import React from 'react';
import StoreInitializer from 'shared/utilities/StoreInitializer';

import CounterButtons from '@/(home)/_components/Counter/buttons';
import CounterClient from '@/(home)/_components/Counter/client';
import CounterRSC from '@/(home)/_components/Counter/rsc';
import { useGlobalStore } from '~/lib/stores/Global';

const DEFAULT_STATE = { count: 10 };

export function Counter() {
    // server-side store initialization
    useGlobalStore.setState(DEFAULT_STATE);

    return (
        <Box direction="column" gap="1rem" alignItems="center">
            {/* client-side store initialization */}
            <CounterClient />
            <CounterRSC />
            <CounterButtons />
            <StoreInitializer initialState={DEFAULT_STATE} />
        </Box>
    );
}
