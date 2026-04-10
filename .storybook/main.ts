import type { StorybookConfig } from '@storybook/nextjs-vite'

import { dirname } from 'node:path'

import { fileURLToPath } from 'node:url'

const nodeModulesRegex = /node_modules/

function getAbsolutePath(value: string) {
	return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}

const config: StorybookConfig = {
	stories: [
		'../app/**/*.stories.tsx',
		'../packages/core/**/*.stories.tsx',
		'../src/**/*.mdx',
		'../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
	],
	addons: [
		getAbsolutePath('@storybook/addon-vitest'),
		getAbsolutePath('@storybook/addon-a11y'),
		getAbsolutePath('@storybook/addon-docs'),
		getAbsolutePath('@storybook/addon-designs'),
	],
	framework: getAbsolutePath('@storybook/nextjs-vite'),
	typescript: {
		check: false,
		reactDocgen: 'react-docgen-typescript',
		reactDocgenTypescriptOptions: {
			shouldRemoveUndefinedFromOptional: true,
			shouldExtractLiteralValuesFromEnum: true,
			shouldExtractValuesFromUnion: true,
			propFilter: prop => (prop.parent ? !nodeModulesRegex.test(prop.parent.fileName) : true),
		},
	},
	staticDirs: [
		'../public',
	],
}
export default config
