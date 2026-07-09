# Krystle's Pistols — Rebuild Plan

> Canonical copy of the approved architecture/build plan, mirrored into the repo so a
> fresh session can pick up work without re-deriving context. The original lives at
> `~/.claude/plans/twinkly-finding-lighthouse.md` if it needs cross-referencing.

## Context

The current repo is a throwaway single-file mockup (`index.html` + generated `support.js` runtime + vendored `image-slot.js`) built with a proprietary Claude-Design templating system — not a real app. It's valuable only as a **design/copy reference**: dark theme, pink/purple/gold accents, Bricolage Grotesque + Manrope fonts, the full poster wizard flow, and pricing-tier copy.

The real product is a 21+ paid-listing dating platform ("posters" pay to be listed and browsable; "browsers" browse for free) that needs to move to a real stack: **Next.js (App Router) + Sanity (poster profile content) + Supabase (auth/billing/relational state)**. Mid-conversation, a second scaffold appeared in the repo (`package.json`, `metadata.jsonj`, empty `server.ts`/`tsconfig.json`/`src/main.tsx`/`src/index.css`) that looks like a Google AI Studio export (Vite + Express + `@google/genai`). Its `metadata.jsonj` description ("biometric-grade verification, ephemeral encounters, secure direct messaging, admin moderation panel") turned out to describe **real required scope**, confirmed directly — this plan includes all of it in the initial build, not as a later phase.

---

## Confirmed product decisions

1. **Two user types**: Posters (pay to be listed) and Browsers (free, unlimited — no paywall anywhere on the browsing side).
2. **Pricing — replaces the old $19/$39/$69 monthly tiers entirely**: flat **$150 for 72 hours** live. Extension: **$20/day**, repeatable indefinitely.
3. **Lockout at 72hr expiry**: listing is unpublished from browse/search immediately; **account/dashboard login stays fully accessible** so the poster can pay to extend and republish. Not an auth gate.
4. **Retention**: 7 days after a listing goes `disabled` (no extension), profile content (Sanity doc + photos/video) is hard-deleted. Supabase `poster_listings`/`payments`/`accounts` rows are soft-archived, never deleted (chargeback/compliance trail) — poster can start a fresh listing anytime after.
5. **AI Bio Maker — $10 one-time add-on per listing lineage** (not recurring). Structured Q&A (vibe/turn-on tags, favorite color/drink, ideal night) → Claude Messages API generates bio copy. Photos are uploaded for the gallery, not analyzed by AI. Hard prompt constraint: never describe the poster's appearance or who/what they're looking for.
6. **Bio page = structured form**, not a visual builder. Poster fills fields; renders into one fixed, polished template.
7. **Identity verification (Persona) — posters only.** Browsers stay low-friction (DOB self-attestation only).
8. **In-app messaging — browser ↔ poster only**, with a flat 7-day message TTL (ephemerality mechanism). Real user-to-user, never an AI persona impersonating a profile (explicitly rejected — see Addendum).
9. **Admin moderation panel — single admin**, env-var email allowlist, no RBAC needed.
10. **All of the above ships in the initial launch** (verification, messaging, admin panel are not deferred).
11. **Payments processor undecided.** Mainstream processors (Stripe/PayPal/Square) generally prohibit pay-to-list personal/companionship marketplaces under acceptable-use policy. Build behind a swappable `PaymentsProvider` interface; use Stripe only as a local dev sandbox; evaluate CCBill / Segpay / Verotel or an Authorize.net setup via a high-risk merchant broker before launch. **Pre-launch blocker, outside dev work.**

---

## Infra provisioned

- **Sanity**: project `c575t6ib` ("Krystle's Pistols"), org "Ges Development", dataset `production`. `posterProfile` schema **deployed** (source: `sanity/schemaTypes/posterProfile.ts` — deploy future changes via `npx sanity schema deploy`, NOT the Sanity MCP `deploy_schema` tool, which refuses once local Studio files exist).
- **Supabase**: dedicated project `hojfhjmdfxqidmrumxte`, under a partner's account (the user's own account was at its free-tier project limit). `.mcp.json` points here, but **the project-scoped MCP OAuth flow is broken** (persistent "not a member of pre-selected organization" error, unresolved) — schema changes go through the Supabase Dashboard SQL Editor manually instead. Full initial schema is in `supabase/migrations/0001_init.sql` and has been run.

