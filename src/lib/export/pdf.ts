// PDF export — drives the browser's native Print dialog so the user lands in
// "Save as PDF" without us shipping a heavy PDF generator.
//
// The print stylesheet (src/styles/print.css) strips the glassmorphism. This
// helper additionally injects a per-page header/footer with entity, period,
// and operator using CSS @page margin boxes (Chromium supports these).

interface PDFOptions {
  entityName: string;
  period: string;
  operator: string | null;
}

const STYLE_ID = 'ar-tool-beta-print-runtime';

function escapeForCSSContent(s: string): string {
  // CSS string escapes — the only chars we need to handle for content: "..."
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

function buildRuntimeStyle(opts: PDFOptions): string {
  const entity = escapeForCSSContent(opts.entityName || 'Entity not set');
  const period = escapeForCSSContent(opts.period);
  const stamp = new Date().toLocaleString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const operator = escapeForCSSContent(opts.operator ?? 'unknown');
  return `
    @page {
      margin: 0.6in 0.55in 0.85in 0.55in;
      @bottom-left {
        content: "${entity} · ${period}";
        font: 9pt 'Inter', system-ui, sans-serif;
        color: #444;
      }
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font: 9pt 'Inter', system-ui, sans-serif;
        color: #666;
      }
      @bottom-right {
        content: "Generated ${stamp} by ${operator} — AR Tool-Beta";
        font: 9pt 'Inter', system-ui, sans-serif;
        color: #444;
      }
    }
    @media print {
      .no-print, header.glass-bar, footer { display: none !important; }
    }
  `;
}

export function exportPDF(opts: PDFOptions): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  // remove any prior runtime style we left behind
  document.getElementById(STYLE_ID)?.remove();
  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = buildRuntimeStyle(opts);
  document.head.appendChild(styleEl);

  // Run print on the next frame so the style has applied
  requestAnimationFrame(() => {
    window.print();
    // Tear down the runtime style after the print dialog closes. We can't know
    // exactly when that is, so wait long enough for most users to finish.
    setTimeout(() => styleEl.remove(), 4000);
  });
}
