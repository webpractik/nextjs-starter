'use client'

import type { ComponentProps, ReactNode } from 'react'

import type { FieldShellProps } from '../shared'

import { cn } from '../../../cn'
import {
    Slider,
    SliderControl,
    SliderIndicator,
    SliderThumb,
    SliderTrack,
    SliderValue,
} from '../../../slider'
import { useFieldContext } from '../../form-context'
import { asSliderValue, defaultSliderValueLabel, FieldShell } from '../shared'

type SliderRootProps = ComponentProps<typeof Slider>

export type SliderFieldValue = number | readonly number[]
export type SliderValueLabel = (_value: SliderFieldValue) => ReactNode

export type SliderFieldProps = FieldShellProps &
    Omit<
        SliderRootProps,
        'children' | 'className' | 'defaultValue' | 'id' | 'name' | 'onValueChange' | 'value'
    > & {
        formatValue?: SliderValueLabel
        getThumbLabel?: (_index: number) => string
        showValue?: boolean
        sliderClassName?: string
    }

export function SliderField({
    className,
    description,
    disabled = false,
    formatValue = defaultSliderValueLabel,
    getThumbLabel,
    label,
    onValueCommitted,
    showValue = true,
    sliderClassName,
    ...sliderProps
}: SliderFieldProps) {
    const field = useFieldContext<unknown>()
    const value = asSliderValue(field.state.value)
    const values = typeof value === 'number' ? [value] : value
    const thumbs = values.map((_thumbValue, index) => ({
        index,
        key: `${field.name}-thumb-${index}`,
    }))

    return (
        <FieldShell
            className={className}
            description={description}
            disabled={disabled}
            field={field}
            label={label}
        >
            {(controlProps) => (
                <Slider
                    {...sliderProps}
                    className={cn('w-full', sliderClassName)}
                    disabled={disabled}
                    id={controlProps.id}
                    name={field.name}
                    onValueChange={(nextValue) => field.handleChange(nextValue)}
                    onValueCommitted={(nextValue, eventDetails) => {
                        onValueCommitted?.(nextValue, eventDetails)
                        field.handleBlur()
                    }}
                    value={value}
                >
                    {showValue ? <SliderValue>{() => formatValue(value)}</SliderValue> : null}
                    <SliderControl>
                        <SliderTrack>
                            <SliderIndicator />
                        </SliderTrack>
                        {thumbs.map((thumb) => (
                            <SliderThumb
                                aria-describedby={controlProps['aria-describedby']}
                                aria-invalid={controlProps['aria-invalid']}
                                aria-labelledby={
                                    getThumbLabel ? undefined : controlProps['aria-labelledby']
                                }
                                getAriaLabel={getThumbLabel}
                                index={thumb.index}
                                key={thumb.key}
                            />
                        ))}
                    </SliderControl>
                </Slider>
            )}
        </FieldShell>
    )
}
