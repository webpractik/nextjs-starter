import { z } from 'zod';

export const Route = {
    name: 'ApiReady',
    params: z.object({}),
};

export const GET = {
    result: z.object({}),
};
