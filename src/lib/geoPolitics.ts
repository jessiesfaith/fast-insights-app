// Geopolitics layer — the model behind tab 19's geopolitics steps and the
// per-lens exposure blocks (country / state / industry).
//
// Covers: the live flashpoints (Taiwan, the South China Sea island-building
// and international-waters campaign, Iran oil, Venezuela, the sanctions &
// dollar system, AI/chip export controls & data centers, the space race),
// the institutions (WTO, G7, G20, BRICS), two decades of US meetings and
// what they produced, a recent-window digest, and the two-decade economic
// timeline — each keyed back to the SAME top-10 country list, top-10 state
// list, and eight industries the rest of the Lab uses.
//
// Honesty model: entries through early 2026 are compiled history (verify
// dates before citing); the recent-window digest extends the Lab’s 2026
// snapshot world and is labeled ILLUSTRATIVE. Education only.

export const GEOPOLITICS_SOURCE =
  'Compiled history through early 2026 (verify dates and details against live sources before citing); the recent-window digest is an ILLUSTRATIVE continuation consistent with the Lab’s 2026 snapshots (tariff wave, Middle-East energy shock, term premium, AI capex boom). Education only.';

// ---------------------------------------------------------------------------
// Flashpoints
// ---------------------------------------------------------------------------

export interface Flashpoint {
  id: string;
  name: string;
  /** What is actually happening on the ground. */
  status: string;
  /** Why a finance person cares — the economic transmission. */
  economics: string;
  /** The dials and industries it hits first. */
  hits: string;
  /** What to watch next. */
  watch: string;
  /** Country ids (from the report's top-10 + skorea) most directly involved. */
  countries: string[];
  /** Industry ids (the Lab's eight) most directly exposed. */
  industries: string[];
}

