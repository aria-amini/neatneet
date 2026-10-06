import { z } from 'zod'

export const applicationStatus = z.enum([
	'Saved',
	'Applied',
	'Interview',
	'Offer',
	'Closed',
])
