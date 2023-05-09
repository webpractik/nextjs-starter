'use client';

import React from 'react';

import { GlobalStoreContext, initializeStore } from '@/hooks/useStore';

export default function StoreProvider({
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
