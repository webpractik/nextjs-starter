import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '../button'
import { Toaster } from './toast'
import { toast } from './toast-manager'

const meta: Meta<typeof Toaster> = {
    component: Toaster,
    decorators: [
        (Story) => (
            <>
                <Story />
                <Toaster />
            </>
        ),
    ],
    title: 'core/Toast',
}

export default meta

type Story = StoryObj<typeof Toaster>

export const Default: Story = {
    render: () => (
        <Button onClick={() => toast.add({ title: 'Workspace saved' })}>Show toast</Button>
    ),
}

export const Statuses: Story = {
    render: () => (
        <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast.add({ title: 'Changes saved', type: 'success' })}>
                Success
            </Button>
            <Button onClick={() => toast.add({ title: 'New version available', type: 'info' })}>
                Info
            </Button>
            <Button
                onClick={() => toast.add({ title: 'Check the imported values', type: 'warning' })}
                variant="outline"
            >
                Warning
            </Button>
            <Button
                onClick={() => toast.add({ title: 'Could not save changes', type: 'error' })}
                variant="destructive"
            >
                Error
            </Button>
            <Button onClick={() => toast.add({ title: 'Uploading report', type: 'loading' })}>
                Loading
            </Button>
        </div>
    ),
}

export const WithDescription: Story = {
    render: () => (
        <Button
            onClick={() =>
                toast.add({
                    description: 'The review is scheduled for Monday at 10:00.',
                    title: 'Event created',
                })
            }
        >
            Show details
        </Button>
    ),
}

export const WithAction: Story = {
    render: () => (
        <Button
            onClick={() =>
                toast.add({
                    actionProps: {
                        children: 'Undo',
                        onClick: () => toast.add({ title: 'File restored', type: 'success' }),
                    },
                    description: 'quarterly-report.pdf',
                    title: 'File deleted',
                })
            }
            variant="outline"
        >
            Delete file
        </Button>
    ),
}

export const PromiseLifecycle: Story = {
    render: () => (
        <Button
            onClick={() => {
                const upload = new Promise<string>((resolve) => {
                    setTimeout(resolve, 1500, 'quarterly-report.pdf')
                })

                void toast.promise(upload, {
                    error: 'Upload failed',
                    loading: 'Uploading report',
                    success: (filename) => `Uploaded ${filename}`,
                })
            }}
        >
            Upload report
        </Button>
    ),
}

export const Persistent: Story = {
    render: () => (
        <Button
            onClick={() =>
                toast.add({
                    description: 'Close this notification manually.',
                    timeout: 0,
                    title: 'Persistent notification',
                })
            }
        >
            Show persistent toast
        </Button>
    ),
}

export const Stacking: Story = {
    render: () => (
        <Button
            onClick={() => {
                toast.add({ title: 'Profile updated', type: 'success' })
                toast.add({ title: 'Team invited', type: 'info' })
                toast.add({ title: 'Report queued', type: 'loading' })
            }}
        >
            Show stack
        </Button>
    ),
}
