'use client';
import { Button } from '@repo/core/button';
import React from 'react';

import { useGlobalStore } from '~/lib/stores/global';

function CounterButtons() {
    return (
        <div className="flex gap-2">
            <Button size="icon" onClick={useGlobalStore.use.increment()}>
                +
            </Button>
            <Button size="icon" onClick={useGlobalStore.use.decrement()}>
                -
            </Button>
        </div>
    );
}

export default CounterButtons;
