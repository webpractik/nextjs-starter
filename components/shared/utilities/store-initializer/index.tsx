'use client';
import { useRef } from 'react';

import { CounterStore } from '~/lib/stores/counter';
import { useGlobalStore } from '~/lib/stores/global';

export function StoreInitializer({ initialState }: { initialState: Partial<CounterStore> }) {
    const initialized = useRef(false);

    if (!initialized.current) {
        useGlobalStore.setState(initialState);
        initialized.current = true;
    }

    return null;
}
