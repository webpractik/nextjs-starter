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

export type ResponseErrorConfig<TError = unknown> = TError;

export type ResponseConfig<TData = unknown> = {
    data: TData;
    headers?: AxiosResponse['headers'];
    status: number;
    statusText: string;
};

export const axiosInstance = axios.create({
    baseURL: process.env.BACK_INTERNAL_URL as string,
    withCredentials: true,
});

const client = async <TData, TError = unknown, TVariables = unknown>(
    config: RequestConfig<TVariables>
): Promise<ResponseConfig<TData>> => {
    return axiosInstance
        .request<TVariables, ResponseConfig<TData>>({ ...config })
        .catch((error: AxiosError<TError>) => {
            if (error.config) {
                throw new Error(
                    `Request Failed: \n ${JSON.stringify({
                        message: error.message,
                        responseData: error.response?.data,
                        status: error.status,
                        url: `${String(error.config.baseURL)}${String(error.config.url)}`,
                    })}`
                );
            }

            throw error;
        });
};

export default client;
