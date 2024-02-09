import 'modern-normalize/modern-normalize.css';
import '../styles/index.sass';
import ReactQueryProvider from '../components/shared/providers/react-query';
import { inter } from '../lib/fonts/Inter';

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
