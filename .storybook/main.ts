import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
	stories: ['../app/**/*.stories.tsx', '../packages/core/**/*.stories.tsx'],
	addons: [
		'@storybook/addon-onboarding',
		'@storybook/addon-links',
		'@storybook/addon-designs',
		'@storybook/addon-docs',
	],
	framework: '@storybook/nextjs',
	typescript: {
		check: false,
		reactDocgen: 'react-docgen-typescript',
		reactDocgenTypescriptOptions: {
			shouldRemoveUndefinedFromOptional: true,
			shouldExtractLiteralValuesFromEnum: true,
			shouldExtractValuesFromUnion: true,
			propFilter: prop => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
		},
	},
	features: {
		experimentalRSC: true,
	},
	staticDirs: ['../public'],
}

export default config
