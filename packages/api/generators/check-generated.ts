import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

async function snapshot(directory: string): Promise<Record<string, string>> {
    const result: Record<string, string> = {}
    const entries = await readdir(directory, { withFileTypes: true })

    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
        const filePath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
            for (const [name, digest] of Object.entries(await snapshot(filePath))) {
                result[`${entry.name}/${name}`] = digest
            }
        } else {
            result[entry.name] = createHash('sha256')
                .update(await readFile(filePath))
                .digest('hex')
        }
    }
    return result
}

const before = await snapshot('codegen')
const generation = spawnSync('npm', ['run', 'gen'], { stdio: 'inherit' })

if (generation.status !== 0) {
    throw new Error('API generation failed', { cause: generation.error })
}

const after = await snapshot('codegen')

if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error(
        'Generated API is stale: review and commit the result of npm --workspace @repo/api run gen',
    )
}
