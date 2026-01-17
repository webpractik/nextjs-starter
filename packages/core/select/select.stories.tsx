import type { Meta, StoryObj } from '@storybook/react'
import { Field } from '@base-ui/react/field'

import { GlobeIcon } from 'lucide-react'
import { Label } from '../label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './select'

const meta: Meta<typeof Select> = {
	component: Select,
	title: 'core/Select',
}

export default meta

type Story = StoryObj<typeof Select>

const items = [
	{ value: null, label: 'Select theme' },
	{ value: 'system', label: 'System default' },
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
]

export const Default: Story = {

	render: () => (
		<Select items={items}>
			<SelectTrigger className="w-48">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{items.map(({ value, label }) => (
					<SelectItem key={label} value={value}>{label}</SelectItem>
				))}
			</SelectContent>
		</Select>
	),
}

export const Small: Story = {
	render: () => (
		<Select defaultValue="sm">
			<SelectTrigger size="sm" className="w-32">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="xs">XS</SelectItem>
				<SelectItem value="sm">SM</SelectItem>
				<SelectItem value="md">MD</SelectItem>
				<SelectItem value="lg">LG</SelectItem>
			</SelectContent>
		</Select>
	),
}

export const WithLabel: Story = {
	render: () => (
		<Field.Root className="grid gap-2">
			<Field.Label render={Label} htmlFor="country">
				Country
			</Field.Label>
			<Select defaultValue="Select country">
				<SelectTrigger id="country" className="w-56">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="us">United States</SelectItem>
					<SelectItem value="uk">United Kingdom</SelectItem>
					<SelectItem value="ca">Canada</SelectItem>
					<SelectItem value="au">Australia</SelectItem>
					<SelectItem value="de">Germany</SelectItem>
					<SelectItem value="fr">France</SelectItem>
				</SelectContent>
			</Select>
		</Field.Root>
	),
}

export const Disabled: Story = {
	render: () => (
		<Select disabled defaultValue="1">
			<SelectTrigger className="w-48">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="1">Item 1</SelectItem>
				<SelectItem value="2">Item 2</SelectItem>
			</SelectContent>
		</Select>
	),
}

export const DisabledItem: Story = {
	render: () => (
		<Select defaultValue="Select a plan">
			<SelectTrigger className="w-48">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="free">Free</SelectItem>
				<SelectItem value="pro">Pro</SelectItem>
				<SelectItem value="enterprise" disabled>
					Enterprise (Coming soon)
				</SelectItem>
			</SelectContent>
		</Select>
	),
}

export const WithIcons: Story = {
	render: () => (
		<Select defaultValue="en">
			<SelectTrigger className="w-48">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="en">
					<GlobeIcon className="size-4" />
					English
				</SelectItem>
				<SelectItem value="ru">
					<GlobeIcon className="size-4" />
					Russian
				</SelectItem>
				<SelectItem value="de">
					<GlobeIcon className="size-4" />
					German
				</SelectItem>
				<SelectItem value="fr">
					<GlobeIcon className="size-4" />
					French
				</SelectItem>
			</SelectContent>
		</Select>
	),
}
