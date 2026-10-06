import { expect, test } from '@playwright/test'

test('landing page renders', async ({ page }) => {
	await page.goto('/')
	await expect(
		page.getByRole('link', { name: 'neatneet.', exact: true }),
	).toBeVisible()
	await page.goto('/auth/login')
	await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})
