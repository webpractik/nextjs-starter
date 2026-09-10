'use client'

import type { ComponentProps } from 'react'

import type { FieldShellProps } from '../shared'

import { Input } from '../../../input'
import { useFieldContext } from '../../form-context'
import { FieldShell, fieldValueAsString, handleFieldBlur } from '../shared'

type TextInputProps = ComponentProps<typeof Input>

export type TextFieldProps = FieldShellProps &
    Omit<TextInputProps, 'className' | 'defaultValue' | 'id' | 'name' | 'onChange' | 'value'> & {
        controlClassName?: TextInputProps['className']
    }

export function TextField({
    className,
    controlClassName,
    description,
    label,
    onBlur,
    ...inputProps
}: TextFieldProps) {
    const field = useFieldContext<unknown>()

    return (
        <FieldShell className={className} description={description} field={field} label={label}>
            {(controlProps) => (
                <Input
                    {...inputProps}
                    {...controlProps}
                    className={controlClassName}
                    name={field.name}
                    value={fieldValueAsString(field.state.value)}
                    onBlur={(event) => handleFieldBlur(field, onBlur, event)}
                    onChange={(event) => field.handleChange(event.currentTarget.value)}
                />
            )}
        </FieldShell>
    )
}
