import { afterAll, beforeAll, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { cdp } from 'vitest/browser'

import { Hero } from '@/(public)/(home)/_components/hero'

beforeAll(async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
})

afterAll(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] })
})

it('показывает заголовок первого уровня и описание стартового комплекта', async () => {
    const screen = await render(<Hero />)

    await expect
        .element(screen.getByRole('heading', { level: 1, name: 'Next Starter' }))
        .toBeVisible()
    await expect.element(screen.getByText(/Этот стартовый комплект/)).toBeVisible()
})

it('сразу показывает контент без размытия и перемещения при уменьшенной анимации', async () => {
    expect(globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)
    const screen = await render(<Hero />)
    const heading = screen.getByRole('heading', { level: 1, name: 'Next Starter' }).element()
    const content = heading.parentElement

    if (!content) {
        throw new Error('Hero content is missing')
    }

    const style = getComputedStyle(content)
    expect(style.opacity).toBe('1')
    expect(style.filter).toBe('none')
    expect(style.transform).toBe('none')
    expect(content.getAnimations()).toHaveLength(0)
})

it('сохраняет анимацию появления без настройки уменьшенного движения', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    })
    expect(globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false)
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve())
    })
    const screen = await render(<Hero />)
    const heading = screen.getByRole('heading', { level: 1, name: 'Next Starter' }).element()
    const content = heading.parentElement

    if (!content) {
        throw new Error('Hero content is missing')
    }

    expect(getComputedStyle(content).opacity).toBe('0')
    await expect.poll(() => getComputedStyle(content).opacity, { timeout: 3000 }).toBe('1')
    expect(getComputedStyle(content).filter).toBe('blur(0px)')
    expect(getComputedStyle(content).transform).toBe('none')
})

it('сохраняет видимость после отключения уменьшенного движения', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve())
    })
    const screen = await render(<Hero />)
    const content = screen
        .getByRole('heading', { level: 1, name: 'Next Starter' })
        .element().parentElement

    if (!content) {
        throw new Error('Hero content is missing')
    }

    await expect.poll(() => getComputedStyle(content).opacity).toBe('1')
    await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    })
    await expect.poll(() => getComputedStyle(content).opacity, { timeout: 3000 }).toBe('1')
    expect(getComputedStyle(content).filter).toBe('blur(0px)')
    expect(getComputedStyle(content).transform).toBe('none')
})
