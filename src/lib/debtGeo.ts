// Sovereign debt & geopolitics — the model layer behind tab 15.
//
// Dalio's equilibrium 1 at sovereign scale: debt vs the income that services
// it, for the ten largest economies — plus the US-state version, where
// balanced-budget rules push the real long-term liability into pensions
// (the same "promises we don't call debt" from the talk, and the same reason
// tab 1's pro forma adds pension to leverage). Then the geopolitics layer:
// what is moving now, what TYPICALLY moves it, and the scheduled events of
// the next 24 months.
//
// DATA HONESTY: country figures are IMF-WEO-style general-government gross
// debt as % of GDP, APPROXIMATE TEACHING VALUES rounded to whole points —
// refresh from imf.org / fiscaldata.treasury.gov before citing. State
// figures are state+local bonded debt as % of state GDP, INTERNAL TEACHING
// ESTIMATES. Calendar entries are constitutionally scheduled or due-by
// dates, not predictions. Education only.

export interface CountryDebt {
  id: string;
  name: string;
  /** Debt/GDP %, approximate, at [2000, 2010, 2020, 2025]. */
  trend: [number, number, number, number];
  note: string;
}

export const DEBT_TREND_YEARS = [2000, 2010, 2020, 2025] as const;

/** Ten largest economies — approximate general-government gross debt, % GDP. */
export const COUNTRY_DEBT: CountryDebt[] = [
  { id: 'us', name: 'United States', trend: [55, 91, 126, 123], note: 'The $40T debt from tab 11 — held up by reserve-currency demand; the term premium is the market beginning to charge for it.' },
  { id: 'china', name: 'China', trend: [23, 34, 70, 88], note: 'Official figure — local-government financing vehicles hide a large extra layer; the fastest ratchet on the list.' },
  { id: 'japan', name: 'Japan', trend: [135, 205, 258, 235], note: 'The endgame exhibit: decades at the zero bound, the central bank owning much of the stock — Dalio’s "latest in its long-term debt cycle."' },
  { id: 'germany', name: 'Germany', trend: [59, 82, 68, 63], note: 'The disciplinarian — a constitutional debt brake; the question is whether defense/industrial spending bends it.' },
  { id: 'uk', name: 'United Kingdom', trend: [37, 74, 105, 101], note: 'Tripled since 2000; the 2022 gilt episode showed how fast bond markets discipline a mid-size sovereign.' },
  { id: 'france', name: 'France', trend: [58, 85, 115, 112], note: 'Persistently above the euro-area line — every budget fight is now a spread-to-Germany event.' },
  { id: 'india', name: 'India', trend: [73, 66, 89, 82], note: 'High-nominal-growth math: income growth doing the deleveraging that austerity can’t.' },
  { id: 'italy', name: 'Italy', trend: [109, 119, 155, 137], note: 'The euro area’s stress gauge — sustainable only while the ECB backstop holds spreads down.' },
  { id: 'brazil', name: 'Brazil', trend: [65, 63, 96, 87], note: 'Emerging-market template: high real rates make even moderate ratios expensive to carry.' },
  { id: 'canada', name: 'Canada', trend: [80, 81, 118, 106], note: 'Federal ratio looks moderate; combined federal+provincial is the honest number — a states-style lesson.' },
];

export const COUNTRY_DEBT_SOURCE =
  'IMF World Economic Outlook-style general-government gross debt, % of GDP — APPROXIMATE TEACHING VALUES (rounded); refresh from imf.org / fiscaldata.treasury.gov before citing.';

export interface StateDebt {
  id: string;
  name: string;
  /** Rank by state GDP (1 = largest economy). */
  gdpRank: number;
  /** State + local bonded debt, % of state GDP — internal teaching estimate. */
  debtGspPct: number;
  /** The hidden layer: pension funding health. */
  pensionNote: string;
}

