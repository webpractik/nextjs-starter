import '~/styles/index.sass';
import 'modern-normalize/modern-normalize.css';

import React, { ReactNode } from 'react';
import ReactQueryProvider from 'shared/providers/react-query';

import { montserrat } from '~/lib/fonts/Montserrat';

export const metadata = {
    title: 'Nextjs Starter',
    description: 'Default starter for projects',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ru" className={`${montserrat.variable}`}>
            <body>
                <main>
                    <ReactQueryProvider>{children}</ReactQueryProvider>
                </main>
            </body>
        </html>
    );
}
