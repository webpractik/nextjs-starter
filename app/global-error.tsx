'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

import { ErrorFallback } from '#/components/utilities/error-boundary'
import logger from '#/observability/logger'

interface GlobalErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        logger.error(error)
        Sentry.captureException(error)
    }, [error])

    return (
        <html lang="ru">
            <body>
                <ErrorFallback error={error} resetError={reset} />
            </body>
        </html>
    )
}
