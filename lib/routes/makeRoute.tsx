import Link from 'next/link';
import {
    useParams as useNextParams,
    useRouter,
    useSearchParams as useNextSearchParams,
} from 'next/navigation';
import queryString from 'query-string';
import React from 'react';
import { z } from 'zod';

type LinkProps = Parameters<typeof Link>[0];

export type RouteInfo<Params extends z.ZodSchema, Search extends z.ZodSchema> = {
    name: string;
    params: Params;
    search: Search;
    description?: string;
};

export type GetInfo<Result extends z.ZodSchema> = {
    result: Result;
};

export type PostInfo<Body extends z.ZodSchema, Result extends z.ZodSchema> = {
    body: Body;
    result: Result;
    description?: string;
};

export type PutInfo<Body extends z.ZodSchema, Result extends z.ZodSchema> = {
    body: Body;
    result: Result;
    description?: string;
};

type FetchOptions = Parameters<typeof fetch>[1];

type PushOptions = Parameters<ReturnType<typeof useRouter>['push']>[1];

type CoreRouteElements<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema = typeof emptySchema,
> = {
    params: z.output<Params>;
    paramsSchema: Params;
    search: z.output<Search>;
    searchSchema: Search;
};

type PutRouteBuilder<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    Body extends z.ZodSchema,
    Result extends z.ZodSchema,
