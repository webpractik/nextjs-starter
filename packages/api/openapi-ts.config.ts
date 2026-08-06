import type { UserConfig } from '@hey-api/openapi-ts'

import { createRequire, registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'

const config = {
    input: './bundled.yaml',
    output: {
        clean: true,
        entryFile: true,
        path: './codegen',
        postProcess: [],
    },
    plugins: [
        {
            name: '@hey-api/typescript',
            enums: 'javascript',
            topType: 'unknown',
        },
        {
            name: '@hey-api/client-next',
            baseUrl: false,
            runtimeConfigPath: './client-config',
            throwOnError: false,
        },
        {
            name: '@hey-api/sdk',
            operations: 'flat',
            paramsStructure: 'grouped',
            responseStyle: 'fields',
            validator: {
                request: false,
                response: 'zod',
            },
        },
        {
            name: 'zod',
            compatibilityVersion: 4,
            definitions: true,
            requests: true,
            responses: true,
        },
        {
            name: '@tanstack/react-query',
            infiniteQueryKeys: {
                enabled: true,
                tags: true,
            },
            infiniteQueryOptions: true,
            mutationKeys: {
                enabled: true,
                tags: true,
            },
            mutationOptions: true,
            queryKeys: {
                enabled: true,
                tags: true,
            },
            queryOptions: true,
        },
        {
            name: '@faker-js/faker',
            compatibilityVersion: 10,
            definitions: true,
            requests: true,
            responses: true,
        },
    ],
} satisfies UserConfig

export default config

if (import.meta.main) {
    const require = createRequire(import.meta.url)
    const typescriptUrl = pathToFileURL(require.resolve('typescript')).href

    registerHooks({
        resolve(specifier, context, nextResolve) {
            if (specifier === 'typescript') {
                return {
                    shortCircuit: true,
                    url: typescriptUrl,
                }
            }

            return nextResolve(specifier, context)
        },
    })

    const { createClient } = await import('@hey-api/openapi-ts')

    await createClient(config)
}
