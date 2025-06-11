import wpConfigNext from '@webpractik/eslint-config-next';

export const ignores = [
    '.next',
    'next.config.ts',
    'next-env.d.ts',
    '*.config.js',
    'report',
    'packages/api/**/*.ts',
    'packages/routes/**/*.ts',
    'packages/routes/**/*.tsx',
    '.storybook/preview.tsx',
    '.storybook/main.ts',
];

export default [
    ...wpConfigNext,
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
                            group: ['~/packages/routes/*'],
                            message: 'Please use import from @repo/routes instead',
                        },
                        {
                            group: ['~/packages/logger/*'],
                            message: 'Please use import from @repo/logger instead',
                        },
                    ],
                },
            ],
        },
    },
    { ignores },
];
