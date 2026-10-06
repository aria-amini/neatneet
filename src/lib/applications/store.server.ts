import { and, desc, eq } from 'drizzle-orm'
import type { z } from 'zod'

import type { db } from '@/db'
import {
	applications,
	type applicationInput,
	type applicationUpdate,
} from '@/db/schema/applications'

export function createApplicationStore(database: typeof db) {
	return {
		list(userId: string) {
			return database
				.select()
				.from(applications)
				.where(eq(applications.userId, userId))
				.orderBy(desc(applications.createdAt), desc(applications.id))
		},
		async create(userId: string, input: z.infer<typeof applicationInput>) {
			const [application] = await database
				.insert(applications)
				.values({ ...input, userId })
				.returning()

			return application
		},
		async update(userId: string, input: z.infer<typeof applicationUpdate>) {
			const { id, ...fields } = input

			const [application] = await database
				.update(applications)
				.set({ ...fields, updatedAt: new Date() })
				.where(and(eq(applications.id, id), eq(applications.userId, userId)))
				.returning()

			if (!application) throw new Error('Application not found.')

			return application
		},
		async delete(userId: string, id: string) {
			const [application] = await database
				.delete(applications)
				.where(and(eq(applications.id, id), eq(applications.userId, userId)))
				.returning({ id: applications.id })

			if (!application) throw new Error('Application not found.')

			return application
		},
	}
}