/** Top ten state economies — bonded debt % of GSP (teaching estimates). */
export const STATE_DEBT: StateDebt[] = [
  { id: 'ca', name: 'California', gdpRank: 1, debtGspPct: 7, pensionNote: 'Huge absolute pension obligations (CalPERS/CalSTRS) but meaningful funding; revenue is boom-bust with capital gains.' },
  { id: 'tx', name: 'Texas', gdpRank: 2, debtGspPct: 4, pensionNote: 'Low state debt; local school/municipal utility debt is where Texas leverage actually lives.' },
  { id: 'ny', name: 'New York', gdpRank: 3, debtGspPct: 14, pensionNote: 'Highest bonded-debt ratio of the big states — but pensions comparatively well funded.' },
  { id: 'fl', name: 'Florida', gdpRank: 4, debtGspPct: 4, pensionNote: 'Light debt; the state’s real balance-sheet risk is catastrophe/insurance exposure, not bonds.' },
  { id: 'il', name: 'Illinois', gdpRank: 5, debtGspPct: 9, pensionNote: 'THE pension cautionary tale — among the worst-funded major plans (~40%-funded territory): the unfunded promise dwarfs the bonded debt.' },
  { id: 'pa', name: 'Pennsylvania', gdpRank: 6, debtGspPct: 7, pensionNote: 'Middling debt, chronically underfunded pensions — the quiet version of Illinois.' },
  { id: 'oh', name: 'Ohio', gdpRank: 7, debtGspPct: 5, pensionNote: 'Moderate on both counts.' },
  { id: 'ga', name: 'Georgia', gdpRank: 8, debtGspPct: 3, pensionNote: 'AAA discipline — the low-debt benchmark among big states.' },
  { id: 'nj', name: 'New Jersey', gdpRank: 9, debtGspPct: 12, pensionNote: 'High debt AND one of the deepest pension holes — the state that proves the two layers compound.' },
  { id: 'wa', name: 'Washington', gdpRank: 10, debtGspPct: 6, pensionNote: 'Moderate debt, comparatively healthy pensions.' },
];

export const STATE_DEBT_SOURCE =
  'State + local bonded debt as % of state GDP — INTERNAL TEACHING ESTIMATES. The teaching point: balanced-budget rules cap states’ bonded debt, so the real long-term liability hides in pension promises (Dalio’s "liabilities we don’t call debt" — the same reason tab 1’s pro forma adds pension to leverage). Refresh from Census of Governments / state CAFRs before citing.';

// ---------------------------------------------------------------------------
// Geopolitics: what is moving now, what typically moves, what is scheduled
// ---------------------------------------------------------------------------

/** Current government changes/policies moving geopolitics (from the cited sources). */
export const GEO_CURRENT: string[] = [
  'The tariff wave and trade fragmentation — raising costs and re-regionalizing supply chains (semiconductors, energy, critical minerals) without collapsing trade (EY 2026 outlook; tab 3’s supply-shock preset).',
  'US–China technology restrictions — export controls on advanced chips and tools: Dalio’s rising-power-vs-existing-power conflict expressed through technology rather than armies.',
  'The Middle East conflict as a supply shock — energy, commodities, shipping routes, and financial conditions (the key downside risk in the EY outlook, and the doubt leg of tab 11’s term premium).',
  'Industrial policy at scale — subsidies for chips, batteries, and defense pulling investment flows and reshaping who produces what (the fiscal lever aimed by politics).',
  'Fiscal strain going mainstream — $40T US debt, $432B single-month deficits, interest ≈ two-thirds of the deficit: the bond market is now a political actor (tab 11’s scale story).',
  'Populism of the left and the right — the widest party polarity since 1900 in Dalio’s charts, turning elections into capitalism-vs-socialism referendums that move capital flows.',
];

export interface GeoDriver {
  name: string;
  what: string;
  /** Which dial/equilibrium it hits first. */
  hits: string;
}

/** What TYPICALLY drives geopolitical shocks — the standing watch list. */
export const GEO_DRIVERS: GeoDriver[] = [
  { name: 'Elections & leadership changes', what: 'Budgets, tariffs, alliances, and central-bank pressure can all flip with one vote.', hits: 'The fiscal dial jumps the day a law passes — before any economic data moves.' },
  { name: 'Wars & armed conflict', what: 'Reroutes energy, shipping, and capital; forces defense spending.', hits: 'Inflation up (supply), growth down — the torn reading on equilibrium 2.' },
  { name: 'Tariffs & trade policy', what: 'Reprices imports and retaliation reprices exports.', hits: 'The one shock pushing both Fed mandates the wrong way at once (tab 3).' },
  { name: 'Sanctions & export controls', what: 'Weaponized finance and technology access.', hits: 'Reserve-currency politics — pushes affected states toward alternative payment blocs.' },
  { name: 'Energy & resource control', what: 'OPEC decisions, chokepoints, critical minerals.', hits: 'The energy line of CPI (tab 3: ~12% now) and the commodity hedges of tab 1’s playbook.' },
  { name: 'Sovereign debt crises', what: 'A big borrower losing market access.', hits: 'Term premium and safe-haven flows — equilibrium 1 failing in public.' },
  { name: 'Currency & reserve status', what: 'Dalio’s guilder → pound → dollar arc.', hits: 'The slowest, biggest force: who gets to run deficits the world funds.' },
  { name: 'Technology races', what: 'AI, chips, 5G — “if you have technology it works both economically and militarily.”', hits: 'Productivity (the upside) and export controls (the friction) at once.' },
  { name: 'Alliances & treaties', what: 'NATO, trade blocs, defense pacts forming or fraying.', hits: 'The risk premium on every cross-border cash flow.' },
  { name: 'Wealth gaps & populism', what: 'The internal-politics force from the talk (top 0.1% ≈ bottom 90%).', hits: 'Tax and redistribution policy — the fiscal lever’s direction.' },
  { name: 'Immigration & demographics', what: 'Labor supply and entitlement math over decades.', hits: 'Trend growth and the pension math above.' },
  { name: 'Central-bank independence fights', what: 'Political pressure on rate-setters.', hits: 'The term premium — markets charge for politicized money.' },
];

