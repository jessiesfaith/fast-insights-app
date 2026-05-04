// First-load operator capture and ongoing badge.
// Renders inline in the top bar. When `operator` is null, shows an input;
// once set, shows the name with a click-to-edit pencil.

import { Pencil, UserCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDataStore } from '../../lib/dataStore';

export function OperatorBadge() {
  const { operator, setOperator } = useDataStore();
  const [editing, setEditing] = useState(operator == null);
  const [draft, setDraft] = useState(operator ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setOperator(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
        className="row gap-2"
        style={{
          alignItems: 'center',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent)',
          borderRadius: 999,
          padding: '4px 6px 4px 10px',
        }}
      >
        <UserCircle2 size={14} style={{ color: 'var(--accent)' }} />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft.trim()) commit();
          }}
          placeholder="Your name"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 12,
            width: 130,
          }}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            border: 'none',
            borderRadius: 999,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
            cursor: draft.trim() ? 'pointer' : 'not-allowed',
            opacity: draft.trim() ? 1 : 0.5,
          }}
        >
          Save
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(operator ?? '');
        setEditing(true);
      }}
      aria-label={`Operator: ${operator}. Click to change.`}
      title="Change operator name"
      className="row gap-2"
      style={{
        alignItems: 'center',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 999,
        padding: '4px 10px',
        color: 'var(--text-secondary)',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      <UserCircle2 size={14} style={{ color: 'var(--accent)' }} />
      <span style={{ fontWeight: 600 }}>{operator}</span>
      <Pencil size={11} style={{ color: 'var(--text-tertiary)' }} />
    </button>
  );
}

export default OperatorBadge;
