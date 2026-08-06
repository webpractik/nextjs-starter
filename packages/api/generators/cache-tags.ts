import type { ContractModel, ContractPathParameter } from './contract'

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { camelCase, kebabCase, pascalCase } from 'change-case'
import pluralize from 'pluralize'

export interface CacheTagModel {
    fileName: string
    pathParameters: ContractPathParameter[]
    singularPrefix: string
    tagName: string
    varPrefix: string
}

const generatedWarning =
    '// ВНИМАНИЕ: файл сгенерирован generate-cache-tags. Не редактируйте вручную.'
const identifierPattern = /^[a-z_$][\w$]*$/i

function mergeSchemaTypes(
    left: ContractPathParameter['schemaType'],
    right: ContractPathParameter['schemaType'],
): ContractPathParameter['schemaType'] {
    return left === right ? left : 'string | number'
}

function upsertParameter(
    parameters: Map<string, ContractPathParameter>,
    parameter: ContractPathParameter,
) {
    const current = parameters.get(parameter.name)
    parameters.set(
        parameter.name,
        current === undefined
            ? parameter
            : {
                  name: parameter.name,
                  schemaType: mergeSchemaTypes(current.schemaType, parameter.schemaType),
              },
    )
}

function createModel(tagName: string, pathParameters: ContractPathParameter[]): CacheTagModel {
    const varPrefix = camelCase(tagName)
    const singularName = pluralize.singular(tagName)
    const singularPrefix = singularName === tagName ? `${varPrefix}Item` : camelCase(singularName)

    return {
        fileName: kebabCase(tagName),
        pathParameters,
        singularPrefix,
        tagName,
        varPrefix,
    }
}

function validateModels(models: CacheTagModel[]) {
    const fileNames = new Set<string>()
    const identifiers = new Set<string>()

    for (const model of models) {
        if (
            model.fileName === '' ||
            !identifierPattern.test(model.varPrefix) ||
            !identifierPattern.test(model.singularPrefix)
        ) {
            throw new Error(`OpenAPI tag cannot produce stable cache identifiers: ${model.tagName}`)
        }
        if (fileNames.has(model.fileName) || identifiers.has(model.varPrefix)) {
            throw new Error(`OpenAPI cache tag name collision: ${model.tagName}`)
        }

        fileNames.add(model.fileName)
        identifiers.add(model.varPrefix)
    }
}

export function collectCacheTags(contract: ContractModel) {
    const buckets = new Map<string, Map<string, ContractPathParameter>>()

    for (const operation of contract.operations) {
        for (const tag of operation.tags) {
            const bucket = buckets.get(tag) ?? new Map<string, ContractPathParameter>()
            buckets.set(tag, bucket)
            for (const parameter of operation.pathParameters) {
                upsertParameter(bucket, parameter)
            }
        }
    }

    const models = [...buckets].map(([tag, parameters]) =>
        createModel(tag, [...parameters.values()]),
    )
    validateModels(models)

    return new Map(models.map((model) => [model.tagName, model]))
}

function parameterObject(parameter: ContractPathParameter) {
    return `{ ${parameter.name}: ${parameter.schemaType} }`
}

function tagReturnType(tagName: string, parameter: ContractPathParameter) {
    return `\`${tagName}:${parameter.name}:\${string}\``
}

function renderResourceTag(model: CacheTagModel) {
    const parameterType = model.pathParameters.map(parameterObject).join(' | ')
    const returnType = model.pathParameters
        .map((parameter) => tagReturnType(model.tagName, parameter))
        .join(' | ')

    if (model.pathParameters.length === 1) {
        const parameter = model.pathParameters[0]!
        return [
            `export function ${model.singularPrefix}Tag(`,
            `    params: ${parameterType},`,
            `): ${returnType} {`,
            `    return \`${model.tagName}:${parameter.name}:\${params.${parameter.name}}\``,
            `}`,
        ].join('\n')
    }

    const branches = model.pathParameters.map((parameter, index) => {
        const result = `return \`${model.tagName}:${parameter.name}:\${params.${parameter.name}}\``
        return index === model.pathParameters.length - 1
            ? `    ${result}`
            : `    if ('${parameter.name}' in params) {\n        ${result}\n    }`
    })

    return [
        `export function ${model.singularPrefix}Tag(`,
        `    params: ${parameterType},`,
        `): ${returnType} {`,
        ...branches,
        `}`,
    ].join('\n')
}

export function renderCacheTagModule(model: CacheTagModel) {
    const lines = [
        generatedWarning,
        `import 'server-only'`,
        ``,
        `import { updateTag } from 'next/cache'`,
        ``,
        `export const ${model.varPrefix}Tag = '${model.tagName}' as const`,
        ``,
    ]

    if (model.pathParameters.length > 0) {
        lines.push(renderResourceTag(model), ``)
    }

    lines.push(
        `export async function revalidate${pascalCase(model.varPrefix)}() {`,
        `    updateTag(${model.varPrefix}Tag)`,
        `}`,
    )

    if (model.pathParameters.length > 0) {
        const parameterType = model.pathParameters.map(parameterObject).join(' | ')
        lines.push(
            ``,
            `export async function revalidate${pascalCase(model.singularPrefix)}(`,
            `    params: ${parameterType},`,
            `): Promise<void> {`,
            `    updateTag(${model.singularPrefix}Tag(params))`,
            `}`,
        )
    }

    return `${lines.join('\n')}\n`
}

export function renderCacheTagIndex(models: CacheTagModel[]) {
    const exports = [...models]
        .sort((left, right) => left.fileName.localeCompare(right.fileName))
        .map((model) => `export * as ${model.varPrefix} from './${model.fileName}'`)

    return `${[generatedWarning, `import 'server-only'`, '', ...exports].join('\n')}\n`
}

export async function generateCacheTags(contract: ContractModel, outputDirectory: string) {
    const models = [...collectCacheTags(contract).values()]
    await mkdir(outputDirectory, { recursive: true })
    await Promise.all([
        ...models.map((model) =>
            writeFile(
                path.join(outputDirectory, `${model.fileName}.ts`),
                renderCacheTagModule(model),
            ),
        ),
        writeFile(path.join(outputDirectory, 'index.ts'), renderCacheTagIndex(models)),
    ])
}
