import sharedConfig from '@repo/tailwind-config';
import type { Config } from 'tailwindcss';

const config = {
    content: ['./**/*.{ts,tsx}'],
    presets: [sharedConfig],
} satisfies Pick<Config, 'content' | 'presets'>;

export default config;
