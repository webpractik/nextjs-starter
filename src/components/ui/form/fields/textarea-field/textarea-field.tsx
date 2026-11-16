'use client'

import type { ComponentProps } from 'react'

import type { FieldShellProps } from '../shared'

import { Textarea } from '../../../textarea'
import { useFieldContext } from '../../form-context'
import { FieldShell, fieldValueAsString, handleFieldBlur } from '../shared'

type TextareaControlProps = ComponentProps<typeof Textarea>

export type TextareaFieldProps = FieldShellProps &
    Omit<
        TextareaControlProps,
        'className' | 'defaultValue' | 'id' | 'name' | 'onChange' | 'value'
    > & {
        controlClassName?: TextareaControlProps['className']
    }

export function TextareaField({
    className,
    controlClassName,
    description,
    label,
    onBlur,
    ...textareaProps
}: TextareaFieldProps) {
    const field = useFieldContext<unknown>()

    return (
        <FieldShell className={className} description={description} field={field} label={label}>
            {(controlProps) => (
                <Textarea
                    {...textareaProps}
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
