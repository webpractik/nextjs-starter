import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '../button'
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from './card'

const meta: Meta<typeof Card> = {
	component: Card,
	title: 'core/Card',
	argTypes: {
		size: {
			control: 'select',
			options: ['default', 'sm'],
		},
	},
}

export default meta

type Story = StoryObj<typeof Card>

export const Default: Story = {
	render: args => (
		<Card {...args}>
			<CardHeader>
				<CardTitle>Card Title</CardTitle>
				<CardDescription>Card description goes here</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Card content with some text inside.</p>
			</CardContent>
			<CardFooter>
				<Button>Action</Button>
			</CardFooter>
		</Card>
	),
	args: {
		size: 'default',
	},
}

export const Small: Story = {
	render: args => (
		<Card {...args}>
			<CardHeader>
				<CardTitle>Small Card</CardTitle>
				<CardDescription>Compact version</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Content for small card.</p>
			</CardContent>
		</Card>
	),
	args: {
		size: 'sm',
	},
}

export const WithAction: Story = {
	render: () => (
		<Card className="w-96">
			<CardHeader>
				<CardTitle>Card with Action</CardTitle>
				<CardDescription>This card has an action button in the header</CardDescription>
				<CardAction>
					<Button variant="outline" size="sm">
						Edit
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<p>Some content goes here.</p>
			</CardContent>
		</Card>
	),
}

export const Simple: Story = {
	render: () => (
		<Card className="w-64">
			<CardContent>
				<p className="text-2xl font-bold">$1,234</p>
				<p className="text-muted-foreground">Total Revenue</p>
			</CardContent>
		</Card>
	),
}

export const WithFooterActions: Story = {
	render: () => (
		<Card className="w-96">
			<CardHeader>
				<CardTitle>Confirm Action</CardTitle>
				<CardDescription>Are you sure you want to proceed?</CardDescription>
			</CardHeader>
			<CardContent>
				<p>This action cannot be undone.</p>
			</CardContent>
			<CardFooter className="gap-2">
				<Button variant="outline">Cancel</Button>
				<Button>Confirm</Button>
			</CardFooter>
		</Card>
	),
}
