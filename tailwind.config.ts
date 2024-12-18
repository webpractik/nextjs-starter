import sharedConfig from '@repo/tailwind-config';
import type { Config } from 'tailwindcss';
import { PluginAPI, RecursiveKeyValuePair } from 'tailwindcss/types/config';

// eslint-disable-next-line @typescript-eslint/unbound-method
function addVariablesForColors({ addBase, theme }: PluginAPI) {
    const { default: flattenColorPalette } =
        // eslint-disable-next-line @typescript-eslint/no-var-requires,unicorn/prefer-module
        require('tailwindcss/lib/util/flattenColorPalette') as {
            default: (colors: RecursiveKeyValuePair) => Record<string, string>;
        };

    const allColors = flattenColorPalette(theme('colors'));

    const newVariables = Object.fromEntries(
        Object.entries(allColors).map(([key, value]) => [`--${key}`, value])
    );

    addBase({
        ':root': newVariables,
    });
}

const config = {
    content: ['./app/**/*.{ts,tsx}', './packages/core/**/*.tsx'],
    presets: [sharedConfig],
    theme: {
        extend: {
            keyframes: {
                aurora: {
                    from: {
                        backgroundPosition: '50% 50%, 50% 50%',
                    },
                    to: {
                        backgroundPosition: '350% 50%, 350% 50%',
                    },
                },
            },
            animation: {
                aurora: 'aurora 60s linear infinite',
            },
        },
    },
    plugins: [addVariablesForColors],
} satisfies Config;

export default config;
