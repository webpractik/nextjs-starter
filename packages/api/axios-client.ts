import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

import { environment } from '../../env/client';

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
    baseURL: environment.NEXT_PUBLIC_BFF_PATH,
});

const client = async <TData, TError = unknown, TVariables = unknown>(
    config: RequestConfig<TVariables>
): Promise<ResponseConfig<TData>> => {
    return axiosInstance
        .request<TData>({ ...config })
        .then(response => response)
        .catch((error: AxiosError<TError>) => {
            throw error;
        });
};

export default client;
