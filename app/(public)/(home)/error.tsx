'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

import { ErrorFallback } from '@/_shared/utilities/error-boundary';

type ErrorProps = {
    error: { digest?: string } & Error;
    reset: () => void;
};

export default function ErrorPage({ error, reset }: Readonly<ErrorProps>) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return <ErrorFallback error={error} resetError={reset} />;
}
