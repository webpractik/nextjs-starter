'use client';
import logger from '@repo/logger';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

import { ErrorFallback } from '@/_shared/utilities/error-boundary';

type GlobalErrorProps = {
    error: { digest?: string } & Error;
    reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        logger.error(error);
        Sentry.captureException(error);
    }, [error]);

    return (
        <html lang="ru">
            <body>
                <ErrorFallback error={error} resetError={reset} />
            </body>
        </html>
    );
}
