import { afterEach } from 'vitest'

import { resetNextNavigationMock } from './mocks/next-navigation'
import { resetSonnerMock } from './mocks/sonner'

import '#/styles/globals.css'

afterEach(() => {
    resetNextNavigationMock()
    resetSonnerMock()
})