> = CoreRouteElements<Params, Search> & {
    (
        body: z.input<Body>,
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>>;

    body: z.output<Body>;
    bodySchema: Body;
    result: z.output<Result>;
    resultSchema: Result;
};

type PostRouteBuilder<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    Body extends z.ZodSchema,
    Result extends z.ZodSchema,
> = CoreRouteElements<Params, Search> & {
    (
        body: z.input<Body>,
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>>;

    body: z.output<Body>;
    bodySchema: Body;
    result: z.output<Result>;
    resultSchema: Result;
};

type GetRouteBuilder<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    Result extends z.ZodSchema,
> = CoreRouteElements<Params, Search> & {
    (
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>>;

    result: z.output<Result>;
    resultSchema: Result;
};

type DeleteRouteBuilder<Params extends z.ZodSchema> = CoreRouteElements<Params, z.ZodSchema> & {
    (p?: z.input<Params>, options?: FetchOptions): Promise<void>;
};

type RouteBuilder<Params extends z.ZodSchema, Search extends z.ZodSchema> = CoreRouteElements<
    Params,
    Search
> & {
    (p?: z.input<Params>, search?: z.input<Search>): string;

    useParams: () => z.output<Params>;
    useSearchParams: () => z.output<Search>;
    usePush: () => (
        params: z.input<Params>,
        search?: z.input<Search>,
        options?: PushOptions
    ) => void;

    Link: React.FC<
        Omit<LinkProps, 'href'> &
            z.input<Params> & {
                search?: z.input<Search>;
            } & { children?: React.ReactNode }
    >;
    ParamsLink: React.FC<
        Omit<LinkProps, 'href'> & {
            params?: z.input<Params>;
            search?: z.input<Search>;
        } & { children?: React.ReactNode }
    >;
};

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

function createPathBuilder<T extends Record<string, string | string[]>>(
    route: string
): (params: T) => string {
    const pathArray = route.split('/');

    let catchAllSegment: ((params: T) => string) | null = null;
    if (pathArray.at(-1)?.startsWith('[[...')) {
        const catchKey = pathArray.pop()!.replace('[[...', '').replace(']]', '');
        catchAllSegment = (params: T) => {
            const catchAll = params[catchKey] as unknown as string[];
            return catchAll ? `/${catchAll.join('/')}` : '';
        };
    }

    const elements: ((params: T) => string)[] = [];
    for (const element of pathArray) {
        const catchAll = element.match(/\[\.{3}(.*)]/);
        const parameter = element.match(/\[(.*)]/);
        if (catchAll?.[1]) {
            const key = catchAll[1];
            elements.push((params: T) => (params[key as unknown as string] as string[]).join('/'));
        } else if (parameter?.[1]) {
            const key = parameter[1];
            elements.push((params: T) => params[key as unknown as string] as string);
        } else {
            elements.push(() => element);
        }
    }

    return (params: T): string => {
        const p = elements.map(element => element(params)).join('/');
        if (catchAllSegment) {
            return p + catchAllSegment(params);
        }
        return p;
    };
}

function createRouteBuilder<Params extends z.ZodSchema, Search extends z.ZodSchema>(
    route: string,
    info: RouteInfo<Params, Search>
) {
    // @ts-expect-error autogenerated code
    const function_ = createPathBuilder<z.output<Params>>(route);

    return (params?: z.input<Params>, search?: z.input<Search>) => {
        let checkedParams = params;
        if (info.params) {
            const safeParams = info.params.safeParse(checkedParams);
            if (safeParams?.success) {
                checkedParams = safeParams.data;
            } else {
                throw new Error(
                    `Invalid params for route ${info.name}: ${safeParams.error.message}`
                );
            }
        }
        const safeSearch = info.search ? info.search?.safeParse(search ?? {}) : null;
        if (info.search && !safeSearch?.success) {
            throw new Error(
                `Invalid search params for route ${info.name}: ${safeSearch?.error.message}`
            );
        }

        const baseUrl = function_(checkedParams);
        const searchString = search && queryString.stringify(search);
        return [baseUrl, searchString ? `?${searchString}` : ''].join('');
    };
}

const emptySchema = z.object({});

export function makePostRoute<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    Body extends z.ZodSchema,
    Result extends z.ZodSchema,
>(
    route: string,
    info: RouteInfo<Params, Search>,
    postInfo: PostInfo<Body, Result>
): PostRouteBuilder<Params, Search, Body, Result> {
    const urlBuilder = createRouteBuilder(route, info);

    const routeBuilder: PostRouteBuilder<Params, Search, Body, Result> = (
        body: z.input<Body>,
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>> => {
        const safeBody = postInfo.body.safeParse(body);
        if (!safeBody.success) {
            throw new Error(`Invalid body for route ${info.name}: ${safeBody.error.message}`);
        }

        return fetch(urlBuilder(p, search), {
            ...options,
            method: 'POST',
            body: JSON.stringify(safeBody.data),
            headers: {
                ...options?.headers,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${info.name}: ${response.statusText}`);
                }
                return response.json() as Promise<z.output<Result>>;
            })
            .then(data => {
                const result = postInfo.result.safeParse(data);
                if (!result.success) {
                    throw new Error(
                        `Invalid response for route ${info.name}: ${result.error.message}`
                    );
                }
                return result.data;
            });
    };

    routeBuilder.params = undefined as z.output<Params>;
    routeBuilder.paramsSchema = info.params;
    routeBuilder.search = undefined as z.output<Search>;
    routeBuilder.searchSchema = info.search;
    routeBuilder.body = undefined as z.output<Body>;
    routeBuilder.bodySchema = postInfo.body;
    routeBuilder.result = undefined as z.output<Result>;
    routeBuilder.resultSchema = postInfo.result;

    return routeBuilder;
}

export function makePutRoute<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    Body extends z.ZodSchema,
    Result extends z.ZodSchema,
>(
    route: string,
    info: RouteInfo<Params, Search>,
    putInfo: PutInfo<Body, Result>
): PutRouteBuilder<Params, Search, Body, Result> {
    const urlBuilder = createRouteBuilder(route, info);

    const routeBuilder: PutRouteBuilder<Params, Search, Body, Result> = (
        body: z.input<Body>,
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>> => {
        const safeBody = putInfo.body.safeParse(body);
        if (!safeBody.success) {
            throw new Error(`Invalid body for route ${info.name}: ${safeBody.error.message}`);
        }

        return fetch(urlBuilder(p, search), {
            ...options,
            method: 'PUT',
            body: JSON.stringify(safeBody.data),
            headers: {
                ...options?.headers,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${info.name}: ${response.statusText}`);
                }
                return response.json() as Promise<z.output<Result>>;
            })
            .then(data => {
                const result = putInfo.result.safeParse(data);
                if (!result.success) {
                    throw new Error(
                        `Invalid response for route ${info.name}: ${result.error.message}`
                    );
                }
                return result.data;
            });
    };

    routeBuilder.params = undefined as z.output<Params>;
    routeBuilder.paramsSchema = info.params;
    routeBuilder.search = undefined as z.output<Search>;
    routeBuilder.searchSchema = info.search;
    routeBuilder.body = undefined as z.output<Body>;
    routeBuilder.bodySchema = putInfo.body;
    routeBuilder.result = undefined as z.output<Result>;
    routeBuilder.resultSchema = putInfo.result;

    return routeBuilder;
}

export function makeGetRoute<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    Result extends z.ZodSchema,
>(
    route: string,
    info: RouteInfo<Params, Search>,
    getInfo: GetInfo<Result>
): GetRouteBuilder<Params, Search, Result> {
    const urlBuilder = createRouteBuilder(route, info);

    const routeBuilder: GetRouteBuilder<Params, Search, Result> = (
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>> => {
        return fetch(urlBuilder(p, search), options)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${info.name}: ${response.statusText}`);
                }
                return response.json() as Promise<z.output<Result>>;
            })
            .then(data => {
                const result = getInfo.result.safeParse(data);
                if (!result.success) {
                    throw new Error(
                        `Invalid response for route ${info.name}: ${result.error.message}`
                    );
                }
                return result.data;
            });
    };

    routeBuilder.params = undefined as z.output<Params>;
    routeBuilder.paramsSchema = info.params;
    routeBuilder.search = undefined as z.output<Search>;
    routeBuilder.searchSchema = info.search;
    routeBuilder.result = undefined as z.output<Result>;
    routeBuilder.resultSchema = getInfo.result;

    return routeBuilder;
}

export function makeDeleteRoute<Params extends z.ZodSchema, Search extends z.ZodSchema>(
    route: string,
    info: RouteInfo<Params, Search>
): DeleteRouteBuilder<Params> {
    const urlBuilder = createRouteBuilder(route, info);

    const routeBuilder: DeleteRouteBuilder<Params> = (
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<void> => {
        return fetch(urlBuilder(p, search), options).then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch ${info.name}: ${response.statusText}`);
            }
        });
    };

    routeBuilder.params = undefined as z.output<Params>;
    routeBuilder.paramsSchema = info.params;
    routeBuilder.search = undefined as z.output<Search>;
    routeBuilder.searchSchema = info.search;

    return routeBuilder;
}

