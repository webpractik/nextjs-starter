import type { ContractModel, ContractOperation, ContractResponse } from './contract'

import { readFile, writeFile } from 'node:fs/promises'

import { pascalCase } from 'change-case'

type MockHttpMethod = 'delete' | 'get' | 'patch' | 'post' | 'put'

export interface MockRouteDefinition {
    factoryName?: string
    method: MockHttpMethod
    operationId: string
    path: string
    status: number
    tag?: string
}

const generatedWarning =
    '// ВНИМАНИЕ: файл сгенерирован generate-mock-routes. Не редактируйте вручную.'
const pathParameterPattern = /\{[^}]+\}/g

function isMockMethod(method: ContractOperation['method']): method is MockHttpMethod {
    return ['delete', 'get', 'patch', 'post', 'put'].includes(method)
}

function preferredResponse(responses: ContractResponse[]): ContractResponse {
    return (
        responses.find((response) => response.status >= 200 && response.status < 300) ??
        responses.find((response) => response.status >= 300 && response.status < 400) ?? {
            hasBody: false,
            status: 200,
        }
    )
}

function factoryName(operationId: string, status: number) {
    return `fake${pascalCase(operationId)}Response${status}`
}

function compareRoutes(left: MockRouteDefinition, right: MockRouteDefinition) {
    const leftParameters = left.path.match(pathParameterPattern)?.length ?? 0
    const rightParameters = right.path.match(pathParameterPattern)?.length ?? 0
    return leftParameters - rightParameters || right.path.length - left.path.length
}

export function collectMockRoutes(contract: ContractModel, fakerExports: ReadonlySet<string>) {
    const routes = contract.operations.flatMap<MockRouteDefinition>((operation) => {
        if (!isMockMethod(operation.method)) return []

        const response = preferredResponse(operation.responses)
        const expectedFactory = response.hasBody
            ? factoryName(operation.operationId, response.status)
            : undefined

        if (expectedFactory !== undefined && !fakerExports.has(expectedFactory)) {
            throw new Error(
                `Generated Faker export is missing for ${operation.operationId}: ${expectedFactory}`,
            )
        }

        return [
            {
                factoryName: expectedFactory,
                method: operation.method,
                operationId: operation.operationId,
                path: operation.path,
                status: response.status,
                tag: operation.tags[0],
            },
        ]
    })

    return routes.sort(compareRoutes)
}

function escapeRegexLiteral(value: string) {
    return value.replaceAll(/[\\^$.*+?()[\]{}|/]/g, '\\$&')
}

function routePattern(pathname: string) {
    let offset = 0
    let source = ''

    for (const match of pathname.matchAll(pathParameterPattern)) {
        const value = match[0]
        source += escapeRegexLiteral(pathname.slice(offset, match.index))
        source += '[^/]+'
        offset = match.index + value.length
    }

    source += escapeRegexLiteral(pathname.slice(offset))
    return `^${source}$`
}

function renderRoute(route: MockRouteDefinition) {
    const properties = [
        `method: '${route.method.toUpperCase()}'`,
        `pattern: /${routePattern(route.path)}/`,
        `operationId: '${route.operationId}'`,
        ...(route.tag === undefined ? [] : [`tag: '${route.tag}'`]),
        ...(route.status === 200 ? [] : [`status: ${route.status}`]),
        ...(route.factoryName === undefined ? [] : [`create: ${route.factoryName}`]),
    ]

    return `{ ${properties.join(', ')} }`
}

export function renderMockRoutes(routes: MockRouteDefinition[]) {
    const imports = [...new Set(routes.flatMap((route) => route.factoryName ?? []))].sort()
    const fakerImport =
        imports.length === 0
            ? []
            : [`import { ${imports.join(', ')} } from './@faker-js/faker.gen'`, ``]

    return `${[
        generatedWarning,
        `import type { MockRoute } from '../mock-client'`,
        ``,
        ...fakerImport,
        `export const mockRoutes = [`,
        ...routes.map((route) => `    ${renderRoute(route)},`),
        `] satisfies MockRoute[]`,
    ].join('\n')}\n`
}

export async function readFakerExportManifest(filePath: string) {
    const source = await readFile(filePath, 'utf8')
    return new Set([...source.matchAll(/export const (\w+)/g)].map((match) => match[1]!))
}

export async function generateMockRoutes(
    contract: ContractModel,
    fakerFilePath: string,
    outputPath: string,
) {
    const fakerExports = await readFakerExportManifest(fakerFilePath)
    const routes = collectMockRoutes(contract, fakerExports)
    await writeFile(outputPath, renderMockRoutes(routes))
}
