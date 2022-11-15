import axios from 'axios';

export const backInnerClient = axios.create({
    baseURL: process.env.BACK_INTERNAL_URL,
});

export const backPublicClient = axios.create({
    baseURL: process.env.BACK_PUBLIC_URL,
});

export const apiClient = axios.create({
    withCredentials: true,
    baseURL: '/api',
});
