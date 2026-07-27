# FAST Insights auth — Supabase setup runbook

One-time dashboard setup to activate the account / NDA / login / password-reset
system (the Scout Quest pattern). Everything here happens at
https://supabase.com/dashboard/project/vsdvqzbffbjyaemnimje — the project the
app points at (ref `vsdvqzbffbjyaemnimje`; the original `pikdtkqjhsektckwrkkb`
"ar-recon" ref stopped resolving 2026-07 and was replaced). ~10 minutes total.
`.env.local` and the Vercel production env already carry this project's URL +
publishable key — no key changes needed.

## 1. Run the two SQL files

SQL Editor → New query → paste + Run, one file at a time (both safe to re-run):

1. `supabase/fastinsights_auth_setup.sql` — `preview_profiles`,
   `nda_acceptances`, `access_audit` (RLS on, append-only NDA/audit) + the
   signup trigger that records NDA acceptance.
2. `supabase/fastinsights_activity_setup.sql` — `registration_activity`
   (write-only signup-funnel log).

Verify in Table Editor that all four tables exist.

## 2. Auth settings

**Authentication → Sign In / Up → Email provider:**
- Email provider: **enabled**, "Allow new users to sign up": **on**.
- **"Confirm email": OFF.** (Scout Quest behavior — signup logs straight in,
  then the app signs out and drives the password + emailed-code flow. If left
  ON, signup still works but users must click a confirm link first and the
  automatic code step is skipped.)
- Minimum password length: 8.

**Authentication → Sign In / Up (or Rate Limits/Advanced, depending on
dashboard version):**
- Email OTP expiration: **600 seconds** (the login screen says "expires in
  10 minutes").

## 3. Email templates

**Authentication → Email Templates:**

**Magic Link** template — this is the email that carries the 2FA sign-in code.
It MUST include `{{ .Token }}` (the 6-digit code). Suggested body:

```html
<h2>Your FAST Insights sign-in code</h2>
<p>Enter this code on the sign-in page. It expires in 10 minutes.</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>If you didn't request this, you can ignore this email.</p>
```

**Reset Password** template — link the user to the app's reset page with the
`token_hash` style link (the two-click, scanner-proof flow the app implements):

```html
<h2>Reset your FAST Insights password</h2>
<p><a href="{{ .SiteURL }}/login?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a></p>
<p>The link expires in 1 hour. If you didn't request this, ignore this email.</p>
```

## 4. URL configuration

**Authentication → URL Configuration:**
- Site URL: `https://app.fastinsights.io`
- Redirect URLs (add all):
  - `https://app.fastinsights.io/*`
  - `http://localhost:5173/*` (local dev)

## 5. Data tables — one check after first login

The AR data loads (`invoices`, `cash_receipts`, `credit_memos`, `gl_entries`,
`bank_statements`, `customers`) currently run with the anon key. After signing
in, the same client sends the user's `authenticated` JWT instead. With default
Supabase grants this just works — but if those tables ever got RLS policies
scoped to `anon` only, signed-in loads would start failing. **Smoke test:**
sign in → open `/ar` → "Load from cloud". If it errors, run:

```sql
grant select on public.invoices, public.cash_receipts, public.credit_memos,
  public.gl_entries, public.bank_statements, public.customers to authenticated;
-- and, only if RLS is enabled on those tables with anon-only policies,
-- recreate each select policy "to anon, authenticated".
```

## 6. Email volume (private preview vs. launch)

Supabase's built-in mailer is fine for a private preview but is rate-limited
(a few auth emails per hour). Every sign-in sends one code email. Before
opening access more widely, plug in custom SMTP (e.g. Resend) under
**Project Settings → Auth → SMTP** — this is the same open decision as the
Fast Insights notification-email question.

## 7. Account deletion procedure (same as Scout Quest)

- **User side:** users email info@fastinsights.io asking for deletion (the
  register screen and the app footer say exactly that).
- **Admin side:** Dashboard → **Authentication → Users** → find the user →
  ⋯ → **Delete user**. Cascades automatically: their `preview_profiles` row
  and `nda_acceptances` rows are deleted; `access_audit` rows remain with
  `user_id` nulled; `registration_activity` rows remain. That retention is
  what the "some records may be retained for legal/audit purposes" language
  in the app covers.

## Who signed / who signed up — where to look

- `nda_acceptances` — legal name, email, NDA version, server timestamp, user agent.
- `preview_profiles` — one row per account (name, org, role).
- `access_audit` — signup / login / login_2fa_ok / nda_accepted events.
- `registration_activity` — the signup funnel, including abandoned attempts.

## Test script (after steps 1–4)

1. Open https://app.fastinsights.io → should land on `/login`.
2. Create an account: NDA checkbox is locked until you open the NDA link;
   both boxes + 8-char password → "Agree & create account".
3. You should get a code email; enter it → lands on the tool picker.
4. Check Table Editor: `preview_profiles`, `nda_acceptances`, `access_audit`
   all have your rows.
5. Sign out (header button) → sign back in with password + fresh code.
6. "Forgot password?" → email arrives → click link → Continue → set new
   password → sign in with it.
7. Open `/gantt` signed out (new incognito window) → redirected to `/login`.