export interface GeoEvent {
  when: string;
  where: string;
  what: string;
  why: string;
}

/** Scheduled/due-by events, next ~24 months (dates are constitutional schedules, not predictions). */
export const GEO_CALENDAR_COUNTRIES: GeoEvent[] = [
  { when: 'Oct 2026', where: 'Brazil', what: 'General election (president + congress)', why: 'Fiscal-credibility referendum for the highest-real-rate major EM.' },
  { when: 'Nov 2026', where: 'United States', what: 'Midterm elections — full House, one-third of the Senate', why: 'Decides whether the fiscal lever moves at all for two years — and tariff/tax posture into 2028.' },
  { when: '2027', where: 'France', what: 'Presidential election (constitutionally due)', why: 'Euro-area fiscal direction and the France–Germany spread; a hard-right or hard-left win is a capital-flows event (Dalio’s Corbyn point, updated).' },
  { when: '2027', where: 'Mexico', what: 'Midterm legislative elections', why: 'Nearshoring policy continuity — a direct input to the supply-chain re-regionalization trade.' },
  { when: '2027–2028', where: 'India', what: 'State-election cycle → general election runway', why: 'Policy continuity for the fastest-growing large economy.' },
  { when: 'By mid-2028', where: 'Japan', what: 'Upper-house election (scheduled); lower house due-by window opens', why: 'Any government stress tests the world’s largest debt stock at the zero bound.' },
  { when: 'Nov 2028', where: 'United States', what: 'Presidential election', why: 'The single largest scheduled geopolitical event in the window — tariffs, alliances, Fed appointments, fiscal path.' },
  { when: 'Rolling', where: 'China', what: 'No elections — but Party congress/plenum cycle sets five-year policy', why: 'Policy risk arrives by announcement, not ballot: watch plenums, not polls.' },
  { when: 'Rolling', where: 'OPEC+ / Middle East', what: 'Production decisions and conflict developments', why: 'The standing supply-shock channel into tab 3’s energy line.' },
];

export const GEO_CALENDAR_STATES: GeoEvent[] = [
  { when: 'Nov 2026', where: 'California, Texas, Florida, New York, Pennsylvania, Ohio, Georgia, Illinois', what: 'Gubernatorial elections — 8 of the top-10 state economies vote for governor', why: 'State fiscal posture, pension reform (or not), energy and housing policy — the state-level fiscal lever.' },
  { when: 'Nov 2026', where: 'All top-10 states', what: 'State legislatures + US House delegations on the ballot', why: 'Budgets and pension contributions are legislature decisions — the line items behind the state table above.' },
  { when: '2027', where: 'New Jersey (next cycle 2029), Washington (2028)', what: 'Off-cycle states — no governor race in 2026', why: 'The two top-10 states NOT voting in the wave; NJ’s pension math continues regardless of the calendar.' },
  { when: 'Ongoing', where: 'Illinois, New Jersey, Pennsylvania', what: 'Pension funding fights in each budget cycle', why: 'The slow-motion version of equilibrium 1 — promises vs the income to service them, no election required.' },
];

export const GEO_CALENDAR_NOTE =
  'Dates are constitutionally scheduled or due-by windows, compiled 2026-08 — verify before citing, and remember the tab-11 lesson: the events that matter most (auctions, plenums, conflicts) are often not on any ballot calendar.';
