import axios from 'axios';
import { env } from '~/env.mjs';

export const backInnerClient = axios.create({
    baseURL: env.BACK_INTERNAL_URL,
});

export const backPublicClient = axios.create({
    baseURL: env.BACK_PUBLIC_URL,
});

export const apiClient = axios.create({
    withCredentials: true,
    baseURL: env.NEXT_PUBLIC_FRONT_PROXY,
});
