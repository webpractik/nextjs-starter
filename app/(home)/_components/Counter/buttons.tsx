'use client';
import { Box } from 'core/Box';
import { Button } from 'core/Button';
import React from 'react';

import { useGlobalStore } from '~/lib/stores/Global';

function CounterButtons() {
    return (
        <Box gap={'.5rem'}>
            <Button size="icon" onClick={useGlobalStore.use.increment()}>
                +
            </Button>
            <Button size="icon" onClick={useGlobalStore.use.decrement()}>
                -
            </Button>
        </Box>
    );
}

export default CounterButtons;
