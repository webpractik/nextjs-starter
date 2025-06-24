import { defineConfig } from '@kubb/core';
import { baseConfig } from './base.config';

export default defineConfig(() => {
    return {
        ...baseConfig,
        input: {
            path: 'openapi.yaml',
        },
        output: {
            clean: true,
            path: './codegen',
            extension: {
                ts: '',
            },
        },
    };
});
