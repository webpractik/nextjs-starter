'use client'

import type { ReactNode } from 'react'
import { getQueryClient } from '#/utils/get-query-client'
import { QueryClientProvider } from '@tanstack/react-query'

export function QueryProvider({ children }: { children: ReactNode }) {
	const queryClient = getQueryClient()

	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	)
}
