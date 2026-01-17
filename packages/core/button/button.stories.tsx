import type { Meta, StoryObj } from '@storybook/react'
import { MailIcon, PlusIcon } from 'lucide-react'

import { Button } from './button'

const meta: Meta<typeof Button> = {
	component: Button,
	title: 'core/Button',
	argTypes: {
		variant: {
			control: 'select',
			options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
		},
		size: {
			control: 'select',
			options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
		},
		disabled: {
			control: 'boolean',
		},
	},
}

export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = {
	args: {
		children: 'Button',
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

export const Small: Story = {
	args: {
		children: 'Small',
		size: 'sm',
	},
}

export const ExtraSmall: Story = {
	args: {
		children: 'XS',
		size: 'xs',
	},
}

export const Large: Story = {
	args: {
		children: 'Large',
		size: 'lg',
	},
}

export const Icon: Story = {
	args: {
		'children': <PlusIcon />,
		'size': 'icon',
		'aria-label': 'Add',
	},
}

export const IconSmall: Story = {
	args: {
		'children': <PlusIcon />,
		'size': 'icon-sm',
		'aria-label': 'Add',
	},
}

export const WithIcon: Story = {
	args: {
		children: (
			<>
				<MailIcon data-icon="inline-start" />
				Send Email
			</>
		),
	},
}

export const Disabled: Story = {
	args: {
		children: 'Disabled',
		disabled: true,
	},
}

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<Button variant="default">Default</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="destructive">Destructive</Button>
			<Button variant="link">Link</Button>
		</div>
	),
}

export const AllSizes: Story = {
	render: () => (
		<div className="flex flex-wrap items-center gap-4">
			<Button size="xs">Extra Small</Button>
			<Button size="sm">Small</Button>
			<Button size="default">Default</Button>
			<Button size="lg">Large</Button>
		</div>
	),
}
