import { useForm } from '@tanstack/react-form'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { RadioGroupField, SelectField, SliderField } from '.'
import { fieldContext } from '../form-context'

const stackOptions = [
    { label: 'TanStack Start', value: 'start' },
    { label: 'TanStack Query', value: 'query' },
] as const

const channelOptions = [
    { description: 'Send updates by email.', label: 'Email alerts', value: 'email' },
    { description: 'Send updates by text.', label: 'SMS alerts', value: 'sms' },
] as const

interface CompositeFieldsDemoProps {
    onSelectOpenChange: (_open: boolean) => void
    onSliderCommit: (_value: number | readonly number[]) => void
}

function CompositeFieldsDemo({ onSelectOpenChange, onSliderCommit }: CompositeFieldsDemoProps) {
    const form = useForm({
        defaultValues: {
            channel: 'email',
            confidence: 40,
            confidenceRange: [20, 80] as readonly number[],
            stack: 'start',
        },
    })

    return (
        <>
            <form.Field name="stack">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <SelectField
                            description="Choose the primary library."
                            label="Stack"
                            onOpenChange={onSelectOpenChange}
                            options={stackOptions}
                        />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="channel">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <RadioGroupField label="Notification channel" options={channelOptions} />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="confidence">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <SliderField
                            description="Overall delivery confidence."
                            label="Confidence"
                            onValueCommitted={onSliderCommit}
                        />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="confidenceRange">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <SliderField
                            formatValue={(value) =>
                                Array.isArray(value) ? value.join(' to ') : String(value)
                            }
                            getThumbLabel={(index) =>
                                index === 0 ? 'Minimum confidence' : 'Maximum confidence'
                            }
                            label="Confidence range"
                        />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                    <output aria-label="Composite values">{JSON.stringify(values)}</output>
                )}
            </form.Subscribe>
        </>
    )
}

it('обновляет select и radio, сохраняет callback закрытия и помечает поля затронутыми', async () => {
    const onSelectOpenChange = vi.fn<(_open: boolean) => void>()
    const screen = await render(
        <CompositeFieldsDemo
            onSelectOpenChange={onSelectOpenChange}
            onSliderCommit={() => undefined}
        />,
    )
    const select = screen.getByRole('combobox', { name: 'Stack' })
    const radioGroup = screen.getByRole('radiogroup', { name: 'Notification channel' })

    await expect.element(select).toHaveAccessibleDescription('Choose the primary library.')
    await select.click()
    await screen.getByRole('option', { name: 'TanStack Query' }).click()

    expect(onSelectOpenChange).toHaveBeenCalledWith(false, expect.anything())
    expect(select.element().closest('[data-slot="field"]')).toHaveAttribute('data-touched', 'true')

    await screen.getByRole('radio', { name: 'SMS alerts' }).click()

    expect(radioGroup.element().closest('[data-slot="field"]')).toHaveAttribute(
        'data-touched',
        'true',
    )
    await expect
        .element(screen.getByRole('status', { name: 'Composite values' }))
        .toHaveTextContent('"stack":"query"')
    await expect
        .element(screen.getByRole('status', { name: 'Composite values' }))
        .toHaveTextContent('"channel":"sms"')
})

it('обновляет scalar и range ползунки, подписи и состояние формы после commit', async () => {
    const onSliderCommit = vi.fn<(_value: number | readonly number[]) => void>()
    const screen = await render(
        <CompositeFieldsDemo
            onSelectOpenChange={() => undefined}
            onSliderCommit={onSliderCommit}
        />,
    )
    const scalar = screen.getByRole('slider', { exact: true, name: 'Confidence' })
    const minimum = screen.getByRole('slider', { name: 'Minimum confidence' })
    const maximum = screen.getByRole('slider', { name: 'Maximum confidence' })

    await expect.element(scalar).toHaveValue('40')
    await expect.element(scalar).toHaveAccessibleDescription('Overall delivery confidence.')
    await expect.element(minimum).toHaveValue('20')
    await expect.element(maximum).toHaveValue('80')
    await expect.element(screen.getByText('20 to 80')).toBeVisible()

    scalar.element().focus()
    await userEvent.keyboard('{ArrowRight}')

    await expect.element(scalar).toHaveValue('41')
    expect(onSliderCommit).toHaveBeenCalledWith(41, expect.anything())
    expect(scalar.element().closest('[data-slot="field"]')).toHaveAttribute('data-touched', 'true')

    maximum.element().focus()
    await userEvent.keyboard('{ArrowRight}')

    await expect.element(maximum).toHaveValue('81')
    await expect.element(screen.getByText('20 to 81')).toBeVisible()
    await expect
        .element(screen.getByRole('status', { name: 'Composite values' }))
        .toHaveTextContent('"confidence":41')
    await expect
        .element(screen.getByRole('status', { name: 'Composite values' }))
        .toHaveTextContent('"confidenceRange":[20,81]')
})

it('оставляет выступающие края ползунка видимыми и доступными для указателя', async () => {
    const screen = await render(
        <CompositeFieldsDemo
            onSelectOpenChange={() => undefined}
            onSliderCommit={() => undefined}
        />,
    )
    const slider = screen.getByRole('slider', { exact: true, name: 'Confidence' })
    const thumb = slider.element().closest<HTMLElement>('[data-slot="slider-thumb"]')

    if (!thumb) throw new Error('Визуальный ползунок не найден')

    const bounds = thumb.getBoundingClientRect()
    const upperEdgeTarget = document.elementFromPoint(
        bounds.left + bounds.width / 2,
        bounds.top + 1,
    )
    const lowerEdgeTarget = document.elementFromPoint(
        bounds.left + bounds.width / 2,
        bounds.bottom - 1,
    )

    expect(thumb.contains(upperEdgeTarget)).toBe(true)
    expect(thumb.contains(lowerEdgeTarget)).toBe(true)
})
