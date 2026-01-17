import type { Meta, StoryObj } from '@storybook/react'
import { CheckIcon, XIcon } from 'lucide-react'

import { Badge } from './badge'

const meta: Meta<typeof Badge> = {
	component: Badge,
	title: 'core/Badge',
	argTypes: {
		variant: {
			control: 'select',
			options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
		},
	},
}

export default meta

type Story = StoryObj<typeof Badge>

export const Default: Story = {
	args: {
		children: 'Badge',
		variant: 'default',
	},
}

export const Outline: Story = {
	args: {
		children: 'Outline',
		variant: 'outline',
	},
}

export const Secondary: Story = {
	args: {
		children: 'Secondary',
		variant: 'secondary',
	},
}

export const Ghost: Story = {
	args: {
		children: 'Ghost',
		variant: 'ghost',
	},
}

export const Destructive: Story = {
	args: {
		children: 'Destructive',
		variant: 'destructive',
	},
}

export const Link: Story = {
	args: {
		children: 'Link',
		variant: 'link',
	},
}

export const WithIcon: Story = {
	args: {
		children: (
			<>
				<CheckIcon data-icon="inline-start" />
				Verified
			</>
		),
		variant: 'default',
	},
}

export const WithIconEnd: Story = {
	args: {
		children: (
			<>
				Close
				<XIcon data-icon="inline-end" />
			</>
		),
		variant: 'secondary',
	},
}

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-wrap gap-2">
			<Badge variant="default">Default</Badge>
			<Badge variant="outline">Outline</Badge>
			<Badge variant="secondary">Secondary</Badge>
			<Badge variant="ghost">Ghost</Badge>
			<Badge variant="destructive">Destructive</Badge>
			<Badge variant="link">Link</Badge>
		</div>
	),
}