export const FLASHPOINTS: Flashpoint[] = [
  {
    id: 'taiwan',
    name: 'Taiwan Strait',
    status:
      'China has never renounced force over Taiwan and rehearses blockades with large-scale air and naval exercises around the island; the US maintains "strategic ambiguity" plus arms sales, and semiconductor export controls have made the strait the center of tech geopolitics.',
    economics:
      'Taiwan (TSMC) fabricates roughly 90% of the world’s most advanced logic chips. Even a blockade short of war would freeze the supply chain under every phone, car, data center, and AI model — a supply shock that would make the 2021 chip shortage look small. This is why CHIPS-Act fabs (Arizona, Ohio, Texas, New York) are geopolitics wearing an industrial-policy coat.',
    hits: 'Growth dial down, inflation dial up (the stagflation pair) · tech and industrials first, then everything with a chip in it — which is everything.',
    watch: 'Exercise tempo becoming a de facto blockade · Taiwan election cycles · US carrier movements · TSMC’s overseas-fab share of leading edge (the "silicon shield" thinning).',
    countries: ['china', 'us', 'japan', 'skorea'],
    industries: ['tech', 'industrials', 'discretionary'],
  },
  {
    id: 'islands',
    name: 'South China Sea — artificial islands & international waters',
    status:
      'China dredged reefs in the Spratlys into fortified islands with runways and missile shelters, claims almost the whole sea via the "nine-dash line," and ignored the 2016 Hague tribunal ruling against that claim. Its coast guard now uses water cannon and ramming against Philippine resupply missions (Second Thomas Shoal, Scarborough Shoal); the US and allies answer with freedom-of-navigation patrols.',
    economics:
      'Roughly a third of global shipping — about $3–5 trillion of trade a year — moves through this water, including the energy and export flows of Japan, Korea, and China itself. The market prices it as tail risk: nothing until an incident, then shipping insurance, freight rates, and regional currencies (the won and yen from tab 15) move together. A US–Philippines mutual-defense trigger is the escalation path nobody wants priced.',
    hits: 'Inflation dial up through freight and energy · discretionary and staples through import costs · the export economies (skorea, japan) through trade volumes.',
    watch: 'A resupply-mission casualty invoking the US–Philippines treaty · new dredging at Scarborough · Chinese ADIZ declaration over the sea · insurance-rate spikes on Manila-route hulls.',
    countries: ['china', 'us', 'japan', 'skorea'],
    industries: ['industrials', 'energy', 'discretionary', 'staples'],
  },
  {
    id: 'iran',
    name: 'Iran — oil, sanctions, and the Strait of Hormuz',
    status:
      'Iran sells sanctioned crude at a discount, mostly to China, via a "shadow fleet" of tankers with obscured ownership and transponders off; the US enforces with secondary sanctions on buyers, shippers, and insurers. The JCPOA nuclear deal (2015) collapsed after the 2018 US withdrawal, and the Middle-East conflict shock in the Lab’s 2026 snapshot runs straight through this file.',
    economics:
      'About a fifth of the world’s oil and a large share of LNG transit the Strait of Hormuz. Iran’s cheap barrels quietly ADD supply (softening prices) while its threat to the strait is the single biggest upside risk to them — the same country is both the discount and the tail risk. That is why tab 3’s energy line (+12% in the 2026 snapshot) reads as a supply-shock story, not a demand story.',
    hits: 'Inflation dial up (energy is the fastest pass-through) · energy sector revenue up while every energy CONSUMER’s margin compresses · utilities fuel costs.',
    watch: 'Tanker seizures or mining in the strait · sanctions snapback vs quiet enforcement easing · the discount on Iranian barrels (narrowing = enforcement fading) · Gulf producers’ spare capacity.',
    countries: ['us', 'china', 'india', 'japan', 'skorea'],
    industries: ['energy', 'utilities', 'industrials', 'discretionary'],
  },
  {
    id: 'venezuela',
    name: 'Venezuela — sanctioned barrels and on/off licenses',
    status:
      'The world’s largest proven oil reserves, produced at a fraction of former capacity after years of mismanagement and sanctions. US policy has oscillated — licenses (Chevron) granted, revoked, and renegotiated as leverage around elections and migration — while disputed votes keep the political question open and a US naval presence in the southern Caribbean keeps the pressure visible.',
    economics:
      'Venezuelan heavy crude is what US Gulf refineries were literally built to process, so license swings move refinery economics and diesel margins, not just headline oil. Each licensing round is a case study in sanctions-as-dial: the same barrel is legal, illegal, then legal again, and the price of gasoline moves with the paperwork. Migration pressure is the other channel — a state-level fiscal story (Florida, Texas, New York from the state lens).',
    hits: 'Inflation dial via refined-product prices · energy sector directly · state budgets through migration services.',
    watch: 'License renewals vs revocations · production trend (recovering toward ~1M bpd or not) · escalation vs negotiation signals from the US naval posture.',
    countries: ['us', 'china', 'india', 'brazil'],
    industries: ['energy', 'financials'],
  },
  {
    id: 'sanctions',
    name: 'The sanctions economy & the dollar system',
    status:
      'Sanctions became the US’s primary economic weapon: Russia (the 2022 package — reserve freeze, SWIFT cutoffs, the G7 oil price cap), Iran, Venezuela, North Korea, plus export controls on China. Enforcement now runs on SECONDARY sanctions — punishing third-country banks and shippers who touch the trade — which is exactly what pushes BRICS members toward local-currency settlement and China’s CIPS payment rails.',
    economics:
      'Freezing another central bank’s reserves in 2022 taught every non-allied government that dollar reserves are conditional. The measurable responses: central-bank gold buying at record pace, slow de-dollarization of trade invoicing, a shadow tanker fleet outside Western insurance. None of it dethrones the dollar soon — network effects are why the US deficit stays financeable (tab 15’s US row) — but every sanctions round spends a little of the privilege it runs on. Dalio’s reserve-currency force, live.',
    hits: 'Fiscal dial (the deficit’s financeability is the long game) · financials through compliance and payment plumbing · gold’s bid in the asset menu (tab 3).',
    watch: 'Central-bank gold purchases · the share of China’s trade settled in yuan · secondary-sanctions designations of large third-country banks · BRICS settlement-system announcements.',
    countries: ['us', 'china', 'india', 'brazil', 'germany', 'france', 'uk', 'japan'],
    industries: ['financials', 'energy'],
  },
  {
    id: 'ai-chips',
    name: 'AI distribution — export controls, data centers, and the compute race',
    status:
      'Since October 2022 the US has banned exports of leading-edge AI chips and tools to China, tightening rules repeatedly as Nvidia shipped China-specific downgrades; "AI diffusion" style rules extend control to third countries so compute cannot be re-routed. China answers with rare-earth and gallium/germanium export curbs and a state-funded push for self-sufficiency (SMIC, Huawei). Meanwhile the buildout is the capex story of the decade: hundreds of billions a year into data centers, with electricity the new binding constraint.',
    economics:
      'This is industrial policy at valuation scale. Export controls decide WHO gets the compute that AI economics run on — the reason "AI upside" appears in EY-Parthenon’s outlook as the offset to the tariff drag (tab 7). Data-center demand has turned power into a growth industry: grid interconnection queues, nuclear restarts, and gas turbines sold out for years. The industry lens shows both edges: tech gets the revenue, utilities get the demand growth, and every AI plan gets a geopolitical dependency (chips) at the bottom of it.',
    hits: 'Growth dial up (the capex impulse) · tech, utilities, industrials up · the ai-semis sub-lens on tab 3 is this story in miniature.',
    watch: 'New export-control tiers and China’s retaliation list · data-center power-purchase deals and nuclear restarts · Chinese domestic-chip benchmarks closing the gap · which third countries land "trusted" compute status.',
    countries: ['us', 'china', 'japan', 'skorea', 'germany'],
    industries: ['tech', 'utilities', 'industrials', 'energy'],
  },
  {
    id: 'space',
    name: 'The space race, round two',
    status:
      'Two lunar programs in open competition (Artemis with allied partners vs China–Russia’s planned lunar station), mega-constellations (Starlink first, Chinese equivalents following), demonstrated anti-satellite weapons, and launch costs collapsing under commercial reuse. Space is now infrastructure: navigation, communications, imaging, and missile warning all live there.',
    economics:
      'The commercial layer is a real industry (launch, satellites, ground equipment — hundreds of billions and compounding), but the finance story is dependency: GPS timing alone underpins payment networks and power grids, and Ukraine proved constellations decide battlefield communications. Defense budgets (the fiscal lever) now carry space lines in every G7 member — a tailwind the industrials lens picks up regardless of the cycle, which is why A&D IPOs stayed active in the H1-2026 window (tab 13).',
    hits: 'Fiscal dial up through defense budgets · industrials and tech · the defense sub-lens on tab 3.',
    watch: 'Artemis vs Chinese lunar-landing timelines · ASAT tests or on-orbit incidents · constellation licensing fights · launch-cost curve (reuse cadence).',
    countries: ['us', 'china', 'japan', 'india', 'france', 'uk'],
    industries: ['industrials', 'tech'],
  },
];

// ---------------------------------------------------------------------------
// Institutions — WTO, G7, G20, BRICS
// ---------------------------------------------------------------------------

export interface Institution {
  id: string;
  name: string;
  what: string;
  status: string;
  watch: string;
  /** Member/participant ids from the report's country list. */
  members: string[];
}

