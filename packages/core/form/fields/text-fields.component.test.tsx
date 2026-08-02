import { useForm } from '@tanstack/react-form'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { NumberField, TextareaField, TextField } from '.'
import { fieldContext } from '../form-context'

function TextFieldsDemo({ onNameBlur }: { onNameBlur: () => void }) {
    const form = useForm({
        defaultValues: {
            budgetInCents: 125,
            projectName: 'Initial project',
            seats: 2 as number | undefined,
            summary: 'Initial summary',
        },
    })

    return (
        <>
            <form.Field
                name="projectName"
                validators={{
                    onBlur: ({ value }) =>
                        value.length >= 3 ? undefined : 'Use at least three characters',
                }}
            >
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <TextField
                            description="Shown in project lists."
                            label="Project name"
                            onBlur={onNameBlur}
                        />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="summary">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <TextareaField label="Summary" />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="seats">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <NumberField label="Seats" />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="budgetInCents">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <NumberField
                            format={(value) =>
                                typeof value === 'number' ? String(value / 100) : ''
                            }
                            label="Budget"
                            parse={(value) => Number(value) * 100}
                            step="0.01"
                        />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <button
                type="button"
                onClick={() => form.setFieldValue('projectName', 'External name')}
            >
                Set external name
            </button>
            <button type="button" onClick={() => form.setFieldValue('summary', 'External summary')}>
                Set external summary
            </button>

            <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                    <>
                        <output aria-label="Seats value">{String(values.seats)}</output>
                        <output aria-label="Budget value">{String(values.budgetInCents)}</output>
                    </>
                )}
            </form.Subscribe>
        </>
    )
}

it('синхронизирует текстовое поле с внешним состоянием и показывает ошибку после потери фокуса', async () => {
    const onNameBlur = vi.fn()
    const screen = await render(<TextFieldsDemo onNameBlur={onNameBlur} />)
    const input = screen.getByRole('textbox', { name: 'Project name' })

    await expect.element(input).toHaveValue('Initial project')
    await input.fill('Edited project')
    await expect.element(input).toHaveValue('Edited project')

    await screen.getByRole('button', { name: 'Set external name' }).click()
    await expect.element(input).toHaveValue('External name')
    onNameBlur.mockClear()

    await input.fill('')
    await userEvent.tab()

    expect(onNameBlur).toHaveBeenCalledOnce()
    await expect
        .element(screen.getByRole('alert'))
        .toHaveTextContent('Use at least three characters')
    await expect.element(input).toHaveAttribute('aria-invalid', 'true')
})

it('синхронизирует textarea с пользовательскими и внешними обновлениями', async () => {
    const screen = await render(<TextFieldsDemo onNameBlur={() => undefined} />)
    const textarea = screen.getByRole('textbox', { name: 'Summary' })

    await expect.element(textarea).toHaveValue('Initial summary')
    await textarea.fill('Edited summary')
    await expect.element(textarea).toHaveValue('Edited summary')

    await screen.getByRole('button', { name: 'Set external summary' }).click()
    await expect.element(textarea).toHaveValue('External summary')
})

it('преобразует пустое число в undefined и применяет пользовательские parse и format', async () => {
    const screen = await render(<TextFieldsDemo onNameBlur={() => undefined} />)
    const seats = screen.getByRole('spinbutton', { name: 'Seats' })
    const budget = screen.getByRole('spinbutton', { name: 'Budget' })

    await expect.element(seats).toHaveValue(2)
    await seats.fill('')
    await expect
        .element(screen.getByRole('status', { name: 'Seats value' }))
        .toHaveTextContent('undefined')

    await expect.element(budget).toHaveValue(1.25)
    await budget.fill('2.5')
    await expect
        .element(screen.getByRole('status', { name: 'Budget value' }))
        .toHaveTextContent('250')
})
