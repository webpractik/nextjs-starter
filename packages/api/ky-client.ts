import logger from '@repo/logger';
import ky, { HTTPError, type SearchParamsOption } from 'ky';

export type RequestConfig<TData = unknown> = {
    data?: TData;
    headers?: Record<string, string>;
    method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
    params?: SearchParamsOption;
    responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'stream' | 'text';
    signal?: AbortSignal;
    url: string;
};

export type ResponseConfig<TData = unknown> = {
    data: TData;
    headers?: Record<string, string>;
    status: number;
    statusText: string;
};

export const logRequest = (
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: unknown
) => {
    logger.info(`[REQ] ${method} ${url}`, {
        body,
        headers,
    });
};

export const logResponse = (
    method: string,
    url: string,
    status: number,
    duration: number,
    data: unknown
) => {
    logger.success(`[RES] ${method} ${url} - ${String(status)} (${String(duration)}ms)`, {
        data,
    });
};

export const logError = (method: string, url: string, error: unknown) => {
    logger.error(`[ERR] ${method} ${url}`);
};

const apiClient = ky.create({
    credentials: 'include',
    hooks: {
        afterResponse: [
            async (request, _options, response) => {
                const start = performance.now();
                const clonedResponse = response.clone();

                const parseBody = async () => {
                    try {
                        const contentType = response.headers.get('content-type') || '';

                        if (contentType.includes('application/json')) {
                            return await clonedResponse.json();
                        }
                        if (contentType.includes('text/')) {
                            return await clonedResponse.text();
                        }

                        return {};
                    } catch {
                        return {};
                    }
                };

                const data = await parseBody();
                const duration = Math.round(performance.now() - start);

                logResponse(request.method, request.url, response.status, duration, data);

                return response;
            },
        ],
        beforeRequest: [
            request => {
                logRequest(
                    request.method,
                    request.url,
                    Object.fromEntries(request.headers),
                    request.body ? JSON.parse(String(request.body)) : undefined
                );
            },
        ],
    },
    prefixUrl: process.env.BACK_INTERNAL_URL,
});

const client = async <TData, TError = unknown, TVariables = unknown>(
    config: RequestConfig<TVariables>
): Promise<ResponseConfig<TData>> => {
    const { data, headers, method, params, responseType = 'json', signal, url } = config;

    try {
        logger.log('prefixURL', process.env.BACK_INTERNAL_URL);

        const kyMethod = apiClient.extend({
            headers,
            searchParams: params,
            signal,
        })[method.toLowerCase() as 'delete' | 'get' | 'patch' | 'post' | 'put'];

        const requestUrl = url.startsWith('/') ? url.slice(1) : url;

        const response = await kyMethod<TData>(requestUrl || '', {
            body: method === 'GET' ? undefined : JSON.stringify(data),
            json: data,
        });

        const dataResponse = (await (async () => {
            switch (responseType) {
                case 'arraybuffer': {
                    return response.arrayBuffer();
                }
                case 'blob': {
                    return response.blob();
                }
                case 'document': {
                    return new DOMParser().parseFromString(await response.text(), 'text/html');
                }
                case 'json': {
                    return response.json();
                }
                case 'stream': {
                    return response.body;
                }
                case 'text': {
                    return response.text();
                }
                default: {
                    return response.json();
                }
            }
        })()) as TData;

        return {
            data: dataResponse,
            headers: Object.fromEntries(response.headers),
            status: response.status,
            statusText: response.statusText,
        };
    } catch (error) {
        logError(method, url || '', error);

        if (error instanceof HTTPError) {
            const errorData = await error.response.json().catch(() => ({}));

            throw new Error(
                `HTTP error! status: ${String(error.response.status)}, details: ${JSON.stringify(errorData)}`
            );
        }

        throw error;
    }
};

export default client;
