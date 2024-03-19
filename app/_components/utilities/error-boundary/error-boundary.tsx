import { ErrorBoundary as SentryBoundary, ErrorBoundaryProps } from '@sentry/nextjs';
import { Button } from 'components/core/button';
import { Typography } from 'components/core/typography';
import React from 'react';

import { cn } from '~/lib/utils/cn';

type ErrorFallbackProps = {
    title?: string;
    description?: string;
    error: { message: string };
    resetError: () => void;
};

const DEFAULT_ERROR_TITLE = 'Техническая ошибка';

const DEFAULT_ERROR_TEXT = `Извините, возникла неожиданная техническая неполадка. 
Мы прилагаем все усилия для решения этой проблемы как можно скорее. 
Пожалуйста, попробуйте обновить страницу или вернуться позже.`;

export function ErrorFallback({ title, description, error, resetError }: ErrorFallbackProps) {
    return (
        <div
            data-testid="error-boundary"
            className={cn(
                'max-w-screen-sm max-h-80 p-4 flex flex-col gap-4 rounded-2xl border border-solid  '
            )}
        >
            <Typography variant="h3" className={cn('')}>
                {title ?? DEFAULT_ERROR_TITLE}
            </Typography>

            <Typography color="secondary" variant="p">
                {description ?? DEFAULT_ERROR_TEXT}
            </Typography>

            <pre className={cn('')}>{error.message}</pre>

            <Button type="button" variant="outline" onClick={resetError}>
                Попробовать еще
            </Button>
        </div>
    );
}

export function ErrorBoundary({ children, fallback, onError, onReset }: ErrorBoundaryProps) {
    return (
        <SentryBoundary fallback={fallback ?? ErrorFallback} onError={onError} onReset={onReset}>
            {children}
        </SentryBoundary>
    );
}
