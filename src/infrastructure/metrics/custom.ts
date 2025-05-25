import { environment } from '#/env/server';
import client from 'prom-client';

const { collectDefaultMetrics } = client;

const { Registry } = client;

export const register = new Registry();

collectDefaultMetrics({
    prefix: environment.APP_NAME,
    register,
});
