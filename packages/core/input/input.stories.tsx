import type { Meta, StoryObj } from '@storybook/react'

import { Label } from '../label'
import { Input } from './input'

const meta: Meta<typeof Input> = {
	component: Input,
	title: 'core/Input',
	argTypes: {
		type: {
			control: 'select',
			options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'file'],
		},
		disabled: {
			control: 'boolean',
		},
		placeholder: {
			control: 'text',
		},
	},
}

export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {
	args: {
		placeholder: 'Enter text...',
	},
}

export const Email: Story = {
	args: {
		type: 'email',
		placeholder: 'email@example.com',
	},
}

export const Password: Story = {
	args: {
		type: 'password',
		placeholder: 'Enter password',
	},
}

export const Number: Story = {
	args: {
		type: 'number',
		placeholder: '0',
	},
}

export const Search: Story = {
	args: {
		type: 'search',
		placeholder: 'Search...',
	},
}

export const File: Story = {
	args: {
		type: 'file',
	},
}

export const Disabled: Story = {
	args: {
		placeholder: 'Disabled input',
		disabled: true,
	},
}

export const Invalid: Story = {
	args: {
		'placeholder': 'Invalid input',
		'aria-invalid': true,
		'defaultValue': 'Invalid value',
	},
}

export const WithLabel: Story = {
	render: () => (
		<div className="grid gap-2">
			<Label htmlFor="email">Email</Label>
			<Input id="email" type="email" placeholder="email@example.com" />
		</div>
	),
}

export const WithValue: Story = {
	args: {
		defaultValue: 'Pre-filled value',
	},
}