---

## Data model

### Sanity — `sanity/schemaTypes/posterProfile.ts`

Single content type, keyed `profile-<supabaseAccountId>`. Fields: `accountId`, `slug`, `displayName`, `age`, `city`, `bio`, `bioSource` (`manual`/`ai`), `vibeTags`, `turnOnTags`, `favoriteColor`, `favoriteDrink`, `idealNight`, `photos` (max 6), `video`, `published` (app-controlled visibility flag), `badge` (unused hook for future boost upsell). No Sanity draft/publish workflow — visibility is purely the `published` boolean.

### Supabase — already created (see `supabase/migrations/0001_init.sql` for exact DDL + RLS)

- `accounts` — `id` = `auth.users.id`, `role` (poster/browser), `date_of_birth`, `status` (active/banned/archived/deleted), `identity_verified_at`.
- `poster_listings` — `sanity_profile_id`, `status` (draft/active/expired/disabled/archived), `activated_at`/`expires_at`/`disabled_at`/`deletion_eligible_at`/`archived_at`, `ai_bio_entitled`. One non-archived listing lineage per account (partial unique index).
- `payments` — `kind` (initial_listing/extension/ai_addon/refund), `amount_cents`, `provider`, `provider_charge_id` (unique per provider).
- `webhook_events` — idempotency guard shared by payments + Persona webhooks (`source` column).
- `identity_verifications` — append-only Persona inquiry history; `accounts.identity_verified_at` is a denormalized fast-path read.
- `conversations` / `messages` — browser↔poster only; messages have a flat 7-day `expires_at` TTL (the ephemerality mechanism); `retained_for_report` escape-hatches the purge for open moderation reports. **One deliberate exception to "all writes go through service-role code": message inserts happen directly from the authenticated client via RLS**, since RLS alone fully constrains it.
- `reports` / `moderation_actions` — flag targets are `listing_profile` or `message` (mutually exclusive via check constraint); every admin action logs a `moderation_actions` row.

**RLS everywhere**: select scoped to the owning `account_id = auth.uid()`; no client insert/update/delete except `conversations`/`messages` (as noted above) and `reports` (client can insert their own report). Everything else is service-role-only (Server Actions, webhook handlers, cron routes).

---

## Lifecycle enforcement

**Vercel Cron → Next.js Route Handler**, not `pg_cron`/`pg_net` (orchestrates both Supabase + Sanity, naturally app code).

- `app/api/cron/lifecycle/route.ts` (every 15 min): active listings past `expires_at` → `lib/listings/disableListing()` (status→disabled, Sanity `published:false`, sets `deletion_eligible_at=+7d`); disabled listings past `deletion_eligible_at` → hard-delete Sanity doc+assets, archive the Supabase rows.
- `lib/listings/disableListing(listingId, reason)` is shared between the cron job and admin unpublish/ban actions — one code path, can't diverge.
- `app/api/cron/message-purge/route.ts` (separate, hourly): deletes messages past `expires_at` (excluding redacted/report-held ones).

---

## Payments module

`lib/payments/provider.ts` interface: `createCheckoutSession`, `verifyAndParseWebhook`, `refund`. Concrete implementation selected via `PAYMENTS_PROVIDER` env var. Webhook lands at `app/api/webhooks/payments/route.ts` → dedupe via `webhook_events` → `lib/billing/handlePaymentEvent.ts` (the single mutation point keeping Supabase listing state and Sanity `published` in sync). Processor shortlist: CCBill, Segpay, Verotel, or Authorize.net via a high-risk broker (e.g. PaymentCloud). Stripe = local dev sandbox only.

---

## Identity verification (Persona) — posters only

