import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { QueryProvider } from '#/components/providers/query-provider'
import { Button } from '#/components/ui/button'

function QueryConsumer() {
    const queryClient = useQueryClient()
    const query = useQuery({
        queryFn: async () => 'Данные доступны через QueryProvider',
        queryKey: ['storybook', 'query-provider'],
    })

    return (
        <div className="space-y-3">
            <p role="status">{query.data ?? 'Загрузка данных…'}</p>
            <Button
                onClick={() => {
                    queryClient.setQueryData(
                        ['storybook', 'query-provider'],
                        'Кэш обновлён через QueryProvider',
                    )
                }}
            >
                Обновить кэш
            </Button>
        </div>
    )
}

const meta = {
    component: QueryProvider,
    title: 'providers/QueryProvider',
    render: () => (
        <QueryProvider>
            <QueryConsumer />
        </QueryProvider>
    ),
} satisfies Meta<typeof QueryProvider>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { children: null } }
