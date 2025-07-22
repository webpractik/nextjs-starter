import '../src/styles/globals.css';
import type { Preview } from '@storybook/nextjs';

import { geistSans } from '../src/fonts/geist';

const preview: Preview = {
    parameters: {
        actions: {
            argTypesRegex: '^on[A-Z].*',
        },
        controls: {
            expanded: true,
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        tags: ['autodocs'],
        docs: {
            toc: true,
            codePanel: true,
        },
        layout: 'centered',
    },
    decorators: [
        Story => (
            <div className={`${geistSans.variable}`}>
                <Story />
            </div>
        ),
    ],
};

export default preview;