Hosted Inquiry flow (no Persona IDs reach the client). `app/api/verification/start/route.ts` creates the inquiry → poster completes it on Persona's domain → `app/api/webhooks/persona/route.ts` verifies signature, dedupes via `webhook_events`, updates `identity_verifications` + `accounts.identity_verified_at` via `lib/verification/handlePersonaEvent.ts`. **Hard enforcement** is server-side in the wizard publish step and checkout-session creation (both re-check `identity_verified_at IS NOT NULL`) — `middleware.ts`'s redirect is just UX convenience, not the real gate.

---

## AI Bio Maker

Locked behind `ai_bio_entitled` (set by the `ai_addon` payment webhook, re-checked server-side in the generation route). Poster answers structured Q&A (vibe/turn-on tags, favorite color/drink, ideal night) + uploads 2-4 photos (not sent to the AI — text-only generation). `app/api/ai/generate-bio/route.ts` calls the Claude Messages API with a system prompt that hard-constrains it to never describe the poster's appearance or who they're looking for. Editable result saved to Sanity `bio` + `bioSource:'ai'`.

---

## Messaging

Real-time via **Supabase Realtime (`postgres_changes`)** — no third-party vendor, RLS already constrains who sees what. Two thin route trees: `app/dashboard/messages/[conversationId]` (poster, under existing dashboard middleware) and `app/messages/[conversationId]` (new top-level browser route, needs its own `middleware.ts` matcher). Conversations survive listing expiry (only *new* conversation creation requires an `active` listing); ephemerality is the flat 7-day message TTL, not a per-message toggle.

---

## Admin moderation panel

