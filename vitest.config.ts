import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

// https://vitest.dev/config/
export default defineConfig({
	define: {
		'process.env': JSON.stringify({}),
	},
	plugins: [react(), tsconfigPaths()],
	test: {
		browser: {
			enabled: true,
			headless: true,
			instances: [{ browser: 'chromium' }],
			provider: playwright(),
		},
		css: false,
		globals: true,
		include: ['**/?(*.)test.ts?(x)'],
	},
})
