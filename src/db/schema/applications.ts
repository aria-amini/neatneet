import {
	index,
	pgEnum,
	snakeCase,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'

import { applicationStatus } from '@/lib/applications/status'

import { user } from './auth'

export const applicationStatusEnum = pgEnum(
	'application_status',
	applicationStatus.enum,
)

export const applications = snakeCase.table(
	'applications',
	{
		id: uuid().defaultRandom().primaryKey(),
		userId: text()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		company: text().notNull(),
		role: text().notNull(),
		jobUrl: text().notNull().default(''),
		notes: text().notNull().default(''),
		status: applicationStatusEnum().notNull().default('Saved'),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('applications_user_created_index').on(table.userId, table.createdAt),
	],
)

export const applicationInput = createInsertSchema(applications, {
	company: z.string().trim().min(1, 'Enter a company.').max(200),
	role: z.string().trim().min(1, 'Enter a role.').max(200),
	jobUrl: z.union([z.literal(''), z.url({ protocol: /^https?$/ })]).default(''),
	notes: z.string().trim().max(10_000).default(''),
	status: applicationStatus,
}).pick({ company: true, role: true, jobUrl: true, notes: true, status: true })

export const applicationId = createSelectSchema(applications).pick({ id: true })

export const applicationUpdate = applicationInput.extend(applicationId.shape)
