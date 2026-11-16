import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { builtinModules } from 'node:module'
import path from 'node:path'

import { parseSync } from 'oxc-parser'

const sourceExtension = /\.[cm]?[jt]sx?$/
const moduleName = (file) => /^src\/modules\/([^/]+)\//.exec(file)?.[1]
const componentName = (file) =>
    /^src\/components\/(?:ui|providers|utilities)\/[^/.]+\//.exec(file)?.[0]
const pureLayer = (file, text) =>
    /(?:^|\/)(domain|application)\//.exec(file)?.[1] ??
    /^\s*\/\*\*\s*@architecture\s+(domain|application)\s*\*\//.exec(text)?.[1]
const builtins = new Set(builtinModules.map((name) => name.replace(/^node:/, '')))
const forbiddenExternal =
    /^(?:react(?:-dom)?(?:\/|$)|next(?:\/|$)|@tanstack\/|node:|fs(?:\/|$)|path$|https?$|server-only$|client-only$|adze$)/

function importSource(node) {
    let source

    if (
        [
            'ExportAllDeclaration',
            'ExportNamedDeclaration',
            'ImportDeclaration',
            'ImportExpression',
            'TSImportType',
        ].includes(node.type)
    ) {
        source = node.source
    }

    if (node.type === 'TSExternalModuleReference') {
        source = node.expression
    }

    if (node.type === 'CallExpression' && node.callee?.name === 'require') {
        source = node.arguments[0]
    }

    return source
}

function importViolation(from, target) {
    let reason
    const sourceModule = moduleName(from)
    const targetModule = moduleName(target)
    const component = componentName(target)

    if (from.startsWith('src/') && !sourceModule && (target.startsWith('app/') || targetModule)) {
        reason = 'общий код не импортирует app или доменные модули'
    }

    if (
        sourceModule &&
        (target.startsWith('app/') || (targetModule && targetModule !== sourceModule))
    ) {
        reason = 'модуль не импортирует app или другой модуль'
    }

    if (!from.startsWith('src/tests/') && target.startsWith('src/tests/')) {
        reason = 'runtime не импортирует тестовую инфраструктуру'
    }

    if (
        targetModule &&
        targetModule !== sourceModule &&
        !/^src\/modules\/[^/]+\/(?:index|server|client)\.[cm]?[jt]sx?$/.test(target)
    ) {
        reason = 'используйте публичный вход модуля'
    }

    if (
        !from.startsWith('src/api/') &&
        target.startsWith('src/api/') &&
        !/^src\/api\/(?:index|client|query|schemas|mocks|cache-tags)\.ts$/.test(target)
    ) {
        reason = 'используйте публичный facet API'
    }

    if (
        component &&
        !from.startsWith(component) &&
        !['index.ts', 'index.tsx', 'index.js', 'index.jsx'].some(
            (name) => target === component + name,
        )
    ) {
        reason = 'используйте публичный index компонента'
    }

    const privateDirectory = target.indexOf('/_components/')

    if (privateDirectory !== -1 && !from.startsWith(target.slice(0, privateDirectory + 1))) {
        reason = 'route-local UI принадлежит своему маршруту'
    }

    return reason
}

