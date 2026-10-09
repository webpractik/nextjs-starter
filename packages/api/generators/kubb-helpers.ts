import type { ContractModel } from './contract'

import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { pascalCase } from 'change-case'

const warning = '// ВНИМАНИЕ: файл сгенерирован из OpenAPI/Kubb. Не редактируйте вручную.\n'

export function normalizeFaker(source: string) {
    if (!source.includes('export function fake') || !source.includes('fakerEN as faker')) {
        throw new Error('Kubb Faker output no longer matches the pinned generator shape')
    }

    const result = source
        .replace('fakerEN as faker', 'fakerEN as defaultFaker')
        .replaceAll(
            /(?<!function )\b(fake\w+)\((?!options)/g,
            (_match, name: string) => `${name}(options, `,
        )
        .replaceAll('options, )', 'options)')
        .replaceAll(
            /export function (fake\w+)\(/g,
            'export function $1(options: FactoryOptions = {}, ',
        )
        .replaceAll('= {}, )', '= {})')
        .replaceAll(/\bfaker\./g, '(options.faker ?? defaultFaker).')
        .replaceAll(
            /export function fake(\w+Status\d+)\(options: FactoryOptions = \{\}\) \{\s*return undefined/g,
            'export function fake$1(_options: FactoryOptions = {}): $1 { return undefined',
        )
    return `${warning}import type { FactoryOptions } from '../../factory-options'\n${result}`
}

function exportedNames(source: string, pattern: RegExp) {
    return [...source.matchAll(pattern)].flatMap((match) =>
        match[1] === undefined ? [] : [match[1]],
    )
}

export async function generateKubbFacets(contract: ContractModel, outputDirectory: string) {
    const fakerDirectory = path.join(outputDirectory, 'faker')
    const entries = await readdir(fakerDirectory)
    const files = entries.filter((file) => file.endsWith('.ts') && file !== 'index.ts')
    const factoryNames = new Set<string>()

    for (const file of files) {
        const filePath = path.join(fakerDirectory, file)
        const source = await readFile(filePath, 'utf8')

        for (const name of exportedNames(source, /export function (\w+)/g)) {
            factoryNames.add(name)
        }

        await writeFile(filePath, normalizeFaker(source))
    }

    await generateMockFacet(contract, factoryNames, outputDirectory)

    const schemaIndex = await readFile(path.join(outputDirectory, 'schemas/index.ts'), 'utf8')
    const schemas = [...schemaIndex.matchAll(/export \{ ([^}]+) \}/g)].flatMap((match) =>
        (match[1] ?? '').split(',').map((name) => name.trim()),
    )
    const schemaLines = schemas.map(
        (name) =>
            `export { ${name} as z${pascalCase(name.replace(/Schema$/, ''), { mergeAmbiguousCharacters: true })} } from './schemas'`,
    )
    const aliases = contract.operations.flatMap((operation) =>
        operation.responses
            .filter((response) => response.hasBody)
            .map(
                (response) =>
                    `export { ${operation.operationId}Status${response.status}Schema as z${pascalCase(operation.operationId)}Response${response.status} } from './schemas'`,
            ),
    )
    await writeFile(
        path.join(outputDirectory, 'schema-facade.ts'),
        `${warning}${[...schemaLines, ...aliases].join('\n')}\n`,
    )
    await writeFile(
        path.join(outputDirectory, 'index.ts'),
        `${warning}export * from './types'\nexport * from './clients'\n`,
    )
    await generateQueryFactories(contract, outputDirectory)
    await normalizeSchemas(contract, outputDirectory)
}

async function generateMockFacet(
    contract: ContractModel,
    factoryNames: ReadonlySet<string>,
    outputDirectory: string,
) {
    const responseFactories = new Set(
        contract.operations.map((operation) => `fake${pascalCase(operation.operationId)}Response`),
    )
    const publicFactories = [...factoryNames].filter((name) => !responseFactories.has(name)).sort()
    const mockLines = [
        warning,
        `import type { FactoryOptions } from '../factory-options'`,
        `export { ${publicFactories.join(', ')} } from './faker'`,
        `export type { FactoryOptions as Options } from '../factory-options'`,
    ]

    for (const operation of contract.operations) {
        const name = pascalCase(operation.operationId)
        const groups = ['Path', 'Query', 'Body'].filter((group) =>
            factoryNames.has(`fake${name}${group}`),
        )

        if (groups.length > 0) {
            mockLines.push(
                `import { ${groups.map((group) => `fake${name}${group}`).join(', ')} } from './faker'`,
            )
        }

        mockLines.push(
            `export function fake${name}Request(options: FactoryOptions = {}) { return { ${groups.map((group) => `${group.toLowerCase()}: fake${name}${group}(options)`).join(', ')} } }`,
        )

        for (const response of operation.responses) {
            if (!response.hasBody) {
                continue
            }

            const factory = `fake${name}Status${response.status}`

            if (!factoryNames.has(factory)) {
                throw new Error(`Missing Kubb response factory: ${factory}`)
            }

            mockLines.push(
                `export { ${factory} as fake${name}Response${response.status} } from './faker'`,
            )
        }
    }

    await writeFile(path.join(outputDirectory, 'mocks.ts'), `${mockLines.join('\n')}\n`)
}

async function normalizeSchemas(contract: ContractModel, outputDirectory: string) {
    // Preserve Hey API's public unknown-key policy: object schemas strip additional fields.
    const schemaDirectory = path.join(outputDirectory, 'schemas')

    for (const file of await readdir(schemaDirectory)) {
        if (!file.endsWith('.ts')) {
            continue
        }

        const filePath = path.join(schemaDirectory, file)
        const source = await readFile(filePath, 'utf8')
        await writeFile(filePath, source.replaceAll('z.strictObject(', 'z.object('))
    }

    for (const operation of contract.operations) {
        for (const response of operation.responses.filter((item) => !item.hasBody)) {
            const name = `${pascalCase(operation.operationId)}Status${response.status}`
            const typePath = path.join(
                outputDirectory,
                `types/${pascalCase(operation.operationId)}.ts`,
            )
            const source = await readFile(typePath, 'utf8')
            const declaration = `export type ${name} = unknown;`

            if (!source.includes(declaration)) {
                throw new Error(`Bodyless response type shape changed: ${name}`)
            }

            await writeFile(
                typePath,
                source.replace(declaration, `export type ${name} = undefined;`),
            )
            const schemaPath = path.join(schemaDirectory, `${operation.operationId}Schema.ts`)
            const schema = await readFile(schemaPath, 'utf8')
            const schemaDeclaration = `${operation.operationId}Status${response.status}Schema = z.unknown()`

            if (!schema.includes(schemaDeclaration)) {
                throw new Error(`Bodyless response schema shape changed: ${name}`)
            }

            await writeFile(
                schemaPath,
                schema.replace(
                    schemaDeclaration,
                    `${operation.operationId}Status${response.status}Schema = z.undefined()`,
                ),
            )
        }
    }
}

async function generateQueryFactories(contract: ContractModel, outputDirectory: string) {
    const lines = [
        warning,
        `import type { Client, Options, RequestResult } from '../client'`,
        `import { client } from '../client'`,
        `import { infiniteQueryOptions, queryOptions, type InfiniteData, type UseMutationOptions } from '@tanstack/react-query'`,
        `interface KeyOptions { baseUrl?: string; body?: unknown; client?: Client; headers?: HeadersInit; path?: object; query?: object }`,
        `export function createQueryKey(id: string, options: KeyOptions = {}, tags: readonly string[] = [], infinite = false) { return [{ _id: id, baseUrl: options.baseUrl ?? (options.client ?? client).getConfig().baseUrl, body: options.body, headers: options.headers, path: options.path, query: options.query, tags, ...(infinite ? { _infinite: true } : {}) }] as const }`,
    ]

    for (const operation of contract.operations) {
        const { operationId: id, tags } = operation
        const name = pascalCase(id)
        const types = await readFile(path.join(outputDirectory, `types/${name}.ts`), 'utf8')
        lines.push(
            `import type { ${name}Options, ${name}Responses } from './types/${name}'`,
            `import { ${id} } from './clients/${id}'`,
            `type ${name}Error = Exclude<RequestResult<${name}Responses>['error'], undefined>`,
        )
        const resultType = `RequestResult<${name}Responses, true>['data']`

        if (operation.method === 'get') {
            const parameter =
                operation.pathParameters.length === 0
                    ? `options: Options<${name}Options> = {}`
                    : `options: Options<${name}Options>`
            lines.push(
                `export const ${id}QueryKey = (${parameter}) => createQueryKey('${id}', options, ${JSON.stringify(tags)})`,
                `export const ${id}Options = (${parameter}) => queryOptions<${resultType}, ${name}Error, ${resultType}, ReturnType<typeof ${id}QueryKey>>({ queryKey: ${id}QueryKey(options), queryFn: async ({ queryKey, signal }) => (await ${id}({ ...options, baseUrl: queryKey[0].baseUrl, signal, throwOnError: true })).data })`,
            )

            if (/\boffset\??: number/.test(types)) {
                lines.push(
                    `export const ${id}InfiniteQueryKey = (${parameter}) => createQueryKey('${id}', options, ${JSON.stringify(tags)}, true)`,
                    `export const ${id}InfiniteOptions = (${parameter}) => infiniteQueryOptions<${resultType}, ${name}Error, InfiniteData<${resultType}, number>, ReturnType<typeof ${id}InfiniteQueryKey>, number>({ initialPageParam: 0, getNextPageParam: () => undefined, queryKey: ${id}InfiniteQueryKey(options), queryFn: async ({ queryKey, signal, pageParam }) => (await ${id}({ ...options, baseUrl: queryKey[0].baseUrl, query: { ...options.query, offset: pageParam }, signal, throwOnError: true })).data })`,
                )
            }
        } else {
            lines.push(
                `export const ${id}MutationKey = (options: Partial<Options<${name}Options>> = {}) => createQueryKey('${id}', options, ${JSON.stringify(tags)})`,
                `export const ${id}Mutation = (options: Partial<Options<${name}Options>> = {}): UseMutationOptions<${resultType}, ${name}Error, Options<${name}Options>> => ({ mutationKey: ${id}MutationKey(options), mutationFn: async (variables) => (await ${id}({ ...options, ...variables, throwOnError: true })).data })`,
            )
        }
    }

    await writeFile(path.join(outputDirectory, 'query.ts'), `${lines.join('\n')}\n`)
}
