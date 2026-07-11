# LoadPilot

Automated freight booking and document management for owner-operators and small fleets.

## Status: Phase 1–3 scaffolded, ready to run against a real Supabase project

## What's built

**Database** (`supabase/migrations/`)
- Full multi-tenant schema: `companies`, `profiles`, `drivers`, `trucks`, `loads`, `documents`, `brokers`, `facilities`, `detention_events`, `revenue_recovery_items`, `email_parse_log`
- Row Level Security on every table, scoped by `company_id` — one carrier can never read another's data, enforced at the database layer, not just in app code
- Private Storage bucket for documents, folder-scoped per company
- Realtime enabled on `loads`, `documents`, `detention_events`, `revenue_recovery_items` so the dashboard updates live

**Auth**
- Email/password via Supabase Auth
- Signup calls a `SECURITY DEFINER` RPC (`create_company_and_owner`) so a new user can only ever create their *own* company — never insert into an arbitrary `company_id`
- Middleware refreshes sessions and protects every route except `/login`, `/signup`

**Loads** — the full vertical slice: list (`/loads`), create (`/loads/new`, server action), detail (`/loads/[id]`) with linked documents and detention

**Drivers, Trucks** — list + create, same pattern as Loads

**Documents** — Storage upload → `documents` row → hands off to the AI parser automatically

**AI email parsing + rate confirmation parser** (`src/lib/ai/extract-load-data.ts`)
- One shared extraction schema so a load booked by forwarded email and a load booked by uploaded PDF land in the same shape
- `/api/parse-rate-confirmation` — reads an uploaded document from Storage, extracts fields, matches it to an existing load by load number, flags low-confidence results for review instead of guessing
- `/api/webhooks/inbound-email` — receives broker emails forwarded to `loads+{company_id}@parse.loadpilot.com`, and **auto-books** the load only when confidence ≥ 90% and the essentials (rate, lane, load number) are present. Anything softer lands in `email_parse_log` for a human to confirm — the goal is less admin work, not silent bad bookings.

**Broker CRM** (`/brokers`) — auto-populated as loads are booked; credit rating and pay-speed are stubbed for a Phase 4 credit-API integration

**Facility database** (`/facilities`) — shippers/receivers auto-created from booked loads, designed to accumulate detention history over time

**Revenue recovery engine** (`src/lib/engine/revenue-recovery.ts`)
- Detects short pays (`rate_paid < rate_confirmed`) and unbilled detention (closed `detention_events` with billable minutes) and files a `revenue_recovery_items` row a dispatcher can dispute in one click
- Deliberately conservative — only flags variance against a stored rate confirmation or a closed detention event, never an estimate
- Runs hourly via `/api/cron/revenue-recovery` (see `vercel.json`)

## What's next (not yet built)

- **Detention timer automation** — the schema and UI support `detention_events`, but the geofence trigger (ELD webhook → auto check-in/check-out) isn't wired up yet. That's the next PR.
- **Broker credit API integration** — `brokers.credit_rating` and `avg_days_to_pay` are manually editable placeholders until a credit bureau (e.g. Ansonia, TCI) is integrated.
- **Load-matching autopilot** — the landing page's "auto-book from DAT/Truckstop" promise needs a load-board API integration (Phase 4/5 candidate) that runs the same match-and-book logic as the email parser, against external board listings instead of inbound email.
- **Expo mobile app** — driver-facing app consuming this same Supabase project (same auth, same RLS). Scaffold not yet started; next phase once the web dashboard is stable, since the mobile app is a thinner client over the same backend rather than a separate build.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase + Anthropic keys

# Link and push the schema to a real Supabase project:
npx supabase link --project-ref <your-project-ref>
npx supabase db push

npm run dev
```

Then visit `/signup` to create your first carrier account.

## Why this order

Loads first, because every other table has a foreign key to it — building
Drivers or Documents before Loads existed would mean building against a
schema that wasn't real yet. Auth had to come with Loads, not before it,
because RLS policies need `profiles.company_id` to exist to be testable at
all. AI parsing came after Documents because it needs somewhere to file
what it extracts. Revenue Recovery came last among the built pieces because
it depends on Loads having both a confirmed rate *and* a paid rate to
compare — there's nothing to recover against on day one.
