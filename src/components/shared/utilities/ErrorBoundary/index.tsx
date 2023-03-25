import { ErrorBoundary, ErrorBoundaryProps } from '@sentry/nextjs';
import React from 'react';

import cn from './style.module.sass';

type ErrorFallbackProps = {
    error: { message: string };
    resetError: () => void;
};

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
    return (
        <div className={cn.errorWrapper} role="alert">
            <div className={cn.errorLabel}>Что-то пошло не так:</div>

            <pre className={cn.errorText}>{error.message}</pre>

            <button type="button" onClick={resetError}>
                Попробовать еще
            </button>
        </div>
    );
}

function Boundary({ children, fallback, onError, onReset }: ErrorBoundaryProps) {
    return (
        <ErrorBoundary fallback={fallback ?? ErrorFallback} onError={onError} onReset={onReset}>
            {children}
        </ErrorBoundary>
    );
}

export default Boundary;
