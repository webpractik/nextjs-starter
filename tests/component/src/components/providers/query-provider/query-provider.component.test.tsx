import { useQuery } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { QueryProvider } from '#/components/providers/query-provider'

it('предоставляет общий кэш запросов дочерним потребителям', async () => {
    const queryFn = vi.fn(async () => 'Проект загружен')
    const queryKey = ['query-provider-test', crypto.randomUUID()]

    function Consumer() {
        const query = useQuery({ queryFn, queryKey })

        return <p>{query.data ?? 'Загрузка'}</p>
    }

    const screen = await render(
        <QueryProvider>
            <Consumer />
            <Consumer />
        </QueryProvider>,
    )
    await expect.poll(() => screen.getByText('Проект загружен').elements()).toHaveLength(2)
    expect(queryFn).toHaveBeenCalledTimes(1)
})
