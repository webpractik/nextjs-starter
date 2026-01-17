'use client'

import { ErrorFallback } from '#/components/utilities/error-boundary'
import * as Sentry from '@sentry/nextjs'

import { useEffect } from 'react'

interface ErrorProps {
	error: { digest?: string } & Error
	reset: () => void
}

export default function ErrorPage({ error, reset }: Readonly<ErrorProps>) {
	useEffect(() => {
		Sentry.captureException(error)
	}, [error])

	return <ErrorFallback error={error} resetError={reset} />
}
