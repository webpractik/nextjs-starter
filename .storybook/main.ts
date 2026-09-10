import type { StorybookConfig } from '@storybook/nextjs-vite'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

function getAbsolutePath(value: string) {
    return path.dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
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
        reactDocgen: false,
    },
    staticDirs: ['../public'],
}

export default config
