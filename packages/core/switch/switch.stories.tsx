import type { Meta, StoryObj } from '@storybook/react'

import { Label } from '../label'
import { Switch } from './switch'

const meta: Meta<typeof Switch> = {
	component: Switch,
	title: 'core/Switch',
	argTypes: {
		size: {
			control: 'select',
			options: ['default', 'sm'],
		},
		disabled: {
			control: 'boolean',
		},
	},
}

export default meta

type Story = StoryObj<typeof Switch>

export const Default: Story = {
	args: {},
}

export const Checked: Story = {
	args: {
		defaultChecked: true,
	},
}

export const Small: Story = {
	args: {
		size: 'sm',
	},
}

export const SmallChecked: Story = {
	args: {
		size: 'sm',
		defaultChecked: true,
	},
}

export const Disabled: Story = {
	args: {
		disabled: true,
	},
}

export const DisabledChecked: Story = {
	args: {
		disabled: true,
		defaultChecked: true,
	},
}

export const Invalid: Story = {
	args: {
		'aria-invalid': true,
	},
}

export const WithLabel: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Switch id="airplane-mode" />
			<Label htmlFor="airplane-mode">Airplane Mode</Label>
		</div>
	),
}

export const WithLabelChecked: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Switch id="dark-mode" defaultChecked />
			<Label htmlFor="dark-mode">Dark Mode</Label>
		</div>
	),
}

export const SettingsList: Story = {
	render: () => (
		<div className="w-80 space-y-4">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label htmlFor="notifications">Push Notifications</Label>
					<p className="text-sm text-muted-foreground">Receive push notifications</p>
				</div>
				<Switch id="notifications" defaultChecked />
			</div>
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label htmlFor="emails">Email Updates</Label>
					<p className="text-sm text-muted-foreground">Receive email updates</p>
				</div>
				<Switch id="emails" />
			</div>
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label htmlFor="marketing">Marketing</Label>
					<p className="text-sm text-muted-foreground">Receive marketing emails</p>
				</div>
				<Switch id="marketing" />
			</div>
		</div>
	),
}

export const AllSizes: Story = {
	render: () => (
		<div className="flex items-center gap-4">
			<div className="flex items-center gap-2">
				<Switch size="sm" defaultChecked />
				<Label>Small</Label>
			</div>
			<div className="flex items-center gap-2">
				<Switch size="default" defaultChecked />
				<Label>Default</Label>
			</div>
		</div>
	),
}
