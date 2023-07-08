import '@/styles/index.sass';
import 'modern-normalize/modern-normalize.css';

import { Montserrat } from 'next/font/google';
import React, { ReactNode } from 'react';

import ReactQueryProvider from '@/providers/react-query';
import StoreProvider from '@/providers/store';

export const metadata = {
    title: 'Nextjs Starter',
    description: 'Default starter for projects',
};

const montserrat = Montserrat({
    weight: ['400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
    style: 'normal',
    fallback: [
        'system-ui',
        'Segoe UI',
        'Roboto',
        'Helvetica',
        'Arial',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
    ],
    variable: '--font-montserrat',
});

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ru" className={`${montserrat.variable}`}>
            <body>
                <main>
                    <ReactQueryProvider>
                        <StoreProvider>{children}</StoreProvider>
                    </ReactQueryProvider>
                </main>
            </body>
        </html>
    );
}
