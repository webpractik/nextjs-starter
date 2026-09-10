import path from 'node:path'

import { runPostGeneration } from './post-generate'

const outputDirectory = path.resolve(process.cwd(), process.argv[2] ?? 'codegen')
const bundlePath = path.resolve(process.cwd(), 'bundled.yaml')

await runPostGeneration(bundlePath, outputDirectory)
