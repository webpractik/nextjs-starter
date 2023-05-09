import '@/styles/index.sass';

import React, { ReactNode } from 'react';

import ReactQueryProvider from '@/providers/react-query';
import StoreProvider from '@/providers/store';

export const metadata = {
    title: 'Nextjs Starter',
    description: 'Default starter for projects',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ru">
            <body>
                <ReactQueryProvider>
                    <StoreProvider>{children}</StoreProvider>
                </ReactQueryProvider>
            </body>
        </html>
    );
}
