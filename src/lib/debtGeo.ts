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
// Trade balances, currency trends, and the Korea case
// ---------------------------------------------------------------------------
//
// APPROXIMATE TEACHING VALUES (~2025, goods + services, $B, rounded) —
// refresh from Census/BEA (US), national statistics offices, and IMF before
// citing. The balance column is COMPUTED (exports − imports), never typed.

export interface TradeBalance {
  id: string;
  name: string;
  exportsB: number;
  importsB: number;
  note: string;
}

export const TRADE_BALANCES: TradeBalance[] = [
  { id: 'us', name: 'United States', exportsB: 3100, importsB: 4000, note: 'The world’s deficit: it consumes more than it sells, financed by the reserve currency — the flip side of tab 11’s Treasury supply.' },
  { id: 'china', name: 'China', exportsB: 3600, importsB: 2700, note: 'The world’s surplus: exports absorb the demand its own consumers don’t supply — the mirror of the US deficit, and the tariff war’s target.' },
  { id: 'germany', name: 'Germany', exportsB: 2000, importsB: 1750, note: 'The export machine inside a currency union — a surplus it cannot revalue away, which is half of euro-area politics.' },
  { id: 'skorea', name: 'South Korea', exportsB: 770, importsB: 700, note: 'A surplus built on chips and ships: trade is a huge share of GDP, so the won and the KOSPI live and die with the export cycle — the case study below.' },
  { id: 'japan', name: 'Japan', exportsB: 920, importsB: 940, note: 'The old surplus giant now near balance: energy imports and offshored production — the income comes home as investment returns instead.' },
  { id: 'uk', name: 'United Kingdom', exportsB: 1100, importsB: 1180, note: 'Services surplus, goods deficit — the pound absorbs the difference.' },
  { id: 'france', name: 'France', exportsB: 1050, importsB: 1130, note: 'A persistent deficit inside the euro — no currency valve, so competitiveness fights happen through politics.' },
  { id: 'india', name: 'India', exportsB: 820, importsB: 1080, note: 'A growth deficit: importing energy and capital goods to build — sustainable while capital inflows fund it; the rupee slides when they pause.' },
  { id: 'italy', name: 'Italy', exportsB: 700, importsB: 650, note: 'Quiet surplus: machinery, luxury, agrifood — the export engine that keeps the debt table’s 137% financeable.' },
  { id: 'brazil', name: 'Brazil', exportsB: 390, importsB: 320, note: 'Commodity surplus — the real is a commodity-price thermometer.' },
  { id: 'canada', name: 'Canada', exportsB: 720, importsB: 740, note: 'Near balance, hostage to one customer: the US takes ~3/4 of exports, so US tariff politics IS Canadian trade policy.' },
];

export const TRADE_SOURCE =
  'Goods + services, ~2025, $B — APPROXIMATE TEACHING VALUES (rounded); balance computed as exports − imports. Refresh from Census/BEA, national statistics, and the IMF before citing.';

/** Computed, never typed: exports − imports. */
export function tradeBalanceB(t: TradeBalance): number {
  return t.exportsB - t.importsB;
}

/** Currency value vs the US dollar, indexed 2021 = 100. Lower = weaker. */
export const CURRENCY_YEARS = ['2021', '2022', '2023', '2024', '2025', '2026'] as const;

export interface CurrencyTrend {
  id: string;
  name: string;
  /** Index of the currency's USD value per CURRENCY_YEARS entry (2021 = 100). */
  index: [number, number, number, number, number, number];
  note: string;
}

