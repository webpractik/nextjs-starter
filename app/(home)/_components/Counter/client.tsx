'use client';

import { Typography } from 'core/Typography';
import React from 'react';

import { useGlobalStore } from '~/lib/stores/Global';

function CounterClient() {
    return <Typography>Counter client: {useGlobalStore.use.count()}</Typography>;
}

export default CounterClient;
