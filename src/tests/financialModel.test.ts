// Financial Model Lab — internal consistency of the baked pipeline results
// and the shared Excel report spec / workbook builder.

import { describe, expect, it } from 'vitest';
import {
  ACTIONS,
  ACTION_META,
  CLOSE_CALL_THRESHOLD,
  FEATURES,
  LABEL_BALANCE,
  MODEL_CARD,
  PREDICTIONS,
  TRAINING_PROFILE,
  buildExcelReportSpec,
  buildFinancialModelWorkbook,
  featureDrift,
  outputControlChecks,
  predictionKpis,
  scoreCompany,
  WORKBOOK_SHEET_NAMES,
} from '../lib/financialModel';

describe('prediction table (baked from the seeded kit run)', () => {
  it('has 12 companies with unique ids', () => {
    expect(PREDICTIONS).toHaveLength(12);
    expect(new Set(PREDICTIONS.map((r) => r.companyId)).size).toBe(12);
  });

  it('probabilities per row sum to ~1 and the recommendation is the argmax', () => {
    for (const r of PREDICTIONS) {
      const sum = r.p.NEW_PRODUCT + r.p.MA + r.p.PAY_DEBT;
      expect(Math.abs(sum - 1)).toBeLessThanOrEqual(0.005); // 3-decimal rounding tolerance
      const argmax = ACTIONS.reduce((best, a) => (r.p[a] > r.p[best] ? a : best), ACTIONS[0]);
      expect(r.recommended).toBe(argmax);
      expect(r.confidence).toBeCloseTo(r.p[r.recommended], 6);
    }
  });

  it('kpis: counts total 12, NorthPine is the lone close call', () => {
    const k = predictionKpis();
    expect(k.scored).toBe(12);
    expect(k.counts.NEW_PRODUCT + k.counts.MA + k.counts.PAY_DEBT).toBe(12);
    expect(k.counts).toEqual({ NEW_PRODUCT: 3, MA: 6, PAY_DEBT: 3 });
    expect(k.closeCalls.map((r) => r.companyId)).toEqual(['N001']);
    expect(k.avgConfidence).toBeGreaterThan(CLOSE_CALL_THRESHOLD);
  });
});

describe('model card (baked)', () => {
  it('passes its own written validation gate', () => {
    expect(MODEL_CARD.testAccuracy).toBeGreaterThanOrEqual(MODEL_CARD.gate.minTestAccuracy);
    for (const a of ACTIONS) {
      expect(MODEL_CARD.perClass[a].recall).toBeGreaterThanOrEqual(MODEL_CARD.gate.minClassRecall);
    }
    expect(MODEL_CARD.status).toBe('APPROVED');
  });

  it('confusion matrix rows sum to the 20 test rows per class', () => {
    for (const truth of ACTIONS) {
      const rowSum = ACTIONS.reduce((s, pred) => s + MODEL_CARD.confusion[truth][pred], 0);
      expect(rowSum).toBe(MODEL_CARD.rows.test / ACTIONS.length);
    }
  });

  it('coefficients cover every action × feature, and leverage pushes toward PAY_DEBT', () => {
    for (const a of ACTIONS) {
      for (const f of FEATURES) {
        expect(typeof MODEL_CARD.coefficients[a][f.id]).toBe('number');
      }
    }
    expect(MODEL_CARD.coefficients.PAY_DEBT.debt_to_ebitda).toBeGreaterThan(1);
    expect(MODEL_CARD.coefficients.MA.debt_to_ebitda).toBeLessThan(0);
  });

  it('training profile matches the taught story (leverage → debt, growth → product, cash+fragmentation → M&A)', () => {
    expect(LABEL_BALANCE.NEW_PRODUCT + LABEL_BALANCE.MA + LABEL_BALANCE.PAY_DEBT).toBe(240);
    expect(TRAINING_PROFILE.PAY_DEBT.debt_to_ebitda).toBeGreaterThan(TRAINING_PROFILE.NEW_PRODUCT.debt_to_ebitda);
    expect(TRAINING_PROFILE.NEW_PRODUCT.market_growth_pct).toBeGreaterThan(TRAINING_PROFILE.MA.market_growth_pct);
    expect(TRAINING_PROFILE.MA.cash_pct_of_revenue).toBeGreaterThan(TRAINING_PROFILE.NEW_PRODUCT.cash_pct_of_revenue);
  });
});

