// Scenario engine — pure transform from raw ARData + ScenarioState to a
// "view" ARData (BUILD.md §9).
//
// Transformations apply in this order:
//   1. Customer-level filters (customer / customer_type) narrow the customer set.
//   2. Invoice-level filters (salesperson / territory / product_category) further
//      narrow invoices within the allowed customers.
//   3. Receipt-level filters (payment_method) narrow receipts.
//   4. Related rows (GL, bank, credits) drop along with their referenced
//      records so the recon math stays internally consistent.
//   5. Demo state — when "cleaned", what-if is forced to its maximum values.
//   6. What-if — virtually applies unapplied cash/credits, writes off old
//      invoices, and bumps collections on past-due invoices.
//
// All transformations return a new ARData; the input is never mutated.

import {
  ARData,
  CashReceipt,
  CreditMemo,
  Invoice,
} from '../types/data';
import {
  DEFAULT_WHAT_IF,
  ScenarioFilters,
  ScenarioState,
  WhatIfState,
} from '../types/scenario';

// Selecting an empty array for a filter dimension means "no constraint" —
// keep everything in that dimension.
function passes<T>(value: T, allowed: T[]): boolean {
  return allowed.length === 0 || allowed.includes(value);
}

interface FilterPlan {
  customerIds: Set<string>;
  invoiceIds: Set<string>;
  receiptIds: Set<string>;
  creditMemoIds: Set<string>;
}

function buildFilterPlan(data: ARData, filters: ScenarioFilters): FilterPlan {
  // 1. Allowed customers from customer / customer_type filters.
  const allowedCustomerIds = new Set<string>();
  for (const c of data.customers) {
    if (!passes(c.customer_id, filters.customers)) continue;
    if (!passes(c.customer_type, filters.customerTypes)) continue;
    allowedCustomerIds.add(c.customer_id);
  }
  // If the customers CSV is missing some IDs that show up in transactions,
  // still include them when no customer filter is active.
  if (filters.customers.length === 0 && filters.customerTypes.length === 0) {
    for (const i of data.invoices) allowedCustomerIds.add(i.customer_id);
    for (const r of data.receipts) allowedCustomerIds.add(r.customer_id);
  }

  // 2. Allowed invoices: matching the customer set + the invoice-level filters.
  const allowedInvoiceIds = new Set<string>();
  for (const inv of data.invoices) {
    if (!allowedCustomerIds.has(inv.customer_id)) continue;
    if (!passes(inv.salesperson, filters.salespeople)) continue;
    if (!passes(inv.territory, filters.territories)) continue;
    if (!passes(inv.product_category, filters.productCategories)) continue;
    allowedInvoiceIds.add(inv.invoice_id);
  }

  // 3. Allowed receipts: customer set + payment-method filter; if a receipt is
  //    applied to a specific invoice, that invoice must also be allowed.
  const allowedReceiptIds = new Set<string>();
  for (const r of data.receipts) {
    if (!allowedCustomerIds.has(r.customer_id)) continue;
    if (!passes(r.payment_method, filters.paymentMethods)) continue;
    if (r.invoice_id_applied && !allowedInvoiceIds.has(r.invoice_id_applied)) continue;
    allowedReceiptIds.add(r.receipt_id);
  }

  // 4. Allowed credit memos: customer set + applied invoice (if any) is allowed.
  const allowedCreditMemoIds = new Set<string>();
  for (const m of data.creditMemos) {
    if (!allowedCustomerIds.has(m.customer_id)) continue;
    if (m.applied_to_invoice_id && !allowedInvoiceIds.has(m.applied_to_invoice_id)) continue;
    allowedCreditMemoIds.add(m.memo_id);
  }

  return {
    customerIds: allowedCustomerIds,
    invoiceIds: allowedInvoiceIds,
    receiptIds: allowedReceiptIds,
    creditMemoIds: allowedCreditMemoIds,
  };
}

