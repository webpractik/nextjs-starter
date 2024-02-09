import { ErrorBoundary as SentryBoundary, ErrorBoundaryProps } from '@sentry/nextjs';
import { Box } from 'core/Box';
import { Button } from 'core/Button';
import { Typography } from 'core/Typography';
import React from 'react';

import cn from './ErrorBoundary.module.sass';

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
        <Box
            className={cn.errorWrapper}
            direction="column"
            gap={'1rem'}
            data-testid="error-boundary"
        >
            <Typography variant="h3" className={cn.errorLabel}>
                {title ?? DEFAULT_ERROR_TITLE}
            </Typography>

            <Typography color="secondary" variant="p">
                {description ?? DEFAULT_ERROR_TEXT}
            </Typography>

            <pre className={cn.errorText}>{error.message}</pre>

            <Button type="button" variant="outline" onClick={resetError}>
                Попробовать еще
            </Button>
        </Box>
    );
}

export function ErrorBoundary({ children, fallback, onError, onReset }: ErrorBoundaryProps) {
    return (
        <SentryBoundary fallback={fallback ?? ErrorFallback} onError={onError} onReset={onReset}>
            {children}
        </SentryBoundary>
    );
}
