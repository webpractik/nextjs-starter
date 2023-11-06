import '../app/styles/index.sass';
import ReactQueryProvider from '../app/components/shared/providers/react-query';
import { montserrat } from '../app/lib/fonts/Montserrat';

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
                    <Story />
                </ReactQueryProvider>
            </div>
        );
    },
];
