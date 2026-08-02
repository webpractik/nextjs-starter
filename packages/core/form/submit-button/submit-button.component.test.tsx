import type { ReactNode } from 'react'

import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { z } from 'zod'

import { useAppForm } from '../form'

interface SubmitButtonDemoProps {
    children?: ReactNode
    disableUntilValid?: boolean
    disabled?: boolean
    initialName?: string
    onSubmit?: () => Promise<void> | void
}

function SubmitButtonDemo({
    children = 'Save',
    disableUntilValid,
    disabled,
    initialName = '',
    onSubmit,
}: SubmitButtonDemoProps) {
    const form = useAppForm({
        defaultValues: { name: initialName },
        onSubmit: async () => {
            await onSubmit?.()
        },
        validators: {
            onChange: z.object({ name: z.string().min(1, 'Required') }),
        },
    })

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
                void form.handleSubmit()
            }}
        >
            <form.AppField name="name">{(field) => <field.TextField label="Name" />}</form.AppField>
            <form.AppForm>
                <form.SubmitButton disabled={disabled} disableUntilValid={disableUntilValid}>
                    {children}
                </form.SubmitButton>
            </form.AppForm>
        </form>
    )
}

it('по умолчанию блокирует кнопку отправки, когда форма не готова', async () => {
    const screen = await render(<SubmitButtonDemo />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    const button = screen.getByRole('button', { name: 'Save' })

    await input.fill('Ready')
    await input.fill('')

    await expect.element(button).toHaveAttribute('type', 'submit')
    await expect.element(button).toBeDisabled()
})

it('оставляет кнопку доступной без блокировки по валидности, но не обходит проверку формы', async () => {
    const onSubmit = vi.fn()
    const screen = await render(<SubmitButtonDemo disableUntilValid={false} onSubmit={onSubmit} />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    const button = screen.getByRole('button', { name: 'Save' })

    await input.fill('Ready')
    await input.fill('')

    await expect.element(button).toBeEnabled()
    await button.click()

    expect(onSubmit).not.toHaveBeenCalled()
    await expect.element(screen.getByText('Required')).toBeVisible()
})

it('сохраняет явную блокировку даже для валидной формы', async () => {
    const screen = await render(<SubmitButtonDemo disabled initialName="Ready" />)

    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
})

it('блокирует кнопку на время асинхронной отправки и включает после завершения', async () => {
    let resolveSubmission: (() => void) | undefined
    const submission = new Promise<void>((resolve) => {
        resolveSubmission = resolve
    })
    const onSubmit = vi.fn<() => Promise<void>>(() => submission)
    const screen = await render(<SubmitButtonDemo initialName="Ready" onSubmit={onSubmit} />)
    const button = screen.getByRole('button', { name: 'Save' })

    await button.click()

    await expect.poll(() => onSubmit).toHaveBeenCalledOnce()
    await expect.element(button).toBeDisabled()

    resolveSubmission?.()

    await expect.element(button).toBeEnabled()
})
