import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { expect, it } from 'vitest'

import { checkImports } from '../../../tools/check-imports.mjs'

function check(files: Record<string, string>) {
    const root = mkdtempSync(path.join(tmpdir(), 'architecture-'))

    try {
        const fixtures = {
            'tsconfig.json': JSON.stringify({
                compilerOptions: {
                    paths: { '#/*': ['./src/*'], '@/*': ['./app/*'], '~/*': ['./*'] },
                },
            }),
            ...files,
        }

        for (const [file, text] of Object.entries(fixtures)) {
            mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
            writeFileSync(path.join(root, file), text)
        }
        return checkImports(root)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
}

it.each([
    ['общий код в маршрут', 'src/utils/a.ts', "import '@/page'", 'app/page.ts'],
    [
        'модуль в соседний модуль',
        'src/modules/a/a.ts',
        "import '../b/index'",
        'src/modules/b/index.ts',
    ],
    [
        'обход API facet',
        'app/page.ts',
        "import type { X } from '#/api/codegen/x'",
        'src/api/codegen/x.ts',
    ],
    [
        'обход index компонента',
        'app/page.ts',
        "export * from '#/components/ui/button/button'",
        'src/components/ui/button/button.ts',
    ],
    [
        'обход вложенного index',
        'app/page.ts',
        "import '#/components/ui/form/fields/index'",
        'src/components/ui/form/fields/index.ts',
    ],
    [
        'обход входа модуля',
        'app/page.ts',
        "import '#/modules/a/internal'",
        'src/modules/a/internal.ts',
    ],
    [
        'динамический импорт env из UI',
        'src/components/ui/button/button.ts',
        "import('#/env/server')",
        'src/env/server.ts',
    ],
    [
        'чужой route-local UI',
        'app/a/page.ts',
        "import '../b/_components/button'",
        'app/b/_components/button.ts',
    ],
])('отклоняет %s', (_title, from, source, target) => {
    expect(check({ [from]: source, [target]: 'export interface X {}' }).length).toBeGreaterThan(0)
})

it.each([
    "import 'react'",
    "type T = import('next').NextConfig",
    "require('child_process')",
    "import 'node:net'",
    "export * from 'fs/promises'",
])('отклоняет framework и IO в чистом слое: %s', (source) => {
    expect(check({ 'app/domain/rule.ts': source }).join('\n')).toContain('запрещённая зависимость')
    expect(
        check({ 'app/rule.ts': `/** @architecture application */\n${source}` }).join('\n'),
    ).toContain('запрещённая зависимость')
})

it('проверяет транзитивные зависимости через универсальный barrel и root helper', () => {
    expect(
        check({
            'src/utils/a.ts': "import '~/bridge'",
            'bridge.ts': "export * from '@/page'",
            'app/page.ts': '',
        }).join('\n'),
    ).toContain('~/bridge → @/page')
    expect(
        check({
            'app/domain/rule.ts': "import '../helper'",
            'app/helper.ts': "export * from 'next/headers'",
        }).join('\n'),
    ).toContain('../helper → next/headers')
})

it('отклоняет зависимость domain от application и вычисляемый импорт', () => {
    expect(
        check({
            'app/domain/rule.ts': "import '../application/save'",
            'app/application/save.ts': '',
        }).join('\n'),
    ).toContain('запрещённая зависимость')
    expect(check({ 'app/page.ts': 'import(target)' }).join('\n')).toContain('строковым литералом')
})

it('разрешает композицию, публичные входы, внутренние импорты и чистый IO-порт', () => {
    expect(
        check({
            'app/page.ts':
                "import '#/modules/products/server'; import '#/components/ui/button'; import '#/api'",
            'src/modules/products/server.ts':
                "import './application/save'; import './adapters/api'",
            'src/modules/products/application/save.ts':
                "import '../domain/product'; export interface Port { save(): Promise<void> }",
            'src/modules/products/domain/product.ts': 'export interface Product { name: string }',
            'src/modules/products/adapters/api.ts': "import '#/api'",
            'src/components/ui/button/index.ts': "export * from './button.js'",
            'src/components/ui/button/button.ts': "import 'react'",
            'src/api/index.ts': "export * from './codegen/client'",
            'src/api/codegen/client.ts': '',
        }),
    ).toStrictEqual([])
})

it('сообщает синтаксическую ошибку и неразрешённый локальный импорт', () => {
    expect(check({ 'app/page.ts': "import '#/missing'" }).join('\n')).toContain('не найден')
    expect(check({ 'app/page.ts': 'export const =' }).length).toBeGreaterThan(0)
})
