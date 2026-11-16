import type { ReactNode } from 'react'

import { useForm } from '@tanstack/react-form'

import { fieldContext } from '../../form-context'

type FieldStoryValidator = (_value: unknown) => string | undefined

interface FieldStoryProps {
    children: ReactNode
    className?: string
    defaultValue: unknown
    validate?: FieldStoryValidator
}

function displayFieldValue(value: unknown) {
    if (value === '') {
        return 'пусто'
    }

    if (typeof value === 'string') {
        return value
    }

    if (value === undefined) {
        return 'не задано'
    }

    if (typeof value === 'symbol' || typeof value === 'function') {
        return String(value)
    }

    return JSON.stringify(value)
}

function FieldStoryState({
    children,
    className = 'w-full max-w-sm space-y-3',
    defaultValue,
    validate,
}: FieldStoryProps) {
    const form = useForm({ defaultValues: { value: defaultValue } })

    return (
        <div className={className}>
            <form.Field
                name="value"
                validators={{
                    onBlur: ({ value }) => validate?.(value),
                    onMount: ({ value }) => validate?.(value),
                }}
            >
                {(field) => <fieldContext.Provider value={field}>{children}</fieldContext.Provider>}
            </form.Field>
            <form.Subscribe selector={(state) => state.values.value}>
                {(value) => (
                    <output className="block text-xs text-muted-foreground">
                        Значение формы: {displayFieldValue(value)}
                    </output>
                )}
            </form.Subscribe>
        </div>
    )
}

export function FieldStory(props: FieldStoryProps) {
    return <FieldStoryState {...props} key={displayFieldValue(props.defaultValue)} />
}
