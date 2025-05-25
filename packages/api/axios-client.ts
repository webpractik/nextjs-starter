import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';

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
    baseURL: process.env.BACK_INTERNAL_URL,
    withCredentials: true,
});

const client = async <TData, TError = unknown, TVariables = unknown>(
    config: RequestConfig<TVariables>
): Promise<ResponseConfig<TData>> => {
    return axiosInstance
        .request<TVariables, ResponseConfig<TData>>({ ...config })
        .catch((error: AxiosError<TError>) => {
            throw error;
        });
};

export default client;
