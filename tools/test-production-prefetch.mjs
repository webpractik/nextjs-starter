import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, globSync, renameSync, rmSync } from 'node:fs'

const destination = 'app/e2e-foresight'

if (existsSync(destination)) {
    throw new Error(`${destination} уже существует`)
}

function run(args) {
    const result = spawnSync('npm', args, {
        env: {
            ...process.env,
            PLAYWRIGHT_SERVER_MODE: 'standalone',
            FORESIGHT_E2E: 'true',
            FRONT_PORT: process.env.FRONT_PORT ?? '3107',
            PORT: process.env.FRONT_PORT ?? '3107',
        },
        stdio: 'inherit',
    })

    if (result.error) {
        throw result.error
    }

    if (result.status !== 0) {
        throw new Error(`npm ${args.join(' ')}: ${result.status}`)
    }
}

try {
    cpSync('src/tests/fixtures/foresight', destination, { recursive: true, errorOnExist: true })

    for (const file of globSync(`${destination}/**/*.fixture`)) {
        renameSync(file, file.slice(0, -'.fixture'.length))
    }

    run(['run', 'build'])
    run(['run', 'test:e2e', '--', '--reporter=list,html'])
} finally {
    rmSync(destination, { recursive: true, force: true })
    // Тестовые маршруты не должны оставаться в готовой production-сборке.
    run(['run', 'build'])
}
