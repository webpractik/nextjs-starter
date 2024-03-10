'use client';
import Flex from 'core/Flex';
import React from 'react';

import { useGlobalStore } from '~/lib/stores/global';

function CounterButtons() {
    const increment = useGlobalStore.use.increment();
    const decrement = useGlobalStore.use.decrement();

    return (
        <Flex gap={'.5rem'}>
            <button onClick={increment}>+</button>
            <button onClick={decrement}>-</button>
        </Flex>
    );
}

export default CounterButtons;
