import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { db } from '@/db'
import {
	applicationId,
	applicationInput,
	applicationUpdate,
} from '@/db/schema/applications'
import { getAuth } from '@/lib/auth/config'

import { createApplicationStore } from './store.server'

const authenticated = createMiddleware({ type: 'function' }).server(
	async ({ next }) => {
		const session = await getAuth().api.getSession({
			headers: getRequestHeaders(),
		})

		if (!session) throw new Error('Sign in to manage your applications.')

		return next({ context: { userId: session.user.id } })
	},
)

export const listApplications = createServerFn({ method: 'GET' })
	.middleware([authenticated])
	.handler(({ context }) => createApplicationStore(db).list(context.userId))

export const addApplication = createServerFn({ method: 'POST' })
	.middleware([authenticated])
	.validator(applicationInput)
	.handler(({ context, data }) =>
		createApplicationStore(db).create(context.userId, data),
	)

export const updateApplication = createServerFn({ method: 'POST' })
	.middleware([authenticated])
	.validator(applicationUpdate)
	.handler(({ context, data }) =>
		createApplicationStore(db).update(context.userId, data),
	)

export const deleteApplication = createServerFn({ method: 'POST' })
	.middleware([authenticated])
	.validator(applicationId)
	.handler(({ context, data }) =>
		createApplicationStore(db).delete(context.userId, data.id),
	)
