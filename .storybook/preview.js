import '../src/styles/index.sass';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import { initialize, mswDecorator } from 'msw-storybook-addon';
import { handlers } from '../src/mocks/handlers';

initialize({
    onUnhandledRequest: 'bypass',
});

const queryClient = new QueryClient();

export const parameters = {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
    nextRouter: {
        Provider: RouterContext.Provider,
    },
    msw: {
        handlers: handlers,
    },
};

export const decorators = [
    mswDecorator,
    story => (
        <QueryClientProvider client={queryClient}>
            {story()}
            <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        </QueryClientProvider>
    ),
];
