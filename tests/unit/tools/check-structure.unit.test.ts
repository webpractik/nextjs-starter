import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { expect, it } from 'vitest'

import { checkStructure } from '../../../tools/check-structure.mjs'

it('проверяет зеркальность, обязательные артефакты и расположение CSS Modules', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'structure-'))

    function write(file: string, content = '') {
        mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
        writeFileSync(path.join(root, file), content)
    }

    try {
        write('src/components/button.tsx')
        expect(checkStructure(root)).toHaveLength(2)
        write('tests/component/src/components/button.component.test.tsx')
        write('stories/src/components/button.stories.tsx')
        expect(checkStructure(root)).toStrictEqual([])
        write('app/(public)/_components/hero.tsx')
        write('tests/component/app/(public)/_components/hero.component.test.tsx')
        expect(checkStructure(root)).toStrictEqual([])
        write('stories/app/(public)/_components/hero.stories.tsx')
        expect(checkStructure(root)).toContain(
            'stories/app/(public)/_components/hero.stories.tsx: stories разрешены только для src/components/',
        )
        rmSync(path.join(root, 'stories/app'), { recursive: true })
        write('tests/component/src/components/button.unit.test.tsx')
        expect(checkStructure(root)).toContain(
            'tests/component/src/components/button.unit.test.tsx: unit-тест в неверном проекте',
        )
        rmSync(path.join(root, 'tests/component/src/components/button.unit.test.tsx'))
        write('tests/unit/src/components/button.component.test.tsx')
        expect(checkStructure(root)).toContain(
            'tests/unit/src/components/button.component.test.tsx: компонентный тест в неверном проекте',
        )
        rmSync(path.join(root, 'tests/unit/src/components/button.component.test.tsx'))
        write('src/components/button.module.css')
        write('src/components/button.test.tsx')
        write('stories/src/components/missing.stories.tsx')
        write('tests/unit/src/missing/missing.unit.test.ts')
        expect(checkStructure(root)).toHaveLength(4)
        write('src/styles/allowed.module.css')
        expect(checkStructure(root)).toHaveLength(4)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})
