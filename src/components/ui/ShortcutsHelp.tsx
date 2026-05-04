// Keyboard-shortcuts overlay (BUILD.md §10.1, polish pass).
// Triggered by `?` from anywhere in the app; Escape dismisses.

import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { isTypingTarget, SHORTCUTS } from '../../lib/shortcuts';

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15, 10, 31, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 100%)',
          background: 'var(--bg-elevated-2)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          border: '1px solid var(--border-strong)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card-strong)',
          padding: 22,
        }}
      >
        <div className="between" style={{ marginBottom: 14 }}>
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <span
              className="center"
              style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <Keyboard size={16} />
            </span>
            <div>
              <h2 style={{ fontSize: 16 }}>Keyboard shortcuts</h2>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                Press <Kbd>?</Kbd> to toggle this overlay any time.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close shortcuts help"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 6,
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SHORTCUTS.map((s) => (
            <li
              key={s.label}
              className="between"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.hint}</div>
              </div>
              <div className="row gap-1" style={{ alignItems: 'center' }}>
                {s.keys.map((k, i) => (
                  <Kbd key={i}>{k}</Kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        padding: '2px 8px',
        minWidth: 22,
        textAlign: 'center',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
        borderRadius: 4,
        color: 'var(--text-secondary)',
        fontWeight: 600,
      }}
    >
      {children}
    </kbd>
  );
}

export default ShortcutsHelp;