export const CURRENCY_TRENDS: CurrencyTrend[] = [
  { id: 'jpy', name: 'Japanese yen', index: [100, 84, 81, 75, 72, 71], note: 'The biggest slide: zero-bound holdout while the Fed hiked — carry-trade fuel, import-inflation pain (~¥110 → ~¥155/$).' },
  { id: 'krw', name: 'Korean won', index: [100, 88, 86, 82, 76, 75], note: 'Weakest since 2009 during the Dec-2024 political crisis (~₩1,100 → ~₩1,470/$) — the case study’s spine.' },
  { id: 'cny', name: 'Chinese yuan', index: [100, 95, 91, 89, 89, 88], note: 'Managed drift lower — a weaker yuan cushions tariffs, but too fast invites outflows.' },
  { id: 'inr', name: 'Indian rupee', index: [100, 94, 90, 88, 86, 85], note: 'The growth-deficit slide: steady, managed depreciation as imports outrun exports.' },
  { id: 'eur', name: 'Euro', index: [100, 91, 92, 92, 90, 91], note: 'One down-leg in 2022 (energy shock), then range-bound — the union mutes the moves and moves the fight into politics.' },
  { id: 'gbp', name: 'British pound', index: [100, 91, 92, 93, 92, 92], note: 'The 2022 gilt episode inside the dip — bond markets discipline mid-size sovereigns through the currency too.' },
  { id: 'cad', name: 'Canadian dollar', index: [100, 97, 94, 92, 90, 91], note: 'Grinding lower with rate differentials and tariff risk on the one big customer.' },
  { id: 'brl', name: 'Brazilian real', index: [100, 97, 102, 96, 92, 93], note: 'High real rates defend it; fiscal-credibility scares knock it — the EM pattern in one line.' },
];

export const CURRENCY_SOURCE =
  'Currency value vs USD, indexed 2021 = 100 (lower = weaker) — APPROXIMATE TEACHING VALUES from the documented moves (¥110→~155, ₩1,100→~1,470, €1.20→~1.09…). Refresh from official/market sources before citing.';

/** Chart rows: {year, [currencyId]: index}. */
export function currencyRows(): Record<string, number | string>[] {
  return CURRENCY_YEARS.map((year, i) => {
    const row: Record<string, number | string> = { year };
    for (const c of CURRENCY_TRENDS) row[c.id] = c.index[i];
    return row;
  });
}

/** The South Korea case — trade, currency, equities, and politics in one chain. */
export const KOREA_CASE = {
  title: 'Case study: South Korea — when politics hits the exchange rate',
  facts: [
    'An export economy: trade flows are a very large share of GDP, concentrated in semiconductors, autos, and ships — the won and the KOSPI are levered to the global capex cycle.',
    'The won slid from ~₩1,100/$ (2021) to ~₩1,470/$ — its weakest since the 2009 crisis — with the sharpest leg landing around the December 2024 martial-law declaration and impeachment crisis.',
    'The "Korea discount": the KOSPI persistently trades below global peers on governance (chaebol cross-holdings, weak minority-shareholder rights) — political risk priced as a permanent equity discount.',
    'The central bank’s bind: defending the won argues for higher rates; a slowing, export-dependent economy argues for cuts — the torn reading, currency edition.',
  ],
  chain: [
    'Political shock (martial-law crisis, impeachment) → foreign investors reprice governance risk',
    '→ capital outflows from the KOSPI → won sells off to ~₩1,470 (weakest since 2009)',
    '→ imports (energy, food) cost more in won → inflation pressure at home',
    '→ the Bank of Korea is trapped: defend the currency (hike) or defend growth (cut) — not both',
    '→ a weaker won DOES flatter exporters’ won-revenues… which is why surplus economies tolerate slides — until the outflow becomes the story',
    '→ the health check in one glance: trade balance (still surplus?) × currency trend (orderly or disorderly?) × equity discount (widening?) × politics (resolving or compounding?)',
  ],
  lesson:
    'The lesson for reading ANY country: surplus vs deficit tells you the cash engine; the currency trend tells you whether the world still wants the claim; the equity discount tells you what governance costs; and politics is the accelerant that turns a slide into a run. Korea in 2024–26 shows all four gauges moving at once — and why the drivers list below has "elections & leadership" at the top.',
};

/**
 * GDP & GSP impact watch — the NON-fiscal items that move output over the
 * next ~24 months: disease & health policy (FDA / health departments), food
 * & agriculture, and education/workforce changes. Keyed to the SAME top-10
 * country and top-10 state lists as the debt tables. Qualitative teaching
 * reads compiled 2026-08 — verify before citing.
 */
