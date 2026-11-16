import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

function checkTest(file, files, errors) {
    const match = /^tests\/(unit|component)\/(.+)$/.exec(file)

    if (!match) {
        errors.push(`${file}: тест должен находиться в tests/unit/ или tests/component/`)
    } else if (
        !files.some(
            (source) =>
                path.posix.dirname(source) === path.posix.dirname(match[2]) &&
                !source.startsWith('tests/'),
        )
    ) {
        errors.push(`${file}: нет соответствующей директории исходников`)
    }

    if (match && /\.unit\.test\./.test(file) && match[1] !== 'unit') {
        errors.push(`${file}: unit-тест в неверном проекте`)
    }

    if (match && /\.component\.test\./.test(file) && match[1] !== 'component') {
        errors.push(`${file}: компонентный тест в неверном проекте`)
    }
}

function checkFile(file, files, errors) {
    if (/\.module\.(?:css|scss|sass|less)$/.test(file) && !file.startsWith('src/styles/')) {
        errors.push(`${file}: CSS Modules разрешены только в src/styles/`)
    }

    if (/\.test\.[cm]?[jt]sx?$/.test(file)) {
        checkTest(file, files, errors)
    }

    if (/\.stories\.[cm]?[jt]sx?$/.test(file)) {
        const source = file.replace(/^stories\//, '').replace(/\.stories(?=\.)/, '')

        if (!file.startsWith('stories/src/components/')) {
            errors.push(`${file}: stories разрешены только для src/components/`)
        } else if (!files.includes(source)) {
            errors.push(`${file}: story должна зеркалировать существующий исходник в stories/`)
        }
    }
}

function checkComponents(components, files, errors) {
    for (const component of components) {
        const stem = component.replace(/\.tsx$/, '')

        const required = component.startsWith('src/components/') ? ['test', 'story'] : ['test']

        for (const kind of required) {
            const found =
                kind === 'story'
                    ? files.includes(`stories/${stem}.stories.tsx`)
                    : files.some((file) =>
                          new RegExp(
                              `^tests/(unit|component)/${stem.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)}\\.(?:(?:unit|component)\\.)?test\\.tsx?$`,
                          ).test(file),
                      )

            if (!found) {
                errors.push(`${component}: отсутствует ${kind}`)
            }
        }
    }
}

export function checkStructure(root) {
    const files = []
    const ignored = new Set([
        '.git',
        '.next',
        'node_modules',
        'coverage',
        'storybook-static',
        '.audit',
        'openwiki',
        'test-results',
        'allure-results',
        'playwright-report',
        'blob-report',
    ])

    function walk(directory) {
        for (const entry of readdirSync(path.join(root, directory), { withFileTypes: true })) {
            if (ignored.has(entry.name) || entry.isSymbolicLink()) {
                continue
            }

            const relative = path.posix.join(directory, entry.name)

            if (entry.isDirectory()) {
                walk(relative)
            } else {
                files.push(relative)
            }
        }
    }

    walk('')
    const errors = []
    const components = files.filter(
        (file) =>
            /^(?:src\/components\/|app\/.*\/_components\/)/.test(file) &&
            file.endsWith('.tsx') &&
            !/\.(?:test|stories)\.tsx$/.test(file) &&
            (!file.endsWith('/index.tsx') ||
                /\breturn\b|=>/.test(readFileSync(path.join(root, file), 'utf8'))),
    )

    for (const file of files) {
        checkFile(file, files, errors)
    }

    checkComponents(components, files, errors)

    return errors
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
    const errors = checkStructure(process.cwd())

    if (errors.length > 0) {
        console.error(errors.join('\n'))
        process.exitCode = 1
    } else {
        process.stdout.write('Структура тестов, stories и стилей проверена.\n')
    }
}
