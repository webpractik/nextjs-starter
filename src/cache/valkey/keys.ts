import { createHash } from 'node:crypto'

function hash(value: string) {
    return createHash('sha256').update(value).digest('hex')
}

export function entryStorageKey(namespace: string, cacheKey: string) {
    return `${namespace}:entry:${hash(cacheKey)}`
}

export function tagStorageKey(namespace: string, tag: string) {
    return `${namespace}:tag:${hash(tag)}`
}