export const INSTITUTIONS: Institution[] = [
  {
    id: 'wto',
    name: 'WTO (World Trade Organization)',
    what: 'The rules-based trading system — most-favored-nation tariffs, dispute settlement, the framework China joined in 2001 (the single most economically consequential meeting result of the era).',
    status:
      'Functionally wounded: the US has blocked Appellate Body appointments since 2019, so trade disputes can be appealed "into the void" and never resolved. The 2025–26 tariff wave happens largely OUTSIDE WTO rules — national-security exceptions stretched to cover industrial policy — which is why tariffs now move with bilateral summits, not Geneva rulings.',
    watch: 'Appellate Body revival attempts · whether tariff disputes get filed at all · plurilateral deals (subsets of members) replacing global rounds.',
    members: ['us', 'china', 'japan', 'germany', 'uk', 'france', 'india', 'italy', 'brazil', 'canada', 'skorea'],
  },
  {
    id: 'g7',
    name: 'G7',
    what: 'The rich-democracy caucus (US, Japan, Germany, UK, France, Italy, Canada + EU) — small enough to actually coordinate.',
    status:
      'The sanctions cockpit: the Russia oil price cap, reserve freeze, and export-control alignment were G7 products, and chip-control coordination with Japan and the Netherlands ran through this channel. Its economic weight (~30% of global GDP, shrinking) matters less than its cohesion — it is the only table where enforcement actually synchronizes.',
    watch: 'Whether tariff fights INSIDE the G7 (US vs allies) fracture sanctions cohesion · use of frozen Russian assets · joint stance on Chinese overcapacity.',
    members: ['us', 'japan', 'germany', 'uk', 'france', 'italy', 'canada'],
  },
  {
    id: 'g20',
    name: 'G20',
    what: 'The crisis-era table (~85% of global GDP) — rich and emerging economies together, born as a finance forum and elevated to leaders level in 2008.',
    status:
      'Peaked at the 2009 London summit ($1.1T crisis package, the high-water mark of coordination); now too divided to act — communiqués argue over Ukraine language while debt-relief frameworks for poor countries (the "Common Framework") crawl. Still the only room where the US, China, India, Brazil, and the EU all sit — which keeps it alive as a signaling venue and a summit-sideline machine.',
    watch: 'Sideline bilaterals (the real output) · debt-restructuring progress for defaulted borrowers · whether anyone skips it (attendance is the health metric).',
    members: ['us', 'china', 'japan', 'germany', 'uk', 'france', 'india', 'italy', 'brazil', 'canada', 'skorea'],
  },
  {
    id: 'brics',
    name: 'BRICS+',
    what: 'The non-Western caucus — Brazil, Russia, India, China, South Africa, expanded from 2024 to include Iran, UAE, Egypt, Ethiopia and others; runs the New Development Bank and pushes local-currency settlement.',
    status:
      'More symbol than bloc — India and China are strategic rivals inside it, and there is no BRICS currency coming soon. But the expansion (notably adding Iran and Gulf energy states) and the settlement push are the institutional face of de-dollarization pressure: every secondary-sanctions round recruits for it. Watch it as a thermometer of dollar-system discontent, not as an alternative system yet.',
    watch: 'New members (who applies is the signal) · NDB lending in local currencies · India’s balancing act between BRICS and the Quad/US.',
    members: ['china', 'india', 'brazil'],
  },
];

// ---------------------------------------------------------------------------
// Two decades of US meetings — and what they actually produced
// ---------------------------------------------------------------------------

export interface SummitEntry {
  when: string;
  what: string;
  result: string;
  read: string;
}