Single admin via `ADMIN_EMAIL` env var, checked **both** in `app/admin/layout.tsx` (page gate) and independently inside every `app/api/admin/**/route.ts` handler (layouts don't wrap Route Handlers). Routes: reports queue, report detail, listing detail (unpublish/reinstate), account detail (ban/unban), message redact. All actions reuse `lib/listings/disableListing()` where applicable and log to `moderation_actions`.

---

## App structure (Next.js App Router)

```
app/
  page.tsx                              # Landing
  (auth)/
    sign-up/{page.tsx,poster/page.tsx,browser/page.tsx}
    log-in/page.tsx
    verify-identity/{page.tsx,return/page.tsx}
  browse/{page.tsx,[slug]/page.tsx}     # free, public, no paywall
  messages/[conversationId]/page.tsx    # browser-side messaging
  dashboard/                            # poster-only, middleware-gated
    layout.tsx
    page.tsx                            # status/countdown, Publish/Extend CTA
    wizard/page.tsx                     # verification + publish gates enforced server-side
    profile-editor/page.tsx
    ai-bio/page.tsx
    billing/page.tsx
    messages/[conversationId]/page.tsx
  admin/**                              # single-admin, own auth gate
  api/
    webhooks/{payments,persona}/route.ts
    cron/{lifecycle,message-purge}/route.ts
    ai/generate-bio/route.ts
    verification/start/route.ts
    admin/**/route.ts
middleware.ts                           # session refresh (built); route gates land as routes are built
lib/
  supabase/{server.ts,client.ts}        # built
  sanity/{client.ts,queries.ts}         # client.ts built, queries.ts pending
  payments/{types.ts,provider.ts,providers/*,index.ts}   # pending
  billing/handlePaymentEvent.ts         # pending
  verification/handlePersonaEvent.ts    # pending
  listings/disableListing.ts            # pending
  messaging/                            # pending
  admin/requireAdmin.ts                 # pending
sanity/schemaTypes/posterProfile.ts     # built + deployed
```

---

## Phased build order

| Phase | Scope | Status |
|---|---|---|
| 0 | Infra: Supabase project + schema, Sanity schema deploy, Next.js scaffold, design tokens | **Done** |
| 1 | Auth + Identity Verification: signup/login, `accounts`, middleware gates; Persona hosted-flow + webhook | **Next** |
| 2 | Dashboard shell, Wizard, Profile Editor (Sanity CRUD); publish step enforces verification | Pending |
| 3 | Billing + Lifecycle Cron: `PaymentsProvider`, payments webhook, `poster_listings` state machine, `disableListing()`, 15-min cron | Pending |
| 4 | AI Bio Maker: Claude generation route, `ai_bio_entitled` gating | Pending |
| 5 | Public Browse: browse/detail pages over published Sanity docs; lightweight "Report" entry point | Pending |
| 6 | Messaging: schema/RLS (done in migration), Realtime wiring, both route trees, purge cron, "Message" CTA on browse | Pending |
| 7 | Admin Panel: `requireAdmin()`, `/admin/**`, unpublish/ban/redact/resolve | Pending |
| 8 | Polish: cross-cutting UX/error states, rate limiting, load test | Pending |

Mockup reuse: pull copy, field names, and UX flow (not code) from `reference/legacy-mockup/index.html` (signup role-picker, 6-step wizard, chip taxonomy, AI bio tone system) and visual/component ideas from `reference/vite-prototype/` (verification UI shape, admin stat-tile/chart layout, panic-button pattern, screenshot-watermark pattern) — see Addendum below for what NOT to port from the prototype.

---

## Verification approach (once each phase builds)

- Each phase should be demoable end-to-end before moving to the next.
- Webhook idempotency (`webhook_events`) — test by replaying the same event twice, confirm no duplicate mutation.
- Lifecycle cron — test with seeded rows at various `expires_at`/`deletion_eligible_at` boundaries, not just real-time waiting.
- RLS — verify cross-account reads/writes are actually denied as a non-service-role client, especially the messaging client-write exception.

---

## Addendum — prototype reconciliation (do not re-litigate)

A second prototype (Vite+React+Express+`@google/genai`, preserved at `reference/vite-prototype/`) landed mid-build. Reconciled:

- **Pricing**: prototype's flat $100/72h — **rejected**, $150/72h + $20/day + $10 AI addon stands.
- **Messaging**: prototype's "Secure Chat" was Gemini impersonating profiles, undisclosed — **rejected explicitly** (FTC precedent on this exact pattern, e.g. Match Group, Ashley Madison). Real user-to-user messaging via Supabase Realtime stands.
- **"Lister" role** (post a profile of someone else, zero consent/moderation) — **rejected**. Posters only ever manage their own profile.
- **Visual design**: superseded to the prototype's gold/black "discreet private club" aesthetic (Playfair Display + Inter + JetBrains Mono, `#D4AF37` gold scale, `#050505` background) over the original pink mockup — already ported into `app/globals.css`.
- **Reusable as UX shell only** (not the underlying fake/mocked logic): Panic Button safety-exit pattern, screenshot-protection watermark, admin stat-tile+Recharts layout shape. Slot into Phases 7/8.

---

## Env vars — status

In `.env.local` (gitignored, already populated): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (+ legacy JWT), `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`.

**Still blank, needed before the phase noted:**
- `SANITY_API_WRITE_TOKEN` — before Phase 2 (dashboard writes to Sanity). Generate at sanity.io/manage → API → Tokens, Editor permission.
- `ADMIN_EMAIL` — before Phase 7.
- `PERSONA_API_KEY` / `PERSONA_TEMPLATE_ID` / `PERSONA_WEBHOOK_SECRET` — before Phase 1's verification step.
- `CRON_SECRET` — before Phase 3's cron route.
- Payment processor keys (`STRIPE_SECRET_KEY` etc., or the chosen high-risk processor's) — before Phase 3.
- `ANTHROPIC_API_KEY` — before Phase 4.

## Other open items

- **Payment processor selection** — pre-launch blocker, evaluate CCBill/Segpay/Verotel/high-risk-broker options against actual fees/underwriting timelines.
- **Supabase project-scoped MCP OAuth** for the partner's account is unresolved (org-membership error) — schema changes go through the Dashboard SQL Editor manually; not urgent to fix, but worth revisiting for convenience.
