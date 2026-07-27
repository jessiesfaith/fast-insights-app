-- ============================================================================
-- FAST Insights — Registration activity (funnel / abandoned-signup log)
-- ----------------------------------------------------------------------------
-- Paste into the Supabase SQL Editor (project vsdvqzbffbjyaemnimje) and Run. Safe to
-- re-run. Port of Scout Quest's scoutquest_activity_setup.sql.
--
-- Captures WHATEVER a visitor types into the sign-up form as they go — even if
-- they never finish — so you can see partial / abandoned attempts. One row per
-- meaningful moment (a field filled, NDA opened, submit attempt, completed, left).
--
-- ⚠️ NEVER stores the password. Only name/email/org/role + which boxes + stage.
-- SECURITY: write-only for the public key (INSERT only, NO read/update/delete).
--   Only you (service role, via Table Editor) can read it. Clear it
--   periodically if it grows.
-- ============================================================================

create table if not exists public.registration_activity (
  id               bigserial primary key,
  session_id       uuid,                 -- groups all rows from one person's visit
  first_name       text,
  last_name        text,
  email            text,
  organization     text,
  role_note        text,
  nda_opened       boolean default false,
  nda_checked      boolean default false,
  identity_checked boolean default false,
  stage            text,                 -- field_entry | nda_opened | submit_attempt | completed | left
  completed        boolean default false,
  user_agent       text,
  created_at       timestamptz not null default now()
);
create index if not exists reg_activity_session_idx on public.registration_activity (session_id);
create index if not exists reg_activity_created_idx on public.registration_activity (created_at);

alter table public.registration_activity enable row level security;

-- The public key may INSERT only (so pre-signup / abandoned attempts can be logged).
-- No SELECT/UPDATE/DELETE policy = denied. This table is write-only to the world.
drop policy if exists ra_public_insert on public.registration_activity;
create policy ra_public_insert on public.registration_activity
  for insert to anon, authenticated with check (true);

grant insert on public.registration_activity to anon, authenticated;
grant usage on sequence public.registration_activity_id_seq to anon, authenticated;

-- ============================================================================
-- Done. View partial/abandoned sign-ups in Table Editor → registration_activity.
-- Group by session_id to see each person's progression; the last row per session
-- shows how far they got. completed = true means they finished the account.
-- ============================================================================
