'use client'

import type { MaskitoPhoneParams } from '@maskito/phone'

import type { TextFieldProps } from '../text-field'

import { maskitoPhone } from '@maskito/phone'
import { useMaskito } from '@maskito/react'
import phoneMetadata from 'libphonenumber-js/min/metadata'
import { useMemo } from 'react'

import { Input } from '../../../input'
import { useFieldContext } from '../../form-context'
import { FieldShell, fieldValueAsString, handleFieldBlur } from '../shared'

export type PhoneFieldOptions = Omit<MaskitoPhoneParams, 'metadata'> & {
    metadata?: MaskitoPhoneParams['metadata']
}

export type PhoneFieldProps = Omit<TextFieldProps, 'onInput' | 'ref' | 'type'> & {
    phoneOptions?: PhoneFieldOptions
}

const defaultPhoneOptions = {
    countryIsoCode: 'RU',
    format: 'INTERNATIONAL',
    strict: true,
} satisfies PhoneFieldOptions

export function PhoneField({
    autoComplete = 'tel',
    className,
    controlClassName,
    description,
    disabled = false,
    inputMode = 'tel',
    label,
    onBlur,
    phoneOptions = defaultPhoneOptions,
    ...inputProps
}: PhoneFieldProps) {
    const field = useFieldContext<unknown>()
    const maskitoOptions = useMemo(
        () =>
            maskitoPhone({
                ...phoneOptions,
                metadata: phoneOptions.metadata ?? phoneMetadata,
            }),
        [phoneOptions],
    )
    const inputRef = useMaskito({ options: maskitoOptions })

    return (
        <FieldShell
            className={className}
            description={description}
            disabled={disabled}
            field={field}
            label={label}
        >
            {(controlProps) => (
                <Input
                    {...inputProps}
                    {...controlProps}
                    ref={inputRef}
                    autoComplete={autoComplete}
                    className={controlClassName}
                    disabled={disabled}
                    inputMode={inputMode}
                    name={field.name}
                    onBlur={(event) => handleFieldBlur(field, onBlur, event)}
                    onInput={(event) => field.handleChange(event.currentTarget.value)}
                    type="tel"
                    value={fieldValueAsString(field.state.value)}
                />
            )}
        </FieldShell>
    )
}
