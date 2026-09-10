'use client'

import type { ComponentProps, ReactNode } from 'react'

import type { FieldShellProps } from '../shared'

import { cn } from '../../../cn'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../select'
import { useFieldContext } from '../../form-context'
import { FieldShell } from '../shared'

type SelectRootProps = ComponentProps<typeof Select>

export interface SelectOption {
    disabled?: boolean
    label: ReactNode
    value: string
}

export type SelectFieldProps = FieldShellProps &
    Omit<
        SelectRootProps,
        'children' | 'defaultValue' | 'id' | 'items' | 'name' | 'onValueChange' | 'value'
    > & {
        options: readonly SelectOption[]
        placeholder?: ReactNode
        triggerClassName?: string
    }

export function SelectField({
    className,
    description,
    disabled = false,
    label,
    onOpenChange,
    options,
    placeholder,
    triggerClassName,
    ...selectProps
}: SelectFieldProps) {
    const field = useFieldContext<unknown>()
    const value = typeof field.state.value === 'string' ? field.state.value : null

    return (
        <FieldShell
            className={className}
            description={description}
            disabled={disabled}
            field={field}
            label={label}
        >
            {(controlProps) => (
                <Select
                    {...selectProps}
                    disabled={disabled}
                    items={options}
                    name={field.name}
                    value={value}
                    onOpenChange={(open, eventDetails) => {
                        onOpenChange?.(open, eventDetails)

                        if (!open) {
                            field.handleBlur()
                        }
                    }}
                    onValueChange={(nextValue) => field.handleChange(nextValue)}
                >
                    <SelectTrigger {...controlProps} className={cn('w-full', triggerClassName)}>
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {options.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    disabled={option.disabled}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            )}
        </FieldShell>
    )
}
