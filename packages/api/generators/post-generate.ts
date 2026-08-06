import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { generateCacheTags } from './cache-tags'
import { readContractBundle } from './contract'
import { generateMockRoutes } from './mock-routes'

const noContentBranch =
    "if (response.status === 204 || response.headers.get('Content-Length') === '0') {"
const errorResultBranch = /return \{\n(?<indent>\s*)error: finalError,\n\s*response,/g

export function normalizeNoContentResult(source: string) {
    if (!source.includes(noContentBranch)) {
        throw new Error(
            'Generated Next client 204 response branch no longer matches the pinned shape',
        )
    }

    return source.replace(
        noContentBranch,
        `if (response.status === 204) {
          return {
            data: undefined,
            ...result,
          };
        }

        if (response.headers.get('Content-Length') === '0') {`,
    )
}

export function normalizeErrorResult(source: string) {
    const matches = [...source.matchAll(errorResultBranch)]
    const match = matches[0]

    if (matches.length !== 1 || match?.groups?.indent === undefined) {
        throw new Error(
            'Generated Next client error result branch no longer matches the pinned shape',
        )
    }

    const { indent } = match.groups
    return source.replace(
        errorResultBranch,
        `return {\n${indent}data: undefined,\n${indent}error: finalError,\n${indent}response,`,
    )
}

export async function runPostGeneration(bundlePath: string, outputDirectory: string) {
    const contract = await readContractBundle(bundlePath)
    const generatedClientPath = path.join(outputDirectory, 'client/client.gen.ts')
    const generatedClient = await readFile(generatedClientPath, 'utf8')

    await Promise.all([
        generateCacheTags(contract, path.join(outputDirectory, 'cache-tags')),
        generateMockRoutes(
            contract,
            path.join(outputDirectory, '@faker-js/faker.gen.ts'),
            path.join(outputDirectory, 'mock-client-routes.ts'),
        ),
        writeFile(
            generatedClientPath,
            normalizeErrorResult(normalizeNoContentResult(generatedClient)),
        ),
    ])
}