export const US_SUMMIT_HISTORY: SummitEntry[] = [
  {
    when: '2001',
    what: 'China joins the WTO (US-backed accession)',
    result: 'Tariffs fall, supply chains move to China, US imports explode — the single decision behind two decades of goods deflation, the US manufacturing hollowing, and today’s backlash.',
    read: 'The era’s founding bet: trade would liberalize China. The economics arrived; the politics didn’t — everything below is downstream of that miss.',
  },
  {
    when: '2008–09',
    what: 'G20 elevated to leaders level; London summit',
    result: '$1.1T coordinated crisis response, bank-capital overhaul (Basel III), no 1930s-style trade collapse.',
    read: 'Peak cooperation — proof the system CAN coordinate when everyone is scared at the same time. The benchmark every later summit fails against.',
  },
  {
    when: '2015',
    what: 'Iran JCPOA nuclear deal + Paris climate accord (Obama-era multilateralism)',
    result: 'Iran sanctions lifted for nuclear limits; near-universal climate framework. Both later partially unwound by US withdrawal (2017–18).',
    read: 'The lesson markets learned: a deal only as durable as the next US administration reprices fast — country risk premia now carry US electoral cycles.',
  },
  {
    when: '2018–19',
    what: 'US–China trade war: tariff rounds and the Mar-a-Lago / Buenos Aires / Osaka Trump–Xi meetings',
    result: 'Tariffs on hundreds of billions of goods; truces announced at summits, broken between them.',
    read: 'The relationship flips from engagement to rivalry — and stays flipped under both parties. Summits become tactical pauses, not resets.',
  },
  {
    when: '2018–19',
    what: 'Singapore and Hanoi summits with North Korea',
    result: 'Historic photos, denuclearization language — and no verified dismantlement; Hanoi collapsed without a deal.',
    read: 'The control case: summit theater with no enforcement mechanism produces nothing. Compare against the G7 price cap, which had one and worked (partly).',
  },
  {
    when: 'Jan 2020',
    what: 'US–China Phase One trade deal',
    result: 'China commits to +$200B of US purchases; tariffs mostly stay. The purchase targets were then missed by roughly 40% (COVID and design).',
    read: 'Managed trade replaces free trade as the framework — targets and quotas, not rules. The WTO era ends in practice here.',
  },
  {
    when: 'Sep 2021',
    what: 'AUKUS announced (US–UK–Australia)',
    result: 'Nuclear submarine and advanced-tech sharing pact aimed at the Pacific balance; France loses a $60B+ sub contract and briefly recalls ambassadors.',
    read: 'Alliance architecture reorganizing around China — and allies learning that US strategic priorities can cost THEM commercially.',
  },
  {
    when: '2022',
    what: 'Post-invasion sanctions coordination (G7/NATO emergency summits) + CHIPS Act + October chip export controls',
    result: 'Reserve freeze, SWIFT cutoffs, oil price cap; $52B for US fabs; leading-edge compute cut off from China.',
    read: 'Economic statecraft’s biggest year since 1945: the dollar system, export controls, and industrial policy all weaponized within months — the template the Taiwan and AI flashpoints now run on.',
  },
  {
    when: 'Nov 2022',
    what: 'Biden–Xi at the Bali G20',
    result: 'First in-person meeting as presidents; agreement to resume climate and military talks after the Pelosi-visit freeze.',
    read: '"Floor-setting" summits: the goal is no longer progress, it is preventing accidental war. Markets read them for tail-risk pricing, not upside.',
  },
  {
    when: 'Nov 2023',
    what: 'Biden–Xi at Woodside (APEC San Francisco)',
    result: 'Military-to-military hotlines restored, fentanyl-precursor cooperation, AI-risk talks agreed.',
    read: 'The de-risking equilibrium: talk more, decouple anyway. Export controls tightened the same year the hotlines reopened.',
  },
  {
    when: '2025',
    what: 'The tariff wave: bilateral "deal" summits replace multilateral rounds',
    result: 'Sweeping US tariffs with country-by-country negotiations; carve-outs and quotas traded leader-to-leader; the WTO bypassed entirely.',
    read: 'Trade policy becomes summit-to-summit output — which makes it fast, personal, and reversible. Tariff exposure is now a per-meeting risk line (the EY outlook’s core 2026 theme, tab 7).',
  },
  {
    when: '2026 (year to date)',
    what: 'Tariff-adjustment rounds and Middle-East de-escalation diplomacy',
    result: 'Carve-outs for semiconductors, energy, and critical minerals negotiated piecemeal; energy-transit diplomacy around the Gulf conflict shock (the +12% energy line on tab 3).',
    read: 'The Lab’s 2026 snapshot world: regionalization not collapse, supply shocks not demand shocks — exactly the EY-Parthenon framing on tab 7. ILLUSTRATIVE continuation; verify against live coverage.',
  },
];

// ---------------------------------------------------------------------------
// The recent window — last ~9 months, digest form
// ---------------------------------------------------------------------------

export const RECENT_WINDOW_LABEL =
  'Last ~9 months (Dec 2025 → Aug 2026) — ILLUSTRATIVE DIGEST consistent with the Lab’s 2026 snapshots; verify each item against live sources before citing.';

export interface RecentItem {
  when: string;
  what: string;
  impact: string;
}

export const RECENT_WINDOW: RecentItem[] = [
  {
    when: 'Dec 2025',
    what: 'Korea political crisis aftermath: martial-law episode’s first anniversary passes with the won still ~₩1,470 and the governance discount live (tab 15’s case study).',
    impact: 'The standing exhibit that politics prices into currencies and equity multiples — the four-gauge country check exists because of months like this.',
  },
  {
    when: 'Jan 2026',
    what: 'Tariff-wave second round: US carve-out negotiations formalize the country-by-country quota system; China answers with expanded rare-earth licensing.',
    impact: 'Regionalization accelerates (EY outlook’s core theme) — importers’ margins (discretionary, staples lenses) carry the pass-through.',
  },
  {
    when: 'Feb 2026',
    what: 'AI capex arms race escalates: hyperscaler budgets step up again; grid operators warn interconnection queues are the binding constraint.',
    impact: 'The growth dial’s main upside (tab 7); utilities re-rate from bond-proxy to growth-adjacent — visible in the industry lens.',
  },
  {
    when: 'Mar 2026',
    what: 'Gulf conflict escalation pushes tanker insurance and LNG spot rates; the energy CPI line begins the climb toward the +12% in tab 3’s snapshot.',
    impact: 'A supply-shock inflation impulse the Fed cannot hike away — the reason the Lab’s "today" scenario holds policy at neutral while inflation sits above target.',
  },
  {
    when: 'Apr–May 2026',
    what: 'Secondary-sanctions designations hit additional third-country banks and shadow-fleet operators; central-bank gold buying prints another record quarter.',
    impact: 'The sanctions-economy loop in real time: enforcement works, and each round recruits for the settlement alternatives BRICS is building.',
  },
  {
    when: 'Jun 2026',
    what: 'The US national debt crosses $40T; the July deficit will print $432B (tab 11). Long-end auctions clear, but tails widen.',
    impact: 'The term-premium story: the 10Y at 4.70% with the Fed at 3.625% is the bond market charging for exactly this.',
  },
  {
    when: 'Jul 2026',
    what: 'South China Sea resupply confrontation injures Philippine sailors; freedom-of-navigation transits increase; no treaty invocation.',
    impact: 'Tail-risk repricing without a trend break — shipping insurance and regional FX wobble, then mean-revert. The pattern to recognize BEFORE the incident that doesn’t mean-revert.',
  },
  {
    when: 'Aug 2026',
    what: 'IPO window holds open selectively (62 H1 deals, tab 13); A&D and AI issuers lead; biotech still lags its 2024 pace.',
    impact: 'The fiscal lever (defense) and the AI impulse are the two windows geopolitics is actively holding open.',
  },
];

