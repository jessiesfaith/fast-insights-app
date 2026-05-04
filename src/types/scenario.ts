// Scenario state (BUILD.md §9). Drives the filter chips, the As-is / Cleaned
// toggle, the what-if sliders, and presentation mode. The state is a single
// flat record so it serializes cleanly into a JSON snapshot.

export interface ScenarioFilters {
  customers: string[];
  customerTypes: string[];
  salespeople: string[];
  territories: string[];
  productCategories: string[];
  paymentMethods: string[];
}

export interface WhatIfState {
  /** Fraction of currently-unapplied cash that we pretend has been applied. */
  resolveUnappliedCashPct: number;          // 0..1
  /** Pretend every Unapplied credit memo has been applied. */
  applyAllUnappliedCredits: boolean;
  /** Pretend invoices past-due more than N days are written off. 0 = disabled. */
  writeOffPastDueDays: number;
  /** Fraction of past-due AR pretend-collected (additional to existing receipts). */
  collectPastDuePct: number;                // 0..1
}

export type DemoState = 'as-is' | 'cleaned';

export interface ScenarioState {
  filters: ScenarioFilters;
  whatIf: WhatIfState;
  demoState: DemoState;
  presentation: boolean;
}

export const DEFAULT_FILTERS: ScenarioFilters = {
  customers: [],
  customerTypes: [],
  salespeople: [],
  territories: [],
  productCategories: [],
  paymentMethods: [],
};

export const DEFAULT_WHAT_IF: WhatIfState = {
  resolveUnappliedCashPct: 0,
  applyAllUnappliedCredits: false,
  writeOffPastDueDays: 0,
  collectPastDuePct: 0,
};

export const DEFAULT_SCENARIO: ScenarioState = {
  filters: { ...DEFAULT_FILTERS },
  whatIf: { ...DEFAULT_WHAT_IF },
  demoState: 'as-is',
  presentation: false,
};

/** True when nothing is filtering or transforming the data. */
export function isScenarioPristine(s: ScenarioState): boolean {
  if (s.demoState !== 'as-is') return false;
  const f = s.filters;
  if (f.customers.length || f.customerTypes.length || f.salespeople.length || f.territories.length || f.productCategories.length || f.paymentMethods.length) return false;
  const w = s.whatIf;
  return (
    w.resolveUnappliedCashPct === 0 &&
    !w.applyAllUnappliedCredits &&
    w.writeOffPastDueDays === 0 &&
    w.collectPastDuePct === 0
  );
}

/** Sum of active filter chips across every dimension. */
export function activeFilterCount(s: ScenarioState): number {
  const f = s.filters;
  return (
    f.customers.length +
    f.customerTypes.length +
    f.salespeople.length +
    f.territories.length +
    f.productCategories.length +
    f.paymentMethods.length
  );
}
