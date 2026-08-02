import { spawnSync } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function runNpmScript(script, environment = process.env) {
    const result = spawnSync(npmCommand, ['run', script], {
        env: environment,
        stdio: 'inherit',
    })

    if (result.error) {
        throw result.error
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1)
    }
}

runNpmScript('build')
runNpmScript('test:e2e', {
    ...process.env,
    PLAYWRIGHT_SERVER_MODE: 'standalone',
})
