import '../src/styles/index.sass';
import StoreProvider from '../src/providers/store';
import ReactQueryProvider from '../src/providers/react-query';
import { montserrat } from '../lib/fonts/Montserrat';

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
            <div className={`${montserrat.variable}`}>
                <ReactQueryProvider>
                    <StoreProvider>
                        <Story />
                    </StoreProvider>
                </ReactQueryProvider>
            </div>
        );
    },
];
