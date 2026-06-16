import type { PluginFactoryOptions } from '@kubb/core'

export const pluginCacheTagsName = 'plugin-cache-tags' as const

export interface PluginCacheTagsRawOptions {
    output?: { path?: string }
}

export interface PluginCacheTagsResolvedOptions {
    output: { path: string }
}

export type PluginCacheTagsOptions = PluginFactoryOptions<
    typeof pluginCacheTagsName,
    PluginCacheTagsRawOptions,
    PluginCacheTagsResolvedOptions
>

export interface PathParam {
    name: string
    schemaType: 'string' | 'number' | 'string | number'
}

export interface TagModel {
    tagName: string
    singularName: string
    fileName: string
    varPrefix: string
    singularPrefix: string
    pathParams: PathParam[]
}
