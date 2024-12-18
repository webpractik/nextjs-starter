import '../lib/styles/base.css';
import type { Preview } from '@storybook/react';
import { GeistSans } from '../lib/fonts/geist';
import { ReactQueryProvider } from '../app/_shared/utilities/providers/react-query';

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
            <div className={`${GeistSans.variable}`}>
                <ReactQueryProvider showDevtools={false}>
                    <Story />
                </ReactQueryProvider>
            </div>
        ),
    ],
};

export default preview;
