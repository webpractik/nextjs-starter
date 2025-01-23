import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';

import { environment } from '../../env/client';

export type RequestConfig<TData = unknown> = {
    data?: TData;
    headers?: AxiosRequestConfig['headers'];
    method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
    params?: unknown;
    responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'stream' | 'text';
    signal?: AbortSignal;
    url?: string;
};

export type ResponseConfig<TData = unknown> = {
    data: TData;
    headers?: AxiosResponse['headers'];
    status: number;
    statusText: string;
};

export const axiosInstance = axios.create({
    baseURL: environment.NEXT_PUBLIC_BFF_PATH,
    withCredentials: true,
});

const client = async <TData, TVariables = unknown>(
    config: RequestConfig<TVariables>
): Promise<ResponseConfig<TData>> => {
    return axiosInstance
        .request<TVariables, ResponseConfig<TData>>({ ...config })
        .catch((error: AxiosError) => {
            throw error;
        });
};

export default client;
