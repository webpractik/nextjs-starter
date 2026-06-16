import type { PathParam, TagModel } from './types'

import { pascalCase } from 'change-case'

const WARNING = '// ВНИМАНИЕ: файл сгенерирован kubb-plugin-cache-tags. Не редактируйте вручную.'

function paramObject(param: PathParam): string {
    return `{ ${param.name}: ${param.schemaType} }`
}

function literalReturn(tagName: string, param: PathParam): string {
    return `\`${tagName}:${param.name}:\${string}\``
}

function renderBuilder(model: TagModel): string {
    const { tagName, singularPrefix, pathParams } = model
    const paramUnion = pathParams.map(paramObject).join(' | ')
    const returnUnion = pathParams.map((p) => literalReturn(tagName, p)).join(' | ')

    if (pathParams.length === 1) {
        const p = pathParams[0]!
        return [
            `export function ${singularPrefix}Tag(`,
            `\tparams: ${paramUnion},`,
            `): ${returnUnion} {`,
            `\treturn \`${tagName}:${p.name}:\${params.${p.name}}\``,
            `}`,
        ].join('\n')
    }

    const branches = pathParams
        .map((p, index) => {
            const isLast = index === pathParams.length - 1
            const ret = `return \`${tagName}:${p.name}:\${params.${p.name}}\``
            return isLast ? `\t${ret}` : `\tif ('${p.name}' in params) {\n\t\t${ret}\n\t}`
        })
        .join('\n')

    return [
        `export function ${singularPrefix}Tag(`,
        `\tparams: ${paramUnion},`,
        `): ${returnUnion} {`,
        branches,
        `}`,
    ].join('\n')
}

export function renderTagFile(model: TagModel): string {
    const { tagName, varPrefix, singularPrefix, pathParams } = model
    const lines: string[] = [
        WARNING,
        `import { updateTag } from 'next/cache'`,
        ``,
        `export const ${varPrefix}Tag = '${tagName}' as const`,
        ``,
    ]

    if (pathParams.length > 0) {
        lines.push(renderBuilder(model), ``)
    }

    lines.push(
        `export async function revalidate${pascalCase(varPrefix)}() {`,
        `\tupdateTag(${varPrefix}Tag)`,
        `}`,
    )

    if (pathParams.length > 0) {
        const paramUnion = pathParams.map(paramObject).join(' | ')
        lines.push(
            ``,
            `export async function revalidate${pascalCase(singularPrefix)}(`,
            `\tparams: ${paramUnion},`,
            `): Promise<void> {`,
            `\tupdateTag(${singularPrefix}Tag(params))`,
            `}`,
        )
    }

    return `${lines.join('\n')}\n`
}