// ---------------------------------------------------------------------------
// Two decades of economic history — the market-lesson timeline
// ---------------------------------------------------------------------------

export interface TimelineEntry {
  period: string;
  event: string;
  effect: string;
  lesson: string;
}

export const TWO_DECADE_TIMELINE: TimelineEntry[] = [
  { period: '2005–07', event: 'Peak globalization: China’s WTO decade compounds; US housing/credit boom.', effect: 'Goods deflation + cheap credit; risk premia compress everywhere.', lesson: 'The calm BEFORE is when leverage builds — Dalio’s short-cycle top forming (tab 2).' },
  { period: '2008–09', event: 'Global financial crisis; G20 coordination.', effect: 'World trade and GDP contract together; rates to zero; QE begins.', lesson: 'Deleveraging is the regime tab 18 backtests — and the one time coordination actually worked.' },
  { period: '2010–12', event: 'Eurozone debt crisis ("whatever it takes", 2012).', effect: 'Sovereign spreads become THE risk gauge; austerity vs growth fight.', lesson: 'Tab 15’s Italy/France spread-to-Germany lens was born here — currency unions move the fight into bond markets and politics.' },
  { period: '2013', event: 'Taper tantrum.', effect: '10Y jumps ~130bp in months on a policy HINT; EM currencies crack.', lesson: 'The long end moves on expectations, not actions — tab 11’s lesson two decades early.' },
  { period: '2014–16', event: 'Oil crash ($100 → $26), Crimea sanctions round one, Brexit vote.', effect: 'Energy capex collapses; the first modern sanctions regime; political risk returns to rich democracies.', lesson: 'Commodity cycles and referendum risk both price FAST — hedging exists for the first, not really for the second.' },
  { period: '2017–19', event: 'Trade war; global manufacturing recession (2019); Fed reverses hikes.', effect: 'Tariffs redirect supply chains; capex stalls on uncertainty; curve inverts.', lesson: 'Uncertainty is itself a tax — investment waits even where tariffs never land.' },
  { period: '2020', event: 'COVID crash and the fastest stimulus ever.', effect: '-31% GDP quarter annualized, then a V; fiscal and monetary levers pulled together at WWII scale.', lesson: 'Tab 18’s 2020 regime: when both levers pull together, fight neither.' },
  { period: '2021–22', event: 'Inflation shock (9.1% peak) + Russia’s invasion + the sanctions revolution.', effect: 'Fastest hikes since Volcker; stocks AND bonds down (the 60/40 failure); energy weaponized.', lesson: 'The regime that breaks the bonds-hedge rule (tab 18) — and the year reserves became conditional (the sanctions flashpoint).' },
  { period: '2023', event: 'Bank stress (SVB), the 10Y’s 5% scare, ChatGPT’s capex wave begins.', effect: 'Term premium wakes; AI becomes the market’s growth story.', lesson: 'Two forces that define the current regime showed up the same year — supply of Treasuries, demand for compute.' },
  { period: '2024', event: 'The everything-election year (US, India, UK, France, Japan, Taiwan…); first Fed cuts; Korea martial-law crisis.', effect: 'Populism pressure-tests institutions on every continent; the Fed-vs-10Y divergence begins.', lesson: 'Tab 15’s populism table and the divergence chart are both 2024 artifacts — politics and term premium became the same story.' },
  { period: '2025', event: 'The tariff wave; AI capex step-change; sanctions enforcement tightens.', effect: 'Regionalization without collapse; inflation re-accelerates mildly; data-center power crunch.', lesson: 'The EY-Parthenon 2026 outlook world (tab 7): meaningful-but-not-recessionary, with AI as the offset.' },
  { period: '2026 YTD', event: 'Supply shocks (Gulf conflict), $40T debt, selective IPO reopening.', effect: 'Energy-led inflation above target with a Fed on hold; term premium sticky; equity windows sector-selective.', lesson: 'The Lab’s snapshot world — every tab’s "today" numbers describe this configuration. ILLUSTRATIVE beyond early 2026.' },
];

// ---------------------------------------------------------------------------
// Exposure maps — keyed to the SAME lists the report lenses use
// ---------------------------------------------------------------------------

export interface GeoExposure {
  id: string;
  headline: string;
  items: string[];
}

