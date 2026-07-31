import type { FocusEvent } from 'react'

import { useForm } from '@tanstack/react-form'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { DateField, PhoneField } from '.'
import { fieldContext } from '../form-context'

const configuredDateOptions = {
    locale: 'en-US',
    max: new Date(2030, 11, 31),
    min: new Date(2020, 0, 1),
}

function DateFieldsDemo({
    onRequiredDateBlur,
}: {
    onRequiredDateBlur: (_event: FocusEvent<HTMLInputElement>) => void
}) {
    const form = useForm({
        defaultValues: {
            configuredDate: '',
            disabledDate: '01.01.2020',
            pastedDate: '',
            requiredDate: '',
            typedDate: '',
        },
    })

    return (
        <>
            <form.Field name="typedDate">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <DateField label="Typed date" />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="pastedDate">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <DateField label="Pasted date" />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="configuredDate">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <DateField dateOptions={configuredDateOptions} label="Configured date" />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field
                name="requiredDate"
                validators={{
                    onBlur: ({ value }) =>
                        value === '31.12.2026' ? undefined : 'Enter a complete date',
                }}
            >
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <DateField
                            description="Use eight digits."
                            label="Required date"
                            onBlur={onRequiredDateBlur}
                        />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="disabledDate">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <DateField disabled label="Disabled date" />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <button type="button" onClick={() => form.setFieldValue('typedDate', '15.01.2027')}>
                Set external date
            </button>

            <input aria-label="Date clipboard source" defaultValue="01022027" />

            <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                    <>
                        <output aria-label="Typed date value">{values.typedDate}</output>
                        <output aria-label="Pasted date value">{values.pastedDate}</output>
                    </>
                )}
            </form.Subscribe>
        </>
    )
}

it('formats typed and pasted dates while keeping masked strings controlled', async () => {
    const screen = await render(<DateFieldsDemo onRequiredDateBlur={() => undefined} />)
    const typedDate = screen.getByRole('textbox', { name: 'Typed date' })
    const pastedDate = screen.getByRole('textbox', { name: 'Pasted date' })
    const clipboardSource = screen.getByRole('textbox', { name: 'Date clipboard source' })

    await userEvent.type(typedDate, '31122026')
    await expect.element(typedDate).toHaveValue('31.12.2026')
    await expect
        .element(screen.getByRole('status', { name: 'Typed date value' }))
        .toHaveTextContent('31.12.2026')

    await clipboardSource.click()
    await userEvent.keyboard('{Control>}a{/Control}')
    await userEvent.copy()
    await pastedDate.click()
    await userEvent.paste()
    await expect.element(pastedDate).toHaveValue('01.02.2027')
    await expect
        .element(screen.getByRole('status', { name: 'Pasted date value' }))
        .toHaveTextContent('01.02.2027')

    await screen.getByRole('button', { name: 'Set external date' }).click()
    await expect.element(typedDate).toHaveValue('15.01.2027')
})

it('honors locale and bounds and exposes blur validation and disabled metadata', async () => {
    let touchedDuringBlur: string | null = null
    const onRequiredDateBlur = vi.fn((event: FocusEvent<HTMLInputElement>) => {
        touchedDuringBlur =
            event.currentTarget.closest('[data-slot="field"]')?.getAttribute('data-touched') ?? null
    })
    const screen = await render(<DateFieldsDemo onRequiredDateBlur={onRequiredDateBlur} />)
    const configuredDate = screen.getByRole('textbox', { name: 'Configured date' })
    const requiredDate = screen.getByRole('textbox', { name: 'Required date' })
    const disabledDate = screen.getByRole('textbox', { name: 'Disabled date' })

    await userEvent.type(configuredDate, '12312019')
    await expect.element(configuredDate).toHaveValue('01/01/2020')
    await configuredDate.clear()
    await userEvent.type(configuredDate, '12312031')
    await expect.element(configuredDate).toHaveValue('12/31/2030')

    await requiredDate.click()
    await userEvent.tab()

    expect(onRequiredDateBlur).toHaveBeenCalledOnce()
    expect(touchedDuringBlur).toBe('false')

    const requiredField = requiredDate.element().closest('[data-slot="field"]')
    await expect.poll(() => requiredField?.getAttribute('data-touched')).toBe('true')

    const description = screen.getByText('Use eight digits.')
    const error = screen.getByRole('alert')
    const describedBy = requiredDate.element().getAttribute('aria-describedby')

    await expect.element(error).toHaveTextContent('Enter a complete date')
    await expect.element(requiredDate).toHaveAttribute('aria-invalid', 'true')
    expect(describedBy).toContain(description.element().id)
    expect(describedBy).toContain(error.element().id)

    await expect.element(disabledDate).toBeDisabled()
    await expect.element(disabledDate).toHaveAttribute('inputmode', 'numeric')
    expect(disabledDate.element().closest('[data-slot="field"]')).toHaveAttribute(
        'data-disabled',
        'true',
    )
})