export function checkImports(projectRoot) {
    const root = realpathSync(projectRoot)
    const config = JSON.parse(readFileSync(path.join(root, 'tsconfig.json'), 'utf8'))
    const aliases = Object.entries(config.compilerOptions?.paths ?? {})
    const graph = new Map()
    const errors = []
    const relative = (file) => path.relative(root, file).split(path.sep).join('/')

    function resolve(from, specifier) {
        let candidates

        if (specifier.startsWith('.')) {
            candidates = [path.resolve(root, path.dirname(from), specifier)]
        } else {
            const alias = aliases.find(([key]) =>
                key.endsWith('*') ? specifier.startsWith(key.slice(0, -1)) : key === specifier,
            )

            if (!alias) {
                return null
            }

            const [key, targets] = alias
            candidates = targets.map((target) =>
                path.resolve(
                    root,
                    config.compilerOptions?.baseUrl ?? '.',
                    target.replace(
                        '*',
                        specifier.slice(key.endsWith('*') ? key.length - 1 : key.length),
                    ),
                ),
            )
        }

        for (const candidate of candidates) {
            const stem = candidate.replace(/\.(?:js|jsx|mjs|cjs)$/, '')

            for (const file of [
                candidate,
                ...['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'].flatMap((ext) => [
                    stem + ext,
                    path.join(candidate, `index${ext}`),
                ]),
            ]) {
                if (existsSync(file) && statSync(file).isFile()) {
                    return relative(realpathSync(file))
                }
            }
        }
        return undefined
    }

    function load(file) {
        if (graph.has(file) || !sourceExtension.test(file)) {
            return
        }

        const text = readFileSync(path.join(root, file), 'utf8')
        const parsed = parseSync(file, text)
        const entry = { layer: pureLayer(file, text), imports: [] }
        graph.set(file, entry)

        for (const error of parsed.errors) {
            errors.push(`${file}: ${error.message}`)
        }

        function addImport(source, node) {
            const line = text.slice(0, node.start).split('\n').length

            if (typeof source.value !== 'string') {
                errors.push(`${file}:${line}: путь импорта должен быть строковым литералом`)
            } else {
                const target = resolve(file, source.value)

                if (target === undefined) {
                    errors.push(`${file}:${line}: не найден локальный импорт ${source.value}`)
                }

                if (target?.startsWith('../')) {
                    errors.push(`${file}:${line}: импорт вне проекта ${source.value}`)
                }

                entry.imports.push({ specifier: source.value, target, line })
            }
        }

        function visit(node) {
            if (!node || typeof node !== 'object') {
                return
            }

            const source = importSource(node)

            if (source) {
                addImport(source, node)
            }

            for (const value of Object.values(node)) {
                if (Array.isArray(value)) {
                    for (const child of value) {
                        visit(child)
                    }
                } else if (value && typeof value === 'object') {
                    visit(value)
                }
            }
        }

        visit(parsed.program)

        for (const { target } of entry.imports) {
            if (target && !target.startsWith('../')) {
                load(target)
            }
        }
    }

    function walk(directory) {
        if (!existsSync(path.join(root, directory))) {
            return
        }

        for (const entry of readdirSync(path.join(root, directory), { withFileTypes: true })) {
            const file = `${directory}/${entry.name}`

            if (entry.isDirectory()) {
                walk(file)
            } else if (entry.isFile() && sourceExtension.test(file)) {
                load(file)
            }
        }
    }

    walk('app')
    walk('src')

    for (const [from, entry] of graph) {
        if (from.startsWith('src/tests/') || from.startsWith('src/api/codegen/')) {
            continue
        }

        for (const { line, specifier, target } of entry.imports) {
            if (!target) {
                continue
            }

            const reason = importViolation(from, target)

            if (reason) {
                errors.push(`${from}:${line}: ${reason}: ${specifier} → ${target}`)
            }
        }

        const visited = new Set()

        const inspect = (file, chain) => {
            if (visited.has(file)) {
                return
            }

            visited.add(file)

            for (const edge of graph.get(file)?.imports ?? []) {
                const { specifier, target } = edge
                const shared = from.startsWith('src/') && !moduleName(from)
                const sourceModule = moduleName(from)
                const upward =
                    target &&
                    ((shared && (target.startsWith('app/') || moduleName(target))) ||
                        (sourceModule &&
                            (target.startsWith('app/') ||
                                (moduleName(target) && moduleName(target) !== sourceModule))))
                const infrastructure =
                    target &&
                    /^src\/(?:api|env|observability|mock-mode|proxy|components)\//.test(target)
                const adapter =
                    target &&
                    /(?:^|\/)(?:adapters|_components)\/|\.server\.[cm]?[jt]sx?$/.test(target)
                const external =
                    forbiddenExternal.test(specifier) ||
                    builtins.has(specifier.replace(/^node:/, ''))
                const pureViolation =
                    entry.layer &&
                    (external ||
                        infrastructure ||
                        adapter ||
                        (entry.layer === 'domain' && graph.get(target)?.layer === 'application'))
                const uiViolation =
                    from.startsWith('src/components/ui/') &&
                    target &&
                    /^(?:app\/|src\/(?:api|env|modules)\/)/.test(target)
                const forbidden = upward || pureViolation || uiViolation

                if (forbidden) {
                    errors.push(
                        `${from}: запрещённая зависимость ${[...chain, specifier].join(' → ')}`,
                    )
                } else if (target) {
                    inspect(target, [...chain, specifier])
                }
            }
        }

        inspect(from, [])
    }
    return [...new Set(errors)].sort()
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
    const errors = checkImports(process.cwd())

    if (errors.length > 0) {
        console.error(errors.join('\n'))
        process.exitCode = 1
    } else {
        process.stdout.write('Архитектурные границы импортов проверены.\n')
    }
}
