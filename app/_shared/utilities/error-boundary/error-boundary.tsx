import { Button } from '@repo/core/button';
import { Typography } from '@repo/core/typography';
import { ErrorBoundary as SentryBoundary, type ErrorBoundaryProps } from '@sentry/nextjs';
import React from 'react';

import { cn } from '~/lib/utils/cn';

type ErrorFallbackProps = {
    title?: string;
    description?: string;
    error: unknown;
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
            className={
                'flex max-h-80 max-w-screen-sm flex-col gap-4 rounded-2xl border border-solid p-4'
            }
        >
            <Typography variant="h3" className={cn('')}>
                {title ?? DEFAULT_ERROR_TITLE}
            </Typography>

            <Typography color="secondary" variant="p">
                {description ?? DEFAULT_ERROR_TEXT}
            </Typography>

            <pre className={cn('')}>{error instanceof Error ? error.message : String(error)}</pre>

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
