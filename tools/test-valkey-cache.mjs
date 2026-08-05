import { spawnSync } from 'node:child_process'

const projectName = `nextjs-starter-cache-test-${process.pid}`
const composeArguments = [
    'compose',
    '--project-name',
    projectName,
    '--env-file',
    '.env.example',
    '--file',
    'compose.yaml',
    '--file',
    'compose.cache-test.yaml',
]

function run(command, arguments_, options = {}) {
    const result = spawnSync(command, arguments_, {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: options.capture ? 'pipe' : 'inherit',
        ...options,
    })

    if (result.status !== 0) {
        throw new Error(`${command} ${arguments_.join(' ')} failed with status ${result.status}`)
    }

    return result.stdout?.trim()
}

try {
    run('docker', [...composeArguments, 'up', '--detach', '--wait', 'valkey'])
    const endpoint = run('docker', [...composeArguments, 'port', 'valkey', '6379'], {
        capture: true,
    })
    const containerId = run('docker', [...composeArguments, 'ps', '--quiet', 'valkey'], {
        capture: true,
    })
    if (!endpoint) throw new Error('Compose did not publish the test Valkey endpoint')
    if (!containerId) throw new Error('Compose did not return the test Valkey container')

    run(
        'npx',
        ['vitest', 'run', 'src/cache/valkey/handler.integration.unit.test.ts', '--project', 'unit'],
        {
            env: {
                ...process.env,
                VALKEY_TEST_CONTAINER: containerId,
                VALKEY_TEST_URL: `redis://${endpoint}`,
            },
        },
    )
} finally {
    run('docker', [...composeArguments, 'down', '--volumes', '--remove-orphans'])
}
