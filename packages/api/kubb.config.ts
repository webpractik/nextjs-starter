import type { UserConfig } from '@kubb/core'
import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
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
				optionalType: 'questionToken',
				output: { path: 'models' },
				unknownType: 'unknown',
			}),

			pluginClient({
				client: 'axios',
				importPath: '../../../axios.client',
				group: { type: 'tag' },
				output: { path: 'axios' },
				parser: 'zod',
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