function applyFilters(data: ARData, plan: FilterPlan): ARData {
  const sourceAllowed = (sourceDoc: string): boolean =>
    plan.invoiceIds.has(sourceDoc) || plan.receiptIds.has(sourceDoc) || plan.creditMemoIds.has(sourceDoc);

  return {
    customers: data.customers.filter((c) => plan.customerIds.has(c.customer_id)),
    invoices: data.invoices.filter((i) => plan.invoiceIds.has(i.invoice_id)),
    receipts: data.receipts.filter((r) => plan.receiptIds.has(r.receipt_id)),
    creditMemos: data.creditMemos.filter((m) => plan.creditMemoIds.has(m.memo_id)),
    glEntries: data.glEntries.filter((e) => {
      // keep GL rows referencing one of the allowed source docs OR an allowed customer
      if (e.source_doc && sourceAllowed(e.source_doc)) return true;
      if (e.customer_id && plan.customerIds.has(e.customer_id)) return true;
      return false;
    }),
    bankStatements: data.bankStatements.filter((b) => {
      if (b.matched_receipt_ids.length === 0) {
        // bank-only items — keep when no customer filter is active so they
        // remain visible for the bank-only-item exception class
        return plan.customerIds.size === data.customers.length || plan.customerIds.size === 0;
      }
      return b.matched_receipt_ids.some((id) => plan.receiptIds.has(id));
    }),
  };
}

// ---------------------------------------------------------------------------
// What-if transformations
// ---------------------------------------------------------------------------

function effectiveWhatIf(state: ScenarioState): WhatIfState {
  if (state.demoState === 'cleaned') {
    // "Cleaned period" is what the dashboard would look like with every
    // routine close-out completed: all unapplied applied, every too-old
    // invoice written off, and 100 % of past-due collected. Slider state is
    // ignored when this is active so the toggle is a deterministic comparison.
    return {
      resolveUnappliedCashPct: 1,
      applyAllUnappliedCredits: true,
      writeOffPastDueDays: 90,
      collectPastDuePct: 1,
    };
  }
  return state.whatIf;
}

function daysBetween(a: string, b: string): number {
  const da = Date.parse(a + 'T00:00:00Z');
  const db = Date.parse(b + 'T00:00:00Z');
  if (Number.isNaN(da) || Number.isNaN(db)) return 0;
  return Math.round((db - da) / 86_400_000);
}

function applyWhatIf(data: ARData, what: WhatIfState, asOf: string): ARData {
  const cleanedReceipts: CashReceipt[] = data.receipts.map((r) => {
    const isUnapplied = r.status === 'Unapplied' || r.amount_applied < r.amount;
    if (!isUnapplied || what.resolveUnappliedCashPct <= 0) return r;
    const unapplied = Math.max(r.amount - r.amount_applied, 0);
    const additional = unapplied * what.resolveUnappliedCashPct;
    const newApplied = r.amount_applied + additional;
    const fullyApplied = Math.abs(r.amount - newApplied) < 0.005;
    return {
      ...r,
      amount_applied: newApplied,
      status: fullyApplied ? 'Applied' : (r.status === 'Unapplied' && newApplied > 0 ? 'Partial' : r.status),
    };
  });

  const cleanedCredits: CreditMemo[] = data.creditMemos.map((m) => {
    if (!what.applyAllUnappliedCredits) return m;
    if (m.status === 'Applied' && m.applied_to_invoice_id) return m;
    return {
      ...m,
      status: 'Applied',
      applied_to_invoice_id: m.applied_to_invoice_id ?? m.original_invoice_id,
    };
  });

  // Write-off + collect transformations both look at the open balance per
  // invoice net of receipts AND credits, then virtually flip status / scale
  // the open amount via a synthetic receipt (so KPI math stays consistent).
  const recvByInv = new Map<string, number>();
  for (const r of cleanedReceipts) {
    if (!r.invoice_id_applied) continue;
    recvByInv.set(r.invoice_id_applied, (recvByInv.get(r.invoice_id_applied) ?? 0) + r.amount_applied);
  }
  const credByInv = new Map<string, number>();
  for (const m of cleanedCredits) {
    if (m.status !== 'Applied' || !m.applied_to_invoice_id) continue;
    credByInv.set(m.applied_to_invoice_id, (credByInv.get(m.applied_to_invoice_id) ?? 0) + m.amount);
  }

  const cleanedInvoices: Invoice[] = data.invoices.map((inv) => {
    if (inv.status !== 'Open' && inv.status !== 'Short Pay - Open') return inv;
    if (what.writeOffPastDueDays > 0) {
      const dpd = daysBetween(inv.due_date, asOf);
      if (dpd > what.writeOffPastDueDays) {
        return { ...inv, status: 'Written Off' };
      }
    }
    return inv;
  });

  // Collect past-due — synthesize an extra "what-if" receipt against each
  // open past-due invoice to bring its applied total up by `collectPastDuePct`
  // of its open balance. Tagged with a deterministic receipt_id so re-runs
  // are stable and the row is recognizable in the UI.
  const collectionReceipts: CashReceipt[] = [];
  if (what.collectPastDuePct > 0) {
    for (const inv of cleanedInvoices) {
      if (inv.status !== 'Open' && inv.status !== 'Short Pay - Open') continue;
      const dpd = daysBetween(inv.due_date, asOf);
      if (dpd <= 0) continue;
      const applied = (recvByInv.get(inv.invoice_id) ?? 0) + (credByInv.get(inv.invoice_id) ?? 0);
      const open = inv.total_amount - applied;
      if (open <= 0.005) continue;
      const collect = open * what.collectPastDuePct;
      if (collect <= 0.005) continue;
      collectionReceipts.push({
        receipt_id: `WI-${inv.invoice_id}`,
        customer_id: inv.customer_id,
        receipt_date: asOf,
        amount: collect,
        payment_method: 'ACH',
        reference: `WHAT-IF collection ${what.collectPastDuePct.toFixed(2)}`,
        check_number: '',
        invoice_id_applied: inv.invoice_id,
        amount_applied: collect,
        bank_deposit_id: '',
        status: 'Applied',
        notes: 'what-if simulated collection',
      });
    }
  }

  return {
    ...data,
    invoices: cleanedInvoices,
    receipts: [...cleanedReceipts, ...collectionReceipts],
    creditMemos: cleanedCredits,
  };
}

