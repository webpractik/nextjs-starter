import { spawnSync } from 'node:child_process'

const baseArguments = ['compose', '--env-file', '.env.example', '--file', 'compose.yaml']
const environment = {
    ...process.env,
    CACHE_PROBE_TOKEN: 'compose-verification-token-000000000',
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: '',
}

function run(arguments_, options = {}) {
    const result = spawnSync('docker', arguments_, {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: { ...environment, ...options.environment },
        stdio: options.capture ? 'pipe' : 'inherit',
    })

    if (result.status !== 0 && !options.allowFailure) {
        throw new Error(`docker compose verification failed with status ${result.status}`)
    }

    return result
}

function model(...overlays) {
    const arguments_ = [...baseArguments]
    for (const overlay of overlays) arguments_.push('--file', overlay)
    const result = run([...arguments_, 'config', '--format', 'json'], { capture: true })

    return JSON.parse(result.stdout)
}

function expect(condition, message) {
    if (!condition) throw new Error(message)
}

for (const overlay of ['compose.dev.yaml', 'compose.prod.yaml']) {
    const config = model(overlay)
    const valkey = config.services.valkey
    const nextjs = config.services.nextjs

    expect(!valkey.ports, `${overlay} must not publish the Valkey port`)
    expect(!valkey.volumes, `${overlay} must not mount Valkey persistence`)
    expect(valkey.mem_limit > 134_217_728, `${overlay} must reserve dataset headroom`)
    expect(valkey.command.includes('--save'), `${overlay} must explicitly disable RDB`)
    expect(valkey.command.includes('--appendonly'), `${overlay} must explicitly disable AOF`)
    expect(valkey.command.includes('volatile-ttl'), `${overlay} must use TTL-aware eviction`)
    expect(
        valkey.healthcheck.test.includes('valkey-cli') && valkey.healthcheck.test.includes('ping'),
        `${overlay} must use the Valkey PING healthcheck`,
    )
    expect(
        nextjs.depends_on.valkey.condition === 'service_healthy',
        `${overlay} must health-gate Next.js startup`,
    )
}

const integrationConfig = model('compose.cache-test.yaml')
expect(
    integrationConfig.services.valkey.ports?.[0]?.host_ip === '127.0.0.1',
    'Only the integration overlay may publish Valkey on loopback',
)

const missingEnvironment = run([...baseArguments, 'config', '--quiet'], {
    allowFailure: true,
    capture: true,
    environment: { VALKEY_URL: '' },
})
expect(missingEnvironment.status !== 0, 'Missing VALKEY_URL must fail Compose interpolation')

const unhealthyProject = `nextjs-starter-unhealthy-valkey-${process.pid}`
const unhealthyArguments = [
    'compose',
    '--project-name',
    unhealthyProject,
    '--env-file',
    '.env.example',
    '--file',
    'compose.yaml',
    '--file',
    'compose.cache-unhealthy-test.yaml',
]

try {
    const unhealthyStartup = run([...unhealthyArguments, 'up', '--detach', '--wait', 'valkey'], {
        allowFailure: true,
        capture: true,
    })
    expect(unhealthyStartup.status !== 0, 'Unhealthy Valkey startup must fail --wait')
} finally {
    run([...unhealthyArguments, 'down', '--volumes', '--remove-orphans'], {
        allowFailure: true,
        capture: true,
    })
}

process.stdout.write('Valkey Compose verification passed.\n')
