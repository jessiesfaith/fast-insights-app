// Four-letter tickmark cluster (BUILD.md §12 — Preparer Tickmark Legend).
// Click any letter to toggle. Each click is timestamped with the operator
// name in the data store; tooltip shows who signed off and when.

import { TICKMARK_LEGEND, TICKMARK_LETTERS, TickmarkLetter, TickmarkRowType } from '../../types/audit';
import { useDataStore } from '../../lib/dataStore';
import { useIsPeriodLocked } from '../../lib/lockedPeriod';
import { fmtDateTime } from '../../lib/format';

interface Props {
  type: TickmarkRowType;
  id: string;
  letters?: readonly TickmarkLetter[];
  size?: 'sm' | 'md';
}

export function TickmarkCell({ type, id, letters = TICKMARK_LETTERS, size = 'sm' }: Props) {
  const { hasTickmark, toggleTickmark, getTickmark } = useDataStore();
  const locked = useIsPeriodLocked();
  const dim = size === 'md' ? 18 : 14;
  const fontSize = size === 'md' ? 11 : 10;

  return (
    <span className="row gap-1" style={{ display: 'inline-flex', flexWrap: 'nowrap', alignItems: 'center' }}>
      {letters.map((letter) => {
        const active = hasTickmark(type, id, letter);
        const record = active ? getTickmark(type, id, letter) : undefined;
        const tooltip = locked
          ? `(${letter}) ${TICKMARK_LEGEND[letter]} — period closed (read-only)`
          : active && record
          ? `(${letter}) ${TICKMARK_LEGEND[letter]}\nSigned by ${record.actor || 'unknown'}${record.timestamp ? ` · ${fmtDateTime(record.timestamp)}` : ''}\nClick to remove`
          : `(${letter}) ${TICKMARK_LEGEND[letter]} — click to sign off`;
        return (
          <button
            key={letter}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (locked) return;
              toggleTickmark(type, id, letter);
            }}
            disabled={locked}
            title={tooltip}
            aria-label={`Toggle tickmark ${letter}: ${TICKMARK_LEGEND[letter]}`}
            aria-pressed={active}
            style={{
              width: dim,
              height: dim,
              borderRadius: 4,
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? 'var(--accent-contrast)' : 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
              fontSize,
              fontWeight: 700,
              padding: 0,
              cursor: locked ? 'not-allowed' : 'pointer',
              opacity: locked && !active ? 0.5 : 1,
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {letter}
          </button>
        );
      })}
    </span>
  );
}

export default TickmarkCell;