export const GEO_EXPOSURE_COUNTRIES: GeoExposure[] = [
  { id: 'us', headline: 'The system operator — every flashpoint runs through Washington.', items: ['Taiwan guarantor-of-ambiguity and chip-controls author; the sanctions economy is its weapon and its reserve-currency privilege is the collateral.', 'Hormuz/Venezuela policy sets its own gasoline prices; data-center buildout is its growth impulse.', 'Summit history above IS its relationship ledger — trade policy now prices per-meeting.'] },
  { id: 'china', headline: 'The other pole — every flashpoint has a Chinese side.', items: ['Taiwan and the island campaign are its stated core interests; chip controls target its AI stack; it is the discounted buyer of Iranian and Venezuelan barrels.', 'BRICS expansion and yuan settlement are its long de-dollarization game.', 'Its +$900B surplus (tab 15) funds the ambition and is the tariff wave’s target.'] },
  { id: 'japan', headline: 'Front-line ally with the money at stake.', items: ['Sits astride the Taiwan and SCS shipping lanes it depends on for energy and exports.', 'Chip-tooling controls partner (with the Netherlands); hosts US forces; defense budget doubling — the fiscal lever pulled.', 'The weak yen (tab 15) is partly this story: security dependence limits its policy room.'] },
  { id: 'germany', headline: 'The exposed exporter — mercantile model meets bloc politics.', items: ['Lost cheap Russian gas in 2022; its auto-and-machinery model is squeezed between US tariffs and Chinese competition.', 'G7 sanctions member whose industry lobbies against every escalation — the cohesion question in one country.', 'Defense rearmament (the debt-brake bend, tab 15) is its fiscal-lever moment.'] },
  { id: 'uk', headline: 'Sanctions hub, security player, mid-size economy.', items: ['The City is a sanctions-enforcement chokepoint (insurance, shipping law — the price cap ran on it).', 'AUKUS member; Global-Britain trade strategy still finding post-Brexit footing.', 'Gilt-market discipline (2022) caps how hard its fiscal lever can pull.'] },
  { id: 'france', headline: 'Strategic-autonomy voice inside the Western bloc.', items: ['Pushes EU independence on defense and tech (the AUKUS sub-contract burn still shapes its stance).', 'Nuclear energy insulates it from gas shocks; space and defense industries ride the fiscal lever.', 'Its budget fights (tab 15) limit the autonomy it can fund.'] },
  { id: 'india', headline: 'The swing state — in BRICS and the Quad at once.', items: ['Buys discounted Russian and Iranian-adjacent barrels while deepening US tech and defense ties — the balancing act IS the strategy.', 'Chip and data-center diversification destination ("China+1"); border rivalry with China caps BRICS cohesion.', 'Its growth-deficit model (tab 15) needs the capital inflows good relations bring.'] },
  { id: 'italy', headline: 'G7 member on the exposed southern flank.', items: ['Energy import dependence made 2022 painful; Mediterranean migration is its populism accelerant (tab 15).', 'Flirted with (then left) China’s Belt and Road — the G7’s cohesion story in miniature.', 'Its debt (137%) makes it the member most hostage to ECB backstop politics.'] },
  { id: 'brazil', headline: 'BRICS founder playing all sides.', items: ['Sells food to China, buys fertilizer from Russia, courts Western capital — commodity non-alignment.', 'Hosts BRICS/G20 diplomacy; pushes local-currency trade rhetoric hardest.', 'The real (tab 15) prices its fiscal credibility, not its geopolitics — so far.'] },
  { id: 'canada', headline: 'The ally with one customer.', items: ['~3/4 of exports go to the US, so US tariff politics is its macro policy (tab 15).', 'Critical-minerals superpower-in-waiting for the chip and battery chains — its main geopolitical card.', 'Arctic sovereignty is its own quiet flashpoint as the ice opens.'] },
  { id: 'skorea', headline: 'Maximum exposure on every axis at once.', items: ['Chips (Samsung, SK Hynix) put it inside the US export-control wall while China is its biggest market — the squeeze has no clean answer.', 'North Korea risk, SCS shipping dependence, and US alliance politics stack on top.', 'The 2024–25 political crisis (tab 15’s case study) showed domestic politics is the fourth axis — the won and the Korea discount price all four.'] },
];

export const GEO_EXPOSURE_STATES: GeoExposure[] = [
  { id: 'ca', headline: 'The tech-and-trade state.', items: ['LA/Long Beach ports move ~40% of US container imports — the tariff wave lands here first.', 'AI labs and chip design (the design half of the ai-chips flashpoint) plus Vandenberg launch.', 'Defense and space primes across the south; export-control compliance is now a Bay Area job category.'] },
  { id: 'tx', headline: 'Energy, fabs, and launch.', items: ['Gulf refineries are the natural buyers of Venezuelan heavy crude — license swings move Texas margins.', 'Samsung’s fab buildout (CHIPS Act) and a data-center boom straining ERCOT — the AI-power story live.', 'Starbase and a defense corridor ride the fiscal lever.'] },
  { id: 'ny', headline: 'Finance is the sanctions system.', items: ['Dollar clearing runs through New York — every secondary-sanctions designation is enforced here.', 'GlobalFoundries and Micron’s upstate fab plans (CHIPS Act).', 'Migration costs (the Venezuela channel) sit in the city budget.'] },
  { id: 'fl', headline: 'The space coast and the hemisphere’s doorstep.', items: ['Cape Canaveral is the launch cadence of the space race.', 'Venezuela/Cuba policy is domestic politics here; migration flows land first.', 'Tourism exposure makes it the discretionary lens with a coastline.'] },
  { id: 'il', headline: 'The agricultural-export heartland.', items: ['Soy and corn made Illinois a front line of the 2018 trade war (China’s retaliation targeted farm states) — and again in each tariff round.', 'CME’s futures complex prices the world’s food and rates risk.', 'The pension math (tab 15) limits its fiscal room whatever geopolitics does.'] },
  { id: 'pa', headline: 'Gas, steel, and the industrial-policy fight.', items: ['Marcellus shale made it an LNG-era energy state — European gas diplomacy reaches Pittsburgh.', 'Steel tariffs and the fate of legacy mills are its trade-war story.', 'Defense shipbuilding supply chains thread through it.'] },
  { id: 'oh', headline: 'The CHIPS Act’s poster state.', items: ['Intel’s New Albany fabs are the reshoring bet in concrete — delays and subsidies here ARE industrial-policy news.', 'Auto supply chains straddle the EV/tariff transition.', 'A swing state: its politics move the tariff politics.'] },
  { id: 'ga', headline: 'Port and battery corridor.', items: ['Savannah is the East Coast’s fastest-growing container port — the regionalization trade routes through it.', 'Korean battery and EV plants (SK, Hyundai) make it a direct beneficiary of Korea’s "China+1" hedging.', 'Data-center growth (Atlanta) rides the AI buildout.'] },
  { id: 'nj', headline: 'Port, pharma, and logistics.', items: ['NY/NJ port complex shares the import-tariff front line.', 'Pharma HQs make drug-pricing and supply-chain-security policy its industrial policy.', 'The pension hole (tab 15) is the constraint on everything else.'] },
  { id: 'wa', headline: 'Aerospace and cloud.', items: ['Boeing makes it a direct stake in every trade fight (aircraft are the classic tariff-retaliation target) and every defense budget.', 'Amazon and Microsoft put the data-center and AI-distribution story in-state.', 'Blue Origin adds the commercial-space lens.'] },
];

