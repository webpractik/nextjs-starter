import antfu from '@antfu/eslint-config'
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss'

export default antfu(
	{
		type: 'app',
		gitignore: true,
		stylistic: {
			indent: 'tab',
			quotes: 'single',
			jsx: true,
		},
		formatters: {
			css: true,
			html: true,
			json: true,
			markdown: true,
		},
		nextjs: true,
		react: true,
		jsonc: false,
		markdown: true,
		ignores: ['.kuber', 'styles', 'packages/api/bundled.yaml', 'packages/api/codegen'],
	},
	{
		rules: {
			'no-restricted-imports': [
				2,
				{
					patterns: [
						{
							group: ['~/packages/core/*'],
							message: 'Please use import from @repo/core instead',
						},
						{
							group: ['~/packages/api/*'],
							message: 'Please use import from @repo/api instead',
						},
						{
							group: ['~/packages/logger/*'],
							message: 'Please use import from @repo/logger instead',
						},
					],
				},
			],

			'node/prefer-global/process': 0,
		},
	},
	{ ...eslintPluginBetterTailwindcss.configs.recommended },
	{
		settings: {
			'better-tailwindcss': {
				entryPoint: 'src/styles/globals.css',
			},
		},
	},
	// {
	//     extends: [
	//         eslintPluginBetterTailwindcss.configs.recommended
	//     ],
	//     settings: {
	//         "better-tailwindcss": {
	//             entryPoint: "src/styles/globals.css",
	//         }
	//     }
	// },
)
