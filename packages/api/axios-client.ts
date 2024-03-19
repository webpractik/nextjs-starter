import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

import { env as environment } from '../../env.mjs';

export type RequestConfig<TVariables = unknown> = {
    method: 'get' | 'put' | 'patch' | 'post' | 'delete';
    url: string;
    params?: unknown;
    data?: TVariables;
    responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
    signal?: AbortSignal;
    headers?: AxiosRequestConfig['headers'];
};

export type ResponseConfig<TData = unknown> = {
    data: TData;
    status: number;
    statusText: string;
    headers?: AxiosResponse['headers'];
};

export const axiosInstance = axios.create({
    withCredentials: true,
    baseURL:
        typeof window === 'undefined'
            ? environment.BACK_INTERNAL_URL
            : environment.NEXT_PUBLIC_FRONT_PROXY,
});

export const axiosClient = async <TData, TError = unknown, TVariables = unknown>(
    config: RequestConfig<TVariables>
): Promise<ResponseConfig<TData>> => {
    return axiosInstance
        .request<TData>({ ...config })
        .then(response => response)
        .catch((error: AxiosError<TError>) => {
            throw error;
        });
};

export default axiosClient;
