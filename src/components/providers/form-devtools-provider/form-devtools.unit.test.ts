import { readFileSync } from 'node:fs'

import { expect, it } from 'vitest'

import { formDevtoolsPlugins } from './form-devtools-plugins'

const devtoolsPackagePattern = /@tanstack\/react-(?:form-)?devtools/

it('registers the TanStack Form plugin in the isolated development implementation', () => {
    expect(formDevtoolsPlugins).toHaveLength(1)
    expect(formDevtoolsPlugins[0]?.name).toBe('TanStack Form')
})

it('keeps devtools package imports out of the root and safe wrapper modules', () => {
    const rootLayout = readFileSync(new URL('../../../../app/layout.tsx', import.meta.url), 'utf8')
    const safeWrapper = readFileSync(
        new URL('./form-devtools-provider.tsx', import.meta.url),
        'utf8',
    )

    expect(rootLayout).not.toMatch(devtoolsPackagePattern)
    expect(safeWrapper).not.toMatch(devtoolsPackagePattern)
})
