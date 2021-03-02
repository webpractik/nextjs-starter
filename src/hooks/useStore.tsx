import React, { useContext } from 'react';

import GlobalStoreContext from '@/context/GlobalStoreContext';
import Store from '@/domain/core/Store';

let store: Store;

const initializeStore = (initialData = null) => {
    const actualStore = store ?? new Store();

    if (initialData) {
        actualStore.hydrate(initialData);
    }

    if (typeof window === 'undefined') return actualStore;

    if (!store) store = actualStore;

    return actualStore;
};

export const StoreProvider = ({ children, initialState: initialData }) => {
    const initializedStore = initializeStore(initialData);

    return (
        <GlobalStoreContext.Provider value={initializedStore}>
            {children}
        </GlobalStoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(GlobalStoreContext);

    if (context === undefined) {
        throw new Error('undefined StoreProvider');
    }

    return context;
};