describe('excel report spec (shared by the mock grid and the workbook)', () => {
  const spec = buildExcelReportSpec();

  it('lays out header + 12 data rows and knows where they are', () => {
    expect(spec.dataRows).toEqual({ first: 2, last: 13 });
    expect(spec.rows[0].map((c) => c.v)).toContain('Recommended');
    // sheet rows are 1-based; array is 0-based
    expect(spec.rows[spec.dataRows.first - 1][0].v).toBe(PREDICTIONS[0].companyId);
  });

  it('every derived cell displays the value its formula computes', () => {
    for (let i = 0; i < PREDICTIONS.length; i++) {
      const r = PREDICTIONS[i];
      const row = spec.rows[i + 1];
      expect(row[6].f).toMatch(/^=IF\(AND\(/); // recommendation
      expect(row[6].v).toBe(ACTION_META[r.recommended].label);
      expect(row[7].f).toMatch(/^=MAX\(/); // confidence
      expect(row[7].v).toBe(r.confidence);
      expect(row[8].f).toMatch(/^=SUM\(/); // prob check
      expect(Math.abs((row[8].v as number) - 1)).toBeLessThanOrEqual(0.005);
      expect(row[9].v).toBe(r.confidence < CLOSE_CALL_THRESHOLD ? 'REVIEW - close call' : 'OK');
    }
  });

  it('summary COUNTIF/AVERAGEIF values agree with predictionKpis', () => {
    const k = predictionKpis();
    const summaryStart = 15; // 0-based: header(1)+data(12)+blank(1)+summary header(1)
    ACTIONS.forEach((a, i) => {
      const row = spec.rows[summaryStart + i];
      expect(row[0].v).toBe(ACTION_META[a].label);
      expect(row[1].v).toBe(k.counts[a]);
      expect(row[1].f).toMatch(/^=COUNTIF\(/);
      expect(row[2].v).toBe(k.avgConfidenceByAction[a]);
    });
    const totalRow = spec.rows[summaryStart + ACTIONS.length];
    expect(totalRow[1].v).toBe(12);
    expect(totalRow[2].v).toBe(k.avgConfidence);
  });
});

describe('in-browser model (scoreCompany)', () => {
  it('reproduces sklearn predict_proba on every baked prediction row', () => {
    for (const r of PREDICTIONS) {
      const s = scoreCompany(r.features);
      expect(s.recommended).toBe(r.recommended);
      for (const a of ACTIONS) {
        // baked probabilities are rounded to 3 decimals
        expect(Math.abs(s.p[a] - r.p[a])).toBeLessThanOrEqual(0.0015);
      }
      const sum = ACTIONS.reduce((acc, a) => acc + s.p[a], 0);
      expect(sum).toBeCloseTo(1, 9);
    }
  });

  it('responds to features in the taught direction (leverage → pay debt)', () => {
    const base = { ...PREDICTIONS[11].features }; // N012 Lumen, an M&A call
    const low = scoreCompany(base);
    const high = scoreCompany({ ...base, debt_to_ebitda: 6.5 });
    expect(low.recommended).toBe('MA');
    expect(high.recommended).toBe('PAY_DEBT');
    expect(high.p.PAY_DEBT).toBeGreaterThan(low.p.PAY_DEBT);
    // contributions: the leverage push toward PAY_DEBT grows with leverage
    expect(high.contributions.PAY_DEBT.debt_to_ebitda)
      .toBeGreaterThan(low.contributions.PAY_DEBT.debt_to_ebitda);
  });
});

describe('governance: output controls and drift', () => {
  it('all six completeness/accuracy checks pass on the real prediction table', () => {
    const checks = outputControlChecks();
    expect(checks).toHaveLength(6);
    expect(checks.filter((c) => c.kind === 'completeness')).toHaveLength(3);
    expect(checks.every((c) => c.passed)).toBe(true);
  });

  it('a broken table fails the right checks', () => {
    const broken = PREDICTIONS.map((r, i) =>
      i === 0 ? { ...r, p: { ...r.p, MA: 0.9 } } : r); // sum no longer ~1, conf no longer max
    const checks = outputControlChecks(broken);
    expect(checks.find((c) => c.id === 'probSum')?.passed).toBe(false);
    expect(checks.find((c) => c.id === 'rows')?.passed).toBe(true);
  });

  it('drift matches the kit script: fragmentation_index flags INVESTIGATE, everything else STABLE', () => {
    const drift = featureDrift();
    const frag = drift.find((d) => d.feature === 'fragmentation_index');
    expect(frag?.status).toBe('INVESTIGATE');
    expect(frag!.shiftStd).toBeGreaterThan(1.1);
    expect(frag!.shiftStd).toBeCloseTo(1.121, 1);
    for (const d of drift) {
      if (d.feature !== 'fragmentation_index') expect(d.status).toBe('STABLE');
    }
  });

  it('a +3pt rate shock trips the interest_rate drift flag', () => {
    const shocked = PREDICTIONS.map((r) => ({
      ...r,
      features: { ...r.features, interest_rate_pct: r.features.interest_rate_pct + 3 },
    }));
    const rate = featureDrift(shocked).find((d) => d.feature === 'interest_rate_pct');
    expect(rate?.status).toBe('INVESTIGATE');
    expect(rate!.shiftStd).toBeGreaterThan(1.5);
  });
});

describe('workbook builder', () => {
  it('produces the four sheets with live formulas on the Report sheet', () => {
    const wb = buildFinancialModelWorkbook();
    expect(wb.SheetNames).toEqual([...WORKBOOK_SHEET_NAMES]);
    const report = wb.Sheets['Report'];
    expect(report['G2']?.f).toContain('IF(AND(');
    expect(report['H2']?.f).toBe('MAX(D2:F2)');
    expect(report['B2']?.f).toContain('INDEX(prediction_table!$B:$B');
    // raw sheet carries the import: header + 12 rows
    const raw = wb.Sheets['prediction_table'];
    expect(raw['A13']?.v).toBe('N012');
  });
});
