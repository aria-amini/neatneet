import {
	Link,
	createFileRoute,
	useHydrated,
	useNavigate,
} from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { GoogleAuthButton } from '@/components/google-auth-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'
import { redirectAuthenticatedUsers } from '@/lib/auth/functions'
import { getAuthFeatures } from '@/lib/auth/session'

export const Route = createFileRoute('/auth/login')({
	beforeLoad: redirectAuthenticatedUsers,
	loader: () => getAuthFeatures(),
	validateSearch: z.object({
		redirect: z
			.string()
			.startsWith('/')
			.refine((value) => !value.startsWith('//') && !value.includes('\\'))
			.optional(),
	}),
	component: Login,
})

function Login() {
	const { googleEnabled } = Route.useLoaderData()
	const hydrated = useHydrated()
	const navigate = useNavigate()
	const search = Route.useSearch()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [pending, setPending] = useState(false)

	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		setPending(true)

		try {
			const result = await authClient.signIn.email({
				email,
				password,
				callbackURL: search.redirect ?? '/',
			})

			if (result.error) toast.error(result.error.message)
			else await navigate({ to: search.redirect ?? '/' })
		} catch {
			toast.error('Could not sign in. Try again.')
		} finally {
			setPending(false)
		}
	}

	return (
		<main className="grid min-h-dvh place-items-center p-6">
			<Card className="w-full max-w-md">
				<CardContent>
					<div className="space-y-6">
						<h1 className="text-3xl font-bold">Sign in</h1>
						{googleEnabled && (
							<GoogleAuthButton fallbackRedirect="/" className="w-full" />
						)}
						<form onSubmit={submit}>
							<fieldset disabled={!hydrated || pending} className="space-y-4">
								<Input
									aria-label="Email"
									autoComplete="email"
									required
									type="email"
									placeholder="you@example.com"
									value={email}
									onChange={(event) => setEmail(event.target.value)}
								/>
								<Input
									aria-label="Password"
									autoComplete="current-password"
									required
									type="password"
									placeholder="Password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
								/>
								<Button type="submit" className="w-full" disabled={pending}>
									{pending ? 'Signing in…' : 'Sign in'}
								</Button>
							</fieldset>
						</form>
						<p className="text-sm">
							New here?{' '}
							<Link to="/auth/signup" className="underline">
								Create an account
							</Link>
						</p>
					</div>
				</CardContent>
			</Card>
		</main>
	)
}