const nationalUsPhoneOptions = {
    countryIsoCode: 'US',
    format: 'NATIONAL',
    strict: true,
} as const

function PhoneFieldsDemo({
    onRequiredPhoneBlur,
}: {
    onRequiredPhoneBlur: (_event: FocusEvent<HTMLInputElement>) => void
}) {
    const form = useForm({
        defaultValues: {
            disabledPhone: '+7 999 123-45-67',
            requiredPhone: '',
            russianPhone: '+7 ',
            usPhone: '',
        },
    })

    return (
        <>
            <form.Field name="russianPhone">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <PhoneField label="Russian phone" />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="usPhone">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <PhoneField
                            label="US national phone"
                            phoneOptions={nationalUsPhoneOptions}
                        />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field
                name="requiredPhone"
                validators={{
                    onBlur: ({ value }) =>
                        value === '+7 999 123-45-67' ? undefined : 'Enter a complete phone',
                }}
            >
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <PhoneField
                            description="Include all ten national digits."
                            label="Required phone"
                            onBlur={onRequiredPhoneBlur}
                        />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="disabledPhone">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <PhoneField disabled label="Disabled phone" />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <button
                type="button"
                onClick={() => form.setFieldValue('russianPhone', '+7 912 345-67-89')}
            >
                Set external phone
            </button>

            <form.Subscribe selector={(state) => state.values.russianPhone}>
                {(russianPhone) => <output aria-label="Russian phone value">{russianPhone}</output>}
            </form.Subscribe>
        </>
    )
}

it('formats a strict Russian phone while keeping its masked string controlled', async () => {
    const screen = await render(<PhoneFieldsDemo onRequiredPhoneBlur={() => undefined} />)
    const russianPhone = screen.getByRole('textbox', { name: 'Russian phone' })

    await userEvent.type(russianPhone, '9991234567')
    await expect.element(russianPhone).toHaveValue('+7 999 123-45-67')
    await expect
        .element(screen.getByRole('status', { name: 'Russian phone value' }))
        .toHaveTextContent('+7 999 123-45-67')

    await screen.getByRole('button', { name: 'Set external phone' }).click()
    await expect.element(russianPhone).toHaveValue('+7 912 345-67-89')
    await expect.element(russianPhone).toHaveAttribute('type', 'tel')
    await expect.element(russianPhone).toHaveAttribute('inputmode', 'tel')
    await expect.element(russianPhone).toHaveAttribute('autocomplete', 'tel')
})

it('supports alternate phone configuration and blur validation metadata', async () => {
    let touchedDuringBlur: string | null = null
    const onRequiredPhoneBlur = vi.fn((event: FocusEvent<HTMLInputElement>) => {
        touchedDuringBlur =
            event.currentTarget.closest('[data-slot="field"]')?.getAttribute('data-touched') ?? null
    })
    const screen = await render(<PhoneFieldsDemo onRequiredPhoneBlur={onRequiredPhoneBlur} />)
    const usPhone = screen.getByRole('textbox', { name: 'US national phone' })
    const requiredPhone = screen.getByRole('textbox', { name: 'Required phone' })
    const disabledPhone = screen.getByRole('textbox', { name: 'Disabled phone' })

    await userEvent.type(usPhone, '2025550123')
    await expect.element(usPhone).toHaveValue('(202) 555-0123')

    await requiredPhone.click()
    await userEvent.tab()

    expect(onRequiredPhoneBlur).toHaveBeenCalledOnce()
    expect(touchedDuringBlur).toBe('false')

    const requiredField = requiredPhone.element().closest('[data-slot="field"]')
    await expect.poll(() => requiredField?.getAttribute('data-touched')).toBe('true')

    const description = screen.getByText('Include all ten national digits.')
    const error = screen.getByRole('alert')
    const describedBy = requiredPhone.element().getAttribute('aria-describedby')

    await expect.element(error).toHaveTextContent('Enter a complete phone')
    await expect.element(requiredPhone).toHaveAttribute('aria-invalid', 'true')
    expect(describedBy).toContain(description.element().id)
    expect(describedBy).toContain(error.element().id)

    await expect.element(disabledPhone).toBeDisabled()
    expect(disabledPhone.element().closest('[data-slot="field"]')).toHaveAttribute(
        'data-disabled',
        'true',
    )
})
