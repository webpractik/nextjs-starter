'use client';
import { useRef } from 'react';

import { CounterStore } from '@/lib/stores/Counter';
import { useGlobalStore } from '@/lib/stores/Global';

function StoreInitializer({ initialState }: { initialState: Partial<CounterStore> }) {
    const initialized = useRef(false);

    if (!initialized.current) {
        useGlobalStore.setState(initialState);
        initialized.current = true;
    }

    return null;
}

export default StoreInitializer;
