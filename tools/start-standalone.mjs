import { cpSync, existsSync } from 'node:fs'

// Next.js standalone не копирует public и static автоматически.
cpSync('.next/static', '.next/standalone/.next/static', { recursive: true })

if (existsSync('public')) {
    cpSync('public', '.next/standalone/public', { recursive: true })
}

await import('../.next/standalone/server.js')
