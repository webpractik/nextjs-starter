import React, { useContext } from 'react';

import GlobalStoreContext from '@/context/GlobalStoreContext';
import Store from '@/domain/core/Store';

let store: Store;

const initializeStore = (initialData?: unknown) => {
    const actualStore = store ?? new Store();

    if (initialData) {
        actualStore.hydrate(initialData);
    }

    if (typeof window === 'undefined') return actualStore;

    if (!store) store = actualStore;

    return actualStore;
};

export function StoreProvider({
    children,
    initialState,
}: {
    children: React.ReactNode;
    initialState?: unknown;
}) {
    const initializedStore = initializeStore(initialState);

    return (
        <GlobalStoreContext.Provider value={initializedStore}>
            {children}
        </GlobalStoreContext.Provider>
    );
}

export const useStore = () => {
    const context = useContext(GlobalStoreContext);

    if (context === undefined) {
        throw new Error('undefined StoreProvider');
    }

    return context;
};
