import type { Meta, StoryObj } from '@storybook/react'
import { toast } from 'sonner'

import { Button } from '../button'
import { Toaster } from './sonner'

const meta: Meta<typeof Toaster> = {
	component: Toaster,
	title: 'core/Toaster',
	decorators: [
		Story => (
			<>
				<Story />
				<Toaster />
			</>
		),
	],
}

export default meta

type Story = StoryObj<typeof Toaster>

export const Default: Story = {
	render: () => (
		<Button
			onClick={() => toast('This is a default toast message')}
		>
			Show Toast
		</Button>
	),
}

export const Success: Story = {
	render: () => (
		<Button
			onClick={() => toast.success('Successfully saved!')}
		>
			Show Success
		</Button>
	),
}

export const Error: Story = {
	render: () => (
		<Button
			variant="destructive"
			onClick={() => toast.error('Something went wrong!')}
		>
			Show Error
		</Button>
	),
}

export const Warning: Story = {
	render: () => (
		<Button
			variant="outline"
			onClick={() => toast.warning('Please check your input')}
		>
			Show Warning
		</Button>
	),
}

export const Info: Story = {
	render: () => (
		<Button
			variant="secondary"
			onClick={() => toast.info('Here is some information')}
		>
			Show Info
		</Button>
	),
}

export const Loading: Story = {
	render: () => (
		<Button
			onClick={() => {
				const id = toast.loading('Loading...')
				setTimeout(() => {
					toast.success('Loaded successfully!', { id })
				}, 2000)
			}}
		>
			Show Loading
		</Button>
	),
}

export const WithDescription: Story = {
	render: () => (
		<Button
			onClick={() =>
				toast('Event Created', {
					description: 'Your event has been scheduled for Monday at 10:00 AM',
				})}
		>
			With Description
		</Button>
	),
}

export const WithAction: Story = {
	render: () => (
		<Button
			onClick={() =>
				toast('File deleted', {
					action: {
						label: 'Undo',
						onClick: () => toast.success('Restored!'),
					},
				})}
		>
			With Action
		</Button>
	),
}

export const WithCancel: Story = {
	render: () => (
		<Button
			onClick={() =>
				toast('New message', {
					description: 'You have a new message from John',
					cancel: {
						label: 'Dismiss',
						onClick: () => console.warn('Dismissed'),
					},
				})}
		>
			With Cancel
		</Button>
	),
}

export const AllTypes: Story = {
	render: () => (
		<div className="flex flex-wrap gap-2">
			<Button onClick={() => toast('Default toast')}>Default</Button>
			<Button onClick={() => toast.success('Success!')}>Success</Button>
			<Button onClick={() => toast.error('Error!')}>Error</Button>
			<Button onClick={() => toast.warning('Warning!')}>Warning</Button>
			<Button onClick={() => toast.info('Info!')}>Info</Button>
			<Button onClick={() => toast.loading('Loading...')}>Loading</Button>
		</div>
	),
}

export const CustomDuration: Story = {
	render: () => (
		<Button
			onClick={() =>
				toast('This toast will stay for 10 seconds', {
					duration: 10000,
				})}
		>
			Long Duration (10s)
		</Button>
	),
}

export const Persistent: Story = {
	render: () => (
		<Button
			onClick={() =>
				toast('This toast will not auto-dismiss', {
					duration: Number.POSITIVE_INFINITY,
				})}
		>
			Persistent Toast
		</Button>
	),
}
