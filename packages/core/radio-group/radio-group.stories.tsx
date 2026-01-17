import type { Meta, StoryObj } from '@storybook/react'

import { Label } from '../label'
import { RadioGroup, RadioGroupItem } from './radio-group'

const meta: Meta<typeof RadioGroup> = {
	component: RadioGroup,
	title: 'core/RadioGroup',
}

export default meta

type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
	render: () => (
		<RadioGroup defaultValue="option-1">
			<div className="flex items-center gap-2">
				<RadioGroupItem value="option-1" id="option-1" />
				<Label htmlFor="option-1">Option 1</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="option-2" id="option-2" />
				<Label htmlFor="option-2">Option 2</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="option-3" id="option-3" />
				<Label htmlFor="option-3">Option 3</Label>
			</div>
		</RadioGroup>
	),
}

export const NoDefault: Story = {
	render: () => (
		<RadioGroup>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="a" id="a" />
				<Label htmlFor="a">Choice A</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="b" id="b" />
				<Label htmlFor="b">Choice B</Label>
			</div>
		</RadioGroup>
	),
}

export const Disabled: Story = {
	render: () => (
		<RadioGroup defaultValue="enabled">
			<div className="flex items-center gap-2">
				<RadioGroupItem value="enabled" id="enabled" />
				<Label htmlFor="enabled">Enabled option</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="disabled" id="disabled" disabled />
				<Label htmlFor="disabled" className="opacity-50">
					Disabled option
				</Label>
			</div>
		</RadioGroup>
	),
}

export const Invalid: Story = {
	render: () => (
		<RadioGroup aria-invalid>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="yes" id="yes" aria-invalid />
				<Label htmlFor="yes">Yes</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="no" id="no" aria-invalid />
				<Label htmlFor="no">No</Label>
			</div>
		</RadioGroup>
	),
}

export const WithDescriptions: Story = {
	render: () => (
		<RadioGroup defaultValue="personal" className="gap-4">
			<div className="flex gap-2">
				<RadioGroupItem value="personal" id="personal" className="mt-1" />
				<div className="grid gap-1">
					<Label htmlFor="personal">Personal</Label>
					<p className="text-sm text-muted-foreground">Use for personal projects</p>
				</div>
			</div>
			<div className="flex gap-2">
				<RadioGroupItem value="team" id="team" className="mt-1" />
				<div className="grid gap-1">
					<Label htmlFor="team">Team</Label>
					<p className="text-sm text-muted-foreground">Share with your team members</p>
				</div>
			</div>
			<div className="flex gap-2">
				<RadioGroupItem value="enterprise" id="enterprise" className="mt-1" />
				<div className="grid gap-1">
					<Label htmlFor="enterprise">Enterprise</Label>
					<p className="text-sm text-muted-foreground">For large organizations</p>
				</div>
			</div>
		</RadioGroup>
	),
}

export const Horizontal: Story = {
	render: () => (
		<RadioGroup defaultValue="left" className="flex flex-row gap-4">
			<div className="flex items-center gap-2">
				<RadioGroupItem value="left" id="left" />
				<Label htmlFor="left">Left</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="center" id="center" />
				<Label htmlFor="center">Center</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="right" id="right" />
				<Label htmlFor="right">Right</Label>
			</div>
		</RadioGroup>
	),
}
