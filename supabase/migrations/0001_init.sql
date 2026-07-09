-- Krystle's Pistols — initial schema
-- Run this once in the Supabase Dashboard SQL Editor (Project > SQL Editor > New query > paste > Run).
-- Safe to run top-to-bottom in a single execution. Idempotent-ish via IF NOT EXISTS where practical,
-- but this is meant for a single fresh run against a brand-new project.

-- ============================================================================
-- Core: accounts, poster_listings, payments, webhook_events
-- ============================================================================

create table public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'browser' check (role in ('poster','browser')),
  email text not null,
  date_of_birth date not null,
  display_name text,
  status text not null default 'active' check (status in ('active','banned','archived','deleted')),
  identity_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.poster_listings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  sanity_profile_id text not null,
  status text not null default 'draft'
    check (status in ('draft','active','expired','disabled','archived')),
  activated_at timestamptz,
  expires_at timestamptz,
  disabled_at timestamptz,
  deletion_eligible_at timestamptz,
  archived_at timestamptz,
  ai_bio_entitled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- one non-archived listing lineage per account
create unique index one_open_listing_per_account on public.poster_listings(account_id)
  where status in ('draft','active','expired','disabled');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id),
  listing_id uuid references public.poster_listings(id),
  kind text not null check (kind in ('initial_listing','extension','ai_addon','refund')),
  amount_cents integer not null,
  currency text not null default 'usd',
  provider text not null,
  provider_charge_id text not null,
  status text not null check (status in ('pending','succeeded','failed','refunded')),
  raw_event jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_charge_id)
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'payments' check (source in ('payments','persona')),
  provider text not null,
  external_event_id text not null,
  received_at timestamptz not null default now(),
  processed boolean not null default false,
  payload jsonb not null,
  unique (provider, external_event_id)
);

-- ============================================================================
-- Identity verification (Persona) — posters only
-- ============================================================================

create type public.verification_status as enum ('pending','approved','declined','expired');

create table public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  persona_inquiry_id text not null unique,
  status public.verification_status not null default 'pending',
  decline_reason text,
  raw_webhook_payload jsonb,
  created_at timestamptz not null default now(),
  status_updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create index identity_verifications_account_idx on public.identity_verifications(account_id, created_at desc);

-- ============================================================================
-- Messaging (browser <-> poster only, flat 7-day TTL)
-- ============================================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  poster_account_id uuid not null references public.accounts(id),
  browser_account_id uuid not null references public.accounts(id),
  listing_id uuid not null references public.poster_listings(id),
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  unique (poster_account_id, browser_account_id, listing_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_account_id uuid not null references public.accounts(id),
  body text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  redacted boolean not null default false,
  redacted_reason text,
  retained_for_report boolean not null default false
);
create index messages_conversation_idx on public.messages(conversation_id, created_at);
create index messages_purge_idx on public.messages(expires_at) where redacted = false and retained_for_report = false;

-- ============================================================================
-- Admin / moderation (single admin, env-var allowlist enforced in app code)
-- ============================================================================

create type public.report_target_type as enum ('listing_profile','message');
create type public.report_status as enum ('open','actioned','dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type public.report_target_type not null,
  reported_listing_id uuid references public.poster_listings(id),
  reported_message_id uuid references public.messages(id),
  reporter_account_id uuid references public.accounts(id),
  reason text not null,
  detail text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text,
  resolution_note text,
  constraint reports_target_check check (
    (target_type = 'listing_profile' and reported_listing_id is not null and reported_message_id is null) or
    (target_type = 'message' and reported_message_id is not null and reported_listing_id is null)
  )
);
create index reports_open_idx on public.reports(status, created_at);

create type public.moderation_action_type as enum
  ('unpublish_listing','reinstate_listing','ban_account','unban_account','redact_message','resolve_report');

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  action_type public.moderation_action_type not null,
  target_account_id uuid references public.accounts(id),
  target_listing_id uuid references public.poster_listings(id),
  target_message_id uuid references public.messages(id),
  report_id uuid references public.reports(id),
  admin_identifier text not null,
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.accounts enable row level security;
alter table public.poster_listings enable row level security;
alter table public.payments enable row level security;
alter table public.webhook_events enable row level security;
alter table public.identity_verifications enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;

-- accounts: read your own row only. All writes (insert/update) happen server-side via service_role.
create policy "accounts_select_own" on public.accounts
  for select using (id = auth.uid());

-- poster_listings: read your own listings only. Writes are service_role only (billing/lifecycle logic).
create policy "poster_listings_select_own" on public.poster_listings
  for select using (account_id = auth.uid());

-- payments: read your own payment history only. Writes are service_role only (webhook handler).
create policy "payments_select_own" on public.payments
  for select using (account_id = auth.uid());

-- webhook_events: no client policies at all — service_role only, front and back.

-- identity_verifications: read your own verification history only. Writes are service_role only.
create policy "identity_verifications_select_own" on public.identity_verifications
  for select using (account_id = auth.uid());

-- conversations: either party can read. Only the browser side can create, and only against an active listing.
create policy "conversations_select_party" on public.conversations
  for select using (auth.uid() = poster_account_id or auth.uid() = browser_account_id);

create policy "conversations_insert_browser_active_listing" on public.conversations
  for insert with check (
    auth.uid() = browser_account_id
    and exists (
      select 1 from public.poster_listings pl
      where pl.id = listing_id and pl.status = 'active'
    )
  );

-- messages: a party to the conversation can read; a party can insert as themselves.
create policy "messages_select_party" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.poster_account_id = auth.uid() or c.browser_account_id = auth.uid())
    )
  );

create policy "messages_insert_own" on public.messages
  for insert with check (
    sender_account_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.poster_account_id = auth.uid() or c.browser_account_id = auth.uid())
    )
  );

-- reports: anyone can file a report as themselves. No client select — admin reads via service_role.
create policy "reports_insert_own" on public.reports
  for insert with check (reporter_account_id = auth.uid());

-- moderation_actions: no client policies at all — service_role (admin routes) only.
