import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '../button'
import { Input } from '../input'
import { Label } from '../label'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './dialog'

const meta: Meta<typeof Dialog> = {
	component: Dialog,
	title: 'core/Dialog',
}

export default meta

type Story = StoryObj<typeof Dialog>

export const Default: Story = {
	render: () => (
		<Dialog>
			<DialogTrigger render={<Button />}>Open Dialog</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Dialog Title</DialogTitle>
					<DialogDescription>
						This is a dialog description. It can contain more details about the dialog content.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<p>Dialog content goes here.</p>
				</div>
				<DialogFooter>
					<Button>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
}

export const WithForm: Story = {
	render: () => (
		<Dialog>
			<DialogTrigger render={<Button />}>Edit Profile</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Profile</DialogTitle>
					<DialogDescription>
						Make changes to your profile here. Click save when you're done.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="name">Name</Label>
						<Input id="name" defaultValue="Pavel Durov" />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="username">Username</Label>
						<Input id="username" defaultValue="@durov" />
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline">Cancel</Button>
					<Button>Save changes</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
}

export const Confirmation: Story = {
	render: () => (
		<Dialog>
			<DialogTrigger render={<Button variant="destructive" />}>Delete Account</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Are you sure?</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This will permanently delete your account and remove your
						data from our servers.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline">Cancel</Button>
					<Button variant="destructive">Delete</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
}

export const WithoutCloseButton: Story = {
	render: () => (
		<Dialog>
			<DialogTrigger render={<Button />}>Open Dialog</DialogTrigger>
			<DialogContent className="sm:max-w-md" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>No Close Button</DialogTitle>
					<DialogDescription>
						This dialog doesn't have a close button in the corner.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter showCloseButton>
					<Button>Confirm</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
}

export const LongContent: Story = {
	render: () => (
		<Dialog>
			<DialogTrigger render={<Button />}>Open Long Dialog</DialogTrigger>
			<DialogContent className="
     max-h-[80vh] overflow-y-auto
     sm:max-w-lg
   "
			>
				<DialogHeader>
					<DialogTitle>Terms of Service</DialogTitle>
					<DialogDescription>Please read and accept our terms.</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					{Array.from({ length: 10 }).map((_, i) => (
						<p key={i}>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
							incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
							exercitation ullamco laboris.
						</p>
					))}
				</div>
				<DialogFooter>
					<Button variant="outline">Decline</Button>
					<Button>Accept</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
}
