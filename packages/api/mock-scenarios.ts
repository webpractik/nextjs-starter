import type { MockRoute, RequestMethod } from './mock-client'

export type BaseMockScenarioName = 'default'

export const activeBaseMockScenario: BaseMockScenarioName = 'default'

const mockScenarios: Record<BaseMockScenarioName, MockRoute[]> = {
    default: [],
}

export function isBaseMockScenarioName(
    value: string | null | undefined,
): value is BaseMockScenarioName {
    return value != null && Object.hasOwn(mockScenarios, value)
}

export function getMockScenarioRoute(
    method: RequestMethod,
    path: string,
    scenario: BaseMockScenarioName = activeBaseMockScenario,
) {
    return mockScenarios[scenario].find((item) => item.method === method && item.pattern.test(path))
}
