import type { Meta, StoryObj } from '@storybook/nextjs';

import { noop } from 'lodash-es';

import { ErrorBoundary, ErrorFallback } from './error-boundary';

const meta: Meta<typeof ErrorBoundary> = {
    component: ErrorBoundary,
    title: 'shared/utilities/ErrorBoundary',
};

export default meta;

type Story = StoryObj<typeof ErrorBoundary>;

const message = { message: 'Example error message' };

export const Primary: Story = {
    args: {},
    render: () => <ErrorFallback error={message} resetError={noop} />,
};
