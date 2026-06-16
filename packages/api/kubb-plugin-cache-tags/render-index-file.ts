import type { TagModel } from './types'

const WARNING = '// ВНИМАНИЕ: файл сгенерирован kubb-plugin-cache-tags. Не редактируйте вручную.'

export function renderIndexFile(models: TagModel[]): string {
    if (models.length === 0) return `${WARNING}\n`

    const sorted = [...models].sort((a, b) => a.fileName.localeCompare(b.fileName))
    const exports = sorted.map((m) => `export * as ${m.varPrefix} from './${m.fileName}'`)
    return `${[WARNING, '', ...exports].join('\n')}\n`
}
