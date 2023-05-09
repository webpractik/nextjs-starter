import { createContext, useContext } from 'react';

import Store from '@/domain/core/Store';

let store: Store;

export const GlobalStoreContext = createContext<Store>({} as Store);

export const initializeStore = (initialData?: unknown) => {
    const actualStore = store ?? new Store();

    if (initialData) {
        actualStore.hydrate(initialData);
    }

    if (typeof window === 'undefined') {
        return actualStore;
    }

    if (!store) {
        store = actualStore;
    }

    return actualStore;
};

export const useStore = () => {
    const context = useContext(GlobalStoreContext);

    if (!context) {
        throw new Error('undefined StoreProvider');
    }

    return context;
};
