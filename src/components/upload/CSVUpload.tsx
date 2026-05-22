// Drag-drop + click-to-pick CSV upload zone.
//
// Accepts any subset of the six CSVs at a time. Auto-detects which dataset each
// file belongs to from its header row (BUILD.md §4) and merges into the store.
// Cross-file FK warnings are appended once the user is done uploading.

import { ChangeEvent, DragEvent, useCallback, useRef, useState } from 'react';
import { Cloud, FileUp, FlaskConical, Loader2, Save, Upload } from 'lucide-react';
import { ARData, DATASET_LABEL, DatasetKey, ImportSummary } from '../../types/data';
import { crossValidate, parseCSVFile } from '../../lib/parse';
import { loadSampleData } from '../../lib/sampleData';
import { useDataStore } from '../../lib/dataStore';
import { importSnapshot } from '../../lib/export/json';
import { isSupabaseConfigured, loadFromSupabaseMerged } from '../../lib/supabase';
import GlassCard from '../ui/GlassCard';

interface PendingResult {
  fileName: string;
  status: 'parsing' | 'ok' | 'error';
  message?: string;
  key?: DatasetKey;
}

export function CSVUpload() {
  const { setData, loadSnapshot, data: existingData, summaries: existingSummaries } = useDataStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const snapshotInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<PendingResult[]>([]);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => /\.csv$/i.test(f.name));
      if (files.length === 0) return;
      setBusy(true);

      // start with the data we already have so partial uploads add up
      const data: ARData = {
        invoices: [...existingData.invoices],
        receipts: [...existingData.receipts],
        creditMemos: [...existingData.creditMemos],
        glEntries: [...existingData.glEntries],
        bankStatements: [...existingData.bankStatements],
        customers: [...existingData.customers],
      };
      const summaryByKey = new Map<DatasetKey, ImportSummary>();
      for (const s of existingSummaries) summaryByKey.set(s.key, s);

      const initialPending: PendingResult[] = files.map((f) => ({ fileName: f.name, status: 'parsing' }));
      setPending(initialPending);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const parsed = await parseCSVFile(file);
          // Replace dataset entirely on each successful import (most recent wins).
          (data as unknown as Record<string, unknown[]>)[parsed.key] = parsed.rows;
          summaryByKey.set(parsed.key, parsed.summary);
          setPending((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, status: 'ok', key: parsed.key, message: DATASET_LABEL[parsed.key] } : p,
            ),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Parse failed';
          setPending((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, status: 'error', message } : p)),
          );
        }
      }

      const summaries = crossValidate(data, [...summaryByKey.values()]);
      setData(data, summaries);
      setBusy(false);
    },
    [existingData, existingSummaries, setData],
  );

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    // allow re-selecting the same file
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
  };

  const onSample = async () => {
    setBusy(true);
    setPending([{ fileName: '6 sample CSVs', status: 'parsing' }]);
    try {
      const { data, summaries } = await loadSampleData();
      setData(data, summaries);
      setPending([{ fileName: '6 sample CSVs', status: 'ok', message: 'sample loaded' }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sample load failed';
      setPending([{ fileName: '6 sample CSVs', status: 'error', message }]);
    }
    setBusy(false);
  };

  const onCloud = async () => {
    setBusy(true);
    setPending([{ fileName: 'Supabase cloud', status: 'parsing' }]);
    try {
      const { data, summaries } = await loadFromSupabaseMerged(existingData);
      setData(data, summaries);
      setPending([{ fileName: 'Supabase cloud', status: 'ok', message: 'cloud data loaded (deduplicated)' }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cloud load failed';
      setPending([{ fileName: 'Supabase cloud', status: 'error', message }]);
    }
    setBusy(false);
  };

  const onSnapshotPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setPending([{ fileName: file.name, status: 'parsing' }]);
    try {
      const { snapshot, hashWarnings } = await importSnapshot(file);
      loadSnapshot(snapshot);
      const msg = hashWarnings.length > 0
        ? `loaded — ${hashWarnings.length} hash warning${hashWarnings.length === 1 ? '' : 's'}`
        : 'snapshot restored';
      setPending([{ fileName: file.name, status: 'ok', message: msg }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Snapshot import failed';
      setPending([{ fileName: file.name, status: 'error', message }]);
    }
    setBusy(false);
  };

  return (
    <GlassCard variant="strong" style={{ padding: 28 }}>
      <div className="row gap-2" style={{ alignItems: 'baseline', marginBottom: 8 }}>
        <h2 style={{ fontSize: 20 }}>Load AR data</h2>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          drop the six CSVs, or load the sample dataset to demo
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        style={{
          marginTop: 12,
          padding: 32,
          border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-lg)',
          background: dragOver ? 'var(--accent-soft)' : 'transparent',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'background 120ms ease, border-color 120ms ease',
        }}
        aria-label="Upload CSV files"
      >
        <div className="center" style={{ flexDirection: 'column', gap: 10 }}>
          <div
            className="center"
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
            }}
          >
            <Upload size={24} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Drop CSVs here, or click to browse</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 460 }}>
            Expected: <span className="mono">invoices.csv</span>, <span className="mono">cash_receipts.csv</span>,{' '}
            <span className="mono">credit_memos.csv</span>, <span className="mono">gl_entries.csv</span>,{' '}
            <span className="mono">bank_statements.csv</span>, <span className="mono">customers.csv</span>.
            Files are detected by header — drop in any order.
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={onPick}
          style={{ display: 'none' }}
        />
      </div>

      <div className="row gap-2" style={{ marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onSample}
          disabled={busy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            border: '1px solid var(--accent)',
            padding: '9px 14px',
            borderRadius: 10,
            fontWeight: 600,
            boxShadow: '0 6px 18px var(--accent-glow)',
            cursor: busy ? 'progress' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? <Loader2 size={14} className="spin" /> : <FlaskConical size={14} />}
          Load sample data
        </button>
        <button
          type="button"
          onClick={() => snapshotInputRef.current?.click()}
          disabled={busy}
          className="row gap-2"
          style={{
            alignItems: 'center',
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-strong)',
            padding: '9px 14px',
            borderRadius: 10,
            fontWeight: 600,
            cursor: busy ? 'progress' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          <Save size={14} />
          Import JSON snapshot
        </button>
        {isSupabaseConfigured() && (
          <button
            type="button"
            onClick={onCloud}
            disabled={busy}
            className="row gap-2"
            style={{
              alignItems: 'center',
              background: 'linear-gradient(135deg, #006d04, #00c805)',
              color: '#fff',
              border: '1px solid rgba(0,200,5,0.4)',
              padding: '9px 14px',
              borderRadius: 10,
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0,109,4,0.25)',
              cursor: busy ? 'progress' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? <Loader2 size={14} className="spin" /> : <Cloud size={14} />}
            Load from cloud
          </button>
        )}
        <input
          ref={snapshotInputRef}
          type="file"
          accept=".json,application/json"
          onChange={onSnapshotPick}
          style={{ display: 'none' }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          343 invoices · 208 receipts · 1,184 GL entries · 94 bank lines · 60 customers · 40 credit memos
        </span>
      </div>

      {pending.length > 0 && (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pending.map((p, i) => (
            <PendingRow key={i} entry={p} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 0.9s linear infinite; }`}</style>
    </GlassCard>
  );
}

function PendingRow({ entry }: { entry: PendingResult }) {
  const color =
    entry.status === 'ok'
      ? 'var(--severity-resolved)'
      : entry.status === 'error'
      ? 'var(--severity-high)'
      : 'var(--text-tertiary)';
  return (
    <div
      className="row gap-2"
      style={{
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: 8,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        fontSize: 13,
      }}
    >
      <FileUp size={14} style={{ color }} />
      <span className="mono" style={{ color: 'var(--text-secondary)', flex: 1 }}>{entry.fileName}</span>
      <span style={{ color, fontWeight: 600 }}>
        {entry.status === 'parsing' ? 'parsing…' : entry.status === 'ok' ? entry.message : `error · ${entry.message}`}
      </span>
    </div>
  );
}

export default CSVUpload;
