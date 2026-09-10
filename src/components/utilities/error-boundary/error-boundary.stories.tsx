import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { noop } from 'lodash-es'

import { ErrorBoundary, ErrorFallback } from './error-boundary'

const meta = {
    component: ErrorBoundary,
    title: 'shared/utilities/ErrorBoundary',
} satisfies Meta<typeof ErrorBoundary>

export default meta

type Story = StoryObj<typeof ErrorBoundary>

const message = { message: 'Пример сообщения об ошибке' }

export const Primary: Story = {
    args: {},
    render: () => <ErrorFallback error={message} resetError={noop} />,
}
