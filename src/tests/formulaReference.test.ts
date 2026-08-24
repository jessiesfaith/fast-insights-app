import { describe, expect, it } from 'vitest';
import { FORMULA_GROUPS, GLOSSARY } from '../lib/formulaReference';

describe('glossary', () => {
  it('defines every acronym with a full name and a real definition', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(28);
    for (const g of GLOSSARY) {
      expect(g.term.length).toBeGreaterThan(1);
      expect(g.full.length).toBeGreaterThan(3);
      expect(g.def.length).toBeGreaterThan(20);
    }
  });

  it('covers the acronyms the Lab actually uses', () => {
    const terms = GLOSSARY.map((g) => g.term).join(' ');
    for (const must of ['WACC', 'CAPM', 'ERP', 'NPV', 'IRR', 'EBITDA', 'DSO', 'DIO', 'DPO', 'CCC', 'LC', 'COD', 'GDP', 'CPI', 'FOMC', 'QE', 'SOFR', 'M&A', 'COGS', 'AR', 'FX']) {
      expect(terms).toContain(must);
    }
  });

  it('has no duplicate terms', () => {
    const terms = GLOSSARY.map((g) => g.term);
    expect(new Set(terms).size).toBe(terms.length);
  });
});

describe('formula reference', () => {
  it('covers all five decision groups with flows and formulas', () => {
    expect(FORMULA_GROUPS.map((g) => g.id)).toEqual(['invest', 'proforma', 'credit', 'treasury', 'machine']);
    for (const g of FORMULA_GROUPS) {
      expect(g.decision.length).toBeGreaterThan(10);
      expect(g.flow).toContain('→');
      expect(g.formulas.length).toBeGreaterThanOrEqual(4);
      for (const f of g.formulas) {
        expect(f.eq.length).toBeGreaterThan(5);
        expect(f.plain.length).toBeGreaterThan(20);
        expect(f.feeds.length).toBeGreaterThan(10);
      }
    }
  });

  it('the core equations appear where they should', () => {
    const eq = (id: string) => FORMULA_GROUPS.find((g) => g.id === id)!.formulas.map((f) => f.eq).join('\n');
    expect(eq('invest')).toContain('Re = Rf + β × ERP');
    expect(eq('invest')).toContain('spread = expected − hurdle');
    expect(eq('proforma')).toContain('pension');
    expect(eq('credit')).toContain('CCC = DSO + DIO − DPO');
    expect(eq('treasury')).toContain('notional × Δrate');
    expect(eq('machine')).toContain('Sg×G');
  });
});
