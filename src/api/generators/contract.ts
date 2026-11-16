import { readFile } from 'node:fs/promises'

import { parseDocument } from 'yaml'

export type ContractHttpMethod =
    | 'delete'
    | 'get'
    | 'head'
    | 'options'
    | 'patch'
    | 'post'
    | 'put'
    | 'trace'

export type ContractSchemaType = 'number' | 'string' | 'string | number'

export interface ContractPathParameter {
    name: string
    schemaType: ContractSchemaType
}

export interface ContractResponse {
    hasBody: boolean
    status: number
}

export interface ContractOperation {
    method: ContractHttpMethod
    operationId: string
    path: string
    pathParameters: ContractPathParameter[]
    responses: ContractResponse[]
    tags: string[]
}

export interface ContractModel {
    openapi: string
    operations: ContractOperation[]
}

type Mapping = Map<unknown, unknown> | Record<string, unknown>

const httpMethods = new Set<ContractHttpMethod>([
    'delete',
    'get',
    'head',
    'options',
    'patch',
    'post',
    'put',
    'trace',
])
const pathParameterPattern = /\{([^}]+)\}/g
const responseStatusPattern = /^\d{3}$/

function isMapping(value: unknown): value is Mapping {
    return value instanceof Map || isRecord(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mappingEntries(value: unknown): [string, unknown][] {
    if (value instanceof Map) {
        return [...value.entries()].map(([key, entry]) => [String(key), entry])
    }

    return isRecord(value) ? Object.entries(value) : []
}

function mappingGet(value: unknown, key: string): unknown {
    if (value instanceof Map) {
        return value.get(key)
    }

    return isRecord(value) ? value[key] : undefined
}

function decodeJsonPointerSegment(value: string) {
    return value.replaceAll('~1', '/').replaceAll('~0', '~')
}

function resolveLocalReference(root: Mapping, value: unknown): unknown {
    let resolved = value
    const seen = new Set<string>()

    while (isMapping(resolved)) {
        const reference = mappingGet(resolved, '$ref')

        if (typeof reference !== 'string') {
            return resolved
        }

        if (!reference.startsWith('#/')) {
            throw new Error(`External OpenAPI reference is not supported: ${reference}`)
        }

        if (seen.has(reference)) {
            throw new Error(`Circular OpenAPI reference: ${reference}`)
        }

        seen.add(reference)

        resolved = root

        for (const segment of reference.slice(2).split('/')) {
            resolved = mappingGet(resolved, decodeJsonPointerSegment(segment))
        }

        if (resolved === undefined) {
            throw new Error(`OpenAPI reference cannot be resolved: ${reference}`)
        }
    }

    return resolved
}

function schemaType(root: Mapping, parameter: unknown): ContractSchemaType {
    const schema = resolveLocalReference(root, mappingGet(parameter, 'schema'))
    const type = mappingGet(schema, 'type')

    if (type === 'integer' || type === 'number') {
        return 'number'
    }

    if (type === 'string') {
        return 'string'
    }
    return 'string | number'
}

function resolveParameters(root: Mapping, value: unknown) {
    return Array.isArray(value)
        ? value
              .map((parameter) => resolveLocalReference(root, parameter))
              .filter((parameter) => isMapping(parameter))
        : []
}

function findPathParameter(
    root: Mapping,
    name: string,
    operationParameters: Mapping[],
    pathParameters: Mapping[],
): ContractPathParameter {
    const parameter = [...operationParameters, ...pathParameters].find(
        (candidate) =>
            mappingGet(candidate, 'in') === 'path' && mappingGet(candidate, 'name') === name,
    )

    return {
        name,
        schemaType: schemaType(root, parameter),
    }
}

function operationPathParameters(
    root: Mapping,
    path: string,
    pathItem: Mapping,
    operation: Mapping,
) {
    const operationParameters = resolveParameters(root, mappingGet(operation, 'parameters'))
    const pathParameters = resolveParameters(root, mappingGet(pathItem, 'parameters'))

    return [...path.matchAll(pathParameterPattern)].flatMap((match) => {
        const name = match[1]
        return name === undefined
            ? []
            : [findPathParameter(root, name, operationParameters, pathParameters)]
    })
}

function responseHasBody(root: Mapping, response: unknown) {
    const resolvedResponse = resolveLocalReference(root, response)
    const content = mappingGet(resolvedResponse, 'content')

    return mappingEntries(content).some(([, mediaType]) => {
        const resolvedMediaType = resolveLocalReference(root, mediaType)
        return mappingGet(resolvedMediaType, 'schema') !== undefined
    })
}

function operationResponses(root: Mapping, operation: Mapping): ContractResponse[] {
    return mappingEntries(mappingGet(operation, 'responses')).flatMap(([status, response]) => {
        if (!responseStatusPattern.test(status)) {
            return []
        }

        return [
            {
                hasBody: responseHasBody(root, response),
                status: Number(status),
            },
        ]
    })
}

function operationTags(operation: Mapping) {
    const tags = mappingGet(operation, 'tags')
    return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === 'string') : []
}

function isContractHttpMethod(value: string): value is ContractHttpMethod {
    return httpMethods.has(value as ContractHttpMethod)
}

function pathOperations(root: Mapping, path: string, rawPathItem: unknown): ContractOperation[] {
    const pathItem = resolveLocalReference(root, rawPathItem)

    if (!isMapping(pathItem)) {
        return []
    }

    const operations: ContractOperation[] = []

    for (const [method, rawOperation] of mappingEntries(pathItem)) {
        if (!isContractHttpMethod(method)) {
            continue
        }

        const operation = resolveLocalReference(root, rawOperation)

        if (!isMapping(operation)) {
            continue
        }

        const operationId = mappingGet(operation, 'operationId')

        if (typeof operationId !== 'string' || operationId === '') {
            throw new Error(`${method.toUpperCase()} ${path} must declare an operationId`)
        }

        operations.push({
            method,
            operationId,
            path,
            pathParameters: operationPathParameters(root, path, pathItem, operation),
            responses: operationResponses(root, operation),
            tags: operationTags(operation),
        })
    }

    return operations
}

export function parseContractDocument(document: unknown): ContractModel {
    if (!isMapping(document)) {
        throw new Error('OpenAPI bundle must be an object')
    }

    const openapi = mappingGet(document, 'openapi')

    if (typeof openapi !== 'string' || !openapi.startsWith('3.')) {
        throw new Error('OpenAPI bundle must declare a supported 3.x version')
    }

    const operations: ContractOperation[] = []
    const operationIds = new Set<string>()

    for (const [path, rawPathItem] of mappingEntries(mappingGet(document, 'paths'))) {
        for (const operation of pathOperations(document, path, rawPathItem)) {
            if (operationIds.has(operation.operationId)) {
                throw new Error(`Duplicate OpenAPI operationId: ${operation.operationId}`)
            }

            operationIds.add(operation.operationId)
            operations.push(operation)
        }
    }

    return { openapi, operations }
}

export async function readContractBundle(filePath: string) {
    const source = await readFile(filePath, 'utf8')
    const document = parseDocument(source)

    const [error] = document.errors

    if (error !== undefined) {
        throw new Error(`Invalid bundled OpenAPI YAML: ${error.message}`)
    }

    return parseContractDocument(document.toJS({ mapAsMap: true }))
}
