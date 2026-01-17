import type { Meta, StoryObj } from '@storybook/react'
import { BellIcon, SettingsIcon, UserIcon } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta: Meta<typeof Tabs> = {
	component: Tabs,
	title: 'core/Tabs',
	argTypes: {
		orientation: {
			control: 'select',
			options: ['horizontal', 'vertical'],
		},
	},
}

export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {
	render: () => (
		<Tabs defaultValue="account">
			<TabsList>
				<TabsTrigger value="account">Account</TabsTrigger>
				<TabsTrigger value="password">Password</TabsTrigger>
				<TabsTrigger value="settings">Settings</TabsTrigger>
			</TabsList>
			<TabsContent value="account">
				<p className="text-muted-foreground">Manage your account settings and preferences.</p>
			</TabsContent>
			<TabsContent value="password">
				<p className="text-muted-foreground">Change your password and security settings.</p>
			</TabsContent>
			<TabsContent value="settings">
				<p className="text-muted-foreground">Configure application settings.</p>
			</TabsContent>
		</Tabs>
	),
}

export const LineVariant: Story = {
	render: () => (
		<Tabs defaultValue="overview">
			<TabsList variant="line">
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="analytics">Analytics</TabsTrigger>
				<TabsTrigger value="reports">Reports</TabsTrigger>
			</TabsList>
			<TabsContent value="overview">
				<p className="text-muted-foreground">Overview content goes here.</p>
			</TabsContent>
			<TabsContent value="analytics">
				<p className="text-muted-foreground">Analytics content goes here.</p>
			</TabsContent>
			<TabsContent value="reports">
				<p className="text-muted-foreground">Reports content goes here.</p>
			</TabsContent>
		</Tabs>
	),
}

export const Vertical: Story = {
	render: () => (
		<Tabs defaultValue="profile" orientation="vertical">
			<TabsList>
				<TabsTrigger value="profile">Profile</TabsTrigger>
				<TabsTrigger value="account">Account</TabsTrigger>
				<TabsTrigger value="security">Security</TabsTrigger>
				<TabsTrigger value="notifications">Notifications</TabsTrigger>
			</TabsList>
			<TabsContent value="profile" className="px-4">
				<h3 className="font-semibold">Profile Settings</h3>
				<p className="text-muted-foreground">Manage your profile information.</p>
			</TabsContent>
			<TabsContent value="account" className="px-4">
				<h3 className="font-semibold">Account Settings</h3>
				<p className="text-muted-foreground">Manage your account settings.</p>
			</TabsContent>
			<TabsContent value="security" className="px-4">
				<h3 className="font-semibold">Security Settings</h3>
				<p className="text-muted-foreground">Manage your security preferences.</p>
			</TabsContent>
			<TabsContent value="notifications" className="px-4">
				<h3 className="font-semibold">Notification Settings</h3>
				<p className="text-muted-foreground">Manage your notification preferences.</p>
			</TabsContent>
		</Tabs>
	),
}

export const VerticalLine: Story = {
	render: () => (
		<Tabs defaultValue="general" orientation="vertical">
			<TabsList variant="line">
				<TabsTrigger value="general">General</TabsTrigger>
				<TabsTrigger value="appearance">Appearance</TabsTrigger>
				<TabsTrigger value="advanced">Advanced</TabsTrigger>
			</TabsList>
			<TabsContent value="general" className="px-4">
				<p className="text-muted-foreground">General settings content.</p>
			</TabsContent>
			<TabsContent value="appearance" className="px-4">
				<p className="text-muted-foreground">Appearance settings content.</p>
			</TabsContent>
			<TabsContent value="advanced" className="px-4">
				<p className="text-muted-foreground">Advanced settings content.</p>
			</TabsContent>
		</Tabs>
	),
}

export const WithIcons: Story = {
	render: () => (
		<Tabs defaultValue="profile">
			<TabsList>
				<TabsTrigger value="profile">
					<UserIcon />
					Profile
				</TabsTrigger>
				<TabsTrigger value="notifications">
					<BellIcon />
					Notifications
				</TabsTrigger>
				<TabsTrigger value="settings">
					<SettingsIcon />
					Settings
				</TabsTrigger>
			</TabsList>
			<TabsContent value="profile">
				<p className="text-muted-foreground">Profile content.</p>
			</TabsContent>
			<TabsContent value="notifications">
				<p className="text-muted-foreground">Notifications content.</p>
			</TabsContent>
			<TabsContent value="settings">
				<p className="text-muted-foreground">Settings content.</p>
			</TabsContent>
		</Tabs>
	),
}

export const Disabled: Story = {
	render: () => (
		<Tabs defaultValue="active">
			<TabsList>
				<TabsTrigger value="active">Active Tab</TabsTrigger>
				<TabsTrigger value="disabled" disabled>
					Disabled Tab
				</TabsTrigger>
				<TabsTrigger value="another">Another Tab</TabsTrigger>
			</TabsList>
			<TabsContent value="active">
				<p className="text-muted-foreground">Active tab content.</p>
			</TabsContent>
			<TabsContent value="another">
				<p className="text-muted-foreground">Another tab content.</p>
			</TabsContent>
		</Tabs>
	),
}

export const WithRichContent: Story = {
	render: () => (
		<Tabs defaultValue="details" className="w-full max-w-lg">
			<TabsList>
				<TabsTrigger value="details">Details</TabsTrigger>
				<TabsTrigger value="specs">Specifications</TabsTrigger>
				<TabsTrigger value="reviews">Reviews</TabsTrigger>
			</TabsList>
			<TabsContent value="details" className="space-y-4">
				<h3 className="font-semibold">Product Details</h3>
				<p className="text-muted-foreground">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
					ut labore et dolore magna aliqua.
				</p>
			</TabsContent>
			<TabsContent value="specs" className="space-y-4">
				<h3 className="font-semibold">Technical Specifications</h3>
				<ul className="space-y-2 text-muted-foreground">
					<li>Weight: 1.5kg</li>
					<li>Dimensions: 30x20x10cm</li>
					<li>Material: Aluminum</li>
					<li>Color: Space Gray</li>
				</ul>
			</TabsContent>
			<TabsContent value="reviews" className="space-y-4">
				<h3 className="font-semibold">Customer Reviews</h3>
				<p className="text-muted-foreground">4.5 out of 5 stars based on 128 reviews.</p>
			</TabsContent>
		</Tabs>
	),
}
