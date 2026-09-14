// Pulse feedback persistence.
//
// Completed surveys are the product signal ("adapt the portfolio to what
// people ask for"), so they need to reach Jessica. Primary sink: the
// `pulse_feedback` table in the existing ar-recon Supabase project (same
// VITE_SUPABASE_* env vars as the AR cloud loader; insert-only from the
// browser). When Supabase isn't configured or the insert fails, the entry is
// archived in localStorage and the widget offers a JSON download instead —
// the survey never blocks on infrastructure.
//
// One-time Supabase setup (SQL editor):
//   create table if not exists pulse_feedback (
//     id uuid primary key default gen_random_uuid(),
//     created_at timestamptz not null default now(),
//     role text, tools text[], pain text, wish text,
//     plan jsonb, transcript jsonb, source text
//   );
//   alter table pulse_feedback enable row level security;
//   create policy "pulse anon insert" on pulse_feedback
//     for insert to anon with check (true);
//   -- no select policy for anon: the browser can write feedback, never read it.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { PulseAnswers, PulsePlan } from './pulse';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let _client: SupabaseClient | null = null;
function client(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!_client) _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

export interface PulseRecord {
  answers: PulseAnswers;
  plan: PulsePlan;
  transcript: Array<{ who: 'bot' | 'user'; text: string }>;
  source: string; // page path the survey ran on
  created_at: string;
}

const LOCAL_KEY = 'fi_pulse_feedback';

function archiveLocally(record: PulseRecord): void {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const arr: PulseRecord[] = raw ? JSON.parse(raw) : [];
    arr.push(record);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(arr.slice(-20)));
  } catch {
    /* storage unavailable — the download path still works */
  }
}

/** Persist a completed survey. Resolves to where it landed. */
export async function savePulseRecord(record: PulseRecord): Promise<'cloud' | 'local'> {
  archiveLocally(record); // belt and braces: keep a local copy either way
  const db = client();
  if (!db) return 'local';
  try {
    const { error } = await db.from('pulse_feedback').insert({
      role: record.answers.role,
      tools: record.answers.tools,
      pain: record.answers.pain,
      wish: record.answers.wish,
      plan: record.plan,
      transcript: record.transcript,
      source: record.source,
    });
    return error ? 'local' : 'cloud';
  } catch {
    return 'local';
  }
}

/** Blob-URL download of the record so the user can send it along manually. */
export function downloadPulseRecord(record: PulseRecord): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fast-insights-pulse.json';
  a.click();
  URL.revokeObjectURL(url);
}

/** All survey records archived on this device (newest first) — the demo-mode
 *  inbox reads these until the Supabase table exists. */
export function getLocalPulseRecords(): PulseRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const arr: PulseRecord[] = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? [...arr].reverse() : [];
  } catch {
    return [];
  }
}

export function clearLocalPulseRecords(): void {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* nothing to clear */
  }
}

export function downloadAllPulseRecords(records: PulseRecord[]): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fast-insights-pulse-inbox.json';
  a.click();
  URL.revokeObjectURL(url);
}
