import { defineConfig } from '@kubb/core';
import { definePlugin as createSwagger } from '@kubb/swagger';
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client';
import { definePlugin as createSwaggerTanstackQuery } from '@kubb/swagger-tanstack-query';
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts';
import { definePlugin as createSwaggerZod } from '@kubb/swagger-zod';

const clientPath = './axiosClient';

export default defineConfig(() => {
    return {
        root: '.',
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
                output: { path: 'models' },
                enumType: 'enum',
                dateType: 'date',
                group: { type: 'tag' },
            }),
            createSwaggerClient({
                output: { path: 'axios' },
                client: { importPath: clientPath },
                group: { type: 'tag' },
            }),
            createSwaggerTanstackQuery({
                output: { path: 'hooks' },
                framework: 'react',
                client: { importPath: clientPath },
                dataReturnType: 'data',
                group: { type: 'tag' },
                parser: 'zod',
            }),
            createSwaggerZod({
                output: { path: 'zod' },
                group: { type: 'tag' },
            }),
        ],
    };
});
