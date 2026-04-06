import type { MetadataRoute } from 'next'

import { clientEnvironment } from '#/env/client'

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			changeFrequency: 'yearly',
			lastModified: new Date(),
			priority: 1,
			url: clientEnvironment.NEXT_PUBLIC_FRONT_URL,
		},
	]
}
