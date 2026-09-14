// PulseBot — the floating feedback & suggestion chat widget.
//
// A Stripe-style one-question-per-bubble survey (role → tools → pain → wish)
// that ends in a personalized working-rhythm plan across five cadences
// (daily → yearly), each suggestion linking to a portfolio tool. Free-text
// pains and wishes are persisted (Supabase `pulse_feedback`, local fallback)
// as the portfolio-roadmap signal.
//
// Agentic when the deployment has an ANTHROPIC_API_KEY (/api/assist asks at
// most one clarifying question, personalizes the plan, and answers follow-up
// chat); falls back to the deterministic engine in src/lib/pulse.ts when it
// doesn't, so the widget works on every deployment and in local dev.
//
// UX patterns cribbed from the Rocket Money onboarding study
// (research/rocket-money.md): chips over typing, every answer wired to a
// visible output fast, cadence-bucketed suggestions, and none of their
// trust-destroyers (no paywall, no data ask before value).

import { useEffect, useRef, useState } from 'react';
import { Download, MessageCircle, RefreshCw, Send, Sparkles, X } from 'lucide-react';
import {
  buildPlan, CADENCES, CADENCE_LABEL, GUIDED_QUESTIONS, sanitizePlan,
  toolIdsFromLabels, PulseAnswers, PulsePlan,
} from '../lib/pulse';
import { downloadPulseRecord, savePulseRecord, PulseRecord } from '../lib/pulseStore';

const INK = '#0F1512';
const PANEL = '#151C18';
const BUBBLE = '#212B25';
const GREEN = '#2E9E6B';
const GREEN_DK = '#1F6F4A';
const TEXT = '#EDF2EE';
const MUTED = '#93A29A';
const RULE = '#2C3630';

interface ChatMsg {
  who: 'bot' | 'user';
  text?: string;
  plan?: PulsePlan;
}

type Phase = 'survey' | 'clarify' | 'chat';

interface AssistTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistReply {
  reply: string;
  done: boolean;
  plan: PulsePlan | null;
}

async function callAssist(answers: PulseAnswers, turns: AssistTurn[]): Promise<AssistReply | null> {
  try {
    const res = await fetch('/api/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, messages: turns }),
    });
    if (!res.ok) return null;
    const data: { reply?: unknown; done?: unknown; plan?: unknown } = await res.json();
    if (typeof data.reply !== 'string') return null;
    return {
      reply: data.reply.slice(0, 2000),
      done: Boolean(data.done),
      plan: data.plan ? sanitizePlan(data.plan) : null,
    };
  } catch {
    return null;
  }
}

const FALLBACK_REPLY =
  'Here’s the rhythm I’d suggest from what you told me — each item links straight into the tool. Your wishlist went to the Fast Insights team.';

