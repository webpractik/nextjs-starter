import { afterEach } from 'vitest'

import { resetNextNavigationMock } from './mocks/next-navigation'

import '#/styles/globals.css'

afterEach(() => {
    resetNextNavigationMock()
})
