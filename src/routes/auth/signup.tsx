import {
	Link,
	createFileRoute,
	useHydrated,
	useNavigate,
} from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { GoogleAuthButton } from '@/components/google-auth-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'
import { redirectAuthenticatedUsers } from '@/lib/auth/functions'
import { getAuthFeatures } from '@/lib/auth/session'

export const Route = createFileRoute('/auth/signup')({
	beforeLoad: redirectAuthenticatedUsers,
	loader: () => getAuthFeatures(),
	component: Signup,
})

function Signup() {
	const { googleEnabled } = Route.useLoaderData()
	const hydrated = useHydrated()
	const navigate = useNavigate()
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [pending, setPending] = useState(false)

	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		setPending(true)

		try {
			const { error } = await authClient.signUp.email({ name, email, password })

			if (error) toast.error(error.message)
			else await navigate({ to: '/' })
		} catch {
			toast.error('Could not create your account. Try again.')
		} finally {
			setPending(false)
		}
	}

	return (
		<main className="grid min-h-dvh place-items-center p-6">
			<Card className="w-full max-w-md">
				<CardContent>
					<div className="space-y-6">
						<h1 className="text-3xl font-bold">Create account</h1>
						{googleEnabled && (
							<GoogleAuthButton fallbackRedirect="/" className="w-full" />
						)}
						<form onSubmit={submit}>
							<fieldset disabled={!hydrated || pending} className="space-y-4">
								<Input
									aria-label="Name"
									autoComplete="name"
									required
									placeholder="Name"
									value={name}
									onChange={(event) => setName(event.target.value)}
								/>
								<Input
									aria-label="Email"
									autoComplete="email"
									required
									type="email"
									placeholder="Email"
									value={email}
									onChange={(event) => setEmail(event.target.value)}
								/>
								<Input
									aria-label="Password"
									autoComplete="new-password"
									required
									minLength={8}
									type="password"
									placeholder="Password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
								/>
								<Button type="submit" className="w-full" disabled={pending}>
									{pending ? 'Creating account…' : 'Sign up'}
								</Button>
							</fieldset>
						</form>
						<Link to="/auth/login" className="text-sm underline">
							Already have an account? Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</main>
	)
}
