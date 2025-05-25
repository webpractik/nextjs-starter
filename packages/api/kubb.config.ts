import { defineConfig } from '@kubb/core';
import { pluginClient } from '@kubb/plugin-client';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginZod } from '@kubb/plugin-zod';

const importPath = '../../../ky-client.ts';

export default defineConfig(() => {
    return {
        hooks: {
            done: ['prettier ./codegen --write'],
        },
        input: {
            path: 'swagger.json',
        },
        output: {
            clean: true,
            path: './codegen',
        },
        plugins: [
            pluginOas({ output: { path: 'swagger' }, validate: true }),

            pluginTs({
                dateType: 'date',
                enumType: 'enum',
                group: { type: 'tag' },
                optionalType: 'questionToken',
                output: { path: 'models' },
                unknownType: 'unknown',
            }),

            pluginClient({
                group: { type: 'tag' },
                importPath,
                output: { path: 'ky' },
            }),

            // pluginReactQuery({
            //     client: { dataReturnType: 'data', importPath },
            //     group: { type: 'tag' },
            //     output: {
            //         path: './hooks',
            //     },
            //     paramsType: 'object',
            //     parser: 'zod',
            // }),

            pluginZod({
                dateType: 'date',
                group: { type: 'tag' },
                inferred: true,
                output: { path: 'zod' },
                unknownType: 'unknown',
            }),
        ],
        root: '.',
    };
});
