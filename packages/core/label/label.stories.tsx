import type { Meta, StoryObj } from '@storybook/react'

import { Checkbox } from '../checkbox'
import { Input } from '../input'
import { Label } from './label'

const meta: Meta<typeof Label> = {
	component: Label,
	title: 'core/Label',
}

export default meta

type Story = StoryObj<typeof Label>

export const Default: Story = {
	args: {
		children: 'Label text',
	},
}

export const WithInput: Story = {
	render: () => (
		<div className="grid gap-2">
			<Label htmlFor="email">Email address</Label>
			<Input id="email" type="email" placeholder="email@example.com" />
		</div>
	),
}

export const WithCheckbox: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Checkbox id="terms" />
			<Label htmlFor="terms">Accept terms and conditions</Label>
		</div>
	),
}

export const Required: Story = {
	render: () => (
		<div className="grid gap-2">
			<Label htmlFor="required-field">
				Required field
				<span className="text-destructive">*</span>
			</Label>
			<Input id="required-field" required />
		</div>
	),
}

export const Disabled: Story = {
	render: () => (
		<div className="grid gap-2" data-disabled="true">
			<Label htmlFor="disabled-field">Disabled field</Label>
			<Input id="disabled-field" disabled />
		</div>
	),
}

export const WithDescription: Story = {
	render: () => (
		<div className="grid gap-2">
			<Label htmlFor="username">Username</Label>
			<Input id="username" placeholder="@username" />
			<p className="text-sm text-muted-foreground">This will be your public display name.</p>
		</div>
	),
}
