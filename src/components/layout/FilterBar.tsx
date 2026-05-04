// Filter bar (BUILD.md §9.1) — multi-select dropdowns per dimension with
// chips below showing active filters. All filter changes flow through the
// scenario store so every view recomputes live.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, FilterX, X } from 'lucide-react';
import { ARData } from '../../types/data';
import { ScenarioFilters } from '../../types/scenario';
import { discoverFilterOptions } from '../../lib/scenario';
import { useScenario } from '../../lib/scenarioStore';

interface DimensionDef {
  key: keyof ScenarioFilters;
  label: string;
  options: { value: string; label: string }[];
}

interface Props {
  data: ARData;
}

export function FilterBar({ data }: Props) {
  const { scenario, toggleFilter, clearFilters } = useScenario();
  const opts = useMemo(() => discoverFilterOptions(data), [data]);

  const dimensions: DimensionDef[] = useMemo(
    () => [
      {
        key: 'customers',
        label: 'Customer',
        options: opts.customers.map((c) => ({ value: c.id, label: `${c.name} (${c.id})` })),
      },
      { key: 'customerTypes', label: 'Type', options: opts.customerTypes.map((v) => ({ value: v, label: v })) },
      { key: 'salespeople', label: 'Salesperson', options: opts.salespeople.map((v) => ({ value: v, label: v })) },
      { key: 'territories', label: 'Territory', options: opts.territories.map((v) => ({ value: v, label: v })) },
      { key: 'productCategories', label: 'Product', options: opts.productCategories.map((v) => ({ value: v, label: v })) },
      { key: 'paymentMethods', label: 'Payment', options: opts.paymentMethods.map((v) => ({ value: v, label: v })) },
    ],
    [opts],
  );

  const totalActive =
    scenario.filters.customers.length +
    scenario.filters.customerTypes.length +
    scenario.filters.salespeople.length +
    scenario.filters.territories.length +
    scenario.filters.productCategories.length +
    scenario.filters.paymentMethods.length;

  return (
    <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
      {dimensions.map((d) => (
        <DimensionDropdown key={d.key} def={d} active={scenario.filters[d.key]} onToggle={(v) => toggleFilter(d.key, v)} />
      ))}
      {totalActive > 0 && (
        <>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <ActiveChips filters={scenario.filters} dimensions={dimensions} onRemove={(k, v) => toggleFilter(k, v)} />
          <button
            type="button"
            onClick={clearFilters}
            className="row gap-1"
            style={{
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: 999,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-tertiary)',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            <FilterX size={11} /> Clear
          </button>
        </>
      )}
    </div>
  );
}

function DimensionDropdown({
  def,
  active,
  onToggle,
}: {
  def: DimensionDef;
  active: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return def.options;
    return def.options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [def.options, search]);

  // Compute fixed-position coordinates anchored to the trigger button. Using
  // a portal lets the popover escape every parent stacking context (the dashboard
  // glass cards each create their own via backdrop-filter, which was clipping the
  // popover under the KPI tiles).
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const POPOVER_WIDTH = 280;
    const update = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      // clamp to viewport so the popover doesn't slide off the right edge
      const maxLeft = window.innerWidth - POPOVER_WIDTH - 8;
      const left = Math.min(rect.left, Math.max(8, maxLeft));
      setCoords({ top: rect.bottom + 6, left, width: POPOVER_WIDTH });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  // Click-outside + Escape to close.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const popover = open && coords && (
    <div
      ref={popoverRef}
      role="listbox"
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: coords.width,
        maxHeight: 320,
        overflow: 'auto',
        zIndex: 1000,
        background: 'var(--bg-elevated-2)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid var(--border-strong)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-card-strong)',
        padding: 8,
      }}
    >
      {def.options.length > 8 && (
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter…"
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 8,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: 12,
            marginBottom: 6,
          }}
        />
      )}
      {filtered.length === 0 ? (
        <div style={{ padding: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>No matches.</div>
      ) : (
        filtered.map((opt) => {
          const isActive = active.includes(opt.value);
          return (
            <label
              key={opt.value}
              className="row gap-2"
              style={{
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                background: isActive ? 'var(--accent-soft)' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => onToggle(opt.value)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
            </label>
          );
        })
      )}
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{
          width: '100%',
          marginTop: 6,
          padding: '6px',
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text-tertiary)',
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        Close
      </button>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="row gap-2"
        style={{
          alignItems: 'center',
          padding: '6px 12px',
          borderRadius: 999,
          background: active.length > 0 ? 'var(--accent-soft)' : 'var(--bg-elevated)',
          border: `1px solid ${active.length > 0 ? 'var(--accent)' : 'var(--border)'}`,
          color: active.length > 0 ? 'var(--accent-hover)' : 'var(--text-secondary)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {def.label}
        {active.length > 0 && (
          <span
            style={{
              padding: '0 6px',
              borderRadius: 999,
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontSize: 10,
            }}
          >
            {active.length}
          </span>
        )}
        <ChevronDown size={11} />
      </button>
      {popover && createPortal(popover, document.body)}
    </>
  );
}

function ActiveChips({
  filters,
  dimensions,
  onRemove,
}: {
  filters: ScenarioFilters;
  dimensions: DimensionDef[];
  onRemove: (k: keyof ScenarioFilters, v: string) => void;
}) {
  const chips: { key: keyof ScenarioFilters; value: string; label: string; dimLabel: string }[] = [];
  for (const dim of dimensions) {
    const active = filters[dim.key];
    for (const v of active) {
      const opt = dim.options.find((o) => o.value === v);
      // for a long customer label, just show ID + first 16 chars of name
      const label = dim.key === 'customers' && opt ? opt.label.slice(0, 28) : v;
      chips.push({ key: dim.key, value: v, label, dimLabel: dim.label });
    }
  }
  return (
    <>
      {chips.map((c) => (
        <span
          key={`${c.key}:${c.value}`}
          className="row gap-1"
          style={{
            alignItems: 'center',
            padding: '3px 4px 3px 10px',
            borderRadius: 999,
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent)',
            color: 'var(--accent-hover)',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>{c.dimLabel}:</span>
          <span>{c.label}</span>
          <button
            type="button"
            onClick={() => onRemove(c.key, c.value)}
            aria-label={`Remove ${c.dimLabel} filter ${c.label}`}
            title={`Remove ${c.dimLabel}: ${c.label}`}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 2,
              color: 'var(--accent-hover)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <X size={11} />
          </button>
        </span>
      ))}
    </>
  );
}

export default FilterBar;
