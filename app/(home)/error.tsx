'use client';

import { ErrorFallback } from 'components/shared/utilities/error-boundary';

type ErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
    return <ErrorFallback error={error} resetError={reset} />;
}
