// Pulse Inbox — demo-mode view of collected survey feedback.
//
// Until the Supabase `pulse_feedback` table exists, every completed Pulse
// survey is archived on the device it ran on (localStorage). This page lists
// those records so the feedback loop can be demoed end-to-end with zero
// infrastructure: run the survey from any page, then open /pulse-inbox to see
// what the team would read. Once Supabase is configured, submissions go to
// the cloud too and the real inbox is the Supabase dashboard — this page then
// only shows what was captured on this particular device.
//
// Not linked from the Landing grid on purpose: it's an owner/demo view.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Inbox, Trash2 } from 'lucide-react';
import { CADENCES, CADENCE_LABEL } from '../lib/pulse';
import {
  clearLocalPulseRecords, downloadAllPulseRecords, getLocalPulseRecords, PulseRecord,
} from '../lib/pulseStore';

const INK = '#0F1512';
const PANEL = '#151C18';
const BUBBLE = '#212B25';
const GREEN = '#2E9E6B';
const GREEN_DK = '#1F6F4A';
const TEXT = '#EDF2EE';
const MUTED = '#93A29A';
const RULE = '#2C3630';

export default function PulseInbox() {
  const [records, setRecords] = useState<PulseRecord[]>(() => getLocalPulseRecords());
  const wishlist = useMemo(
    () => records.flatMap((r) => r.plan.roadmap.map((w) => ({ wish: w, role: r.answers.role, when: r.created_at }))),
    [records],
  );

  const clearAll = () => {
    if (window.confirm('Clear every locally saved survey on this device?')) {
      clearLocalPulseRecords();
      setRecords([]);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: INK, color: TEXT, fontSize: 14, lineHeight: 1.5 }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 20px' }}>
        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: `1px solid ${RULE}` }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 10, background: GREEN_DK }}>
            <Inbox size={19} />
          </span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: TEXT }}>Pulse inbox</h1>
            <p style={{ margin: 0, fontSize: 12.5, color: MUTED }}>
              What people asked for — demo mode, reading surveys saved on this device.
            </p>
          </div>
          <button
            onClick={() => downloadAllPulseRecords(records)}
            disabled={!records.length}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: records.length ? GREEN_DK : BUBBLE, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: records.length ? 'pointer' : 'default' }}
          >
            <Download size={14} /> Export all
          </button>
          <button
            onClick={clearAll}
            disabled={!records.length}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', color: MUTED, border: `1px solid ${RULE}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: records.length ? 'pointer' : 'default' }}
          >
            <Trash2 size={14} /> Clear
          </button>
        </header>

        <p style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>
          Demo mode: submissions are stored in this browser only. Once the Supabase{' '}
          <code style={{ color: GREEN }}>pulse_feedback</code> table exists (SQL in{' '}
          <code style={{ color: GREEN }}>src/lib/pulseStore.ts</code>), every survey from every visitor lands there,
          and the Supabase dashboard becomes the real inbox.{' '}
          <Link to="/" style={{ color: GREEN }}>← All tools</Link>
        </p>

        {/* wishlist rollup — the roadmap signal, front and center */}
        {wishlist.length > 0 && (
          <section style={{ marginTop: 24, border: `1px solid ${GREEN_DK}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: GREEN_DK, fontWeight: 600 }}>
              Wishlist rollup — what to build next ({wishlist.length})
            </div>
            <div style={{ padding: '10px 16px' }}>
              {wishlist.map((w, i) => (
                <div key={i} style={{ padding: '6px 0', borderBottom: i < wishlist.length - 1 ? `1px dashed ${RULE}` : 'none' }}>
                  <span style={{ color: TEXT }}>“{w.wish}”</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: MUTED }}>
                    — {w.role || 'unknown role'} · {new Date(w.when).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* individual submissions */}
        {records.length === 0 ? (
          <p style={{ marginTop: 40, color: MUTED }}>
            Nothing here yet. Open any page, hit the <b style={{ color: GREEN }}>Pulse</b> button bottom-right, and run
            through the survey — it lands here instantly.
          </p>
        ) : (
          records.map((r, i) => (
            <section key={i} style={{ marginTop: 20, background: PANEL, border: `1px solid ${RULE}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600 }}>{r.answers.role || 'Unknown role'}</span>
                <span style={{ fontSize: 12, color: MUTED }}>
                  {new Date(r.created_at).toLocaleString()} · from {r.source}
                </span>
              </div>
              {r.answers.tools.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {r.answers.tools.map((t) => (
                    <span key={t} style={{ fontSize: 11.5, border: `1px solid ${RULE}`, borderRadius: 999, padding: '2px 10px', color: TEXT }}>{t}</span>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 10, fontSize: 13 }}>
                <div><span style={{ color: MUTED }}>Pain: </span>{r.answers.pain || '—'}</div>
                <div><span style={{ color: MUTED }}>Wish: </span>{r.answers.wish || '—'}</div>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: MUTED }}>
                Suggested rhythm:{' '}
                {CADENCES.map((c) => `${CADENCE_LABEL[c]} ${r.plan[c].length}`).join(' · ')}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
