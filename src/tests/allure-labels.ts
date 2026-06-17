import { label } from 'allure-js-commons'

export const frontendAllureLayers = {
    component: 'Component-front',
    unit: 'Unit-front',
} as const

export type FrontendAllureLayer = (typeof frontendAllureLayers)[keyof typeof frontendAllureLayers]

export const FRONTEND_ALLURE_FALLBACK_FEATURE = 'Frontend infrastructure'

const featureByPath = [
    { feature: 'API codegen', includes: ['/packages/api/'] },
    { feature: 'App routes', includes: ['/app/'] },
    { feature: 'Error handling', includes: ['/src/components/utilities/error-boundary/'] },
    { feature: 'UI components', includes: ['/packages/core/'] },
    { feature: 'Utilities', includes: ['/src/utils/'] },
    { feature: 'Test infrastructure', includes: ['/src/tests/'] },
] as const satisfies ReadonlyArray<{
    feature: string
    includes: readonly string[]
}>

function getNormalizedPathVariants(testPath: string) {
    const normalizedPath = `/${testPath.replaceAll('\\', '/')}`
    const pathWithoutRouteGroups = normalizedPath.replace(/\/\([^)]+\)/g, '')

    return [normalizedPath, pathWithoutRouteGroups]
}

export function getFrontendAllureFeature(testPath: string) {
    const normalizedPaths = getNormalizedPathVariants(testPath)
    const matchedFeature = featureByPath.find(({ includes }) =>
        includes.some((path) =>
            normalizedPaths.some((normalizedPath) => normalizedPath.includes(path)),
        ),
    )

    return matchedFeature?.feature ?? FRONTEND_ALLURE_FALLBACK_FEATURE
}

export async function setFrontendAllureLabels(testPath: string, layer: FrontendAllureLayer) {
    await label('Epic', 'nextjs-starter')
    await label('Feature', getFrontendAllureFeature(testPath))
    await label('layer', layer)
}
