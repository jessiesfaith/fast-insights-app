// Formula reference & glossary — the model layer behind tab 6 of the
// Corporate Finance Lab and the glossary shown in every tab's user guide.
//
//   - GLOSSARY: every acronym used anywhere in the Lab, with its full name
//     and a one-line plain-English definition.
//   - FORMULA_GROUPS: every equation in the Lab, grouped by the DECISION it
//     serves, each with the formula, what it says in words, and what it
//     feeds into — plus the decision chain that ties the group together.
//
// Education only; not investment, credit, accounting, or tax advice.

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------

export interface GlossaryEntry {
  term: string;
  full: string;
  def: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  { term: 'WACC', full: 'Weighted Average Cost of Capital', def: 'The blended return your equity and debt investors require — the floor any use of capital must beat.' },
  { term: 'CAPM', full: 'Capital Asset Pricing Model', def: 'How equity risk gets priced: Re = Rf + β × ERP.' },
  { term: 'ERP', full: 'Equity Risk Premium', def: 'The extra return stocks must offer over the risk-free rate (~5.5% teaching value).' },
  { term: 'Rf', full: 'Risk-free rate', def: 'The 10-year Treasury yield proxy — the price of time with no credit risk.' },
  { term: 'β (beta)', full: 'Beta', def: 'How hard a business swings versus the whole market: 1.0 moves with it, above 1 swings harder.' },
  { term: 'Re / Rd', full: 'Cost of equity / cost of debt', def: 'The annual return each class of investor requires for funding you.' },
  { term: 'NPV', full: 'Net Present Value', def: 'Today’s dollar value of future cash flows minus the investment — positive means value created.' },
  { term: 'IRR', full: 'Internal Rate of Return', def: 'The discount rate at which a project’s NPV equals zero — its break-even return.' },
  { term: 'EBITDA', full: 'Earnings Before Interest, Taxes, Depreciation & Amortization', def: 'Operating cash profit — the number lenders size debt and credit against.' },
  { term: 'COGS', full: 'Cost of Goods Sold', def: 'The direct cost of making what you sell.' },
  { term: 'AR / AP', full: 'Accounts Receivable / Accounts Payable', def: 'What customers owe you / what you owe suppliers.' },
  { term: 'DSO', full: 'Days Sales Outstanding', def: 'How many days it takes to collect a sale (AR ÷ revenue × 365).' },
  { term: 'DIO', full: 'Days Inventory Outstanding', def: 'How many days inventory sits before it sells (inventory ÷ COGS × 365).' },
  { term: 'DPO', full: 'Days Payables Outstanding', def: 'How many days you take to pay suppliers (AP ÷ COGS × 365).' },
  { term: 'CCC', full: 'Cash Conversion Cycle', def: 'DSO + DIO − DPO — the days cash is trapped between paying suppliers and collecting from customers.' },
  { term: 'WC', full: 'Working Capital', def: 'Current assets minus current liabilities — the cushion for bills due this year.' },
  { term: 'LC', full: 'Standby Letter of Credit', def: 'A bank’s promise to pay if the customer doesn’t — the bank’s credit replaces theirs.' },
  { term: 'COD', full: 'Cash On Delivery', def: 'Payment when the goods arrive — no credit extended at all.' },
  { term: 'Net 30/60/90', full: 'Net payment terms', def: 'The invoice is due 30/60/90 days after shipment — the days your money rides with the customer.' },
  { term: 'M&A', full: 'Mergers & Acquisitions', def: 'Buying or combining companies.' },
  { term: 'GDP', full: 'Gross Domestic Product', def: 'Everything the economy produces in a year — the growth dial’s real-world indicator.' },
  { term: 'CPI', full: 'Consumer Price Index', def: 'The inflation gauge the Fed watches — its target is ~2% a year.' },
  { term: 'FOMC', full: 'Federal Open Market Committee', def: 'The Fed committee that sets interest rates — eight scheduled meetings a year.' },
  { term: 'QE / QT', full: 'Quantitative Easing / Tightening', def: 'The Fed buying bonds to add money and credit (QE) or shedding them to drain it (QT).' },
  { term: 'SOFR', full: 'Secured Overnight Financing Rate', def: 'The floating benchmark most business loans price off — moves with the Fed within days.' },
  { term: 'CP', full: 'Commercial Paper', def: 'Short-term unsecured corporate IOUs — cheap funding that must be constantly rolled over.' },
  { term: 'T-bill', full: 'Treasury bill', def: 'US government debt under one year — the "cash" yield in every comparison.' },
  { term: 'FX', full: 'Foreign Exchange', def: 'The currency market — where a euro invoice becomes a dollar cost.' },
  { term: 'DCF', full: 'Discounted Cash Flow', def: 'Valuing a business as the present value of the cash it will generate — forecast, terminal value, discount.' },
  { term: 'FCF', full: 'Free Cash Flow', def: 'Cash the business throws off after tax, capex, and working capital — NOPAT + D&A − capex − ΔNWC.' },
  { term: 'NOPAT', full: 'Net Operating Profit After Tax', def: 'EBIT × (1 − tax) — operating profit as if the business had no debt.' },
  { term: 'D&A', full: 'Depreciation & Amortization', def: 'The non-cash expense spreading an asset’s cost over its life — added back on the way to cash flow.' },
  { term: 'TV', full: 'Terminal Value', def: 'The value of all cash flows beyond the forecast: FCF₅ × (1+g) ÷ (WACC − g). Usually most of a DCF.' },
  { term: 'EV', full: 'Enterprise Value', def: 'The price of the whole operating business: equity value + debt − cash.' },
  { term: 'EV/EBITDA', full: 'Enterprise value to EBITDA multiple', def: 'The workhorse comparison multiple — capital-structure neutral, so differently financed peers compare cleanly.' },
  { term: 'NWC / ΔNWC', full: '(Change in) Net Working Capital', def: 'Receivables + inventory − payables; growth builds it first, so ΔNWC drains free cash flow.' },
  { term: 'LTM', full: 'Last Twelve Months', def: 'The trailing-year figure a forecast starts from.' },
  { term: 'PP&E', full: 'Property, Plant & Equipment', def: 'The fixed assets on the balance sheet that depreciation wears down.' },
  { term: 'YoY', full: 'Year over Year', def: 'Compared with the same period one year earlier.' },
  { term: 'bp / pp', full: 'Basis point / percentage point', def: 'A basis point is 1/100th of a percent (25bp = 0.25%); a percentage point is a full 1%.' },
];

