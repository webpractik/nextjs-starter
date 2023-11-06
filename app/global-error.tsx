'use client';

import { ErrorFallback } from 'shared/utilities/ErrorBoundary';

type GlobalErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    return (
        <html lang="ru">
            <body>
                <ErrorFallback error={error} resetError={reset} />
            </body>
        </html>
    );
}
