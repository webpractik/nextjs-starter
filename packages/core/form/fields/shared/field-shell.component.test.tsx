import type { AnyFieldApi } from '@tanstack/react-form'

import { useState } from 'react'
import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { ChoiceFieldShell, FieldShell } from './field-shell'

interface FieldMeta {
    errors: unknown[]
    isDirty: boolean
    isTouched: boolean
}

function fieldWithMeta(meta: FieldMeta, name = 'projectName') {
    return {
        name,
        state: {
            meta,
        },
    } as unknown as AnyFieldApi
}

function TextFieldShellDemo() {
    const [showErrors, setShowErrors] = useState(true)
    const field = fieldWithMeta({
        errors: showErrors ? ['Required', [{ message: 'Use at least three characters' }]] : [],
        isDirty: true,
        isTouched: true,
    })

    return (
        <>
            <FieldShell description="Shown in project lists." field={field} label="Project name">
                {(controlProps) => <input {...controlProps} />}
            </FieldShell>
            <button type="button" onClick={() => setShowErrors(false)}>
                Clear errors
            </button>
        </>
    )
}

it('associates one alert, description, and metadata with a stable text control', async () => {
    const screen = await render(<TextFieldShellDemo />)
    const control = screen.getByRole('textbox', { name: 'Project name' })
    const label = screen.getByText('Project name')
    const description = screen.getByText('Shown in project lists.')
    const alert = screen.getByRole('alert')
    const field = screen.getByRole('group')
    const initialControlId = control.element().id

    expect(initialControlId).not.toBe('')
    expect(label.element()).toHaveAttribute('for', initialControlId)
    expect(control.element()).toHaveAttribute('aria-labelledby', label.element().id)
    expect(control.element().getAttribute('aria-describedby')?.split(' ')).toEqual([
        description.element().id,
        alert.element().id,
    ])
    await expect.element(alert).toHaveTextContent('Required')
    await expect.element(alert).toHaveTextContent('Use at least three characters')
    await expect.element(field).toHaveAttribute('data-invalid', 'true')
    await expect.element(field).toHaveAttribute('data-touched', 'true')
    await expect.element(field).toHaveAttribute('data-dirty', 'true')

    await screen.getByRole('button', { name: 'Clear errors' }).click()

    expect(control.element().id).toBe(initialControlId)
    expect(control.element()).toHaveAttribute('aria-describedby', description.element().id)
    await expect.element(control).toHaveAttribute('aria-invalid', 'false')
    await expect.element(screen.getByRole('alert')).not.toBeInTheDocument()
})

it('associates a choice label and description with its control', async () => {
    const fieldApi = fieldWithMeta(
        {
            errors: [],
            isDirty: false,
            isTouched: true,
        },
        'acceptsTerms',
    )
    const screen = await render(
        <ChoiceFieldShell
            description="Required before submitting."
            field={fieldApi}
            label="Accept terms"
        >
            {(controlProps) => <input {...controlProps} type="checkbox" />}
        </ChoiceFieldShell>,
    )
    const control = screen.getByRole('checkbox', { name: 'Accept terms' })
    const label = screen.getByText('Accept terms')
    const description = screen.getByText('Required before submitting.')
    const field = screen.getByRole('group')

    expect(label.element()).toHaveAttribute('for', control.element().id)
    expect(control.element()).toHaveAttribute('aria-labelledby', label.element().id)
    expect(control.element()).toHaveAttribute('aria-describedby', description.element().id)
    await expect.element(field).toHaveAttribute('data-invalid', 'false')
    await expect.element(field).toHaveAttribute('data-touched', 'true')
    await expect.element(field).toHaveAttribute('data-dirty', 'false')
})