// ---------------------------------------------------------------------------
// Top-level entry
// ---------------------------------------------------------------------------

/**
 * Run the entire scenario pipeline. `asOf` should be the dashboard's
 * period_end (YYYY-MM-DD) — used by writeOff and collect transformations.
 */
export function applyScenario(data: ARData, scenario: ScenarioState, asOf: string): ARData {
  const plan = buildFilterPlan(data, scenario.filters);
  const filtered = applyFilters(data, plan);
  const what = effectiveWhatIf(scenario);
  if (what === DEFAULT_WHAT_IF || (what.resolveUnappliedCashPct === 0 && !what.applyAllUnappliedCredits && what.writeOffPastDueDays === 0 && what.collectPastDuePct === 0)) {
    return filtered;
  }
  return applyWhatIf(filtered, what, asOf);
}

// ---------------------------------------------------------------------------
// Filter option discovery
// ---------------------------------------------------------------------------

export interface FilterOptions {
  customers: { id: string; name: string }[];
  customerTypes: string[];
  salespeople: string[];
  territories: string[];
  productCategories: string[];
  paymentMethods: string[];
}

export function discoverFilterOptions(data: ARData): FilterOptions {
  const customerTypes = new Set<string>();
  for (const c of data.customers) if (c.customer_type) customerTypes.add(c.customer_type);
  const salespeople = new Set<string>();
  const territories = new Set<string>();
  const productCategories = new Set<string>();
  for (const inv of data.invoices) {
    if (inv.salesperson) salespeople.add(inv.salesperson);
    if (inv.territory) territories.add(inv.territory);
    if (inv.product_category) productCategories.add(inv.product_category);
  }
  const paymentMethods = new Set<string>();
  for (const r of data.receipts) if (r.payment_method) paymentMethods.add(r.payment_method);

  return {
    customers: [...data.customers]
      .sort((a, b) => a.customer_name.localeCompare(b.customer_name))
      .map((c) => ({ id: c.customer_id, name: c.customer_name })),
    customerTypes: [...customerTypes].sort(),
    salespeople: [...salespeople].sort(),
    territories: [...territories].sort(),
    productCategories: [...productCategories].sort(),
    paymentMethods: [...paymentMethods].sort(),
  };
}

// re-export internals for tests
export { buildFilterPlan, applyFilters, effectiveWhatIf, applyWhatIf };
