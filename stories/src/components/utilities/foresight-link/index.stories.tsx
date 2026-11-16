import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ForesightLink } from '../../../../../src/components/utilities/foresight-link'

const meta = {
    component: ForesightLink,
    title: 'utilities/ForesightLink',
    parameters: { nextjs: { appDirectory: true } },
    args: { href: '/', children: 'На главную' },
} satisfies Meta<typeof ForesightLink>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithoutPrefetch: Story = { args: { prefetch: false } }
