import type { UserConfig } from '@kubb/core'

import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

import { pluginCacheTags } from './kubb-plugin-cache-tags'

export default defineConfig([
    {
        plugins: [
            pluginOas({ output: { path: 'swagger' }, validate: true }),

            pluginTs({
                dateType: 'date',
                enumType: 'asConst',
                group: { type: 'tag' },
                output: { path: 'models' },
                optionalType: 'questionToken',
                // 'type' вместо 'interface': TypeScript считает type alias'ы
                // assignable к index signature'ам структурно, а named interfaces —
                // нет. Это нужно, чтобы `FindPetsByStatusQueryParams` (c `status: string[]`)
                // мог попасть в `RequestConfig.params: Record<string, ...>`.
                syntaxType: 'type',
                integerType: 'number',
                unknownType: 'unknown',
                emptySchemaType: 'unknown',
                arrayType: 'array',
            }),

            pluginClient({
                importPath: '../../../fetch.client',
                // 'data' (а не 'full') — сгенерированные клиенты возвращают
                // напрямую `TData` (например `Pet[]`), а не `ResponseConfig<TData>`.
                // Это совпадает с ожиданием сгенерированных RQ-хуков, у которых
                // queryOptions объявлен с `TQueryFnData = TData`. При 'full'
                // получался type lie: runtime — ResponseConfig, тип — TData.
                dataReturnType: 'data',
                group: { type: 'tag' },
                clientType: 'function',
                parser: 'zod',
                operations: true,
                paramsType: 'object',
                pathParamsType: 'object',
            }),

            pluginReactQuery({
                client: { dataReturnType: 'data', importPath: '../../../fetch.client' },
                group: { type: 'tag' },
                output: {
                    path: './hooks',
                },
                paramsType: 'object',
                pathParamsType: 'object',
                parser: 'zod',
                mutation: {
                    methods: ['post', 'put', 'delete', 'patch'],
                },
                // Глобально infinite-хуки отключены: kubb по умолчанию использует
                // `queryParam: 'id'`, которого нет в большинстве OpenAPI-параметров,
                // из-за чего сгенерированный код ссылается на несуществующее поле
                // и ломает tsc. Ниже через `override` включаем infinite точечно
                // только для findPetsByStatus с курсорным параметром `offset`.
                infinite: false,
                override: [
                    {
                        type: 'operationId',
                        pattern: 'findPetsByStatus',
                        options: {
                            infinite: {
                                queryParam: 'offset',
                                initialPageParam: 0,
                            },
                        },
                    },
                ],
                query: {
                    methods: ['get'],
                    importPath: '@tanstack/react-query',
                },
                suspense: {},
            }),

            pluginFaker({
                output: {
                    path: './mocks',
                    barrelType: 'named',
                },
                group: {
                    type: 'tag',
                    name: ({ group }) => `${group}Service`,
                },
                dateType: 'date',
                // dateParser: 'dayjs',
                unknownType: 'unknown',
                seed: [100],
            }),

            pluginZod({
                dateType: 'date',
                group: { type: 'tag' },
                inferred: true,
                coercion: true,
                operations: true,
                mini: true,
                output: { path: 'zod' },
                unknownType: 'unknown',
            }),

            pluginCacheTags({ output: { path: './tags' } }),
        ],
        root: '.',
        input: {
            path: 'bundled.yaml',
        },
        output: {
            clean: true,
            path: './codegen',
            extension: {
                '.ts': '',
            },
        },
    },
]) as UserConfig[]
