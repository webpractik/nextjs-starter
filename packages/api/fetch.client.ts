export type RequestCredentials = 'omit' | 'same-origin' | 'include';

export type RequestConfig<TData = unknown> = {
    baseURL?: string;
    url?: string;
    method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD';
    params?: unknown;
    data?: TData | FormData;
    responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
    signal?: AbortSignal;
    headers?: [string, string][] | Record<string, string>;
    credentials?: RequestCredentials;
};

export type ResponseConfig<TData = unknown> = {
    data: TData;
    status: number;
    statusText: string;
    headers: Headers;
};

let _config: Partial<RequestConfig> = {};

export const getConfig = () => _config;

export const setConfig = (config: Partial<RequestConfig>) => {
    _config = config;
    return getConfig();
};

export type ResponseErrorConfig<TError = unknown> = TError;

export const client = async <TData, _TError = unknown, TVariables = unknown>(
    paramsConfig: RequestConfig<TVariables>
): Promise<ResponseConfig<TData>> => {
    const normalizedParams = new URLSearchParams();

    const globalConfig = getConfig();
    const config = { ...globalConfig, ...paramsConfig };

    Object.entries(config.params || {}).forEach(([key, value]) => {
        if (value !== undefined) {
            normalizedParams.append(key, value === null ? 'null' : value.toString());
        }
    });

    let targetUrl = [process.env.BACK_INTERNAL_URL, config.url].filter(Boolean).join('');

    if (config.params) {
        targetUrl += `?${normalizedParams}`;
    }

    const response = await fetch(targetUrl, {
        credentials: config.credentials || 'same-origin',
        method: config.method?.toUpperCase(),
        body: JSON.stringify(config.data),
        signal: config.signal,
        headers: config.headers,
    });

    const data =
        [204, 205, 304].includes(response.status) || !response.body ? {} : await response.json();

    return {
        data: data as TData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Headers,
    };
};

client.getConfig = getConfig;
client.setConfig = setConfig;

export default client;
