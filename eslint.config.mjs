import wpConfigNext from '@webpractik/eslint-config-next';

export const ignores = [
    '.next',
    'next.config.ts',
    'next-env.d.ts',
    '*.config.js',
    'lib/routes',
    'report',
    'packages/api/lib/**/*.ts',
];

export default [
    ...wpConfigNext,
    {
        rules: {
            'sonarjs/function-return-type': 0,

            '@typescript-eslint/naming-convention': 0,
            '@typescript-eslint/consistent-type-definitions': [2, 'type'],

            'react-perf/jsx-no-new-object-as-prop': 1,
            'react-perf/jsx-no-new-array-as-prop': 1,
            'react-perf/jsx-no-new-function-as-prop': 1,
            'react-perf/jsx-no-jsx-as-prop': 1,

            'no-restricted-imports': [
                2,
                {
                    patterns: [
                        {
                            group: ['~/packages/core/*'],
                            message: 'Please use import from @repo/core instead',
                        },
                    ],
                },
            ],
        },
    },
    { ignores },
];
