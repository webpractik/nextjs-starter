'use client'

import type { TextFieldProps } from '../text-field'

import { Input } from '../../../input'
import { useFieldContext } from '../../form-context'
import { defaultNumberFormat, defaultNumberParse, FieldShell, handleFieldBlur } from '../shared'

export type NumberFieldProps = Omit<TextFieldProps, 'type'> & {
    emptyValue?: unknown
    format?: (_value: unknown) => string
    parse?: (_value: string) => unknown
}

export function NumberField({
    className,
    controlClassName,
    description,
    emptyValue,
    format = defaultNumberFormat,
    label,
    onBlur,
    parse = defaultNumberParse,
    ...inputProps
}: NumberFieldProps) {
    const field = useFieldContext<unknown>()

    return (
        <FieldShell className={className} description={description} field={field} label={label}>
            {(controlProps) => (
                <Input
                    {...inputProps}
                    {...controlProps}
                    className={controlClassName}
                    name={field.name}
                    type="number"
                    value={format(field.state.value)}
                    onBlur={(event) => handleFieldBlur(field, onBlur, event)}
                    onChange={(event) => {
                        const { value } = event.currentTarget

                        field.handleChange(value === '' ? emptyValue : parse(value))
                    }}
                />
            )}
        </FieldShell>
    )
}
