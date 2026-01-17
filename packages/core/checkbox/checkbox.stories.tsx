import type { Meta, StoryObj } from '@storybook/react'

import { Label } from '../label'
import { Checkbox } from './checkbox'

const meta: Meta<typeof Checkbox> = {
	component: Checkbox,
	title: 'core/Checkbox',
	argTypes: {
		checked: {
			control: 'boolean',
		},
		disabled: {
			control: 'boolean',
		},
	},
}

export default meta

type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
	args: {},
}

export const Checked: Story = {
	args: {
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
			<Checkbox id="terms" />
			<Label htmlFor="terms">Accept terms and conditions</Label>
		</div>
	),
}

export const WithLabelChecked: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Checkbox id="newsletter" defaultChecked />
			<Label htmlFor="newsletter">Subscribe to newsletter</Label>
		</div>
	),
}

export const Group: Story = {
	render: () => (
		<div className="grid gap-3">
			<div className="flex items-center gap-2">
				<Checkbox id="option-1" defaultChecked />
				<Label htmlFor="option-1">Option 1</Label>
			</div>
			<div className="flex items-center gap-2">
				<Checkbox id="option-2" />
				<Label htmlFor="option-2">Option 2</Label>
			</div>
			<div className="flex items-center gap-2">
				<Checkbox id="option-3" />
				<Label htmlFor="option-3">Option 3</Label>
			</div>
		</div>
	),
}