export default function PulseBot() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('survey');
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([{ who: 'bot', text: GUIDED_QUESTIONS[0].prompt }]);
  const [answers, setAnswers] = useState<PulseAnswers>({ role: '', tools: [], pain: '', wish: '' });
  const [picked, setPicked] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [assistTurns, setAssistTurns] = useState<AssistTurn[]>([]);
  const [assistLive, setAssistLive] = useState(true);
  const [record, setRecord] = useState<PulseRecord | null>(null);
  const [savedTo, setSavedTo] = useState<'cloud' | 'local' | null>(null);
  const clarifyRounds = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, open]);

  const push = (msg: ChatMsg) => setMessages((prev) => [...prev, msg]);

  const finishWithPlan = async (finalAnswers: PulseAnswers, plan: PulsePlan, reply: string, turns: AssistTurn[]) => {
    push({ who: 'bot', text: reply });
    push({ who: 'bot', plan });
    const rec: PulseRecord = {
      answers: finalAnswers,
      plan,
      transcript: [...messages, { who: 'bot' as const, text: reply }]
        .filter((m): m is ChatMsg & { text: string } => Boolean(m.text))
        .map((m) => ({ who: m.who, text: m.text })),
      source: window.location.pathname,
      created_at: new Date().toISOString(),
    };
    setRecord(rec);
    setPhase('chat');
    setAssistTurns([...turns, { role: 'assistant', content: reply }]);
    const where = await savePulseRecord(rec);
    setSavedTo(where);
  };

  /** Survey complete (or clarify round answered) → get a plan. */
  const advanceToPlan = async (finalAnswers: PulseAnswers, turns: AssistTurn[]) => {
    setBusy(true);
    const assisted = assistLive ? await callAssist(finalAnswers, turns) : null;
    if (!assisted) {
      setAssistLive(false);
      await finishWithPlan(finalAnswers, buildPlan(finalAnswers), FALLBACK_REPLY, turns);
    } else if (!assisted.done && clarifyRounds.current < 2) {
      clarifyRounds.current += 1;
      setPhase('clarify');
      setAssistTurns([...turns, { role: 'assistant', content: assisted.reply }]);
      push({ who: 'bot', text: assisted.reply });
    } else {
      await finishWithPlan(finalAnswers, assisted.plan ?? buildPlan(finalAnswers), assisted.reply, turns);
    }
    setBusy(false);
  };

  const submitSurveyAnswer = (display: string, value: string | string[]) => {
    if (busy) return;
    const q = GUIDED_QUESTIONS[step];
    push({ who: 'user', text: display });
    const next: PulseAnswers = { ...answers };
    if (q.id === 'role') next.role = String(value);
    if (q.id === 'tools') next.tools = toolIdsFromLabels(value as string[]);
    if (q.id === 'pain') next.pain = String(value);
    if (q.id === 'wish') next.wish = String(value);
    setAnswers(next);
    setPicked([]);
    setDraft('');
    if (step + 1 < GUIDED_QUESTIONS.length) {
      setStep(step + 1);
      push({ who: 'bot', text: GUIDED_QUESTIONS[step + 1].prompt });
    } else {
      void advanceToPlan(next, []);
    }
  };

  /** Free-text send — clarify answers and post-plan chat both land here. */
  const sendDraft = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    if (phase === 'survey') {
      submitSurveyAnswer(text, text);
      return;
    }
    push({ who: 'user', text });
    const turns: AssistTurn[] = [...assistTurns, { role: 'user', content: text }];
    setAssistTurns(turns);
    if (phase === 'clarify') {
      await advanceToPlan(answers, turns);
      return;
    }
    // post-plan chat
    if (!assistLive) {
      push({ who: 'bot', text: 'Live chat isn’t configured on this deployment — but your plan above stands, and everything you typed reached the team.' });
      return;
    }
    setBusy(true);
    const assisted = await callAssist(answers, turns);
    if (!assisted) {
      setAssistLive(false);
      push({ who: 'bot', text: 'I lost my connection — your plan above still stands, and your notes reached the team.' });
    } else {
      setAssistTurns([...turns, { role: 'assistant', content: assisted.reply }]);
      push({ who: 'bot', text: assisted.reply });
      if (assisted.plan) push({ who: 'bot', plan: assisted.plan });
    }
    setBusy(false);
  };

  const restart = () => {
    setPhase('survey');
    setStep(0);
    setMessages([{ who: 'bot', text: GUIDED_QUESTIONS[0].prompt }]);
    setAnswers({ role: '', tools: [], pain: '', wish: '' });
    setPicked([]);
    setDraft('');
    setAssistTurns([]);
    setRecord(null);
    setSavedTo(null);
    clarifyRounds.current = 0;
  };

  const q = GUIDED_QUESTIONS[step];
  const showChips = phase === 'survey' && Boolean(q.options);
  const showInput = !showChips;

  return (
    <>
      <style>{`
        .pulse-scroll::-webkit-scrollbar { width: 6px; }
        .pulse-scroll::-webkit-scrollbar-thumb { background: ${RULE}; border-radius: 3px; }
        @keyframes pulse-dot { 0%, 80%, 100% { opacity: .25 } 40% { opacity: 1 } }
        .pulse-typing span { animation: pulse-dot 1.2s infinite; display: inline-block; }
        .pulse-typing span:nth-child(2) { animation-delay: .2s }
        .pulse-typing span:nth-child(3) { animation-delay: .4s }
        .pulse-link:hover { text-decoration: underline; }
      `}</style>

      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Pulse — tell us what you need"
          style={{
            position: 'fixed', right: 20, bottom: 20, zIndex: 9000,
            display: 'flex', alignItems: 'center', gap: 8,
            background: GREEN_DK, color: '#fff', border: 'none', cursor: 'pointer',
            borderRadius: 999, padding: '12px 18px', fontSize: 14, fontWeight: 600,
            boxShadow: '0 6px 24px rgba(0,0,0,.35)',
          }}
        >
          <MessageCircle size={17} /> Pulse
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Pulse feedback assistant"
          style={{
            position: 'fixed', right: 16, bottom: 16, zIndex: 9000,
            width: 'min(390px, calc(100vw - 32px))', height: 'min(600px, calc(100vh - 48px))',
            display: 'flex', flexDirection: 'column',
            background: PANEL, color: TEXT, borderRadius: 14,
            border: `1px solid ${RULE}`, boxShadow: '0 16px 48px rgba(0,0,0,.5)',
            fontSize: 14, lineHeight: 1.45,
          }}
        >
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${RULE}` }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 999, background: GREEN_DK }}>
              <Sparkles size={15} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Pulse</div>
              <div style={{ fontSize: 11, color: MUTED }}>Tell us what you need — we build the portfolio around it.</div>
            </div>
            <button onClick={restart} title="Start over" aria-label="Start over"
              style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: 6 }}>
              <RefreshCw size={15} />
            </button>
            <button onClick={() => setOpen(false)} title="Close" aria-label="Close Pulse"
              style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: 6 }}>
              <X size={17} />
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="pulse-scroll" style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) =>
              m.plan ? (
                <PlanCard key={i} plan={m.plan} />
              ) : (
                <div
                  key={i}
                  style={{
                    alignSelf: m.who === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: m.who === 'user' ? GREEN_DK : BUBBLE,
                    color: TEXT,
                    borderRadius: m.who === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                    padding: '9px 12px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.text}
                </div>
              ),
            )}
            {busy && (
              <div className="pulse-typing" style={{ alignSelf: 'flex-start', background: BUBBLE, borderRadius: 12, padding: '9px 14px', color: MUTED }}>
                <span>●</span> <span>●</span> <span>●</span>
              </div>
            )}
            {record && savedTo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: MUTED }}>
                {savedTo === 'cloud' ? '✓ Sent to the Fast Insights team.' : 'Saved on this device — nothing left your browser.'}
                <button
                  onClick={() => downloadPulseRecord(record)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${RULE}`, color: MUTED, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}
                >
                  <Download size={11} /> Download
                </button>
              </div>
            )}
          </div>

          {/* chips */}
          {showChips && !busy && (
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${RULE}`, display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 180, overflowY: 'auto' }} className="pulse-scroll">
              {q.options!.map((opt) => {
                const on = picked.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      if (!q.multi) {
                        submitSurveyAnswer(opt, opt);
                      } else {
                        setPicked((prev) => (on ? prev.filter((x) => x !== opt) : [...prev, opt]));
                      }
                    }}
                    style={{
                      borderRadius: 999, padding: '6px 12px', fontSize: 12.5, cursor: 'pointer',
                      border: `1px solid ${on ? GREEN : RULE}`,
                      background: on ? GREEN_DK : 'transparent',
                      color: on ? '#fff' : TEXT,
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
              {q.multi && (
                <button
                  onClick={() => picked.length && submitSurveyAnswer(picked.join(', '), picked)}
                  disabled={!picked.length}
                  style={{
                    borderRadius: 999, padding: '6px 14px', fontSize: 12.5, fontWeight: 600,
                    cursor: picked.length ? 'pointer' : 'default',
                    border: 'none', background: picked.length ? GREEN : RULE, color: picked.length ? INK : MUTED,
                  }}
                >
                  Continue →
                </button>
              )}
            </div>
          )}

          {/* free-text input */}
          {showInput && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: `1px solid ${RULE}` }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void sendDraft(); }}
                placeholder={phase === 'chat' ? 'Ask about any tool, or add to your wishlist…' : 'Type your answer…'}
                disabled={busy}
                style={{
                  flex: 1, background: INK, color: TEXT, border: `1px solid ${RULE}`,
                  borderRadius: 8, padding: '9px 12px', fontSize: 13.5, outline: 'none',
                }}
              />
              <button
                onClick={() => void sendDraft()}
                disabled={busy || !draft.trim()}
                aria-label="Send"
                style={{
                  background: draft.trim() && !busy ? GREEN_DK : BUBBLE, color: '#fff', border: 'none',
                  borderRadius: 8, width: 40, cursor: draft.trim() && !busy ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Send size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function PlanCard({ plan }: { plan: PulsePlan }) {
  // flexShrink 0 is load-bearing: with overflow:hidden, a flex child's
  // automatic minimum size is 0, so an overfull chat column would collapse
  // this card to its borders while the text bubbles keep their height.
  return (
    <div style={{ border: `1px solid ${RULE}`, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ padding: '9px 12px', background: GREEN_DK, fontWeight: 600, fontSize: 13 }}>
        Your Fast Insights rhythm
      </div>
      <div style={{ padding: '4px 12px 10px' }}>
        {CADENCES.map((cadence) =>
          plan[cadence].length ? (
            <div key={cadence} style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: MUTED, marginBottom: 4 }}>
                {CADENCE_LABEL[cadence]}
              </div>
              {plan[cadence].map((sug, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <a
                    className="pulse-link"
                    href={sug.href}
                    style={{ color: '#7FD4A8', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                  >
                    {sug.title}
                  </a>
                  <div style={{ fontSize: 12, color: MUTED }}>{sug.detail}</div>
                </div>
              ))}
            </div>
          ) : null,
        )}
        {plan.roadmap.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${RULE}` }}>
            <div style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: MUTED, marginBottom: 4 }}>
              On your wishlist → sent to the team
            </div>
            {plan.roadmap.map((r, i) => (
              <div key={i} style={{ fontSize: 12, color: TEXT }}>“{r}”</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
