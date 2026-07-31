import { expect, it } from 'vitest'

import {
    asSliderValue,
    defaultNumberFormat,
    defaultNumberParse,
    defaultSliderValueLabel,
    fieldValueAsString,
} from './field-values'

it('normalizes supported text values without exposing object coercion', () => {
    expect(fieldValueAsString('Apollo')).toBe('Apollo')
    expect(fieldValueAsString(42)).toBe('42')
    expect(fieldValueAsString(null)).toBe('')
    expect(fieldValueAsString(undefined)).toBe('')
    expect(fieldValueAsString({ value: 'ignored' })).toBe('')
})

it('formats and parses number values while keeping empty and NaN inputs blank', () => {
    expect(defaultNumberFormat(7)).toBe('7')
    expect(defaultNumberFormat(Number.NaN)).toBe('')
    expect(defaultNumberFormat(null)).toBe('')
    expect(defaultNumberParse('12.5')).toBe(12.5)
})

it('accepts only numeric scalar and range slider values', () => {
    expect(asSliderValue(40)).toBe(40)
    expect(asSliderValue([20, 80])).toEqual([20, 80])
    expect(asSliderValue(['20', 80])).toBe(0)
    expect(asSliderValue(undefined)).toBe(0)
    expect(defaultSliderValueLabel(40)).toBe('40')
    expect(defaultSliderValueLabel([20, 80])).toBe('20 - 80')
})
