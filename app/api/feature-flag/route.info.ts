import { z } from 'zod';

export const Route = {
    name: 'ApiFeatureFlag',
    params: z.object({}),
};

export const GET = {
    result: z.object({}),
};
