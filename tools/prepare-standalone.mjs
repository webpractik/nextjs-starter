import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const projectDirectory = process.cwd()
const standaloneDirectory = resolve(projectDirectory, '.next/standalone')
const standaloneServer = resolve(standaloneDirectory, 'server.js')

if (!existsSync(standaloneServer)) {
    throw new Error('Standalone server is missing. Run `next build` before preparing its assets.')
}

function copyDirectory(source, destination) {
    mkdirSync(dirname(destination), { recursive: true })
    cpSync(source, destination, { force: true, recursive: true })
}

const staticDirectory = resolve(projectDirectory, '.next/static')
if (!existsSync(staticDirectory)) {
    throw new Error(
        'Static build assets are missing. Run `next build` before preparing standalone.',
    )
}

copyDirectory(staticDirectory, resolve(standaloneDirectory, '.next/static'))

const publicDirectory = resolve(projectDirectory, 'public')
if (existsSync(publicDirectory)) {
    copyDirectory(publicDirectory, resolve(standaloneDirectory, 'public'))
}
