import type { Metadata } from 'next'

import type { ReactNode } from 'react'
import { QueryProvider } from '#/components/providers/query-provider'

import { geistSans } from '#/fonts/geist'
import { cn } from '#/utils/cn'
import { Toaster } from '@repo/core/sonner'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import '#/styles/globals.css'

export const metadata: Metadata = {
	description: 'Default starter for projects',
	title: 'Next Starter',
}

export type RootLayoutProps = Readonly<{ children: ReactNode }>

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="ru" suppressHydrationWarning>
			<body className={cn('font-sans antialiased', geistSans.variable)}>
				<NuqsAdapter>
					<QueryProvider>
						<main className={`
        relative flex size-full flex-col items-center justify-center
        overflow-hidden bg-background antialiased
      `}
						>
							{children}
							<Toaster />
						</main>
					</QueryProvider>
				</NuqsAdapter>
			</body>
		</html>
	)
}
