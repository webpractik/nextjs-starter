import antfu from '@antfu/eslint-config'
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss'
import jsxA11y from 'eslint-plugin-jsx-a11y'

const preferTemplate = {
	rules: {
		'multiline-classname': {
			meta: {
				type: 'suggestion',
				fixable: 'code',
				schema: [],
			},
			create(context) {
				const escapeForTemplateLiteral = str =>
					str.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

				return {
					JSXAttribute(node) {
						if (node.name?.type !== 'JSXIdentifier')
							return
						if (node.name.name !== 'className')
							return

						// Only handle: className="...multiline..."
						if (
							node.value?.type === 'Literal'
							&& typeof node.value.value === 'string'
							&& node.value.value.includes('\n')
						) {
							const raw = node.value.value

							context.report({
								node: node.value,
								message:
                                    'Multiline className strings can cause hydration errors. Use a template literal/expression instead.',
								fix(fixer) {
									const escaped = escapeForTemplateLiteral(raw)
									return fixer.replaceText(node.value, `{\`${escaped}\`}`)
								},
							})
						}
					},
				}
			},
		},
	},
}

export default antfu(
	{
		type: 'app',
		gitignore: true,
		stylistic: {
			jsx: true,
			indent: 'tab',
			quotes: 'single',
			tabWidth: 4,
			trailingComma: 'always-multiline',
			arrowParens: false,
			severity: 'warn',
			braceStyle: 'stroustrup',
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
		ignores: ['.kuber', 'styles', 'packages/api/bundled.yaml', 'packages/api/codegen', 'docs'],
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
	jsxA11y.flatConfigs.recommended,
	{
		settings: {
			'better-tailwindcss': {
				entryPoint: 'src/styles/globals.css',
			},
		},
	},
	{
		plugins: {
			preferTemplate,
		},
		rules: {
			'preferTemplate/multiline-classname': 'error',
		},
	},
)
