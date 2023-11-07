'use client';

import React from 'react';

import { useGlobalStore } from '~/lib/stores/Global';

function Counter() {
    return <h1 style={{ color: 'white' }}>Counter client: {useGlobalStore.use.count()}</h1>;
}

export default Counter;
