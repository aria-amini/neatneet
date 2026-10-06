import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth, type BetterAuthOptions } from 'better-auth'
import { oAuthProxy } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { db } from '@/db'
import { account, session, user, verification } from '@/db/schema'
import { serverEnv as env } from '@/env.server'

const appOrigin = new URL(env.BETTER_AUTH_URL).origin

export const allowedHosts = [
	'127.0.0.1:*',
	'localhost:*',
	'*.localhost',
	'*.localhost:*',
	'*.lvh.ariaamini.com',
	'*.dev.ariaamini.com',
	'lima.tail6c944a.ts.net:8449',
	'neatneet-*.up.railway.app',
	'app-neatneet-*.up.railway.app',
]

export function getAuth() {
	const options: BetterAuthOptions = {
		appName: 'neatneet',
		baseURL: {
			allowedHosts,
			protocol: 'auto',
			fallback: appOrigin,
		},
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: { account, session, user, verification },
		}),
		emailAndPassword: { enabled: true, autoSignIn: true },
		plugins:
			env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
				? [
						// Dev uses a shared "Desktop app" Google OAuth client, which
						// accepts any loopback port without registration — so every
						// app/workspace bounces through its own daemon (appOrigin is
						// localhost:<port> in dev). In prod appOrigin is the real
						// domain and the proxy no-ops.
						oAuthProxy({
							productionURL: appOrigin,
							secret: env.OAUTH_PROXY_SECRET,
						}),
						tanstackStartCookies(),
					]
				: [tanstackStartCookies()],
	}

	if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
		return betterAuth({
			...options,
			socialProviders: {
				google: {
					clientId: env.GOOGLE_CLIENT_ID,
					clientSecret: env.GOOGLE_CLIENT_SECRET,
				},
			},
		})
	}

	return betterAuth(options)
}
