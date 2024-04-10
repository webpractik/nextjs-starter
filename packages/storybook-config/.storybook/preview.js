import '../../../lib/styles/base.css';
import { ReactQueryProvider } from '../../../app/_components/providers/react-query';
import { inter } from '../../../lib/fonts/inter';

/** @type { import('@storybook/react').Preview } */
export const parameters = {
    actions: {
        argTypesRegex: '^on[A-Z].*',
    },
    controls: {
        expanded: true,
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
    docs: { toc: true },
    layout: 'centered',
};

export const decorators = [
    Story => {
        return (
            <div className={`${inter.variable}`}>
                <ReactQueryProvider showDevtools={false}>
                    <Story />
                </ReactQueryProvider>
            </div>
        );
    },
];
