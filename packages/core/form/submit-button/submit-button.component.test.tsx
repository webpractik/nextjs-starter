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

it('uses submit type and disables when canSubmit is false by default', async () => {
    const screen = await render(<SubmitButtonDemo />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    const button = screen.getByRole('button', { name: 'Save' })

    await input.fill('Ready')
    await input.fill('')

    await expect.element(button).toHaveAttribute('type', 'submit')
    await expect.element(button).toBeDisabled()
})

it('allows submission before validation when disableUntilValid is false', async () => {
    const screen = await render(<SubmitButtonDemo disableUntilValid={false} />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    const button = screen.getByRole('button', { name: 'Save' })

    await input.fill('Ready')
    await input.fill('')

    await expect.element(button).toBeEnabled()
})

it('preserves an explicit disabled prop', async () => {
    const screen = await render(<SubmitButtonDemo disabled initialName="Ready" />)

    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
})

it('disables while the form submission is in progress', async () => {
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