export interface GdpImpactRow {
  /** Matches COUNTRY_DEBT ids / STATE_DEBT ids. */
  id: string;
  name: string;
  health: string;
  food: string;
  education: string;
  read: string;
}

export const GDP_IMPACT_COUNTRIES: GdpImpactRow[] = [
  { id: 'us', name: 'United States', health: 'FDA approval & drug-pricing policy shifts; avian-flu waves hitting poultry/eggs; ACA subsidy cliffs moving household budgets.', food: 'Avian flu and drought swings feed straight into tab 3’s food line; tariffs raise imported-food costs.', education: 'Student-loan and school-funding fights; workforce pipelines for chips/EV plants the industrial policy just funded.', read: 'Channels: food CPI (inflation dial), labor supply (growth dial), and health spending ~1/6 of GDP — small policy shifts move big numbers.' },
  { id: 'china', name: 'China', health: 'Aging at unprecedented speed — health-system costs compound the property-debt drag.', food: 'Grain self-sufficiency drive; pork-cycle swings are a CPI event.', education: 'Youth-unemployment / degree-mismatch — the demographic dividend running in reverse.', read: 'Demography IS the 24-month story: fewer workers, more dependents — a structural drag no stimulus plenum fixes.' },
  { id: 'japan', name: 'Japan', health: 'Super-aging: healthcare and long-term-care absorb an ever-larger GDP share.', food: 'Heavy import dependence — the weak yen (currency chart) is imported food inflation.', education: 'Shrinking cohorts closing schools and universities.', read: 'The aging-plus-weak-currency squeeze: output flat, costs imported — why the yen slide is a living-standards event.' },
  { id: 'germany', name: 'Germany', health: 'Aging workforce meets a care-worker shortage.', food: 'Energy-linked processing costs; CAP politics.', education: 'The vaunted vocational system straining to re-skill for electrification.', read: 'Labor supply is the binding constraint — immigration and re-skilling policy are GDP policy.' },
  { id: 'uk', name: 'United Kingdom', health: 'NHS backlogs keeping working-age people out of the labor force — a measured GDP drag.', food: 'Post-Brexit trade frictions keeping food inflation sticky.', education: 'University funding model cracking; skills gaps.', read: 'Health-related inactivity is the quiet growth-dial story — treatment waiting lists are labor-supply policy.' },
  { id: 'france', name: 'France', health: 'Health spending inside every budget standoff.', food: 'Farmer protests and CAP fights — agriculture is street politics.', education: 'Reform attempts colliding with the street.', read: 'Every social-policy change risks a political crisis (see populism table) — the fiscal and the social pipelines are the same pipe.' },
  { id: 'india', name: 'India', health: 'Public-health infrastructure build-out; heat-stress on labor.', food: 'THE channel: monsoon → food prices → RBI policy — food weights dominate the CPI basket.', education: 'The demographic-dividend test: educating the world’s largest cohort into productive work.', read: 'A bad monsoon is a monetary-policy event; a good education decade is the whole growth model.' },
  { id: 'italy', name: 'Italy', health: 'Europe’s oldest population after Japan — care costs vs the 137% debt stock.', food: 'Weather-sensitive agrifood exports (the surplus’s backbone).', education: 'Brain drain of graduates north — exporting the workforce it educated.', read: 'Demography against the debt table: fewer workers servicing more debt is equilibrium 1 in slow motion.' },
  { id: 'brazil', name: 'Brazil', health: 'Climate-driven disease burden (dengue) straining public health.', food: 'Harvest cycles swing the trade surplus and the real (currency chart).', education: 'Productivity-limiting education gaps — the reason high rates bite so hard.', read: 'The harvest is the macro: one drought moves the trade balance, the currency, and the policy rate together.' },
  { id: 'canada', name: 'Canada', health: 'Wait-time-driven labor-force effects; provincial health budgets dominating spending.', food: 'Prairie harvests and one-customer export exposure.', education: 'Immigration-driven enrollment surges and the housing collision.', read: 'Immigration policy is simultaneously education, housing, and GDP policy — one lever, three dials.' },
];

