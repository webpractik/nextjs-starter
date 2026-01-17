import type { Meta, StoryObj } from '@storybook/react'
import { HelpCircleIcon, InfoIcon, PlusIcon } from 'lucide-react'

import { Button } from '../button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

const meta: Meta<typeof Tooltip> = {
	component: Tooltip,
	title: 'core/Tooltip',
}

export default meta

type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger render={<Button variant="outline" />}>Hover me</TooltipTrigger>
			<TooltipContent>This is a tooltip</TooltipContent>
		</Tooltip>
	),
}

export const Top: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger render={<Button variant="outline" />}>Top</TooltipTrigger>
			<TooltipContent side="top">Tooltip on top</TooltipContent>
		</Tooltip>
	),
}

export const Bottom: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger render={<Button variant="outline" />}>Bottom</TooltipTrigger>
			<TooltipContent side="bottom">Tooltip on bottom</TooltipContent>
		</Tooltip>
	),
}

export const Left: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger render={<Button variant="outline" />}>Left</TooltipTrigger>
			<TooltipContent side="left">Tooltip on left</TooltipContent>
		</Tooltip>
	),
}

export const Right: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger render={<Button variant="outline" />}>Right</TooltipTrigger>
			<TooltipContent side="right">Tooltip on right</TooltipContent>
		</Tooltip>
	),
}

export const WithIcon: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<span>Need help?</span>
			<Tooltip>
				<TooltipTrigger render={(
					<HelpCircleIcon className="size-4 cursor-help text-muted-foreground" />
				)}
				/>
				<TooltipContent>Click here for more information</TooltipContent>
			</Tooltip>
		</div>
	),
}

export const OnIconButton: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger
				render={<Button variant="outline" size="icon" aria-label="Add item" />}
			>
				<PlusIcon />
			</TooltipTrigger>
			<TooltipContent>Add new item</TooltipContent>
		</Tooltip>
	),
}

export const AllSides: Story = {
	render: () => (
		<div className="flex items-center justify-center gap-4 p-20">
			<Tooltip>
				<TooltipTrigger render={<Button variant="outline" />}>Top</TooltipTrigger>
				<TooltipContent side="top">Top tooltip</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger render={<Button variant="outline" />}>Right</TooltipTrigger>
				<TooltipContent side="right">Right tooltip</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger render={<Button variant="outline" />}>Bottom</TooltipTrigger>
				<TooltipContent side="bottom">Bottom tooltip</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger render={<Button variant="outline" />}>Left</TooltipTrigger>
				<TooltipContent side="left">Left tooltip</TooltipContent>
			</Tooltip>
		</div>
	),
}

export const WithLongContent: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger render={<Button variant="outline" />}>
				<InfoIcon className="mr-2 size-4" />
				Info
			</TooltipTrigger>
			<TooltipContent className="max-w-xs">
				This is a tooltip with longer content. It can contain more detailed information about the
				element being hovered.
			</TooltipContent>
		</Tooltip>
	),
}

export const WithOffset: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger render={<Button variant="outline" />}>With Offset</TooltipTrigger>
			<TooltipContent sideOffset={16}>Tooltip with 16px offset</TooltipContent>
		</Tooltip>
	),
}
