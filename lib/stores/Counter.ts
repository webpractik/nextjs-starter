import { StateCreator } from 'zustand';

export type CounterStoreProps = {
    count: number;
};

export type CounterStore = CounterStoreProps & {
    increment: () => void;
    decrement: () => void;
};

export const createCounterSlice: StateCreator<CounterStore> = set => ({
    count: 0,
    increment: () => set(state => ({ count: ++state.count })),
    decrement: () => set(state => ({ count: --state.count })),
});
