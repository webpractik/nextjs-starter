import { pluginOas } from '@kubb/plugin-oas';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginClient } from '@kubb/plugin-client';
import { pluginZod } from '@kubb/plugin-zod';

export const baseConfig = {
    hooks: {
        done: ['prettier ./codegen --write'],
    },
    plugins: [
        pluginOas({ output: { path: 'swagger' }, validate: true }),

        pluginTs({
            dateType: 'date',
            enumType: 'asConst',
            group: { type: 'tag' },
            optionalType: 'questionToken',
            output: { path: 'models' },
            unknownType: 'unknown',
        }),

        pluginClient({
            client: 'fetch',
            importPath: '../../../fetch.client',
            group: { type: 'tag' },
            output: { path: 'fetch' },
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
