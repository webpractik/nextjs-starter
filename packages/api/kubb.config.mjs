import { defineConfig } from '@kubb/core';
import createSwagger from '@kubb/swagger';
import createSwaggerClient from '@kubb/swagger-client';
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query';
import createSwaggerTS from '@kubb/swagger-ts';
import createSwaggerZod from '@kubb/swagger-zod';

export default defineConfig(async () => {
    return {
        root: '..',
        input: {
            path: 'openapi.yaml',
        },
        output: {
            path: './lib',
            clean: true,
        },
        hooks: {
            done: ['prettier ./lib --write'],
        },
        plugins: [
            createSwagger({
                output: false,
                validate: true,
            }),
            createSwaggerTS({
                output: {
                    path: 'models',
                },
                enumType: 'enum',
                dateType: 'date',
                group: { type: 'tag' },
            }),
            createSwaggerClient({
                output: {
                    path: 'axios',
                },
                clientImportPath: './axios-client',
                group: { type: 'tag' },
            }),
            createSwaggerTanstackQuery({
                output: {
                    path: 'hooks',
                },
                framework: 'react',
                clientImportPath: './axios-client',
                dataReturnType: 'data',
                group: { type: 'tag' },
                parser: 'zod',
            }),
            createSwaggerZod({
                output: {
                    path: 'zod',
                },
                clientImportPath: './axios-client',
                group: { type: 'tag' },
            }),
        ],
    };
});
