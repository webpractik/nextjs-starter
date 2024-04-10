import { z } from 'zod';

export const Route = {
    name: 'ApiHealth',
    params: z.object({}),
};

export const GET = {
    result: z.object({}),
};
