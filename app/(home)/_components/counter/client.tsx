'use client';

import { Typography } from 'components/core/typography';
import React from 'react';

import { useGlobalStore } from '~/lib/stores/global';

function CounterClient() {
    return <Typography>Counter client: {useGlobalStore.use.count()}</Typography>;
}

export default CounterClient;
