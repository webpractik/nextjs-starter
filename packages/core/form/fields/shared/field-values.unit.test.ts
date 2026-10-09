import * as allure from 'allure-js-commons'
import { expect, it } from 'vitest'

import {
    asSliderValue,
    defaultNumberFormat,
    defaultNumberParse,
    defaultSliderValueLabel,
    fieldValueAsString,
} from './field-values'

it('преобразует строки и числа в текст, а пустые и объектные значения в пустую строку', async () => {
    await allure.labels(
        { name: 'layer', value: 'Unit-front' },
        { name: 'feature', value: 'UI components' },
        { name: 'story', value: 'Контракт общих полей формы' },
        { name: 'severity', value: 'normal' },
    )
    expect(fieldValueAsString('Apollo')).toBe('Apollo')
    expect(fieldValueAsString(42)).toBe('42')
    expect(fieldValueAsString(null)).toBe('')
    expect(fieldValueAsString(undefined)).toBe('')
    expect(fieldValueAsString({ value: 'ignored' })).toBe('')
})

it('форматирует и разбирает числа, оставляя null и NaN пустыми', async () => {
    await allure.labels(
        { name: 'layer', value: 'Unit-front' },
        { name: 'feature', value: 'UI components' },
        { name: 'story', value: 'Контракт общих полей формы' },
        { name: 'severity', value: 'normal' },
    )
    expect(defaultNumberFormat(7)).toBe('7')
    expect(defaultNumberFormat(Number.NaN)).toBe('')
    expect(defaultNumberFormat(null)).toBe('')
    expect(defaultNumberParse('12.5')).toBe(12.5)
})

it('не превращает объектные и логические значения в текст числового поля', async () => {
    await allure.labels(
        { name: 'layer', value: 'Unit-front' },
        { name: 'feature', value: 'UI components' },
        { name: 'story', value: 'Контракт общих полей формы' },
        { name: 'severity', value: 'normal' },
    )
    expect(defaultNumberFormat({ value: 7 })).toBe('')
    expect(defaultNumberFormat([7])).toBe('')
    expect(defaultNumberFormat(false)).toBe('')
    expect(defaultNumberFormat(undefined)).toBe('')
    expect(defaultNumberFormat('12.5')).toBe('12.5')
})

it('принимает только числовые значения ползунка и форматирует scalar и range', async () => {
    await allure.labels(
        { name: 'layer', value: 'Unit-front' },
        { name: 'feature', value: 'UI components' },
        { name: 'story', value: 'Контракт общих полей формы' },
        { name: 'severity', value: 'normal' },
    )
    expect(asSliderValue(40)).toBe(40)
    expect(asSliderValue([20, 80])).toStrictEqual([20, 80])
    expect(asSliderValue(['20', 80])).toBe(0)
    expect(asSliderValue(undefined)).toBe(0)
    expect(defaultSliderValueLabel(40)).toBe('40')
    expect(defaultSliderValueLabel([20, 80])).toBe('20 - 80')
})
