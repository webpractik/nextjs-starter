import type { StorybookConfig } from '@storybook/nextjs';

import { join, dirname } from 'path';

function getAbsolutePath(value: string) {
    return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
    stories: ['../app/**/*.stories.tsx', '../packages/core/**/*.stories.tsx'],
    addons: [
        getAbsolutePath('@storybook/addon-onboarding'),
        getAbsolutePath('@storybook/addon-links'),
        getAbsolutePath('@storybook/addon-essentials'),
        getAbsolutePath('@storybook/addon-interactions'),
        getAbsolutePath('@storybook/addon-storysource'),
        getAbsolutePath('@storybook/addon-designs'),
    ],
    framework: {
        name: getAbsolutePath('@storybook/nextjs'),
        options: {},
    },
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
};

export default config;
