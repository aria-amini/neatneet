import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { serverEnv } from '@/env.server'

import { getAuth } from './config'

export const getCurrentSession = createServerFn({ method: 'GET' }).handler(
	async () => {
		const session = await getAuth().api.getSession({
			headers: getRequestHeaders(),
		})

		return session
			? { user: { id: session.user.id, name: session.user.name } }
			: null
	},
)

export const getAuthFeatures = createServerFn({ method: 'GET' }).handler(
	() => ({
		googleEnabled: Boolean(
			serverEnv.GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET,
		),
	}),
)
