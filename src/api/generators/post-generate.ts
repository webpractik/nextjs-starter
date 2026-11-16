import path from 'node:path'

import { generateCacheTags } from './cache-tags'
import { readContractBundle } from './contract'
import { assertKubbContractParity } from './contract-parity'
import { generateKubbFacets } from './kubb-helpers'
import { generateMockRoutes } from './mock-routes'

export async function runPostGeneration(bundlePath: string, outputDirectory: string) {
    const contract = await readContractBundle(bundlePath)
    await assertKubbContractParity(contract, bundlePath)
    await generateKubbFacets(contract, outputDirectory)
    await generateCacheTags(contract, path.join(outputDirectory, 'cache-tags'))
    await generateMockRoutes(
        contract,
        path.join(outputDirectory, 'mocks.ts'),
        path.join(outputDirectory, 'mock-client-routes.ts'),
    )
}
