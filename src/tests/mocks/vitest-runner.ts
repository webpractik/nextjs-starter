import { TestRunner } from 'vitest'

/**
 * Allure 3 reads @vitest/runner state, which Vitest 5 moved into its bundled TestRunner. Browser
 * imports use that same instance to attach labels to the running test.
 */
export const { getCurrentSuite, getCurrentTest } = TestRunner
