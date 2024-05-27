import {
    useParams as useNextParams,
    useRouter,
    useSearchParams as useNextSearchParams,
} from 'next/navigation';
import { z } from 'zod';

import { RouteBuilder } from './makeRoute';

const emptySchema = z.object({});

type PushOptions = Parameters<ReturnType<typeof useRouter>['push']>[1];

function convertURLSearchParamsToObject(
    params: Readonly<URLSearchParams> | null
): Record<string, string | string[]> {
    if (!params) {
        return {};
    }

    const object: Record<string, string | string[]> = {};
    for (const [key, value] of params.entries()) {
        object[key] = params.getAll(key).length > 1 ? params.getAll(key) : value;
    }
    return object;
}

export function usePush<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema = typeof emptySchema,
>(builder: RouteBuilder<Params, Search>) {
    const { push } = useRouter();
    return (p: z.input<Params>, search?: z.input<Search>, options?: PushOptions) => {
        push(builder(p, search), options);
    };
}

export function useParams<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema = typeof emptySchema,
>(builder: RouteBuilder<Params, Search>): z.output<Params> {
    const response = builder.paramsSchema.safeParse(useNextParams());
    if (!response.success) {
        throw new Error(
            `Invalid route params for route ${builder.routeName}: ${response.error.message}`
        );
    }
    return response.data;
}

export function useSearchParams<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema = typeof emptySchema,
>(builder: RouteBuilder<Params, Search>): z.output<Search> {
    const response = builder.searchSchema.safeParse(
        convertURLSearchParamsToObject(useNextSearchParams())
    );
    if (!response.success) {
        throw new Error(
            `Invalid search params for route ${builder.routeName}: ${response.error.message}`
        );
    }
    return response.data;
}
