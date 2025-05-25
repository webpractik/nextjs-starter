import client from 'prom-client';

const { collectDefaultMetrics } = client;

const { Registry } = client;

export const register = new Registry();

collectDefaultMetrics({
    prefix: process.env.APP_NAME as string,
    register,
});