export const GSP_IMPACT_STATES: GdpImpactRow[] = [
  { id: 'ca', name: 'California', health: 'Medi-Cal budget squeeze in every deficit year.', food: 'The #1 farm state: drought and water allocation move national produce prices.', education: 'UC/CSU funding vs enrollment; K-12 swings with the boom-bust revenue base.', read: 'Water is the GSP item: an allocation cut is simultaneously a food-price and farm-employment event.' },
  { id: 'tx', name: 'Texas', health: 'Rural hospital closures shrinking regional labor markets.', food: 'Drought/cattle cycles; avian flu in poultry.', education: 'School-funding and voucher fights; chip-plant workforce pipelines.', read: 'The workforce pipeline is the constraint on the industrial build-out the state just won.' },
  { id: 'ny', name: 'New York', health: 'Hospital-system finances and Medicaid share of the budget.', food: 'Dense-metro food-price sensitivity — CPI politics.', education: 'Enrollment decline vs the school-funding formula.', read: 'Out-migration is the GSP watch: each leaver takes taxable income and a student seat.' },
  { id: 'fl', name: 'Florida', health: 'Hurricane-driven public-health and insurance stress.', food: 'Citrus greening disease shrinking a signature crop.', education: 'Enrollment boom vs teacher shortages.', read: 'The insurance market is the balance-sheet risk (as the debt table notes) — one storm season moves the budget.' },
  { id: 'il', name: 'Illinois', health: 'Public-health spending crowded out by pension math.', food: 'Corn/soy harvests swing downstate income.', education: 'Chicago school finances — the pension story’s twin.', read: 'The pension crowd-out IS the GSP story: every service competes with the promise layer.' },
  { id: 'pa', name: 'Pennsylvania', health: 'Rural health access shrinking labor participation.', food: 'Dairy consolidation.', education: 'State-system university consolidation.', read: 'A slow-demography state: the 24-month items are all about keeping workers in the workforce.' },
  { id: 'oh', name: 'Ohio', health: 'Opioid-legacy costs still in the budget.', food: 'Corn/soy cycles.', education: 'Workforce training for the chips/EV plants — the state’s bet.', read: 'Execution risk on the industrial bet: the plants are funded; the trained workforce is the open question.' },
  { id: 'ga', name: 'Georgia', health: 'Rural hospital closures vs the Atlanta boom.', food: 'Top poultry state — avian flu is a GSP event here.', education: 'HOPE scholarship pipeline feeding the logistics/film/tech mix.', read: 'One avian-flu wave hits the #1 poultry state’s farm income and the national egg price at once.' },
  { id: 'nj', name: 'New Jersey', health: 'Health costs inside the strained budget (see the pension hole).', food: 'Metro food-price sensitivity.', education: 'School-funding formula litigation, perennially.', read: 'Like Illinois: the promise layer crowds the services — the GSP watch is budget arithmetic.' },
  { id: 'wa', name: 'Washington', health: 'Behavioral-health system rebuild.', food: 'Apples/wheat — tariff-retaliation exposure on export crops.', education: 'Tech-workforce demand vs housing costs.', read: 'The export-crop + tariff link: state farm income moves with trade policy set in Washington DC, not Olympia.' },
];

export const GDP_IMPACT_NOTE =
  'Qualitative 24-month watch items, keyed to the same top-10 country and top-10 state lists as the debt tables — the NON-fiscal channels (disease & health policy incl. FDA/health departments, food & agriculture, education/workforce) through which GDP and GSP move. Compiled 2026-08; verify before citing.';

/** Populism pressure and the fiscal-policy pipeline, by country. */
export interface PopulismRow {
  country: string;
  pressure: 'acute' | 'high' | 'rising' | 'moderate' | 'n/a';
  expression: string;
  fiscalPipeline: string;
  impact: string;
}

