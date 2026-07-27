// Sign in / create account / password reset for the FAST Insights private preview.
//
// React port of Scout Quest's login.html — the same five views and flows:
//   signin   email + password, then an emailed one-time code (2FA)
//   twofa    verify the emailed code -> mark the browser signed in
//   register first/last/org/role/email/password + NDA gate (the "I agree"
//            checkbox stays disabled until the NDA link is actually opened)
//   forgot   send a password-reset email
//   reset    arrived via the reset link; new-style token_hash links require a
//            human click before the one-time token is spent (email-scanner fix)
//
// NDA acceptance is recorded at signup via user metadata (nda_agreed /
// nda_version / identity_confirmed / nda_user_agent) which a Supabase trigger
// writes to the append-only nda_acceptances table — see
// supabase/fastinsights_auth_setup.sql. The signup funnel (including abandoned
// attempts — never the password) goes to registration_activity.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import GlassCard from '../components/ui/GlassCard';
import { logAccess, markSignedIn } from '../lib/auth';
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  getSupabaseClient,
  isSupabaseConfigured,
} from '../lib/supabase';

const NDA_VERSION = 'v1';
const SUPPORT_EMAIL = 'info@fastinsights.io';
const NOT_CONNECTED = `Sign-in isn’t connected yet. Please check back shortly or email ${SUPPORT_EMAIL}.`;

type View = 'signin' | 'twofa' | 'register' | 'forgot' | 'reset';
type Msg = { text: string; kind: 'err' | 'ok' } | null;

function friendly(err: { message?: string } | null): string {
  const m = (err && err.message) || 'Something went wrong. Please try again.';
  // Network-level failure — Supabase unreachable (e.g. the free-tier project is
  // paused, or the visitor is offline). Surface something actionable instead
  // of the browser's bare "Failed to fetch".
  if (/failed to fetch|fetch failed|networkerror|load failed/i.test(m))
    return `Can’t reach the sign-in service right now. Please try again in a minute — if it keeps happening, email ${SUPPORT_EMAIL}.`;
  if (/already registered|already been registered/i.test(m))
    return 'That email already has an account — try signing in instead.';
  if (/email not confirmed/i.test(m))
    return 'Please confirm your email first (check your inbox for the link), then sign in.';
  if (/invalid login credentials/i.test(m)) return 'Email or password is incorrect.';
  if (/rate limit|too many|security purposes/i.test(m))
    return 'Too many attempts — please wait a minute and try again.';
  if (/auth session missing|expired|invalid.*token|token.*invalid|invalid.*link|link.*invalid/i.test(m))
    return 'This reset link has expired or was already used — request a new one from the sign-in page.';
  return m;
}

