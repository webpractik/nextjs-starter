import { z } from 'zod';

export const Route = {
    name: 'ApiMetrics',
    params: z.object({}),
};

export const GET = {
    result: z.object({}),
};
