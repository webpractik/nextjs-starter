import '../styles/index.sass';
import ReactQueryProvider from '../components/shared/providers/react-query';
import { inter } from '../lib/fonts/Inter';

export const parameters = {
    actions: {
        argTypesRegex: '^on[A-Z].*',
    },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
};

export const decorators = [
    Story => {
        return (
            <div className={`${inter.variable}`}>
                <ReactQueryProvider>
                    <Story />
                </ReactQueryProvider>
            </div>
        );
    },
];
