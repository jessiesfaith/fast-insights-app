// Private-preview login guard + 20-minute idle timeout for the FAST Insights app.
//
// React port of Scout Quest's assets/sq-idle.js: a synchronous localStorage
// guard (fi_authed / fi_email / fi_last_activity) redirects signed-out or idle
// visitors to /login before a gated page renders. The REAL session lives in
// supabase-js (persisted + auto-refreshed); these keys are the fast client-side
// gate in front of it, exactly like Scout Quest's sq_preview_* keys.
//
// The static Launch Gantt page (public/gantt/index.html) shares the same keys
// via public/fi-idle.js, so one sign-in covers both surfaces.

import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export const IDLE_MS = 20 * 60 * 1000;
const CHECK_MS = 30 * 1000;
export const AUTHED_KEY = 'fi_authed';
export const EMAIL_KEY = 'fi_email';
export const ACTIVITY_KEY = 'fi_last_activity';

export function isAuthed(): boolean {
  try {
    return localStorage.getItem(AUTHED_KEY) === '1';
  } catch {
    return false;
  }
}

export function authedEmail(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function touchActivity(): void {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — the interval check will just re-prompt sooner */
  }
}

export function isIdleExpired(): boolean {
  let last = 0;
  try {
    last = parseInt(localStorage.getItem(ACTIVITY_KEY) || '0', 10) || Date.now();
  } catch {
    last = Date.now();
  }
  return Date.now() - last > IDLE_MS;
}

/** Marks the browser signed-in after a successful 2FA code verification. */
export function markSignedIn(email: string): void {
  try {
    localStorage.setItem(AUTHED_KEY, '1');
    localStorage.setItem(EMAIL_KEY, email);
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — Supabase session still exists; guard will re-prompt */
  }
}

export function clearSignedIn(): void {
  try {
    localStorage.removeItem(AUTHED_KEY);
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

/** Full sign-out: clear the guard keys and end the Supabase session. */
export async function signOut(): Promise<void> {
  clearSignedIn();
  if (isSupabaseConfigured()) {
    try {
      await getSupabaseClient().auth.signOut();
    } catch {
      /* network hiccup — guard keys are already cleared, so the app is gated */
    }
  }
}

/** Append-only access audit (signup | login | login_2fa_ok — same events as Scout Quest). */
export async function logAccess(event: string, detail: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const sb = getSupabaseClient();
    const u = (await sb.auth.getUser()).data.user;
    if (u) await sb.from('access_audit').insert({ user_id: u.id, email: u.email, event, detail });
  } catch {
    /* audit logging must never block the user */
  }
}

function loginUrl(reason: 'required' | 'idle', from: string): string {
  return `/login?reason=${reason}&from=${encodeURIComponent(from)}`;
}

/**
 * Route guard: renders children only when the localStorage guard says the
 * visitor signed in and hasn't idled out; otherwise redirects to /login with
 * a reason + return path. While mounted it tracks activity (mousemove /
 * keydown / click / scroll / touchstart) and re-checks every 30 seconds and on
 * tab re-focus — the same behavior as Scout Quest's sq-idle.js.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.pathname + location.search;
  // Synchronous initial check so a signed-out visitor never sees a gated frame.
  const [ok, setOk] = useState(() => isAuthed() && !isIdleExpired());

  useEffect(() => {
    // Deliberately does NOT clear the guard keys on redirect: access is already
    // denied (missing key / stale activity timestamp), and staying idempotent
    // keeps React StrictMode's double-invoked dev effect from turning an
    // "idle" redirect into a "required" one. Keys refresh on the next login.
    if (!isAuthed()) {
      setOk(false);
      navigate(loginUrl('required', from), { replace: true });
      return;
    }
    if (isIdleExpired()) {
      setOk(false);
      navigate(loginUrl('idle', from), { replace: true });
      return;
    }
    setOk(true);
    touchActivity();

    const check = () => {
      if (!isAuthed()) {
        navigate(loginUrl('required', from), { replace: true });
      } else if (isIdleExpired()) {
        navigate(loginUrl('idle', from), { replace: true });
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    const events: (keyof DocumentEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((ev) => document.addEventListener(ev, touchActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(check, CHECK_MS);
    return () => {
      events.forEach((ev) => document.removeEventListener(ev, touchActivity));
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
    // location changes re-arm the guard with the new return path.
  }, [navigate, from]);

  return ok ? <>{children}</> : null;
}
