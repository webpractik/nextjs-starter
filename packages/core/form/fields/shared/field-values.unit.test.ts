import { expect, it } from 'vitest'

import {
    asSliderValue,
    defaultNumberFormat,
    defaultNumberParse,
    defaultSliderValueLabel,
    fieldValueAsString,
} from './field-values'

it('преобразует строки и числа в текст, а пустые и объектные значения — в пустую строку', () => {
    expect(fieldValueAsString('Apollo')).toBe('Apollo')
    expect(fieldValueAsString(42)).toBe('42')
    expect(fieldValueAsString(null)).toBe('')
    expect(fieldValueAsString(undefined)).toBe('')
    expect(fieldValueAsString({ value: 'ignored' })).toBe('')
})

it('форматирует и разбирает числа, оставляя null и NaN пустыми', () => {
    expect(defaultNumberFormat(7)).toBe('7')
    expect(defaultNumberFormat(Number.NaN)).toBe('')
    expect(defaultNumberFormat(null)).toBe('')
    expect(defaultNumberParse('12.5')).toBe(12.5)
})

it('не превращает объектные и логические значения в текст числового поля', () => {
    expect(defaultNumberFormat({ value: 7 })).toBe('')
    expect(defaultNumberFormat([7])).toBe('')
    expect(defaultNumberFormat(false)).toBe('')
    expect(defaultNumberFormat(undefined)).toBe('')
    expect(defaultNumberFormat('12.5')).toBe('12.5')
})

it('принимает только числовые значения ползунка и форматирует scalar и range', () => {
    expect(asSliderValue(40)).toBe(40)
    expect(asSliderValue([20, 80])).toStrictEqual([20, 80])
    expect(asSliderValue(['20', 80])).toBe(0)
    expect(asSliderValue(undefined)).toBe(0)
    expect(defaultSliderValueLabel(40)).toBe('40')
    expect(defaultSliderValueLabel([20, 80])).toBe('20 - 80')
})
