import React, { ReactNode } from 'react';
import { ErrorBoundary, ErrorBoundaryPropsWithComponent } from 'react-error-boundary';

import cn from './style.module.sass';

type ErrorFallbackProps = {
    error: { message: string };
    resetErrorBoundary: () => void;
};

type BoundaryProps = Partial<ErrorBoundaryPropsWithComponent> & {
    children: ReactNode;
};

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    return (
        <div role="alert">
            <div className={cn.errorLabel}>Что-то пошло не так:</div>

            <pre className={cn.errorText}>{error.message}</pre>

            <button onClick={resetErrorBoundary}>Попробовать еще</button>
        </div>
    );
}

function Boundary({ children, ...props }: BoundaryProps) {
    const onError = (error: Error, info: { componentStack: string }) => {
        console.error({ error, info });
        props.onError?.(error, info);
    };

    return (
        <ErrorBoundary {...props} FallbackComponent={ErrorFallback} onError={onError}>
            {children}
        </ErrorBoundary>
    );
}

export default Boundary;
