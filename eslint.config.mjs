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
        },
    },
    { ignores },
];
