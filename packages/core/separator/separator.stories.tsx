import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Separator } from './separator'

const meta = {
    component: Separator,
    title: 'core/Separator',
    argTypes: {
        orientation: {
            control: 'select',
            options: ['horizontal', 'vertical'],
        },
    },
} satisfies Meta<typeof Separator>

export default meta

type Story = StoryObj<typeof Separator>

export const Horizontal: Story = {
    args: {
        orientation: 'horizontal',
    },
    decorators: [
        (Story) => (
            <div className="w-64">
                <Story />
            </div>
        ),
    ],
}

export const Vertical: Story = {
    args: {
        orientation: 'vertical',
    },
    decorators: [
        (Story) => (
            <div className="flex h-16 items-center">
                <Story />
            </div>
        ),
    ],
}

export const BetweenText: Story = {
    render: () => (
        <div className="w-64 space-y-4">
            <p className="text-sm">Раздел выше</p>
            <Separator />
            <p className="text-sm">Раздел ниже</p>
        </div>
    ),
}

export const VerticalBetweenItems: Story = {
    render: () => (
        <div className="flex h-5 items-center gap-4 text-sm">
            <span>Элемент 1</span>
            <Separator orientation="vertical" />
            <span>Элемент 2</span>
            <Separator orientation="vertical" />
            <span>Элемент 3</span>
        </div>
    ),
}
