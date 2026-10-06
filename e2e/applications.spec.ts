import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

test('account, application lifecycle, filters, persistence, and private lists', async ({
	page,
}) => {
	test.setTimeout(60_000)
	const email = `neatneet-${randomUUID()}@example.test`
	const password = randomUUID()
	await page.goto('/')
	await expect(page.getByRole('switch', { name: 'Dark mode' })).toBeVisible()
	await page.getByRole('link', { name: 'Start your list' }).click()
	await page.getByLabel('Name', { exact: true }).fill('Prototype test')
	await page.getByLabel('Email', { exact: true }).fill(email)
	await page.getByLabel('Password', { exact: true }).fill(password)
	await page.getByRole('button', { name: 'Sign up', exact: true }).click()
	await expect(
		page.getByRole('heading', { name: 'Applications (0)' }),
	).toBeVisible()
	await page
		.getByRole('button', { name: 'Add application', exact: true })
		.click()
	await page.getByLabel('Company', { exact: true }).fill('Acme')
	await page.getByLabel('Role', { exact: true }).fill('Product designer')
	await page
		.getByLabel('Job URL', { exact: false })
		.fill('https://example.com/jobs/design')
	await page
		.getByLabel('Notes', { exact: false })
		.fill('Send portfolio on Friday.')
	await page.getByRole('button', { name: 'Save application' }).click()

	const application = page.getByRole('article', {
		name: 'Product designer at Acme',
	})

	await expect(application).toBeVisible()
	await expect(application.getByText('Saved', { exact: true })).toBeVisible()
	await page.reload()
	await expect(application.getByText('Send portfolio on Friday.')).toBeVisible()
	await application.getByRole('button', { name: 'Edit', exact: true }).click()
	await page
		.getByRole('combobox', { name: 'Status', exact: true })
		.selectOption('Interview')
	await page.getByRole('button', { name: 'Save application' }).click()
	await expect(
		application.getByText('Interview', { exact: true }),
	).toBeVisible()
	await page.getByRole('button', { name: 'Saved 0', exact: true }).click()
	await expect(application).not.toBeVisible()
	await page.getByRole('button', { name: 'Interview 1', exact: true }).click()
	await expect(application).toBeVisible()
	await page.getByRole('button', { name: 'Sign out', exact: true }).click()
	await expect(
		page.getByRole('link', { name: 'Start your list' }),
	).toBeVisible()
	await page.getByRole('link', { name: 'Start your list' }).click()
	await page.getByLabel('Name', { exact: true }).fill('Second account')
	await page
		.getByLabel('Email', { exact: true })
		.fill(`neatneet-${randomUUID()}@example.test`)
	await page.getByLabel('Password', { exact: true }).fill(randomUUID())
	await page.getByRole('button', { name: 'Sign up', exact: true }).click()
	await expect(
		page.getByRole('heading', { name: 'Applications (0)' }),
	).toBeVisible()
	await expect(application).not.toBeVisible()
	await page.getByRole('button', { name: 'Sign out', exact: true }).click()
	await page.getByRole('link', { name: 'Sign in', exact: true }).first().click()
	await page.getByLabel('Email', { exact: true }).fill(email)
	await page.getByLabel('Password', { exact: true }).fill(password)
	await page.getByRole('button', { name: 'Sign in', exact: true }).click()
	await expect(application).toBeVisible()
	await application.getByRole('button', { name: 'Delete', exact: true }).click()
	await application.getByRole('button', { name: 'Cancel', exact: true }).click()
	await expect(application).toBeVisible()
	await application.getByRole('button', { name: 'Delete', exact: true }).click()
	await application.getByRole('button', { name: 'Delete permanently' }).click()
	await expect(
		page.getByRole('heading', { name: 'Applications (0)' }),
	).toBeVisible()
	await page.reload()
	await expect(application).not.toBeVisible()

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth > window.innerWidth,
	)

	expect(overflow).toBe(false)
})