// Where to send the user after a successful sign-in: back to the internal path
// the guard redirected them from. Internal app paths only (must start with a
// single "/") — never an external URL, so the login page can't be used as an
// open redirect. Default is the tool picker.
function safeFrom(raw: string | null): string {
  if (raw && /^\/(?!\/)[A-Za-z0-9/_.-]*(\?[^\s"'<>]*)?$/.test(raw)) return raw;
  return '/';
}

function newSessionId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // crypto.randomUUID needs a secure context (missing when e.g. testing over
    // a LAN IP). registration_activity.session_id is a uuid column, so the
    // fallback must still be UUID-shaped or every funnel row 400s silently.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export default function AuthPage() {
  const configured = isSupabaseConfigured();
  const sb = useMemo(() => (configured ? getSupabaseClient() : null), [configured]);

  const [view, setView] = useState<View>('signin');
  const [resetStage, setResetStage] = useState<'confirm' | 'form'>('confirm');
  const [msg, setMsg] = useState<Msg>(null);
  const [busyBtn, setBusyBtn] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [ndaOpened, setNdaOpened] = useState(false);

  // sign in
  const [siEmail, setSiEmail] = useState('');
  const [siPass, setSiPass] = useState('');
  // 2fa
  const [faCode, setFaCode] = useState('');
  // register
  const [rgFirst, setRgFirst] = useState('');
  const [rgLast, setRgLast] = useState('');
  const [rgOrg, setRgOrg] = useState('');
  const [rgRole, setRgRole] = useState('Investor');
  const [rgEmail, setRgEmail] = useState('');
  const [rgPass, setRgPass] = useState('');
  const [ndaChecked, setNdaChecked] = useState(false);
  const [identityChecked, setIdentityChecked] = useState(false);
  // forgot / reset
  const [fgEmail, setFgEmail] = useState('');
  const [rsPass, setRsPass] = useState('');
  const [rsPass2, setRsPass2] = useState('');

  const say = (text: string, kind: 'err' | 'ok') => setMsg({ text, kind });
  const clearMsg = () => setMsg(null);
  const go = (v: View) => {
    setView(v);
    // Unconfigured deploys keep the "not connected" notice on every view —
    // Scout Quest guarantees this by never attaching handlers at all; here the
    // view links stay live, so re-assert instead of clearing.
    if (configured) clearMsg();
    else say(NOT_CONNECTED, 'err');
  };

  const postLoginDest = useMemo(
    () => safeFrom(new URLSearchParams(window.location.search).get('from')),
    [],
  );

  // ---- Registration activity: capture whatever is typed, even if abandoned.
  //      NEVER the password. Same funnel stages as Scout Quest. ----
  const sessionIdRef = useRef<string>(newSessionId());
  const lastActivityKeyRef = useRef('');
  const regCompletedRef = useRef(false);
  // Latest-value mirror so the visibilitychange listener (bound once) sees
  // current form state without re-subscribing on every keystroke.
  const regStateRef = useRef({ view, rgFirst, rgLast, rgOrg, rgRole, rgEmail, ndaOpened, ndaChecked, identityChecked });
  regStateRef.current = { view, rgFirst, rgLast, rgOrg, rgRole, rgEmail, ndaOpened, ndaChecked, identityChecked };

  const logActivity = (stage: string) => {
    if (!configured) return;
    try {
      const s = regStateRef.current;
      const row = {
        session_id: sessionIdRef.current,
        first_name: s.rgFirst.trim() || null,
        last_name: s.rgLast.trim() || null,
        email: s.rgEmail.trim().toLowerCase() || null,
        organization: s.rgOrg.trim() || null,
        role_note: s.rgRole || null,
        nda_opened: s.ndaOpened,
        nda_checked: s.ndaChecked,
        identity_checked: s.identityChecked,
        stage,
        completed: regCompletedRef.current || stage === 'completed',
        user_agent: navigator.userAgent,
      };
      if (stage !== 'completed' && !row.first_name && !row.last_name && !row.email && !row.organization) return;
      const key = JSON.stringify([
        row.first_name, row.last_name, row.email, row.organization, row.role_note,
        row.nda_opened, row.nda_checked, row.identity_checked, stage,
      ]);
      if (key === lastActivityKeyRef.current) return;
      lastActivityKeyRef.current = key;
      fetch(`${SUPABASE_URL}/rest/v1/registration_activity`, {
        method: 'POST',
        keepalive: true,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(row),
      }).catch(() => {});
    } catch {
      /* funnel logging must never break the form */
    }
  };
  const logActivityRef = useRef(logActivity);
  logActivityRef.current = logActivity;

  // ---- One-time page init: reset-link detection, ?reason= messages,
  //      PASSWORD_RECOVERY listener, abandoned-signup logging. ----
  useEffect(() => {
    if (!configured) {
      say(NOT_CONNECTED, 'err');
      return;
    }
    const qp = new URLSearchParams(window.location.search);
    const tokenHash = qp.get('token_hash');
    if (tokenHash && qp.get('type') === 'recovery') {
      // New-style link: verify explicitly on an actual click (never on load) —
      // Supabase's documented fix for email security scanners silently
      // "clicking" links and burning the one-time code before a human sees it.
      setView('reset');
      setResetStage('confirm');
    } else if (qp.get('mode') === 'reset' || qp.get('code') || /type=recovery/.test(window.location.hash)) {
      // Legacy link shape — passive auto-exchange + PASSWORD_RECOVERY event.
      setView('reset');
      setResetStage('form');
    }
    const reason = qp.get('reason');
    if (reason === 'idle') say('You were signed out after 20 minutes of inactivity — please sign in again.', 'ok');
    else if (reason === 'required') say('Please sign in to continue.', 'ok');

    const { data: sub } = getSupabaseClient().auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('reset');
        setResetStage('form');
      }
    });
    const onVis = () => {
      if (document.visibilityState === 'hidden' && !regCompletedRef.current && regStateRef.current.view === 'register') {
        logActivityRef.current('left');
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      sub.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [configured]);

  const busy = (id: string, on: boolean) => setBusyBtn(on ? id : null);

  // ---- Sign in (password) -> send email code ----
  const onSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!sb) {
      say(NOT_CONNECTED, 'err');
      return;
    }
    const email = siEmail.trim().toLowerCase();
    const pass = siPass;
    if (!email || !pass) {
      say('Enter your email and password.', 'err');
      return;
    }
    busy('si', true);
    const r = await sb.auth.signInWithPassword({ email, password: pass });
    if (r.error) {
      busy('si', false);
      say(friendly(r.error), 'err');
      return;
    }
    setPendingEmail(email);
    const o = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    busy('si', false);
    if (o.error) {
      say(`Signed in, but we couldn’t email your code: ${o.error.message}`, 'err');
      return;
    }
    setFaCode('');
    setView('twofa');
    say('We emailed you a code.', 'ok');
    logAccess('login', 'password ok — code sent');
  };

  // ---- Verify 2FA code -> full access ----
  const onVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!sb) {
      say(NOT_CONNECTED, 'err');
      return;
    }
    const code = faCode.trim();
    if (!/^\d{6,10}$/.test(code)) {
      say('Enter the code from your email.', 'err');
      return;
    }
    busy('fa', true);
    const r = await sb.auth.verifyOtp({ email: pendingEmail, token: code, type: 'email' });
    busy('fa', false);
    if (r.error) {
      say(`That code didn’t work — check it or resend. (${r.error.message})`, 'err');
      return;
    }
    markSignedIn(pendingEmail);
    await logAccess('login_2fa_ok', '2FA verified');
    say('Success! Taking you in…', 'ok');
    // Full navigation (not router) — the destination may be the static /gantt/ page.
    window.setTimeout(() => {
      window.location.href = postLoginDest;
    }, 700);
  };

  const onResend = async () => {
    if (!sb) {
      say(NOT_CONNECTED, 'err');
      return;
    }
    const o = await sb.auth.signInWithOtp({ email: pendingEmail, options: { shouldCreateUser: false } });
    say(o.error ? `Couldn’t resend: ${o.error.message}` : 'A new code is on its way.', o.error ? 'err' : 'ok');
  };

  // ---- Register ----
  const onRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!sb) {
      say(NOT_CONNECTED, 'err');
      return;
    }
    const first = rgFirst.trim();
    const last = rgLast.trim();
    const org = rgOrg.trim();
    const email = rgEmail.trim().toLowerCase();
    const pass = rgPass;
    logActivity('submit_attempt');
    if (!first || !last || !email || !pass) {
      say('Please fill in your first name, last name, email, and password.', 'err');
      return;
    }
    if (pass.length < 8) {
      say('Use a password of at least 8 characters.', 'err');
      return;
    }
    if (!ndaOpened) {
      say('Please open the NDA first (click the link) — then the checkbox unlocks.', 'err');
      return;
    }
    if (!ndaChecked || !identityChecked) {
      say('Please check both boxes to continue.', 'err');
      return;
    }
    busy('rg', true);
    const r = await sb.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          first_name: first,
          last_name: last,
          full_name: `${first} ${last}`,
          organization: org,
          role_note: rgRole,
          nda_agreed: 'true',
          nda_version: NDA_VERSION,
          identity_confirmed: 'true',
          nda_user_agent: navigator.userAgent,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (r.error) {
      busy('rg', false);
      say(friendly(r.error), 'err');
      return;
    }
    regCompletedRef.current = true;
    logActivity('completed');
    // signUp() logs the browser in immediately (confirm-email is off) — sign
    // back out, then drive the SAME real sign-in path (password + emailed
    // code) automatically, so the code step always happens without making the
    // person retype what they just entered.
    await sb.auth.signOut();
    const sr = await sb.auth.signInWithPassword({ email, password: pass });
    if (sr.error) {
      busy('rg', false);
      setSiEmail(email);
      go('signin');
      say('Account created — please sign in.', 'ok');
      return;
    }
    setPendingEmail(email);
    const o = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    busy('rg', false);
    if (o.error) {
      say(`Account created, but we couldn’t email your code: ${o.error.message}`, 'err');
      return;
    }
    setFaCode('');
    setView('twofa');
    say('Account created! We emailed you a code.', 'ok');
    logAccess('login', 'registered — code sent');
  };

  // ---- Forgot password ----
  const onForgot = async (e: FormEvent) => {
    e.preventDefault();
    if (!sb) {
      say(NOT_CONNECTED, 'err');
      return;
    }
    const email = fgEmail.trim().toLowerCase();
    if (!email) {
      say('Enter your email.', 'err');
      return;
    }
    busy('fg', true);
    const r = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?mode=reset`,
    });
    busy('fg', false);
    // Surface a real send failure (e.g. the ~60s resend cooldown) instead of
    // always claiming success. Doesn't reveal whether an account exists.
    if (r.error) {
      const m = r.error.message || '';
      if (/rate limit|too many|security purposes/i.test(m))
        say('Please wait about a minute before requesting another reset link.', 'err');
      else say(friendly(r.error), 'err');
      return;
    }
    say('If that email has an account, a reset link is on its way. Check your inbox.', 'ok');
  };

  // ---- Confirm the reset link is a real click (token_hash-style links) ----
  // Only NOW — on an actual button press — is the one-time token spent.
  const onResetConfirm = async () => {
    if (!sb) {
      say(NOT_CONNECTED, 'err');
      return;
    }
    const tokenHash = new URLSearchParams(window.location.search).get('token_hash');
    if (!tokenHash) {
      say('This reset link is incomplete — request a new one from the sign-in page.', 'err');
      return;
    }
    busy('rsc', true);
    const r = await sb.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    busy('rsc', false);
    if (r.error) {
      say(friendly(r.error), 'err');
      return;
    }
    setResetStage('form');
  };

  // ---- Set new password (after reset link) ----
  const onResetSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!sb) {
      say(NOT_CONNECTED, 'err');
      return;
    }
    if (rsPass.length < 8) {
      say('Use at least 8 characters.', 'err');
      return;
    }
    if (rsPass !== rsPass2) {
      say('Those passwords don’t match.', 'err');
      return;
    }
    busy('rs', true);
    const r = await sb.auth.updateUser({ password: rsPass });
    busy('rs', false);
    if (r.error) {
      say(friendly(r.error), 'err');
      return;
    }
    say('Password updated. Please sign in with your new password.', 'ok');
    window.setTimeout(() => go('signin'), 1600);
  };

  const openNda = () => {
    // Update the ref mirror immediately — React batches the state update until
    // after this handler returns, and the 'nda_opened' funnel row must record
    // nda_opened: true (Scout Quest reads the live DOM there, so it always does).
    regStateRef.current = { ...regStateRef.current, ndaOpened: true };
    setNdaOpened(true);
    logActivity('nda_opened');
  };

  const btnLabel = (id: string, label: string) => (busyBtn === id ? 'Working…' : label);

  return (
    <div className="fi-auth">
      <style>{AUTH_CSS}</style>
      <div className="fi-auth-wrap">
        <a className="brand" href="https://fastinsights.io" aria-label="FAST Insights — home">
          <span className="mark">FI</span>
          <h1>
            FAST <em>Insights</em>
          </h1>
        </a>

        <GlassCard variant="strong" padding="26px 24px">
          {msg && (
            <div className={`msg ${msg.kind}`} role="alert" aria-live="polite">
              {msg.text}
            </div>
          )}

          {view === 'signin' && (
            <form onSubmit={onSignIn}>
              <h2>Private preview sign-in</h2>
              <p className="sub">Enter your account — we’ll email a one-time code to finish.</p>
              <div className="field">
                <label htmlFor="si-email">Email</label>
                <input id="si-email" type="email" autoComplete="email" autoCapitalize="off" value={siEmail} onChange={(e) => setSiEmail(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="si-pass">Password</label>
                <input id="si-pass" type="password" autoComplete="current-password" value={siPass} onChange={(e) => setSiPass(e.target.value)} />
              </div>
              <button className="primary" type="submit" disabled={busyBtn === 'si'}>
                {btnLabel('si', 'Sign in →')}
              </button>
              <div className="links">
                <a onClick={() => go('forgot')}>Forgot password?</a>
                <a onClick={() => go('register')}>Need access? Create an account</a>
              </div>
              <p className="help">
                Trouble signing in, or forgot which email you used? Email{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
              </p>
            </form>
          )}

          {view === 'twofa' && (
            <form onSubmit={onVerify}>
              <h2>Enter your code</h2>
              <p className="sub">
                We emailed a code to <b>{pendingEmail}</b>. It expires in 10 minutes.
              </p>
              <div className="field">
                <label htmlFor="fa-code">Code from your email</label>
                <input
                  id="fa-code"
                  className="code"
                  inputMode="numeric"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={10}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-dashlane-ignore="true"
                  data-form-type="other"
                  value={faCode}
                  onChange={(e) => setFaCode(e.target.value)}
                />
              </div>
              <button className="primary" type="submit" disabled={busyBtn === 'fa'}>
                {btnLabel('fa', 'Verify & enter →')}
              </button>
              <div className="links">
                <a onClick={onResend}>Resend code</a>
                <a onClick={() => go('signin')}>Use a different account</a>
              </div>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={onRegister}>
              <h2>Request preview access</h2>
              <p className="sub">
                Create an account to view the FAST Insights private preview. Your legal name and NDA
                agreement below are recorded with your account and the date/time you accept.
              </p>
              <div className="row2">
                <div className="field">
                  <label htmlFor="rg-first">First name</label>
                  <input id="rg-first" type="text" autoComplete="given-name" value={rgFirst} onChange={(e) => setRgFirst(e.target.value)} onBlur={() => logActivity('field_entry')} />
                </div>
                <div className="field">
                  <label htmlFor="rg-last">Last name</label>
                  <input id="rg-last" type="text" autoComplete="family-name" value={rgLast} onChange={(e) => setRgLast(e.target.value)} onBlur={() => logActivity('field_entry')} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="rg-org">Organization</label>
                <input id="rg-org" type="text" autoComplete="organization" value={rgOrg} onChange={(e) => setRgOrg(e.target.value)} onBlur={() => logActivity('field_entry')} />
              </div>
              <div className="field">
                <label htmlFor="rg-role">You are a…</label>
                <select id="rg-role" value={rgRole} onChange={(e) => setRgRole(e.target.value)} onBlur={() => logActivity('field_entry')}>
                  <option>Investor</option>
                  <option>Accounting / finance professional</option>
                  <option>Partner</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="rg-email">Email</label>
                <input id="rg-email" type="email" autoComplete="email" autoCapitalize="off" value={rgEmail} onChange={(e) => setRgEmail(e.target.value)} onBlur={() => logActivity('field_entry')} />
              </div>
              <div className="field">
                <label htmlFor="rg-pass">Password (8+ characters)</label>
                <input id="rg-pass" type="password" autoComplete="new-password" value={rgPass} onChange={(e) => setRgPass(e.target.value)} />
              </div>
              <div className="nda">
                <label className="chk">
                  <input
                    type="checkbox"
                    disabled={!ndaOpened}
                    checked={ndaChecked}
                    onChange={(e) => setNdaChecked(e.target.checked)}
                  />{' '}
                  <span>
                    I have read and agree to the FAST Insights{' '}
                    <a href="/nda" target="_blank" rel="noopener" onClick={openNda}>
                      Non-Disclosure Agreement
                    </a>
                    .{' '}
                    <span className={`chk-hint${ndaOpened ? ' done' : ''}`}>
                      {ndaOpened ? '✓ NDA opened — you can now agree' : '← open the NDA to enable this'}
                    </span>
                  </span>
                </label>
                <label className="chk">
                  <input type="checkbox" checked={identityChecked} onChange={(e) => setIdentityChecked(e.target.checked)} />{' '}
                  <span>I confirm the name above is my legal name and I am authorized to accept this agreement.</span>
                </label>
              </div>
              <button className="primary" type="submit" disabled={busyBtn === 'rg'}>
                {btnLabel('rg', 'Agree & create account →')}
              </button>
              <div className="links">
                <a onClick={() => go('signin')}>Already have an account? Sign in</a>
              </div>
              <p className="help">
                Want your account or data deleted later? Email{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we’ll remove your access
                (some records may be retained for legal/audit purposes).
              </p>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={onForgot}>
              <h2>Reset your password</h2>
              <p className="sub">Enter your email and we’ll send you a reset link.</p>
              <div className="field">
                <label htmlFor="fg-email">Email</label>
                <input id="fg-email" type="email" autoComplete="email" autoCapitalize="off" value={fgEmail} onChange={(e) => setFgEmail(e.target.value)} />
              </div>
              <button className="primary" type="submit" disabled={busyBtn === 'fg'}>
                {btnLabel('fg', 'Send reset link →')}
              </button>
              <div className="links">
                <a onClick={() => go('signin')}>Back to sign in</a>
              </div>
            </form>
          )}

          {view === 'reset' && resetStage === 'confirm' && (
            <div>
              <h2>Reset your password</h2>
              <p className="sub">
                Click below to continue. This confirms it’s really you clicking the link — not an
                automated email scanner, which is the most common reason reset links stop working
                before anyone gets to use them.
              </p>
              <button className="primary" type="button" onClick={onResetConfirm} disabled={busyBtn === 'rsc'}>
                {btnLabel('rsc', 'Continue →')}
              </button>
            </div>
          )}

          {view === 'reset' && resetStage === 'form' && (
            <form onSubmit={onResetSave}>
              <h2>Choose a new password</h2>
              <p className="sub">Enter a new password for your account.</p>
              <div className="field">
                <label htmlFor="rs-pass">New password (8+ characters)</label>
                <input id="rs-pass" type="password" autoComplete="new-password" value={rsPass} onChange={(e) => setRsPass(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="rs-pass2">Confirm new password</label>
                <input id="rs-pass2" type="password" autoComplete="new-password" value={rsPass2} onChange={(e) => setRsPass2(e.target.value)} />
              </div>
              <button className="primary" type="submit" disabled={busyBtn === 'rs'}>
                {btnLabel('rs', 'Update password →')}
              </button>
            </form>
          )}
        </GlassCard>

        <div className="foot">🔒 Private preview · your info is stored securely</div>
      </div>
    </div>
  );
}

// Page-scoped styles on top of the shared glass/token system, mirroring the
// structure of Scout Quest's login.html styling.
const AUTH_CSS = `
.fi-auth{ min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
.fi-auth-wrap{ width:100%; max-width:440px; }
.fi-auth .brand{ display:flex; align-items:center; gap:11px; justify-content:center; margin-bottom:18px; text-decoration:none; color:inherit; transition:opacity .15s ease; }
.fi-auth .brand:hover{ opacity:.85; }
.fi-auth .brand .mark{ width:38px; height:38px; border-radius:10px; background:var(--accent); color:var(--accent-contrast); font-family:var(--font-mono); font-weight:700; font-size:16px; display:flex; align-items:center; justify-content:center; flex:none; }
.fi-auth .brand h1{ font-size:20px; font-weight:600; letter-spacing:-0.01em; color:var(--text-primary); margin:0; }
.fi-auth .brand h1 em{ font-style:italic; color:var(--accent); }
.fi-auth h2{ font-size:22px; font-weight:600; color:var(--text-primary); margin:0 0 4px; }
.fi-auth .sub{ color:var(--text-tertiary); font-size:13px; margin:0 0 18px; line-height:1.5; }
.fi-auth .sub b{ color:var(--text-secondary); }
.fi-auth label{ display:block; font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.12em; color:var(--text-tertiary); margin:0 0 6px; }
.fi-auth .field{ margin-bottom:14px; }
.fi-auth input, .fi-auth select{ width:100%; background:var(--bg-elevated-2); border:1.5px solid var(--border); color:var(--text-primary); border-radius:10px; padding:11px 12px; font-size:14px; font-family:var(--font-ui); box-sizing:border-box; }
.fi-auth input:focus, .fi-auth select:focus{ outline:none; border-color:var(--accent); }
.fi-auth input.code{ letter-spacing:.4em; font-size:20px; text-align:center; font-family:var(--font-mono); }
.fi-auth button.primary{ width:100%; background:var(--accent); color:var(--accent-contrast); border:none; border-radius:10px; padding:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:var(--font-ui); transition:opacity .15s ease, transform .1s ease; margin-top:4px; }
.fi-auth button.primary:hover{ opacity:.92; }
.fi-auth button.primary:active{ transform:translateY(1px); }
.fi-auth button.primary:disabled{ opacity:.55; cursor:default; }
.fi-auth .links{ display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px; margin-top:16px; }
.fi-auth .links a{ color:var(--accent); font-size:13px; text-decoration:none; cursor:pointer; }
.fi-auth .links a:hover{ text-decoration:underline; }
.fi-auth .help{ margin-top:16px; padding-top:14px; border-top:1px solid var(--border); font-size:11.5px; color:var(--text-tertiary); line-height:1.5; margin-bottom:0; }
.fi-auth .help a{ color:var(--text-secondary); }
.fi-auth .msg{ font-size:13px; line-height:1.5; border-radius:10px; padding:10px 12px; margin-bottom:16px; }
.fi-auth .msg.err{ background:var(--severity-high-bg); border:1px solid var(--severity-high); color:var(--severity-high); }
.fi-auth .msg.ok{ background:var(--severity-resolved-bg); border:1px solid var(--severity-resolved); color:var(--severity-resolved); }
.fi-auth .row2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
@media (max-width:420px){ .fi-auth .row2{ grid-template-columns:1fr; } }
.fi-auth .nda{ margin:8px 0 14px; padding:12px 14px; background:var(--bg-elevated-2); border:1px solid var(--border); border-radius:10px; display:flex; flex-direction:column; gap:11px; }
.fi-auth .chk{ display:flex; align-items:flex-start; gap:10px; margin:0; cursor:pointer; font-family:var(--font-ui); font-size:12.5px; font-weight:400; text-transform:none; letter-spacing:normal; color:var(--text-secondary); line-height:1.45; }
.fi-auth .chk input[type="checkbox"]{ width:auto; margin:2px 0 0; flex:none; accent-color:var(--accent); transform:scale(1.15); }
.fi-auth .chk a{ color:var(--accent); }
.fi-auth .chk input[type="checkbox"]:disabled{ cursor:not-allowed; opacity:.45; }
.fi-auth .chk-hint{ display:inline-block; margin-left:4px; font-size:11px; font-style:italic; color:var(--accent); }
.fi-auth .chk-hint.done{ color:var(--severity-resolved); font-style:normal; }
.fi-auth .foot{ text-align:center; margin-top:16px; color:var(--text-muted); font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.12em; }
`;