export const GEO_EXPOSURE_INDUSTRIES: GeoExposure[] = [
  { id: 'tech', headline: 'The prize and the battlefield.', items: ['Export controls decide its addressable market; Taiwan concentration is its existential supply risk.', 'Data-center capex is its demand story; every AI plan inherits the chip chokepoint.'] },
  { id: 'financials', headline: 'The plumbing of the sanctions economy.', items: ['Dollar clearing and compliance are simultaneously a moat and a liability — every designation adds cost and pricing power.', 'De-dollarization is the slow tail risk to the frankly enormous privilege of running the system.'] },
  { id: 'energy', headline: 'Supply shocks are the business model’s wild card.', items: ['Hormuz, sanctions rounds, and OPEC+ politics set the price band demand never could alone.', 'Sanctioned-barrel discounts (Iran, Venezuela, Russia) redraw refinery economics by license.'] },
  { id: 'staples', headline: 'Food is geopolitics with a shelf label.', items: ['Fertilizer (Russia/Belarus), grain corridors, and monsoons (tab 15’s watch) set input costs.', 'Tariff pass-through lands on the shelf with a lag — the CPI food line (tab 3) is the receipt.'] },
  { id: 'discretionary', headline: 'The tariff bill’s final payer.', items: ['Import-heavy assortments eat the tariff wave first (freight + duties + strong-dollar swings).', 'Chinese consumer demand is many brands’ growth math — decoupling caps it.'] },
  { id: 'healthcare', headline: 'Quietly globalized, newly strategic.', items: ['API and generics supply chains run through China and India — supply-chain-security policy is coming for them.', 'Least dial-sensitive lens (tab 3), but not geopolitics-immune: pricing policy and FDA actions are its politics.'] },
  { id: 'utilities', headline: 'From bond proxy to strategic asset.', items: ['Data-center demand turned load growth positive for the first time in decades — the AI flashpoint’s quiet winner.', 'Grid security and fuel-price pass-through (the Gulf shock) are its new risk lines.'] },
  { id: 'industrials', headline: 'Defense, reshoring, and shipping — the fiscal lever’s home.', items: ['Defense budgets and the space race are structural tailwinds (the A&D window on tab 13).', 'CHIPS/reshoring capex is its order book; freight rates transmit every strait incident to its costs.'] },
];

// ---------------------------------------------------------------------------
// The military layer — budgets, alignment, active conflicts, alliances
// ---------------------------------------------------------------------------

export const MILITARY_SOURCE =
  'APPROXIMATE TEACHING VALUES (~2025 defense budgets, rounded; China’s true total is widely estimated well above the official figure). Alignment is read from the US perspective, since the report’s dollar-system and sanctions math is US-centric. Verify before citing.';

export type Alignment = 'self' | 'ally' | 'adversary' | 'swing';

export interface MilitaryRow {
  id: string;
  name: string;
  budgetB: number;
  pctGdp: number;
  alignment: Alignment;
  nuclear: boolean;
  note: string;
}

export const MILITARY_BALANCE: MilitaryRow[] = [
  { id: 'us', name: 'United States', budgetB: 900, pctGdp: 3.4, alignment: 'self', nuclear: true, note: 'Roughly equal to the next ~10 combined; 11 carriers, ~750 overseas sites. The budget IS the fiscal lever’s biggest single line — and the deficit’s (tab 11).' },
  { id: 'china', name: 'China', budgetB: 300, pctGdp: 1.6, alignment: 'adversary', nuclear: true, note: 'Official ~$300B; real estimates run $400–700B. World’s largest navy by hull count; warhead stockpile expanding fast. The pacing threat US planning is built around.' },
  { id: 'japan', name: 'Japan', budgetB: 56, pctGdp: 1.6, alignment: 'ally', nuclear: false, note: 'Doubling toward 2% of GDP — the biggest posture shift since 1945, counter-strike missiles included. Hosts ~54k US troops; the alliance’s Pacific anchor.' },
  { id: 'germany', name: 'Germany', budgetB: 80, pctGdp: 2.0, alignment: 'ally', nuclear: false, note: 'The Zeitenwende: hit NATO’s 2% via a special fund and a bent debt brake (tab 15). Europe’s industrial rearmament hinge.' },
  { id: 'uk', name: 'United Kingdom', budgetB: 75, pctGdp: 2.3, alignment: 'ally', nuclear: true, note: 'Nuclear (Trident), AUKUS member, expeditionary tradition — the most operationally committed US ally.' },
  { id: 'france', name: 'France', budgetB: 60, pctGdp: 2.1, alignment: 'ally', nuclear: true, note: 'Independent nuclear deterrent and defense industry — the ally most insistent on running its own strategy (strategic autonomy).' },
  { id: 'india', name: 'India', budgetB: 80, pctGdp: 2.4, alignment: 'swing', nuclear: true, note: 'Nuclear, huge army, Himalayan standoffs with China — buys Russian, French, AND American kit. Quad member, BRICS member: the swing state armed.' },
  { id: 'italy', name: 'Italy', budgetB: 35, pctGdp: 1.6, alignment: 'ally', nuclear: false, note: 'NATO’s southern-flank host (carriers, air bases); chronically below the 2% target the debt table explains.' },
  { id: 'brazil', name: 'Brazil', budgetB: 25, pctGdp: 1.1, alignment: 'swing', nuclear: false, note: 'Regional power with no external threat and a constitutionally non-aligned habit — military weight is not its lever.' },
  { id: 'canada', name: 'Canada', budgetB: 30, pctGdp: 1.4, alignment: 'ally', nuclear: false, note: 'NORAD partner under standing US pressure to hit 2%; Arctic reopening is turning its geography strategic again.' },
  { id: 'skorea', name: 'South Korea', budgetB: 47, pctGdp: 2.8, alignment: 'ally', nuclear: false, note: 'A conscript force facing a nuclear North across the DMZ; ~28.5k US troops; now a top-10 arms EXPORTER (Poland deals) — defense is becoming an export industry (tab 15’s chips-and-ships plus munitions).' },
];

