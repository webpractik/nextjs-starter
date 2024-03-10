import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { CounterStore, createCounterSlice } from '~/lib/stores/counter';

import { createSelectors } from './create-selectors';

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
