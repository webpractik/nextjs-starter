import { expect, test } from '@playwright/test'

test('example', async ({ page }) => {
	await page.goto('http://localhost:3000/')

	await expect(page.getByRole('heading')).toContainText('Next Starter')
})
