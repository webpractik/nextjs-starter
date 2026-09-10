'use client'

import type { MaskitoDateParams } from '@maskito/kit'

import type { TextFieldProps } from '../text-field'

import { maskitoDate } from '@maskito/kit'
import { useMaskito } from '@maskito/react'
import { useMemo } from 'react'

import { Input } from '../../../input'
import { useFieldContext } from '../../form-context'
import { FieldShell, fieldValueAsString, handleFieldBlur } from '../shared'

const defaultDateOptions = {
    mode: 'dd/mm/yyyy',
    separator: '.',
} satisfies MaskitoDateParams

export type DateFieldProps = Omit<TextFieldProps, 'onInput' | 'ref' | 'type'> & {
    dateOptions?: MaskitoDateParams
}

export function DateField({
    className,
    controlClassName,
    dateOptions = defaultDateOptions,
    description,
    disabled = false,
    inputMode = 'numeric',
    label,
    onBlur,
    ...inputProps
}: DateFieldProps) {
    const field = useFieldContext<unknown>()
    const maskitoOptions = useMemo(() => maskitoDate(dateOptions), [dateOptions])
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
                    className={controlClassName}
                    disabled={disabled}
                    inputMode={inputMode}
                    name={field.name}
                    type="text"
                    value={fieldValueAsString(field.state.value)}
                    onBlur={(event) => handleFieldBlur(field, onBlur, event)}
                    onInput={(event) => field.handleChange(event.currentTarget.value)}
                />
            )}
        </FieldShell>
    )
}