export const POPULISM_WATCH: PopulismRow[] = [
  { country: 'United States', pressure: 'high', expression: 'Populism of both flanks: tariffs, industrial policy, anti-establishment tax fights — Dalio’s widest party polarity since 1900.', fiscalPipeline: 'Tariff schedules in force; tax-cut extension fight and debt-ceiling rounds ahead; Nov-2026 midterms decide whether the fiscal lever moves at all.', impact: 'Deficit path → Treasury supply → the tab-11 term premium; tariffs feed tab 3’s energy/goods lines.' },
  { country: 'France', pressure: 'high', expression: 'Hard-right and hard-left blocs squeeze every budget; pension politics chronically explosive.', fiscalPipeline: 'Annual budget standoffs through the 2027 presidential; each one risks a government.', impact: 'The France–Germany spread is the market’s live vote; a bloc win in 2027 is a capital-flows event.' },
  { country: 'Germany', pressure: 'rising', expression: 'AfD pressure against the establishment; the debt-brake orthodoxy under strain.', fiscalPipeline: 'Defense/infrastructure spending vs the constitutional debt brake — the definitional fiscal fight of the window.', impact: 'If the brake bends, the euro area’s anchor issuer adds supply — bunds, and every spread priced off them, reprice.' },
  { country: 'United Kingdom', pressure: 'rising', expression: 'Reform’s anti-establishment surge squeezing both major parties.', fiscalPipeline: 'Fiscal rules vs spending demands at every budget; the gilt market referees (2022 showed how fast).', impact: 'Gilt yields and sterling take the strain first — the mid-size-sovereign discipline case.' },
  { country: 'Italy', pressure: 'moderate', expression: 'Populism in office and institutionalizing — the pattern where governing moderates the rhetoric.', fiscalPipeline: 'Budgets vs EU deficit rules, 2026–27, with the ECB backstop as the quiet constraint.', impact: 'The BTP–bund spread is the euro area’s stress gauge (tab 15’s debt table: 137% of GDP).' },
  { country: 'South Korea', pressure: 'acute', expression: 'The martial-law crisis and impeachment — institutional shock, not just party polarity.', fiscalPipeline: 'Post-crisis budgets, chaebol-governance reform attempts, chip-industry support packages.', impact: 'The case study above: won, KOSPI discount, and the BoK’s bind — politics pricing straight into the exchange rate.' },
  { country: 'Japan', pressure: 'moderate', expression: 'Cost-of-living politics pressuring consumption-tax and subsidy policy.', fiscalPipeline: 'Stimulus supplements vs the world’s largest debt stock; any push on the BoJ tests the yen.', impact: 'The yen is the release valve (see the currency chart) — and the carry trade the world borrows through.' },
  { country: 'India', pressure: 'moderate', expression: 'Welfare-populism auctions around the state-election cycle.', fiscalPipeline: 'Subsidy expansions into 2027–28 state elections; deficit vs the growth-deleveraging math.', impact: 'High nominal growth absorbs a lot — the deficit matters when growth slips, not before.' },
  { country: 'Brazil', pressure: 'high', expression: 'Polarized left-right cycle with fiscal credibility the recurring casualty.', fiscalPipeline: 'The fiscal framework’s credibility test into the Oct-2026 general election.', impact: 'The real and the high-real-rate regime: every credibility wobble is paid for in the policy rate.' },
  { country: 'China', pressure: 'n/a', expression: 'No electoral populism — but the same wealth-gap pressures managed by policy: "common prosperity," property deleveraging.', fiscalPipeline: 'Plenum-cycle decisions: stimulus vs deleveraging, local-government debt workouts, industrial policy.', impact: 'Arrives by announcement, not ballot — commodity demand and the yuan’s managed drift are the tells.' },
];

export const POPULISM_NOTE =
  'The Dalio frame from tab 4: the wealth gap (top 0.1% ≈ bottom 90%; 40% can’t raise $400) produces populism of BOTH flanks, and populism owns the fiscal lever — so this table is the pipeline through which internal politics becomes deficits, tariffs, and ultimately the term premium. Assessments are qualitative teaching reads compiled 2026-08; verify before citing.';

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
