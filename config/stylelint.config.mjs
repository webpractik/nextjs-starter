export default {
    extends: [
        'stylelint-config-standard-scss',
        'stylelint-config-css-modules',
        'stylelint-config-idiomatic-order',
        'stylelint-config-sass-guidelines',
    ],
    customSyntax: 'postcss-sass',
    defaultSeverity: 'warning',
    rules: {
        'font-family-no-missing-generic-family-keyword': null,
        'selector-class-pattern': [
            '^[a-z][a-zA-Z0-9]+$',
            {
                message: 'Expected custom property name to be snakeCase',
                resolveNestedSelectors: true,
            },
        ],
    },
};
