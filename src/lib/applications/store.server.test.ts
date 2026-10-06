import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { expect, test } from 'vite-plus/test'

import { applicationInput } from '@/db/schema/applications'
import { user } from '@/db/schema/auth'

import { createApplicationStore } from './store.server'

test('applications persist, enforce ownership, and cascade with account deletion', async () => {
	const container = await new PostgreSqlContainer('postgres:17-alpine').start()
	const pool = new Pool({ connectionString: container.getConnectionUri() })
	const database = drizzle({ client: pool })
	const store = createApplicationStore(database)

	try {
		await migrate(database, { migrationsFolder: './src/db/migrations' })
		await database.insert(user).values(
			['owner', 'other'].map((id) => ({
				id,
				name: id,
				email: `${id}@example.test`,
				createdAt: new Date(),
				updatedAt: new Date(),
			})),
		)

		const input = applicationInput.parse({
			company: ' Acme ',
			role: ' Engineer ',
			status: 'Applied',
			userId: 'other',
		})

		const created = await store.create('owner', input)
		expect(created).toMatchObject({
			company: 'Acme',
			role: 'Engineer',
			userId: 'owner',
			jobUrl: '',
			notes: '',
			status: 'Applied',
		})

		if (!created) throw new Error('Expected an application.')
		expect(await store.list('other')).toEqual([])
		await expect(
			store.update('other', { ...input, id: created.id, status: 'Offer' }),
		).rejects.toThrow('Application not found.')
		await expect(store.delete('other', created.id)).rejects.toThrow(
			'Application not found.',
		)
		expect(await store.list('owner')).toHaveLength(1)
		await store.update('owner', {
			...input,
			id: created.id,
			status: 'Interview',
			notes: 'Call on Friday',
		})
		expect(await store.list('owner')).toMatchObject([
			{ status: 'Interview', notes: 'Call on Friday' },
		])
		await store.delete('owner', created.id)
		expect(await store.list('owner')).toEqual([])
		await store.create('owner', input)
		await pool.query('DELETE FROM "user" WHERE id = $1', ['owner'])
		expect(await store.list('owner')).toEqual([])
	} finally {
		await pool.end()
		await container.stop()
	}
})

test('application validation rejects blank fields, unsafe URLs, and invalid statuses', () => {
	const valid = { company: 'Acme', role: 'Engineer', status: 'Saved' }
	expect(applicationInput.safeParse({ ...valid, company: '   ' }).success).toBe(
		false,
	)
	expect(applicationInput.safeParse({ ...valid, role: '' }).success).toBe(false)
	expect(
		applicationInput.safeParse({ ...valid, jobUrl: 'javascript:alert(1)' })
			.success,
	).toBe(false)
	expect(
		applicationInput.safeParse({ ...valid, jobUrl: 'ftp://example.com' })
			.success,
	).toBe(false)
	expect(
		applicationInput.safeParse({ ...valid, status: 'Unexpected' }).success,
	).toBe(false)
	expect(
		applicationInput.safeParse({ ...valid, notes: 'x'.repeat(10_001) }).success,
	).toBe(false)
	expect(
		applicationInput.safeParse({
			...valid,
			jobUrl: 'https://example.com/jobs/1',
		}).success,
	).toBe(true)
})
