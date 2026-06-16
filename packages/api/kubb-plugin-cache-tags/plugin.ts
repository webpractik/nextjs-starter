import type { PluginCacheTagsOptions } from './types'

import path from 'node:path'

import { definePlugin } from '@kubb/core'
import { pluginOasName } from '@kubb/plugin-oas'

import { collectTags } from './collect-tags'
import { renderIndexFile } from './render-index-file'
import { renderTagFile } from './render-tag-file'
import { pluginCacheTagsName } from './types'

type BaseName = `${string}.${string}`
interface FileLike {
    baseName: BaseName
    path: string
    sources: Array<{ value: string; isExportable?: boolean; isIndexable?: boolean }>
    imports: never[]
    exports: never[]
    meta?: object
}

export const pluginCacheTags = definePlugin<PluginCacheTagsOptions>((rawOptions) => {
    const options = rawOptions ?? {}
    const output = { path: options.output?.path ?? './tags' }

    return {
        name: pluginCacheTagsName,
        options: { output },
        pre: [pluginOasName],

        resolvePath(baseName) {
            const root = path.resolve(this.config.root, this.config.output.path)
            return path.resolve(root, output.path, baseName)
        },

        resolveName(name) {
            return name
        },

        async install() {
            const oas = await this.getOas()
            const document = oas.document as Parameters<typeof collectTags>[0]
            const tags = collectTags(document)
            if (tags.size === 0) return

            const root = path.resolve(this.config.root, this.config.output.path)
            const dir = path.resolve(root, output.path)
            const pluginKey = this.plugin.key

            const models = [...tags.values()]
            const files: FileLike[] = models.map((model) => ({
                baseName: `${model.fileName}.ts` as BaseName,
                path: path.resolve(dir, `${model.fileName}.ts`),
                sources: [
                    {
                        value: renderTagFile(model),
                        isExportable: true,
                        isIndexable: false,
                    },
                ],
                imports: [],
                exports: [],
                meta: { pluginKey },
            }))

            files.push({
                baseName: 'index.ts' satisfies BaseName,
                path: path.resolve(dir, 'index.ts'),
                sources: [
                    {
                        value: renderIndexFile(models),
                        isExportable: true,
                        isIndexable: false,
                    },
                ],
                imports: [],
                exports: [],
                meta: { pluginKey },
            })

            await this.upsertFile(...files)
        },
    }
})
