import '~/lib/styles/base.css';

import type { ReactNode } from 'react';

import { ReactQueryProvider } from '@/_shared/utilities/providers/react-query';
import { GeistSans } from '~/lib/fonts/geist';
import { cn } from '~/lib/utils/cn';

export const dynamic = 'error';
export const fetchCache = 'default-cache';
export const experimental_ppr = true;

export const metadata = {
    title: 'Next Starter',
    description: 'Default starter for projects',
};

export type RootLayoutProps = Readonly<{ children: ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html suppressHydrationWarning lang="ru">
            <body
                className={cn(
                    'min-h-screen bg-background font-sans antialiased',
                    GeistSans.variable
                )}
            >
                <main>
                    <ReactQueryProvider>{children}</ReactQueryProvider>
                </main>
            </body>
        </html>
    );
}
