// @ts-nocheck
import { Hello } from '@/api/models/Hello';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export default class HelloService {
    public static async getHello(): CancelablePromise<Hello> {
        return __request(OpenAPI, {
            method: 'GET',
            url: 'get-hello',
        });
    }
}
