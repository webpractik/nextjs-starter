import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { CounterStore, createCounterSlice } from '~/lib/stores/Counter';

import { createSelectors } from './createSelectors';

export type GlobalStore = CounterStore;

const useGlobalStoreBase = create<GlobalStore>()(
    devtools(
        (...actions) => ({
            ...createCounterSlice(...actions),
        }),
        { name: 'GlobalStore' }
    )
);

export const useGlobalStore = createSelectors(useGlobalStoreBase);
