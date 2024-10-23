import client from 'prom-client';

import { environment } from '~/env/server';

const collectDefaultMetrics = client.collectDefaultMetrics;

const Registry = client.Registry;

export const register = new Registry();

collectDefaultMetrics({
    prefix: environment.APP_NAME,
    register,
});
