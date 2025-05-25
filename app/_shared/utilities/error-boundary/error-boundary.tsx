import { Button } from '@repo/core/button';
import { Typography } from '@repo/core/typography';
import { type ErrorBoundaryProps, ErrorBoundary as SentryBoundary } from '@sentry/nextjs';

import { cn } from '~/src/utils/cn';

type ErrorFallbackProps = {
    description?: string;
    error: unknown;
    resetError: () => void;
    title?: string;
};

const DEFAULT_ERROR_TITLE = 'Техническая ошибка';

const DEFAULT_ERROR_TEXT = `Извините, возникла неожиданная техническая неполадка. 
Мы прилагаем все усилия для решения этой проблемы как можно скорее. 
Пожалуйста, попробуйте обновить страницу или вернуться позже.`;

export function ErrorFallback({ description, error, resetError, title }: ErrorFallbackProps) {
    return (
        <div
            className={
                'flex max-h-80 max-w-(--breakpoint-sm) flex-col gap-4 rounded-2xl border border-solid p-4'
            }
            data-testid="error-boundary"
        >
            <Typography className={cn('')} variant="h3">
                {title ?? DEFAULT_ERROR_TITLE}
            </Typography>

            <Typography color="secondary" variant="p">
                {description ?? DEFAULT_ERROR_TEXT}
            </Typography>

            <pre className={cn('')}>{error instanceof Error ? error.message : String(error)}</pre>

            <Button onClick={resetError} type="button" variant="outline">
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
