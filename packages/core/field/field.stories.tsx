import type { Meta, StoryObj } from '@storybook/nextjs'

import { Checkbox } from '../checkbox'
import { Input } from '../input'
import { Switch } from '../switch'
import { Textarea } from '../textarea'
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
	FieldTitle,
} from './field'

const meta: Meta<typeof Field> = {
	component: Field,
	title: 'core/Field',
	argTypes: {
		orientation: {
			control: 'select',
			options: ['vertical', 'horizontal', 'responsive'],
		},
	},
}

export default meta

type Story = StoryObj<typeof Field>

export const Default: Story = {
	render: () => (
		<Field>
			<FieldLabel htmlFor="name">Name</FieldLabel>
			<Input id="name" placeholder="Enter your name" />
		</Field>
	),
}

export const WithDescription: Story = {
	render: () => (
		<Field>
			<FieldLabel htmlFor="email">Email</FieldLabel>
			<Input id="email" type="email" placeholder="email@example.com" />
			<FieldDescription>We'll never share your email with anyone else.</FieldDescription>
		</Field>
	),
}

export const WithError: Story = {
	render: () => (
		<Field data-invalid="true">
			<FieldLabel htmlFor="password">Password</FieldLabel>
			<Input id="password" type="password" aria-invalid />
			<FieldError>Password must be at least 8 characters.</FieldError>
		</Field>
	),
}

export const WithMultipleErrors: Story = {
	render: () => (
		<Field data-invalid="true">
			<FieldLabel htmlFor="password2">Password</FieldLabel>
			<Input id="password2" type="password" aria-invalid />
			<FieldError
				errors={[
					{ message: 'Must be at least 8 characters' },
					{ message: 'Must contain a number' },
					{ message: 'Must contain a special character' },
				]}
			/>
		</Field>
	),
}

export const HorizontalOrientation: Story = {
	render: () => (
		<Field orientation="horizontal">
			<FieldLabel htmlFor="username">Username</FieldLabel>
			<Input id="username" placeholder="@username" />
		</Field>
	),
}

export const WithCheckbox: Story = {
	render: () => (
		<Field orientation="horizontal">
			<Checkbox id="terms" />
			<FieldContent>
				<FieldTitle>Accept terms and conditions</FieldTitle>
				<FieldDescription>
					You agree to our Terms of Service and Privacy Policy.
				</FieldDescription>
			</FieldContent>
		</Field>
	),
}

export const WithSwitch: Story = {
	render: () => (
		<Field orientation="horizontal">
			<FieldContent>
				<FieldTitle>Marketing emails</FieldTitle>
				<FieldDescription>Receive emails about new products and features.</FieldDescription>
			</FieldContent>
			<Switch />
		</Field>
	),
}

export const Disabled: Story = {
	render: () => (
		<Field data-disabled="true">
			<FieldLabel htmlFor="disabled">Disabled field</FieldLabel>
			<Input id="disabled" placeholder="Can't edit this" disabled />
		</Field>
	),
}

export const FieldSetExample: Story = {
	render: () => (
		<FieldSet>
			<FieldLegend>Personal Information</FieldLegend>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="first-name">First name</FieldLabel>
					<Input id="first-name" placeholder="John" />
				</Field>
				<Field>
					<FieldLabel htmlFor="last-name">Last name</FieldLabel>
					<Input id="last-name" placeholder="Doe" />
				</Field>
				<Field>
					<FieldLabel htmlFor="bio">Bio</FieldLabel>
					<Textarea id="bio" placeholder="Tell us about yourself" />
					<FieldDescription>Max 500 characters.</FieldDescription>
				</Field>
			</FieldGroup>
		</FieldSet>
	),
}

export const WithSeparator: Story = {
	render: () => (
		<FieldSet>
			<FieldLegend>Settings</FieldLegend>
			<FieldGroup>
				<Field orientation="horizontal">
					<FieldContent>
						<FieldTitle>Notifications</FieldTitle>
						<FieldDescription>Receive push notifications.</FieldDescription>
					</FieldContent>
					<Switch />
				</Field>
				<FieldSeparator />
				<Field orientation="horizontal">
					<FieldContent>
						<FieldTitle>Dark mode</FieldTitle>
						<FieldDescription>Toggle dark mode theme.</FieldDescription>
					</FieldContent>
					<Switch />
				</Field>
				<FieldSeparator>or</FieldSeparator>
				<Field orientation="horizontal">
					<Checkbox id="auto-theme" />
					<FieldContent>
						<FieldTitle>Use system theme</FieldTitle>
						<FieldDescription>Automatically match your OS setting.</FieldDescription>
					</FieldContent>
				</Field>
			</FieldGroup>
		</FieldSet>
	),
}

export const LegendVariants: Story = {
	render: () => (
		<div className="space-y-6">
			<FieldSet>
				<FieldLegend variant="legend">Legend variant (default)</FieldLegend>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="l1">Field</FieldLabel>
						<Input id="l1" />
					</Field>
				</FieldGroup>
			</FieldSet>
			<FieldSet>
				<FieldLegend variant="label">Label variant</FieldLegend>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="l2">Field</FieldLabel>
						<Input id="l2" />
					</Field>
				</FieldGroup>
			</FieldSet>
		</div>
	),
}
