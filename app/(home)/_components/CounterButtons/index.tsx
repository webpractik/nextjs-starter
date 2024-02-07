'use client';
import { Button } from 'core/Button';
import { Flex } from 'core/Flex';
import React from 'react';

import { useGlobalStore } from '~/lib/stores/Global';

function CounterButtons() {
    return (
        <Flex gap={'.5rem'}>
            <Button size="icon" onClick={useGlobalStore.use.increment()}>
                +
            </Button>
            <Button size="icon" onClick={useGlobalStore.use.decrement()}>
                -
            </Button>
        </Flex>
    );
}

export default CounterButtons;
