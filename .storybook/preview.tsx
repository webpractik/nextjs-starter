import '../app/globals.css';
import type { Preview } from '@storybook/react';
import { ReactQueryProvider } from '../app/_shared/utilities/providers/react-query';

import { geistSans } from '../app/fonts/font';

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
        docs: { toc: true },
        layout: 'centered',
    },
    decorators: [
        Story => (
            <div className={`${geistSans.variable}`}>
                <ReactQueryProvider showDevtools={false}>
                    <Story />
                </ReactQueryProvider>
            </div>
        ),
    ],
};

export default preview;
