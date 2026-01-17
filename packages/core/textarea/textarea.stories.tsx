import type { Meta, StoryObj } from '@storybook/react'

import { Label } from '../label'
import { Textarea } from './textarea'

const meta: Meta<typeof Textarea> = {
	component: Textarea,
	title: 'core/Textarea',
	argTypes: {
		disabled: {
			control: 'boolean',
		},
		placeholder: {
			control: 'text',
		},
		rows: {
			control: { type: 'number', min: 1, max: 20 },
		},
	},
}

export default meta

type Story = StoryObj<typeof Textarea>

export const Default: Story = {
	args: {
		placeholder: 'Type your message here...',
	},
}

export const WithValue: Story = {
	args: {
		defaultValue:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
	},
}

export const Disabled: Story = {
	args: {
		placeholder: 'Disabled textarea',
		disabled: true,
	},
}

export const Invalid: Story = {
	args: {
		'placeholder': 'Invalid textarea',
		'aria-invalid': true,
		'defaultValue': 'Invalid content',
	},
}

export const WithLabel: Story = {
	render: () => (
		<div className="grid gap-2">
			<Label htmlFor="message">Message</Label>
			<Textarea id="message" placeholder="Type your message here..." />
		</div>
	),
}

export const WithDescription: Story = {
	render: () => (
		<div className="grid gap-2">
			<Label htmlFor="bio">Bio</Label>
			<Textarea id="bio" placeholder="Tell us a little bit about yourself" />
			<p className="text-sm text-muted-foreground">
				You can use up to 500 characters.
			</p>
		</div>
	),
}

export const WithMaxLength: Story = {
	render: () => (
		<div className="grid gap-2">
			<Label htmlFor="limited">Limited Input</Label>
			<Textarea id="limited" placeholder="Max 100 characters" maxLength={100} />
			<p className="text-sm text-muted-foreground">Maximum 100 characters.</p>
		</div>
	),
}

export const Required: Story = {
	render: () => (
		<div className="grid gap-2">
			<Label htmlFor="required-textarea">
				Description
				<span className="text-destructive">*</span>
			</Label>
			<Textarea id="required-textarea" placeholder="This field is required" required />
		</div>
	),
}

export const ReadOnly: Story = {
	args: {
		defaultValue: 'This content is read-only and cannot be edited.',
		readOnly: true,
	},
}

export const CustomSize: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="grid gap-2">
				<Label>Small (rows=2)</Label>
				<Textarea placeholder="Small textarea" rows={2} />
			</div>
			<div className="grid gap-2">
				<Label>Large (rows=8)</Label>
				<Textarea placeholder="Large textarea" rows={8} />
			</div>
		</div>
	),
}
