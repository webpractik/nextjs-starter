'use client'

import { Slider as SliderPrimitive } from '@base-ui/react/slider'

import { cn } from '../cn'

type SliderClassName<State> = ((_state: State) => string | undefined) | string | undefined

function mergeClassName<State>(baseClassName: string, className: SliderClassName<State>) {
    return typeof className === 'function'
        ? (state: State) => cn(baseClassName, className(state))
        : cn(baseClassName, className)
}

export function Slider<Value extends number | readonly number[]>({
    className,
    thumbAlignment = 'edge',
    ...props
}: SliderPrimitive.Root.Props<Value>) {
    return (
        <SliderPrimitive.Root
            data-slot="slider"
            className={mergeClassName<SliderPrimitive.Root.State>(`
                  flex w-full flex-col gap-2 text-foreground
                  data-disabled:opacity-50
                  data-vertical:h-full data-vertical:w-auto
                `, className)}
            thumbAlignment={thumbAlignment}
            {...props}
        />
    )
}

export function SliderLabel({ className, ...props }: SliderPrimitive.Label.Props) {
    return (
        <SliderPrimitive.Label
            data-slot="slider-label"
            className={mergeClassName<SliderPrimitive.Label.State>(
                'text-sm font-medium',
                className,
            )}
            {...props}
        />
    )
}

export function SliderValue({ className, ...props }: SliderPrimitive.Value.Props) {
    return (
        <SliderPrimitive.Value
            data-slot="slider-value"
            className={mergeClassName<SliderPrimitive.Value.State>(
                'text-sm text-muted-foreground',
                className,
            )}
            {...props}
        />
    )
}

export function SliderControl({ className, ...props }: SliderPrimitive.Control.Props) {
    return (
        <SliderPrimitive.Control
            data-slot="slider-control"
            className={mergeClassName<SliderPrimitive.Control.State>(`
                  relative flex w-full touch-none items-center select-none
                  data-disabled:opacity-50
                  data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto
                  data-vertical:flex-col
                `, className)}
            {...props}
        />
    )
}

export function SliderTrack({ className, ...props }: SliderPrimitive.Track.Props) {
    return (
        <SliderPrimitive.Track
            data-slot="slider-track"
            className={mergeClassName<SliderPrimitive.Track.State>(`
                  relative grow overflow-hidden rounded-full bg-muted select-none
                  data-horizontal:h-1.5 data-horizontal:w-full
                  data-vertical:h-full data-vertical:w-1.5
                `, className)}
            {...props}
        />
    )
}

export function SliderIndicator({ className, ...props }: SliderPrimitive.Indicator.Props) {
    return (
        <SliderPrimitive.Indicator
            data-slot="slider-indicator"
            className={mergeClassName<SliderPrimitive.Indicator.State>(`
                  bg-primary select-none
                  data-horizontal:h-full data-vertical:w-full
                `, className)}
            {...props}
        />
    )
}

export function SliderThumb({ className, ...props }: SliderPrimitive.Thumb.Props) {
    return (
        <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            className={mergeClassName<SliderPrimitive.Thumb.State>(`
                  block size-4 shrink-0 rounded-full border border-primary
                  bg-background shadow-sm ring-ring/50
                  transition-[color,box-shadow] select-none
                  hover:ring-4
                  focus-visible:ring-4 focus-visible:outline-hidden
                  data-disabled:pointer-events-none data-disabled:opacity-50
                `, className)}
            {...props}
        />
    )
}
