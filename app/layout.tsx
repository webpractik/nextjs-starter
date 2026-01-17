import type { Metadata } from 'next'

import type { ReactNode } from 'react'
import { geistSans } from '#/fonts/geist'

import { cn } from '#/utils/cn'
import { Toaster } from '@repo/core/sonner'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import '#/styles/globals.css'

export const dynamic = 'force-static'
// 'auto' | 'force-dynamic' | 'error' | 'force-static'

export const revalidate = false
// false | 0 | number

export const fetchCache = 'auto'
// 'auto' | 'default-cache' | 'only-cache' | 'force-cache' | 'force-no-store' | 'default-no-store' | 'only-no-store'

export const runtime = 'nodejs'

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
					<main className="
       relative flex size-full flex-col items-center justify-center
       overflow-hidden bg-background antialiased
     "
					>
						{children}
						<Toaster />
					</main>
				</NuqsAdapter>
			</body>
		</html>
	)
}
