# neatneet

A private job application tracker built from Aria's TanStack template.

## Core

- Create an account and sign in with email and password.
- Add, edit, and delete applications.
- Store company, role, job URL, notes, and status.
- Filter by Saved, Applied, Interview, Offer, or Closed.

Postgres stores each account's applications. Server functions enforce account
ownership on every query and mutation.

## Stack

TanStack Start, React 19, Drizzle, Postgres, Better Auth, Tailwind, Varlock,
Sentry, and PostHog. Google OAuth and S3 support remain available from the
template.

## Local development

Run `mise run bootstrap` to install dependencies, configure the workspace,
remove orphaned Docker resources, migrate the database, and start the app. Use
`mise run bootstrap --verbose` for direct command output. Open
<https://lima.tail6c944a.ts.net:8449> for the current prototype. The registered
Pitchfork URL is <https://neatneet.dev.ariaamini.com>. That URL requires the
local Caddy TLS service.

Run `vp check` and `vp test run` for checks. Run
`BASE_URL=https://lima.tail6c944a.ts.net:8449 vp run e2e` for browser tests.

## Service configuration

Email/password auth and the local database work without external service
credentials. Set local service values through Varlock or your secret provider:

- `VITE_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN`: dedicated neatneet Sentry
  project.
- `VITE_PUBLIC_POSTHOG_KEY`: dedicated neatneet PostHog project.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Google OAuth.

The template disables PostHog in development. Sentry requires a DSN to send
events. Deployment also requires the production values in `.env.schema`.

## Next iteration

Use the core first. Select the next feature from actual use. Potential next
steps include application dates, reminders, and search.
