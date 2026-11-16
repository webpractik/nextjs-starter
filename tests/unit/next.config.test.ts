import { expect, it } from 'vitest'

import nextConfig from '~/next.config'

it('не разрешает обработку SVG оптимизатором изображений', () => {
    expect(nextConfig.images?.dangerouslyAllowSVG ?? false).toBe(false)
})
