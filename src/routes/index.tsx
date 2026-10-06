import {
	Link,
	createFileRoute,
	useHydrated,
	useRouter,
} from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { cn } from 'cn'
import { useState } from 'react'

import { ApplicationForm } from '@/components/application-form'
import { Button, buttonVariants } from '@/components/ui/button'
import type { applications } from '@/db/schema/applications'
import {
	deleteApplication,
	listApplications,
} from '@/lib/applications/functions'
import { applicationStatus } from '@/lib/applications/status'
import { authClient } from '@/lib/auth/client'
import { getCurrentSession } from '@/lib/auth/session'

export const Route = createFileRoute('/')({
	loader: async () => {
		const session = await getCurrentSession()

		return { session, applications: session ? await listApplications() : [] }
	},
	component: Home,
})

function Home() {
	const hydrated = useHydrated()
	const { session, applications: entries } = Route.useLoaderData()
	const router = useRouter()
	const remove = useServerFn(deleteApplication)
	const [filter, setFilter] = useState('All')

	const [editor, setEditor] = useState<
		'new' | typeof applications.$inferSelect | null
	>(null)

	const [deleteId, setDeleteId] = useState<string | null>(null)
	const [pending, setPending] = useState(false)
	const [error, setError] = useState('')

	const visible =
		filter === 'All'
			? entries
			: entries.filter((entry) => entry.status === filter)

	async function save() {
		await router.invalidate()
		setEditor(null)
	}

	async function deleteEntry(id: string) {
		setPending(true)
		setError('')

		try {
			await remove({ data: { id } })
			await router.invalidate()
			setDeleteId(null)
		} catch {
			setError('Could not delete the application. Try again.')
		} finally {
			setPending(false)
		}
	}

	async function signOut() {
		setPending(true)
		setError('')

		try {
			const result = await authClient.signOut()

			if (result.error) throw new Error(result.error.message)
			setEditor(null)
			setDeleteId(null)
			await router.invalidate()
		} catch {
			setError('Could not sign out. Try again.')
		} finally {
			setPending(false)
		}
	}

	return (
		<div className="mx-auto max-w-5xl px-5 sm:px-8">
			<header className="border-border flex items-center justify-between gap-4 border-b py-6">
				<Link to="/" className="text-xl font-bold tracking-tight">
					neatneet<span className="text-primary">.</span>
				</Link>
				{session ? (
					<div className="flex items-center gap-4">
						<span className="text-muted-foreground hidden text-sm sm:block">
							{session.user.name}
						</span>
						<Button
							variant="ghost"
							disabled={!hydrated || pending}
							onClick={signOut}
						>
							Sign out
						</Button>
					</div>
				) : (
					<Link
						to="/auth/login"
						className={cn(buttonVariants({ variant: 'outline' }))}
					>
						Sign in
					</Link>
				)}
			</header>
			{!session ? (
				<main className="max-w-2xl space-y-6 py-24 sm:py-32">
					<p className="text-primary font-mono text-xs tracking-widest uppercase">
						One place for your next chapter
					</p>
					<h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
						A little order for your job search.
					</h1>
					<p className="text-muted-foreground max-w-lg text-lg leading-relaxed">
						Save the roles that catch your eye. Track each application. Keep
						your notes close and your next step clear.
					</p>
					<div className="flex flex-wrap gap-3 pt-3">
						<Link to="/auth/signup" className={cn(buttonVariants())}>
							Start your list
						</Link>
						<Link
							to="/auth/login"
							className={cn(buttonVariants({ variant: 'outline' }))}
						>
							Sign in
						</Link>
					</div>
					<p className="text-muted-foreground text-sm">
						Your applications stay private to your account.
					</p>
				</main>
			) : (
				<main className="space-y-8 py-10 pb-24">
					<div className="flex flex-wrap items-end justify-between gap-5">
						<div className="space-y-2">
							<p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
								Your job search, at a glance
							</p>
							<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
								Applications{' '}
								<span className="text-muted-foreground">
									({entries.length})
								</span>
							</h1>
						</div>
						<Button
							disabled={!hydrated || editor !== null}
							onClick={() => setEditor('new')}
						>
							Add application
						</Button>
					</div>
					{editor !== null && (
						<ApplicationForm
							key={editor === 'new' ? 'new' : editor.id}
							application={editor === 'new' ? undefined : editor}
							onSave={save}
							onCancel={() => setEditor(null)}
						/>
					)}
					<div
						aria-label="Filter applications"
						className="flex flex-wrap gap-2"
					>
						{['All', ...applicationStatus.options].map((status) => (
							<button
								type="button"
								key={status}
								aria-pressed={filter === status}
								disabled={!hydrated}
								onClick={() => setFilter(status)}
								className={cn(
									'border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring',
									filter === status
										? 'border-foreground bg-foreground text-background'
										: 'border-border bg-card text-muted-foreground hover:text-foreground',
								)}
							>
								{status}{' '}
								<span className="ml-1 font-mono text-xs">
									{status === 'All'
										? entries.length
										: entries.filter((entry) => entry.status === status).length}
								</span>
							</button>
						))}
					</div>
					{error && (
						<p role="alert" className="text-destructive text-sm">
							{error}
						</p>
					)}
					{visible.length === 0 ? (
						<section className="border-border border border-dashed px-6 py-16 text-center">
							<h2 className="text-xl font-medium">
								{entries.length === 0
									? 'Your next chapter starts here.'
									: `No ${filter.toLowerCase()} applications yet.`}
							</h2>
							<p className="text-muted-foreground mt-3 text-sm">
								{entries.length === 0
									? 'Add a role you like. You can fill in the rest as you go.'
									: 'Choose another status to see the rest of your list.'}
							</p>
						</section>
					) : (
						<div className="divide-border border-border bg-card divide-y border">
							{visible.map((entry) => (
								<article
									key={entry.id}
									aria-label={`${entry.role} at ${entry.company}`}
									className="space-y-4 p-5 sm:p-6"
								>
									<div className="flex flex-wrap items-start justify-between gap-4">
										<div className="min-w-0 space-y-1">
											<h2 className="text-lg font-semibold break-words">
												{entry.role}
											</h2>
											<p className="text-muted-foreground text-sm break-words">
												{entry.company}
											</p>
										</div>
										<span className="border-border bg-secondary border px-3 py-1 font-mono text-xs">
											{entry.status}
										</span>
									</div>
									{entry.notes && (
										<p className="text-muted-foreground text-sm leading-relaxed break-words whitespace-pre-wrap">
											{entry.notes}
										</p>
									)}
									<div className="flex flex-wrap items-center justify-between gap-3">
										{entry.jobUrl ? (
											<a
												href={entry.jobUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm underline underline-offset-4"
											>
												View job ↗
											</a>
										) : (
											<span />
										)}
										<div className="flex items-center gap-2">
											{deleteId === entry.id ? (
												<>
													<span className="text-sm">
														Delete this application?
													</span>
													<Button
														size="sm"
														variant="destructive"
														disabled={pending}
														onClick={() => deleteEntry(entry.id)}
													>
														Delete permanently
													</Button>
													<Button
														size="sm"
														variant="outline"
														disabled={pending}
														onClick={() => setDeleteId(null)}
													>
														Cancel
													</Button>
												</>
											) : (
												<>
													<Button
														size="sm"
														variant="outline"
														disabled={!hydrated || editor !== null || pending}
														onClick={() => setEditor(entry)}
													>
														Edit
													</Button>
													<Button
														size="sm"
														variant="ghost"
														disabled={!hydrated || pending}
														onClick={() => setDeleteId(entry.id)}
													>
														Delete
													</Button>
												</>
											)}
										</div>
									</div>
								</article>
							))}
						</div>
					)}
				</main>
			)}
		</div>
	)
}