// ---------------------------------------------------------------------------
// The formulas, grouped by decision
// ---------------------------------------------------------------------------

export interface FormulaDef {
  name: string;
  eq: string;
  /** What the equation says, in words. */
  plain: string;
  /** What its output feeds into. */
  feeds: string;
}

export interface FormulaGroup {
  id: string;
  /** The decision this group of formulas serves. */
  decision: string;
  tab: string;
  /** The chain: how the formulas hand off to each other. */
  flow: string;
  formulas: FormulaDef[];
}

export const FORMULA_GROUPS: FormulaGroup[] = [
  {
    id: 'invest',
    decision: 'Should we make this move? (capital allocation)',
    tab: 'Tab 1 — Your company’s moves',
    flow: 'Rf, β, spread → Re & Rd → WACC → + risk premium → hurdle · scenario → expected return · expected − hurdle → spread → NPV sign → go / borderline / no',
    formulas: [
      { name: 'Cost of equity (CAPM)', eq: 'Re = Rf + β × ERP', plain: 'Shareholders want the risk-free rate plus extra for how hard your business swings.', feeds: 'The equity side of WACC.' },
      { name: 'Cost of debt', eq: 'Rd = Rf + credit spread, after-tax × (1 − 25%)', plain: 'Lenders want the risk-free rate plus a spread for your credit; interest is tax-deductible, so the true cost is lower.', feeds: 'The debt side of WACC.' },
      { name: 'WACC', eq: 'WACC = 70% × Re + 30% × Rd(1−T)', plain: 'Blend the two at the target capital mix — the return the whole capital base demands.', feeds: 'The base of every risky hurdle, and the discount rate mindset for NPV.' },
      { name: 'Risk-adjusted hurdle', eq: 'hurdle = WACC + option premium   (safe uses: Rf + premium)', plain: 'Riskier moves must clear more; near-guaranteed uses (debt paydown, T-bills) compare against the risk-free rate instead.', feeds: 'The bar each option’s expected return must beat.' },
      { name: 'Expected return', eq: 'expected = base + Σ (sensitivity × dial)', plain: 'Each option’s neutral-market return, shifted by how the four dials treat it.', feeds: 'The spread, and (in this flat model) the IRR.' },
      { name: 'Spread & NPV', eq: 'spread = expected − hurdle · NPV = Σ CF/(1+h)^t − investment', plain: 'Positive spread means the move earns more than capital costs — and NPV is positive exactly then.', feeds: 'The verdict: spread ≥ +1pp go · within ±1pp borderline · below no.' },
      { name: 'Δ NPV vs neutral', eq: 'Δ = NPV(your scenario) − NPV(neutral market)', plain: 'The dollars the environment itself adds or removes from a project.', feeds: 'Scenario-risk tracking — which projects the market gives and takes.' },
    ],
  },
  {
    id: 'proforma',
    decision: 'What spread does MY balance sheet deserve? (pro forma)',
    tab: 'Tab 1 — pro forma mode',
    flow: 'financials → adjusted debt → leverage & coverage → weaker ratio → tier → spread → back into WACC',
    formulas: [
      { name: 'Adjusted debt', eq: 'adjusted debt = balance-sheet debt + pension & lease obligations', plain: 'Lenders add debt-like obligations (unfunded pension, operating leases) before judging you.', feeds: 'The leverage numerator.' },
      { name: 'Leverage', eq: 'leverage = adjusted debt ÷ EBITDA', plain: 'Years of operating profit to repay everything you owe. ≤2× strong · ≤4× average · above stretched.', feeds: 'One of the two tier votes.' },
      { name: 'Coverage', eq: 'coverage = EBITDA ÷ interest', plain: 'How many times profit covers the interest bill. ≥5× strong · ≥2.5× average · below stretched.', feeds: 'The other tier vote — and the WEAKER of the two wins.' },
      { name: 'Tier → spread', eq: 'strong +2% · average +3% · stretched +5%', plain: 'The tier prices your borrowing spread.', feeds: 'Rd, and through it your WACC and every hurdle above.' },
    ],
  },
  {
    id: 'credit',
    decision: 'Can this customer pay? (trade-credit underwriting)',
    tab: 'Tab 2 — Customer credit',
    flow: 'their financials → six ratios → bands → weighted score · financials → two caps × terms factor · score gate + caps → limit → classification → security ladder',
    formulas: [
      { name: 'The six ratios', eq: 'coverage = EBITDA÷interest · leverage = debt÷EBITDA · current = CA÷CL\nDSO = AR÷revenue×365 · CCC = DSO + DIO − DPO · margin = EBITDA÷revenue', plain: 'Can they pay everyone, can they pay this year, is there cushion, and how long is your money inside their business?', feeds: 'Each ratio lands in a band: good / watch / risk.' },
      { name: 'Credit score', eq: 'score = Σ weight × band points   (coverage 25 · leverage 20 · current 15 · DSO 15 · CCC 15 · margin 10)', plain: 'A weighted 0–100 read of the bands (good 100 · watch 60 · risk 20).', feeds: 'The gate: ≥70 approve · 45–69 conditional · <45 decline.' },
      { name: 'The two caps', eq: 'cash-flow cap = 30% × (EBITDA − interest) × tf · liquidity cap = 20% × (WC + cash) × tf', plain: 'Size the line off what their cash flow and liquidity can actually carry — take the smaller.', feeds: 'The ceiling the score gate applies to.' },
      { name: 'Terms factor', eq: 'Net 30 ×1.0 · Net 60 ×0.75 · Net 90 ×0.6', plain: 'Longer terms leave you exposed longer, so the caps shrink.', feeds: 'Both caps, and the security ladder amounts.' },
      { name: 'The limit', eq: '≥70: min(requested, cap) · 45–69: half that, with security · <45: 0 (prepay/COD)', plain: 'The score gates how much of the capacity you extend, and on what structure.', feeds: 'The classification: unsecured / secured / prepay.' },
      { name: 'The security ladder', eq: 'guarantee → full cap · deposit or LC → requested (covering the gap) · prepay → any amount', plain: 'Security moves a customer up the ladder: a guarantee improves recovery, collateral replaces their credit, prepay removes the risk.', feeds: 'The final offer you put in front of the customer.' },
    ],
  },
  {
    id: 'treasury',
    decision: 'Which treasury tool fits this environment? (hedging)',
    tab: 'Tab 1, step D — the treasury & hedging playbook',
    flow: 'the dials → each instrument’s fit rule → fits / situational / avoid · committed exposure → hedge math → certainty',
    formulas: [
      { name: 'Idle cash', eq: 'earnings = yield × idle cash', plain: 'Money-market yield on every dollar not needed tomorrow.', feeds: 'The baseline every other use of cash competes with.' },
      { name: 'Pay-fixed swap', eq: 'savings ≈ notional × Δrate', plain: 'Fixing floating debt saves (or costs) the notional times how far rates move.', feeds: 'The short-vs-long debt playbook on tab 3.' },
      { name: 'Commodity forward', eq: 'hedged cost = quantity × forward price', plain: 'Lock next season’s input cost — certain, whatever spot does.', feeds: 'Margin protection when inflation is running.' },
      { name: 'Options', eq: 'max loss = premium', plain: 'Pay a known premium for a floor or ceiling and keep the upside.', feeds: 'The high-uncertainty play when direction is unclear.' },
      { name: 'The one rule', eq: 'hedge committed exposures only — never to speculate', plain: 'A hedge with nothing behind it is a market bet with extra paperwork.', feeds: 'Every verdict on the tab.' },
    ],
  },
  {
    id: 'valuation',
    decision: 'What is this business worth? (valuation)',
    tab: 'Tab 5 — Valuation (DCF & comps)',
    flow: 'drivers → FCF forecast → + terminal value → discount at WACC → EV → − net debt → equity value · peer multiple × EBITDA → the cross-check',
    formulas: [
      { name: 'Free cash flow', eq: 'FCF = NOPAT + D&A − capex − ΔNWC', plain: 'Cash the business actually throws off: after-tax operating profit, non-cash D&A back, growth spending out.', feeds: 'The five forecast years of the DCF.' },
      { name: 'Terminal value (Gordon)', eq: 'TV = FCF₅ × (1+g) ÷ (WACC − g)', plain: 'Everything beyond year 5, as a perpetuity growing at g — keep g at or below long-run GDP growth.', feeds: 'Usually 60–80% of the EV — which is why the sensitivity grid exists.' },
      { name: 'Enterprise value', eq: 'EV = Σ FCFₜ/(1+WACC)ᵗ + TV/(1+WACC)⁵', plain: 'Discount the forecast and the terminal value at WACC and add them.', feeds: 'The equity bridge, and the implied multiple.' },
      { name: 'The equity bridge', eq: 'equity value = EV − net debt   (net debt = debt − cash)', plain: 'Lenders get paid first; shareholders own what remains of the enterprise.', feeds: 'The number a share price is made of.' },
      { name: 'Market approach', eq: 'implied EV = peer EV/EBITDA × EBITDA', plain: 'What comparable companies say the business is worth — the reality check on the DCF.', feeds: 'The triangulation: when DCF and comps diverge, an assumption is doing the talking.' },
      { name: 'Sensitivity grid', eq: 'EV over WACC ± 1pp × g ± 0.5pp', plain: 'A valuation is a range, not a number — the grid shows how wide.', feeds: 'The honest answer you present.' },
    ],
  },
  {
    id: 'machine',
    decision: 'Where is the machine, and where is it pushing? (macro)',
    tab: 'Tabs 3 & 4 — Market analysis / The economic machine',
    flow: 'dials → impact & trends → equilibrium reads → the two levers answer → dials move again (the loop IS the cycle)',
    formulas: [
      { name: 'Modeled impact', eq: 'impact % = Sg×G + Si×I + Sp×P + Sf×F', plain: 'Each asset/industry’s published sensitivities times the four dials — the 12-month backdrop.', feeds: 'The industry trend charts, and the credit backdrop on tab 2.' },
      { name: 'Cross-effect pressure', eq: 'pressure on a dial = Σ (sign × other dial)', plain: 'Growth feeds inflation, inflation forces the Fed, the Fed cools both with a lag, fiscal feeds demand.', feeds: 'The pressure cards and the projection below.' },
      { name: 'Dial projection', eq: 'next quarter = dial + 0.3 × pressure   (clamped ±2)', plain: 'Run the pushes forward a step per quarter — the feedback loop bends every trend back.', feeds: 'The 8-quarter trend charts (dials, industries, assets).' },
      { name: 'Equilibrium 1 — debt vs income', eq: 'gap = (−Fed + fiscal) − growth', plain: 'Credit pumped faster than income grows is borrowed time; drained faster is the medicine.', feeds: 'The long-cycle ratchet — and how easily your customer refinances.' },
      { name: 'Equilibrium 2 — operating rate', eq: 'heat = growth + ½ × inflation', plain: 'Too hot invites the brakes, too cold invites the cuts; cold output with hot prices is stagflation — torn.', feeds: 'What the Fed does next.' },
      { name: 'Equilibrium 3 — risk premiums', eq: 'equities > bonds > cash, by fair premiums', plain: 'Tight policy compresses the stack (cash competes); QE stretches it (capital pushed out the risk curve).', feeds: 'Your WACC inputs on tab 1 — the loop closes.' },
    ],
  },
];
