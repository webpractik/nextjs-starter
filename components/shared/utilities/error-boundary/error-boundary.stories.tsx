import { Meta, StoryObj } from '@storybook/react';
import { noop } from 'lodash';

import { ErrorBoundary, ErrorFallback } from './error-boundary';

const meta: Meta<typeof ErrorBoundary> = {
    title: 'shared/utilities/ErrorBoundary',
    component: ErrorBoundary,
};

export default meta;

type Story = StoryObj<typeof ErrorBoundary>;

export const Primary: Story = {
    args: {},
    render: () => <ErrorFallback error={{ message: 'Example error message' }} resetError={noop} />,
};
