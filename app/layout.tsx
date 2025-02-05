import './globals.css';

import type { ReactNode } from 'react';

import { ReactQueryProvider } from '@/_shared/utilities/providers/react-query';

import { cn } from '~/lib/utils/cn';

import { geistSans } from './fonts/font';

export const dynamic = 'error';
export const fetchCache = 'default-cache';

export const metadata = {
    description: 'Default starter for projects',
    title: 'Next Starter',
};

export type RootLayoutProps = Readonly<{ children: ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <body
                className={cn(
                    'min-h-screen bg-background font-sans antialiased',
                    geistSans.variable
                )}
            >
                <main>
                    <ReactQueryProvider>{children}</ReactQueryProvider>
                </main>
            </body>
        </html>
    );
}
