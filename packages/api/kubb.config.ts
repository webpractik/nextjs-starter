import type { UserConfig } from '@kubb/core'
import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

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
				syntaxType: 'interface',
				integerType: 'number',
				unknownType: 'unknown',
				emptySchemaType: 'unknown',
				arrayType: 'array',
			}),

			pluginClient({
				importPath: '../../../fetch.client',
				dataReturnType: 'full',
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
				infinite: false,
				query: {
					methods: ['get'],
					importPath: '@tanstack/react-query',
				},
				suspense: {},
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
