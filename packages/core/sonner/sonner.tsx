'use client'

import type { ToasterProps } from 'sonner'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { Toaster as Sonner } from 'sonner'

export function Toaster({ ...props }: ToasterProps) {
	return (
		<Sonner
			icons={{
				error: (
					<OctagonXIcon className="size-4" />
				),
				info: (
					<InfoIcon className="size-4" />
				),
				loading: (
					<Loader2Icon className="size-4 animate-spin" />
				),
				success: (
					<CircleCheckIcon className="size-4" />
				),
				warning: (
					<TriangleAlertIcon className="size-4" />
				),
			}}
			style={
				{
					'--border-radius': 'var(--radius)',
					'--normal-bg': 'var(--popover)',
					'--normal-border': 'var(--border)',
					'--normal-text': 'var(--popover-foreground)',
				} as React.CSSProperties
			}
			theme="system"
			toastOptions={{
				classNames: {
					toast: 'cn-toast',
				},
			}}
			{...props}
		/>
	)
}
