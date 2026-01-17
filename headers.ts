import type { NextConfig } from 'next/dist/server/config-shared'

export const headers: NextConfig['headers'] = async () => {
	if (process.env.NODE_ENV !== 'production') {
		return []
	}

	return [
		{
			headers: [
				{
					key: 'X-Accel-Buffering',
					value: 'no',
				},
			],
			source: '/:path*{/}?',
		},
		{
			headers: [
				{
					key: 'Cache-Control',
					value: `public, max-age=31536000, stale-while-revalidate`,
				},
			],
			locale: false,
			source: '/:all*(svg|jpg|png|jpeg|woff|woff2|webp|ico)',
		},
		{
			headers: [
				{
					key: 'X-DNS-Prefetch-Control',
					value: 'on',
				},
				{
					key: 'X-XSS-Protection',
					value: '0',
				},
				{
					key: 'X-Content-Type-Options',
					value: 'nosniff',
				},
				{
					key: 'X-Permitted-Cross-Domain-Policies',
					value: 'none',
				},
				{
					key: 'Content-Security-Policy',
					value: `
                            default-src 'self';
                            script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:;
                            worker-src 'self' blob:;
                            style-src 'self' 'unsafe-inline';
                            img-src 'self' blob: data:;
                            font-src 'self';
                            object-src 'none';
                            base-uri 'self';
                            form-action 'self';
                            frame-ancestors 'none';
                            upgrade-insecure-requests;
                            connect-src 'self' data: wss: ws:;
                        `.replaceAll('\n', ''),
				},
				{
					key: 'Cross-Origin-Opener-Policy',
					value: 'same-origin',
				},
				{
					key: 'Cross-Origin-Resource-Policy',
					value: 'same-origin',
				},
				{
					key: 'Referrer-Policy',
					value: 'no-referrer',
				},
				{
					key: 'Strict-Transport-Security',
					value: 'max-age=31536000; includeSubDomains',
				},
				{
					key: 'Permissions-Policy',
					value: `
                            accelerometer=(),
                            autoplay=(),
                            camera=(),
                            cross-origin-isolated=(),
                            display-capture=(),
                            encrypted-media=(),
                            fullscreen=(),
                            geolocation=(),
                            gyroscope=(),
                            keyboard-map=(),
                            magnetometer=(),
                            microphone=(),
                            midi=(),
                            payment=(),
                            picture-in-picture=(),
                            publickey-credentials-get=(),
                            screen-wake-lock=(),
                            sync-xhr=(self),
                            usb=(),
                            xr-spatial-tracking=(),
                            gamepad=(),
                            hid=(),
                            idle-detection=(),
                            interest-cohort=(),
                            serial=(),
                            unload=()
                            `.replaceAll('\n', ''),
				},
			],
			source: '/:path*',
		},
	]
}
