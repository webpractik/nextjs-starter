import { cpSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const projectDirectory = process.cwd()
const standaloneDirectory = path.resolve(projectDirectory, '.next/standalone')
const standaloneServer = path.resolve(standaloneDirectory, 'server.js')

if (!existsSync(standaloneServer)) {
    throw new Error('Standalone server is missing. Run `next build` before preparing its assets.')
}

function copyDirectory(source, destination) {
    mkdirSync(path.dirname(destination), { recursive: true })
    cpSync(source, destination, { force: true, recursive: true })
}

const staticDirectory = path.resolve(projectDirectory, '.next/static')

if (!existsSync(staticDirectory)) {
    throw new Error(
        'Static build assets are missing. Run `next build` before preparing standalone.',
    )
}

copyDirectory(staticDirectory, path.resolve(standaloneDirectory, '.next/static'))

const publicDirectory = path.resolve(projectDirectory, 'public')

if (existsSync(publicDirectory)) {
    copyDirectory(publicDirectory, path.resolve(standaloneDirectory, 'public'))
}