export function makeRoute<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema = typeof emptySchema,
>(route: string, info: RouteInfo<Params, Search>): RouteBuilder<Params, Search> {
    const urlBuilder: RouteBuilder<Params, Search> = createRouteBuilder(
        route,
        info
    ) as RouteBuilder<Params, Search>;

    urlBuilder.useParams = function useParams(): z.output<Params> {
        const result = info.params.safeParse(useNextParams());
        if (!result.success) {
            throw new Error(`Invalid route params for route ${info.name}: ${result.error.message}`);
        }
        return result.data;
    };

    urlBuilder.useSearchParams = info?.search
        ? function useSearchParams(): z.output<Search> {
              const result = info.search.safeParse(
                  convertURLSearchParamsToObject(useNextSearchParams())
              );
              if (!result.success) {
                  throw new Error(
                      `Invalid search params for route ${info.name}: ${result.error.message}`
                  );
              }
              return result.data;
          }
        : function useSearchParams() {
              throw new Error(`Route ${info.name} does not have search params`);
          };

    urlBuilder.ParamsLink = function RouteLink({
        params: linkParams,
        search: linkSearch,
        children,
        ...props
    }: Omit<LinkProps, 'href'> & {
        params?: z.input<Params>;
        search?: z.input<Search>;
    } & { children?: React.ReactNode }) {
        return (
            <Link {...props} href={urlBuilder(linkParams, linkSearch)}>
                {children}
            </Link>
        );
    };

    urlBuilder.Link = function RouteLink({
        search: linkSearch,
        children,
        ...props
    }: Omit<LinkProps, 'href'> &
        z.input<Params> & {
            search?: z.input<Search>;
        } & { children?: React.ReactNode }) {
        const params = info.params.parse(props);
        const extraProps = { ...props };
        for (const key of Object.keys(params as object)) {
            // @ts-expect-error autogenerated code
            delete extraProps[key];
        }
        return (
            <Link {...extraProps} href={urlBuilder(info.params.parse(props), linkSearch)}>
                {children}
            </Link>
        );
    };

    urlBuilder.usePush = function usePush() {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { push } = useRouter();
        return (p: z.input<Params>, search?: z.input<Search>, options?: PushOptions) => {
            push(urlBuilder(p, search), options);
        };
    };

    urlBuilder.params = undefined as z.output<Params>;
    urlBuilder.paramsSchema = info.params;
    urlBuilder.search = undefined as z.output<Search>;
    urlBuilder.searchSchema = info.search;

    return urlBuilder;
}
