import { useServerFn } from '@tanstack/react-start'
import { useState, type FormEvent } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { applications } from '@/db/schema/applications'
import { addApplication, updateApplication } from '@/lib/applications/functions'
import { applicationStatus } from '@/lib/applications/status'

export function ApplicationForm({
	application,
	onSave,
	onCancel,
}: {
	application: typeof applications.$inferSelect | undefined
	onSave: () => Promise<void>
	onCancel: () => void
}) {
	const add = useServerFn(addApplication)
	const update = useServerFn(updateApplication)
	const [pending, setPending] = useState(false)
	const [error, setError] = useState('')

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		setPending(true)
		setError('')

		try {
			const data = {
				company: z.string().parse(form.get('company')),
				role: z.string().parse(form.get('role')),
				jobUrl: z.string().parse(form.get('jobUrl')).trim(),
				notes: z.string().parse(form.get('notes')),
				status: applicationStatus.parse(form.get('status')),
			}

			if (application) await update({ data: { ...data, id: application.id } })
			else await add({ data })
			await onSave()
		} catch {
			setError(
				'Could not save the application. Check the fields and try again.',
			)
		} finally {
			setPending(false)
		}
	}

	return (
		<section
			aria-labelledby="form-title"
			className="border-border bg-card border p-6"
		>
			<h2 id="form-title" className="mb-6 text-xl font-semibold">
				{application ? 'Edit application' : 'Add application'}
			</h2>
			<form onSubmit={submit}>
				<fieldset disabled={pending} className="space-y-5">
					<div className="grid gap-5 sm:grid-cols-2">
						<label htmlFor="company" className="space-y-2 text-sm font-medium">
							<span>Company</span>
							<Input
								id="company"
								name="company"
								required
								maxLength={200}
								defaultValue={application?.company}
								placeholder="Acme"
							/>
						</label>
						<label htmlFor="role" className="space-y-2 text-sm font-medium">
							<span>Role</span>
							<Input
								id="role"
								name="role"
								required
								maxLength={200}
								defaultValue={application?.role}
								placeholder="Product designer"
							/>
						</label>
					</div>
					<div className="grid gap-5 sm:grid-cols-2">
						<label htmlFor="job-url" className="space-y-2 text-sm font-medium">
							<span>
								Job URL{' '}
								<span className="text-muted-foreground">(optional)</span>
							</span>
							<Input
								id="job-url"
								name="jobUrl"
								type="url"
								pattern="https?://.*"
								defaultValue={application?.jobUrl}
								placeholder="https://…"
							/>
						</label>
						<label htmlFor="status" className="space-y-2 text-sm font-medium">
							<span>Status</span>
							<select
								id="status"
								name="status"
								defaultValue={application?.status ?? 'Saved'}
								className="border-input bg-background focus-visible:outline-ring h-9 w-full border px-3 text-sm focus-visible:outline-2"
							>
								{applicationStatus.options.map((status) => (
									<option key={status}>{status}</option>
								))}
							</select>
						</label>
					</div>
					<label
						htmlFor="notes"
						className="block space-y-2 text-sm font-medium"
					>
						<span>
							Notes <span className="text-muted-foreground">(optional)</span>
						</span>
						<Textarea
							id="notes"
							name="notes"
							maxLength={10_000}
							rows={3}
							defaultValue={application?.notes}
							placeholder="Contacts, next steps, or anything worth remembering."
						/>
					</label>
					{error && (
						<p role="alert" className="text-destructive text-sm">
							{error}
						</p>
					)}
					<div className="flex gap-3">
						<Button type="submit">
							{pending ? 'Saving…' : 'Save application'}
						</Button>
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
					</div>
				</fieldset>
			</form>
		</section>
	)
}
