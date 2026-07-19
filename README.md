# GDG Prayagraj — Multi-College QR Treasure Hunt

A full-stack platform for running a **QR-code treasure hunt across many colleges**, built for
the **GDG Prayagraj** community's *Treasure Hunt* event. A central
admin team onboards exactly one sub-organizer per college; each sub-organizer hides physical
QR codes around their campus. Scanning a QR reveals a riddle; participants submit the solved
numeric answer on a separate public form. **The first correct submission permanently locks a
QR.** Data is strictly isolated per college, except the admin's cross-college analytics.

Built with Next.js 14 (App Router), TypeScript, Tailwind + shadcn/ui, Prisma + PostgreSQL
(Neon), NextAuth (credentials), Cloudflare R2 for QR images, Recharts, Framer Motion and
`canvas-confetti`. Themed strictly in the four Google brand colors.

---

## How it works

- **Super Admin** — seeded (no self-signup). Manages colleges, seeds the email allowlist,
  resets sub-organizer passwords, views cross-college analytics, and can drill into any
  college read-only.
- **Sub-organizer** — one account per college. Signs up **only** with a pre-approved
  allowlisted email. Fully isolated to their own college. Controls their hunt start/end
  window, creates/manages QR codes, sees the attempt log and their leaderboard.
- **Participant** — no account. Two public surfaces per college:
  1. `/h/[slug]/riddle/[qrId]` — scan reveals the riddle + the QR ID (no answer input here).
  2. `/h/[slug]/submit` — submits QR ID + numeric answer.

### The leaderboard rule (important)

A participant's **very first submission ever** (matched by email OR phone, platform-wide) is
the only one that can count. If that first attempt was **wrong**, they're permanently
excluded — even if a later attempt is correct. If it was **correct**, they're credited and
ranked by that first attempt's timestamp. A participant appears **at most once** across the
whole leaderboard. QR-locking (first correct answer wins) is **independent** of leaderboard
eligibility — a correct answer locks the QR for everyone even if the submitter isn't eligible.

---

## Setup

### 1. Install

```bash
npm install
```

> This project pins to Next.js 14 / React 18. If your npm blocks lifecycle scripts, run
> `npx prisma generate` once after install.

### 2. Configure environment

Copy `.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string (runtime). Optionally append `&schema=treasure_hunt` to isolate tables. |
| `DIRECT_URL` | Neon **direct** connection string (migrations/seed). |
| `NEXTAUTH_SECRET` | Random secret — `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | App base URL, e.g. `http://localhost:3000`. |
| `R2_UPLOAD_ENDPOINT` / `R2_UPLOAD_PASSWORD` / `R2_PUBLIC_BASE` / `R2_KEY_PREFIX` | Worker-backed R2 uploader for QR images. |
| `NEXT_PUBLIC_APP_NAME` | Display name. |

**R2 note:** QR PNGs are uploaded through an r2-upload Worker (`R2_UPLOAD_*`). The Worker
returns only a key, so the app reconstructs the public image URL as
`${R2_PUBLIC_BASE}/${R2_KEY_PREFIX}qr/<slug>.png` and stores it on the QR record — that's what
the sub-organizer dashboard renders.

### 3. Create the schema

```bash
npm run db:push
```

### 4. Seed sample data

```bash
npm run db:seed
```

This creates an admin, two colleges (one with a claimed organizer + rich data, one with a
pending invite), QR codes in every state, and an attempt log that visibly exercises the
first-attempt leaderboard rule. It prints the sign-in credentials when done:

```
Admin          : admin@gdg.example / AdminPass123!
Sub-organizer  : aisha.northfield@gdg.example / OrganizerPass123!
Pending invite : ravi.westbrook@gdg.example  (unclaimed — try /signup)
```

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>. Sign in as the admin or organizer, or visit
`/h/northfield-tech` as a participant.

### Useful scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Production build (runs `prisma generate` first). |
| `npm run db:push` | Push the Prisma schema to the database. |
| `npm run db:seed` | Seed sample data. |
| `npm run db:reset` | Force-reset the schema and reseed. |
| `npm run db:studio` | Open Prisma Studio. |

---

## Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel.
2. Add a Neon Postgres database and set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in
   Vercel's environment variables.
3. Set `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your production URL), and the `R2_*` variables.
4. Run the schema push and seed against your production database (locally with the prod
   `DATABASE_URL`, or from a one-off job): `npm run db:push && npm run db:seed`.
5. Deploy. `npm run build` runs `prisma generate` automatically.

---

## Design system

Strictly the four official Google brand colors as accents (configured as Tailwind theme
colors, not hardcoded hex): Blue `#4285F4` (primary / active), Red `#EA4335`
(destructive / locked), Yellow `#FBBC05` (warning / pending), Green `#34A853`
(success / solved). Neutrals for backgrounds, borders and text. Mobile-first, large tap
targets, and a confetti + checkmark celebration on a winning submission.

## Known trade-offs (intentional)

No CAPTCHA, no rate limiting, and no participant identity verification on the public form —
accepted for this event's scale. Cross-college submissions are allowed and unvalidated by
design (matching is purely QR ID + answer). See the project brief for the full list.
