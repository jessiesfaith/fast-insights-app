-- ============================================================================
-- FAST Insights — Private-preview access: accounts + NDA + audit
-- ----------------------------------------------------------------------------
-- Paste this whole file into the Supabase SQL Editor (project vsdvqzbffbjyaemnimje) and
-- Run. Safe to re-run. Port of Scout Quest's scoutquest_auth_setup.sql.
--
-- What it creates (SEPARATE from the AR demo-data tables — this does NOT touch
-- invoices / cash_receipts / credit_memos / gl_entries / bank_statements /
-- customers):
--   preview_profiles   one row per registered preview viewer (linked to Auth)
--   nda_acceptances    append-only record of who accepted which NDA version
--   access_audit       append-only log of signups / logins / NDA events
--
-- SECURITY MODEL (the important part — real personal data lives here):
--   * Row Level Security is ON for all three tables.
--   * A logged-in user can read/write ONLY their own rows (auth.uid() match).
--   * The public "anon" key has NO access to these tables at all.
--   * NDA + audit rows are append-only (no update/delete policy = denied).
--   * You (the owner) view all signups/NDAs via the Supabase Table Editor,
--     which uses the service role and bypasses RLS.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

-- One profile per registered preview viewer. id === the Supabase Auth user id.
create table if not exists public.preview_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  first_name    text,
  last_name     text,
  full_name     text,
  organization  text,
  role_note     text,                    -- e.g. "Investor", "Accounting / finance professional"
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);

-- Append-only NDA acceptances. Captured AT SIGNUP with the person's legal
-- first/last name for a stronger, court-defensible record. Versioned so a
-- future NDA re-prompts existing users.
create table if not exists public.nda_acceptances (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  email        text,
  first_name   text,
  last_name    text,
  nda_version  text not null default 'v1',
  accepted     boolean not null default true,
  accepted_at  timestamptz not null default now(),   -- authoritative server timestamp
  user_agent   text
);
create index if not exists nda_acceptances_user_idx on public.nda_acceptances (user_id);

-- Append-only access audit (signup | login | login_2fa_ok | nda_accepted).
create table if not exists public.access_audit (
  id        bigserial primary key,
  user_id   uuid references auth.users(id) on delete set null,
  email     text,
  event     text not null,
  detail    text,
  ts        timestamptz not null default now()
);
create index if not exists access_audit_user_idx on public.access_audit (user_id);

-- ---------------------------------------------------------------------------
-- 2. Row Level Security — each user only ever touches their own rows
-- ---------------------------------------------------------------------------
alter table public.preview_profiles enable row level security;
alter table public.nda_acceptances  enable row level security;
alter table public.access_audit     enable row level security;

-- profiles: read + insert + update ONLY your own row.
drop policy if exists pp_self_select on public.preview_profiles;
create policy pp_self_select on public.preview_profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists pp_self_insert on public.preview_profiles;
create policy pp_self_insert on public.preview_profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists pp_self_update on public.preview_profiles;
create policy pp_self_update on public.preview_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- nda_acceptances: read + insert your own only. No update/delete = append-only.
drop policy if exists nda_self_select on public.nda_acceptances;
create policy nda_self_select on public.nda_acceptances
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists nda_self_insert on public.nda_acceptances;
create policy nda_self_insert on public.nda_acceptances
  for insert to authenticated with check (auth.uid() = user_id);

-- access_audit: read + insert your own only. No update/delete = append-only.
drop policy if exists aa_self_select on public.access_audit;
create policy aa_self_select on public.access_audit
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists aa_self_insert on public.access_audit;
create policy aa_self_insert on public.access_audit
  for insert to authenticated with check (auth.uid() = user_id);

-- Grants: 'authenticated' (logged-in) role only. 'anon' gets nothing here.
grant usage on schema public to authenticated;
grant select, insert, update on public.preview_profiles to authenticated;
grant select, insert         on public.nda_acceptances  to authenticated;
grant select, insert         on public.access_audit     to authenticated;
grant usage on sequence public.nda_acceptances_id_seq to authenticated;
grant usage on sequence public.access_audit_id_seq    to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Auto-create a profile row the moment someone signs up
--    (reads full_name / organization / role_note from the signup metadata)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_preview_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text := new.raw_user_meta_data->>'first_name';
  v_last  text := new.raw_user_meta_data->>'last_name';
  v_full  text := nullif(trim(coalesce(v_first,'') || ' ' || coalesce(v_last,'')), '');
begin
  insert into public.preview_profiles (id, email, first_name, last_name, full_name, organization, role_note)
  values (
    new.id, new.email, v_first, v_last,
    coalesce(new.raw_user_meta_data->>'full_name', v_full),
    new.raw_user_meta_data->>'organization',
    new.raw_user_meta_data->>'role_note'
  )
  on conflict (id) do nothing;

  insert into public.access_audit (user_id, email, event, detail)
  values (new.id, new.email, 'signup', 'preview account created');

  -- Capture the NDA acceptance at the moment of signup: legal first/last name
  -- + email + NDA version + authoritative server timestamp.
  if coalesce(new.raw_user_meta_data->>'nda_agreed', '') = 'true' then
    insert into public.nda_acceptances (user_id, email, first_name, last_name, nda_version, accepted, user_agent)
    values (
      new.id, new.email, v_first, v_last,
      coalesce(new.raw_user_meta_data->>'nda_version', 'v1'), true,
      new.raw_user_meta_data->>'nda_user_agent'
    );
    insert into public.access_audit (user_id, email, event, detail)
    values (new.id, new.email, 'nda_accepted',
            'NDA ' || coalesce(new.raw_user_meta_data->>'nda_version','v1') || ' accepted at signup');
  end if;

  return new;
end
$$;

drop trigger if exists on_auth_user_created_preview on auth.users;
create trigger on_auth_user_created_preview
  after insert on auth.users
  for each row execute function public.handle_new_preview_user();

-- ============================================================================
-- Done. Verify in Table Editor: preview_profiles / nda_acceptances / access_audit.
-- To see who has signed up or accepted the NDA, open those tables there (the
-- dashboard uses the service role, so RLS does not hide rows from you).
-- ============================================================================
