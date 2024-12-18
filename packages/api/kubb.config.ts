import { defineConfig } from '@kubb/core';
import { pluginClient } from '@kubb/plugin-client';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginReactQuery } from '@kubb/plugin-react-query';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginZod } from '@kubb/plugin-zod';

const importPath = '../../../axios-client.ts';

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
            pluginOas({ output: { path: 'swagger' }, validate: true }),

            pluginTs({
                output: { path: 'models' },
                enumType: 'enum',
                dateType: 'date',
                unknownType: 'unknown',
                optionalType: 'questionToken',
                group: { type: 'tag' },
            }),

            pluginClient({
                output: { path: 'axios' },
                importPath,
                group: { type: 'tag' },
            }),

            pluginReactQuery({
                client: { importPath, dataReturnType: 'data' },
                paramsType: 'object',
                output: {
                    path: './hooks',
                },
                parser: 'zod',
                group: { type: 'tag' },
            }),

            pluginZod({
                output: { path: 'zod' },
                group: { type: 'tag' },
                dateType: 'date',
                unknownType: 'unknown',
                inferred: true,
            }),
        ],
    };
});
