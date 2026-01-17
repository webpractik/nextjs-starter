import type { Meta, StoryObj } from '@storybook/react'

import { Skeleton } from './skeleton'

const meta: Meta<typeof Skeleton> = {
	component: Skeleton,
	title: 'core/Skeleton',
}

export default meta

type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
	args: {
		className: 'h-4 w-48',
	},
}

export const Circle: Story = {
	args: {
		className: 'size-12 rounded-full',
	},
}

export const Rectangle: Story = {
	args: {
		className: 'h-32 w-64',
	},
}

export const CardSkeleton: Story = {
	render: () => (
		<div className="flex flex-col space-y-3">
			<Skeleton className="h-32 w-64 rounded-xl" />
			<div className="space-y-2">
				<Skeleton className="h-4 w-64" />
				<Skeleton className="h-4 w-48" />
			</div>
		</div>
	),
}

export const ProfileSkeleton: Story = {
	render: () => (
		<div className="flex items-center space-x-4">
			<Skeleton className="size-12 rounded-full" />
			<div className="space-y-2">
				<Skeleton className="h-4 w-48" />
				<Skeleton className="h-4 w-32" />
			</div>
		</div>
	),
}

export const ListSkeleton: Story = {
	render: () => (
		<div className="space-y-4">
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i} className="flex items-center space-x-4">
					<Skeleton className="size-10 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				</div>
			))}
		</div>
	),
}

export const TableSkeleton: Story = {
	render: () => (
		<div className="space-y-2">
			<div className="flex gap-4">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-8 w-24" />
				<Skeleton className="h-8 w-32" />
			</div>
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="flex gap-4">
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-6 w-24" />
					<Skeleton className="h-6 w-32" />
				</div>
			))}
		</div>
	),
}

export const FormSkeleton: Story = {
	render: () => (
		<div className="w-80 space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-4 w-16" />
				<Skeleton className="h-9 w-full" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-9 w-full" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-20" />
				<Skeleton className="h-24 w-full" />
			</div>
			<Skeleton className="h-9 w-24" />
		</div>
	),
}