export interface ConflictRow {
  name: string;
  status: string;
  marketChannel: string;
}

export const ACTIVE_CONFLICTS: ConflictRow[] = [
  { name: 'Russia–Ukraine', status: 'The largest European land war since 1945, grinding along a fortified line; the West funds and arms Ukraine without fighting; negotiation pressure waxes and wanes with US politics.', marketChannel: 'Energy and grain repricing (the 2022 shock’s source), European rearmament budgets, and the entire sanctions architecture — the conflict that made the sanctions flashpoint what it is.' },
  { name: 'Middle East (Gaza / Lebanon / Iran’s proxy network)', status: 'The Gaza war’s regional escalation cycle — Hezbollah exchanges, direct Iran–Israel strikes, and the Lab’s 2026 Gulf shock — keeps the region between ceasefire attempts and escalation.', marketChannel: 'Oil and LNG risk premium (tab 3’s +12% energy line), defense demand, and the Hormuz tail risk in the Iran flashpoint.' },
  { name: 'Red Sea shipping attacks (Houthi)', status: 'Missile and drone attacks on commercial shipping turned the Suez route into a war-risk zone; carriers reroute around Africa; US-led naval patrols shoot down what they can.', marketChannel: 'Freight rates and delivery times — a standing +10–14 day, +$1–2M-per-voyage tax on Asia–Europe trade that feeds the goods-inflation lines.' },
  { name: 'Korean peninsula', status: 'North Korea tests missiles, supplies Russia with shells (and receives technology back), and has abandoned unification language for a two-hostile-states doctrine.', marketChannel: 'The standing tail risk under every Korean asset — one input to the Korea discount in tab 15’s case study.' },
  { name: 'Sudan & the Sahel', status: 'Civil war in Sudan (one of the world’s worst humanitarian crises) and a coup belt across the Sahel, with Russian paramilitary presence and Gulf money on multiple sides.', marketChannel: 'Mostly a humanitarian catastrophe; market touch is through gold flows, migration pressure toward Europe (a populism input, tab 15), and Red Sea adjacency.' },
  { name: 'Taiwan Strait & South China Sea (gray zone)', status: 'Not a shooting war — a pressure campaign of exercises, incursions, and coast-guard force covered in the flashpoints above.', marketChannel: 'The largest UNPRICED tail in global markets: too big to hedge conventionally, which is why it trades as basis points of "Taiwan risk" in chip names rather than as a scenario.' },
];

export interface AllianceBloc {
  name: string;
  members: string;
  what: string;
}

export const ALLIANCE_STRUCTURE: AllianceBloc[] = [
  { name: 'NATO', members: 'US, UK, Germany, France, Italy, Canada + 26 more (32 total)', what: 'Article 5 mutual defense — the security floor under European asset prices. The 2%-of-GDP spending push (now largely met) is the fiscal lever pulled bloc-wide.' },
  { name: 'US Indo-Pacific lattice', members: 'Bilateral treaties with Japan, South Korea, the Philippines, Australia; AUKUS (UK/Australia); the Quad (Japan/India/Australia)', what: 'Not a NATO — a hub-and-spokes web being knitted together around China. The Philippines treaty is the one a South China Sea incident could trigger.' },
  { name: 'China–Russia "no limits" partnership + friends', members: 'China, Russia; Iran and North Korea as arms-and-energy partners', what: 'Not a formal alliance — a transactional axis: Russian energy and military tech flow east, Chinese goods and dual-use components flow west, Iranian drones and North Korean shells feed the battlefield.' },
  { name: 'The non-aligned middle', members: 'India, Brazil, Gulf states, ASEAN, much of Africa', what: 'The swing bloc both sides court — they buy Russian oil AND Western tech, join BRICS AND welcome US capital. Where they drift is the decade’s biggest geopolitical variable, and the sanctions economy is what pushes them.' },
];

export const MILITARY_ECON_READS: string[] = [
  'Defense budgets are the fiscal lever wearing a uniform: the NATO 2% push, Japan’s doubling, and Korea’s export boom are all tab 15 fiscal-pipeline items — and the A&D tailwind the industrials lens and the tab-13 IPO window already show.',
  'Alignment is an economic variable: allies get chip-supply-chain membership, swap lines, and treaty cover priced INTO their assets; adversaries get export controls and sanctions priced in; the swing states get courted with capital — which is why the alignment column belongs in a finance report.',
  'Conflicts move markets through three channels — commodities (energy, grain, freight), budgets (rearmament as fiscal stimulus), and tails (the unpriced Taiwan scenario). Name the channel before citing the headline.',
];
