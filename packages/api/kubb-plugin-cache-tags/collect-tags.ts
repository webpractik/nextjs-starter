import type { OpenAPIV3, OpenAPIV3_1 } from '@kubb/oas'

import type { PathParam, TagModel } from './types'

import { camelCase, kebabCase } from 'change-case'
import pluralize from 'pluralize'

type Document = OpenAPIV3.Document | OpenAPIV3_1.Document
type PathItem = OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject
type Operation = OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject
type Parameter = OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

const PATH_PARAM_RE = /\{([^}]+)\}/g

function schemaTypeFor(param: Parameter | undefined): PathParam['schemaType'] {
    const schema = param?.schema as { type?: string } | undefined
    if (!schema?.type) return 'string | number'
    if (schema.type === 'integer' || schema.type === 'number') return 'number'
    if (schema.type === 'string') return 'string'
    return 'string | number'
}

function mergeTypes(
    a: PathParam['schemaType'],
    b: PathParam['schemaType'],
): PathParam['schemaType'] {
    if (a === b) return a
    return 'string | number'
}

function findParam(
    name: string,
    operationParams: Parameter[],
    pathParams: Parameter[],
): Parameter | undefined {
    return (
        operationParams.find((p) => p.name === name && p.in === 'path') ??
        pathParams.find((p) => p.name === name && p.in === 'path')
    )
}

function extractPlaceholders(path: string): string[] {
    const result: string[] = []
    for (const match of path.matchAll(PATH_PARAM_RE)) {
        if (match[1]) result.push(match[1])
    }
    return result
}

function upsertParam(bucket: Map<string, PathParam>, param: PathParam) {
    const existing = bucket.get(param.name)
    if (!existing) {
        bucket.set(param.name, param)
        return
    }
    bucket.set(param.name, {
        name: param.name,
        schemaType: mergeTypes(existing.schemaType, param.schemaType),
    })
}

function buildModel(tagName: string, params: PathParam[]): TagModel {
    const varPrefix = camelCase(tagName)
    const singularName = pluralize.singular(tagName)
    const singularPrefix = singularName === tagName ? `${varPrefix}Item` : camelCase(singularName)

    return {
        tagName,
        singularName,
        fileName: kebabCase(tagName),
        varPrefix,
        singularPrefix,
        pathParams: params,
    }
}

export function collectTags(document: Document): Map<string, TagModel> {
    const buckets = new Map<string, Map<string, PathParam>>()
    const paths = document.paths ?? {}

    for (const [rawPath, pathItem] of Object.entries(paths)) {
        if (!pathItem) continue
        const item = pathItem as PathItem
        const pathLevelParams = (item.parameters ?? []) as Parameter[]
        const placeholders = extractPlaceholders(rawPath)

        for (const method of HTTP_METHODS) {
            const op = item[method] as Operation | undefined
            if (!op?.tags?.length) continue
            const opParams = (op.parameters ?? []) as Parameter[]

            for (const tag of op.tags) {
                if (!buckets.has(tag)) buckets.set(tag, new Map())
                const bucket = buckets.get(tag)!
                for (const placeholder of placeholders) {
                    const param = findParam(placeholder, opParams, pathLevelParams)
                    upsertParam(bucket, {
                        name: placeholder,
                        schemaType: schemaTypeFor(param),
                    })
                }
            }
        }
    }

    const result = new Map<string, TagModel>()
    for (const [tag, paramMap] of buckets) {
        result.set(tag, buildModel(tag, [...paramMap.values()]))
    }
    return result
}
