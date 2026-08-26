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
    countries: ['china', 'us', 'japan', 'skorea', 'taiwan'],
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
    countries: ['us', 'china', 'india', 'japan', 'skorea', 'iran', 'saudi'],
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
    countries: ['us', 'china', 'india', 'brazil', 'venezuela'],
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
    countries: ['us', 'china', 'india', 'brazil', 'germany', 'france', 'uk', 'japan', 'russia', 'iran', 'venezuela'],
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

// ---------------------------------------------------------------------------
// Belt and Road, trade corridors & chokepoints
// ---------------------------------------------------------------------------

export const ROUTES_SOURCE =
  'Compiled through early 2026 — verify current membership, lending figures, and port stakes before citing. Per-country route rows are keyed to the SAME country list as the report lenses. Education only.';

export const BRI_FACTS: string[] = [
  'The Belt and Road Initiative (BRI) is China’s signature foreign-investment program, launched in 2013: the overland "Belt" (rail and road corridors across Central Asia to Europe) plus the "Maritime Silk Road" (a chain of financed ports from the South China Sea through the Indian Ocean to the Mediterranean).',
  'Scale: roughly $1 trillion in cumulative lending and investment across ~150 signatory countries — the largest infrastructure program any single country has run since the Marshall Plan, financed mostly as LOANS from Chinese policy banks, not grants.',
  'The port chain is the strategic spine: Piraeus (Greece — COSCO-controlled, now a top-Mediterranean container hub), Hambantota (Sri Lanka — handed over on a 99-year lease when the loans soured, THE debt-distress exhibit), Gwadar (Pakistan), Djibouti (beside China’s first overseas military base), plus stakes in dozens of European and African terminals.',
  'The arc: peak lending 2016–2019, then retrenchment as borrowers hit distress (Sri Lanka, Zambia, Pakistan) — Beijing’s own pivot to "small and beautiful" projects. The debt-trap debate cuts both ways: critics see collateralized leverage; defenders note China has mostly restructured, not seized. Either way, China became the world’s largest official creditor — which puts it INSIDE every sovereign-debt workout (the G20 Common Framework’s slow crawl is largely a Beijing-vs-Paris-Club story).',
  'Why it exists, in one line: the Malacca dilemma. Most of China’s energy imports pass a strait the US Navy could close, so the BRI buys overland pipelines (CPEC, Central Asia), alternative ports, and political alignment — trade infrastructure as security policy.',
  'The finance read: BRI is the capital-allocation decision of tab 1 played at nation scale — projects with negative NPV as commerce can still clear a STRATEGIC hurdle rate, and the "customer credit" analysis of tab 2 applies to sovereigns: China underwrote weak credits at scale and is now living the workout.',
];

export interface Corridor {
  name: string;
  backer: string;
  what: string;
  watch: string;
  /** Country ids (report lens list) with direct stakes in this corridor. */
  involves: string[];
}

export const TRADE_CORRIDORS: Corridor[] = [
  { name: 'Maritime Silk Road', backer: 'China (BRI)', what: 'The financed port chain from the South China Sea via Malacca, Colombo/Hambantota, and Suez to Piraeus — the sea half of the BRI, carrying the bulk of China–Europe trade.', watch: 'New port stakes in Europe/Africa · militarization of "commercial" ports · Red Sea disruption pushing traffic around the Cape.', involves: ['china', 'germany', 'france', 'italy', 'uk', 'japan', 'skorea', 'india'] },
  { name: 'China–Europe Railway Express', backer: 'China (BRI)', what: 'Container rail through Kazakhstan/Russia to European terminals — Duisburg (Germany) is the western railhead. Faster than sea, cheaper than air; volumes swing with sanctions politics since the route crosses Russia.', watch: 'Rerouting via the "Middle Corridor" (Caspian/Caucasus, bypassing Russia) · EU screening of rail-linked logistics assets.', involves: ['china', 'germany', 'france', 'italy', 'uk'] },
  { name: 'CPEC (China–Pakistan Economic Corridor)', backer: 'China (BRI flagship)', what: '$60B+ of roads, power plants, and the Gwadar port — China’s overland bypass of Malacca to the Arabian Sea, crossing territory India claims (why India refused the BRI outright).', watch: 'Pakistan’s debt distress and IMF cycles · security attacks on Chinese workers · Gwadar’s (still tiny) actual throughput.', involves: ['china', 'india', 'us'] },
  { name: 'IMEC (India–Middle East–Europe Economic Corridor)', backer: 'US, India, EU, Gulf states', what: 'The announced rival: ship-rail-ship from India via the UAE/Saudi Arabia to Israel/Jordan and on to Europe — the G20-2023 answer to the BRI, stalled by the Gaza war’s geography.', watch: 'Whether Gulf–Israel normalization survives to make the middle leg buildable · first funded segments.', involves: ['us', 'india', 'germany', 'france', 'italy', 'uk', 'saudi'] },
  { name: 'EU Global Gateway + G7 PGII', backer: 'EU / G7', what: 'The West’s catch-up programs (€300B and $600B headline commitments) for infrastructure lending with governance strings — more announcement than asphalt so far, which is itself the lesson: matching a state-directed lender with committee money is hard.', watch: 'Disbursement vs headline ratio · flagship projects (Lobito) actually completing.', involves: ['us', 'germany', 'france', 'italy', 'uk', 'japan', 'canada'] },
  { name: 'Lobito Corridor', backer: 'US/EU (PGII flagship)', what: 'Refurbished rail from the Congo/Zambia copper-cobalt belt to Angola’s Atlantic coast — the West’s critical-minerals answer to Chinese-controlled processing, and the most concrete PGII project to date.', watch: 'Ore volumes actually shipping west instead of east · Chinese counter-offers to the same mines.', involves: ['us', 'china', 'canada'] },
  { name: 'INSTC (International North–South Transport Corridor)', backer: 'Russia, Iran, India', what: 'Ship-rail-road from India via Iran’s Chabahar and the Caspian to Russia — the sanctions-resistant corridor linking the three economies Western routes exclude, moving real (if modest) volumes since 2022.', watch: 'Chabahar’s US-sanctions carve-out for India · rail-gap completion in Iran · whether volumes survive any US–Iran escalation.', involves: ['russia', 'iran', 'india'] },
  { name: 'Chancay & the bi-oceanic corridor', backer: 'China (BRI in the Americas)', what: 'Peru’s COSCO-run Chancay megaport (opened late 2024) is the BRI’s South American hub — cutting Asia transit times for the west coast, with a proposed transcontinental rail link to Brazil’s soy and iron belts behind it. The hemisphere’s route map redrawn in one project.', watch: 'Brazilian rail-link commitments · US responses (tariff and screening pressure on Chancay-routed cargo) · Chancay volumes vs Panama-routed traffic.', involves: ['china', 'brazil', 'us'] },
  { name: 'Arctic Northern Sea Route', backer: 'Russia (China as "Polar Silk Road" partner)', what: 'The melting shortcut: Asia–Europe ~40% shorter than Suez, usable a growing slice of the year — Russian-controlled, icebreaker-escorted, sanctions-entangled.', watch: 'Transit volumes · Chinese state carriers committing regular services · Arctic militarization (Canada’s quiet flashpoint).', involves: ['china', 'us', 'canada', 'japan', 'russia'] },
];

export interface Chokepoint {
  name: string;
  carries: string;
  issue: string;
  /** Country ids (report lens list) most exposed to a disruption here. */
  relevantTo: string[];
}

export const CHOKEPOINTS: Chokepoint[] = [
  { name: 'Strait of Malacca', carries: '~25–30% of world trade; most of China’s energy imports', issue: 'The dilemma the whole BRI answers — a US-navy-closable bottleneck between the Indian and Pacific Oceans.', relevantTo: ['china', 'japan', 'skorea', 'india', 'us'] },
  { name: 'Strait of Hormuz', carries: '~20% of world oil, much of its LNG', issue: 'Iran’s lever (the Iran flashpoint above) — the single biggest upside tail on energy prices.', relevantTo: ['china', 'india', 'japan', 'skorea', 'us', 'germany', 'france', 'italy', 'uk', 'iran', 'saudi'] },
  { name: 'Suez / Red Sea', carries: '~12–15% of world trade', issue: 'The Houthi campaign turned it into a war-risk zone — the standing reroute-around-Africa tax in the conflicts table.', relevantTo: ['germany', 'france', 'italy', 'uk', 'india', 'china', 'japan', 'skorea'] },
  { name: 'Panama Canal', carries: '~5% of world trade; ~40% of US container traffic touches it', issue: 'Drought restricts transits (a climate chokepoint), and US pressure over Chinese-linked port operators at both ends made it a 2025 flashpoint — even hemispheric infrastructure is now alignment-screened.', relevantTo: ['us', 'canada', 'brazil', 'china', 'mexico', 'venezuela'] },
  { name: 'Taiwan Strait & South China Sea lanes', carries: '~a third of global shipping', issue: 'Covered in the flashpoints above — the unpriced tail under every Asia supply chain.', relevantTo: ['china', 'us', 'japan', 'skorea', 'taiwan'] },
];

/** Per-country trade-route and BRI exposure — SAME ids as the country lens. */
export const COUNTRY_ROUTES: GeoExposure[] = [
  { id: 'us', headline: 'Not a member — runs the rival network.', items: ['Backs the counter-programs: PGII, IMEC, Lobito — and pressures BRI nodes directly (the Panama ports fight).', 'Its own trade rides LA/Long Beach, NY/NJ, and Savannah (the state lens carries each) — tariff policy is reshaping which routes grow.', 'The strategic frame: "small yard, high fence" — control the chokepoint technologies (chips, finance) rather than outbuild the roads.'] },
  { id: 'china', headline: 'The author — the Belt and Road IS its trade strategy.', items: ['~$1T across ~150 countries since 2013: the Maritime Silk Road port chain (Piraeus, Hambantota, Gwadar, Djibouti), rail to Duisburg, CPEC to the Arabian Sea — commerce and security fused.', 'It all answers the Malacca dilemma: diversify every route the US Navy could close.', 'Now the world’s largest official creditor, living the sovereign workouts (Sri Lanka, Zambia) — lending pivoted to "small and beautiful" after the distress wave; the tab-2 lesson at nation scale.'] },
  { id: 'japan', headline: 'The quality-infrastructure rival.', items: ['Never joined; runs the "Partnership for Quality Infrastructure" (~$200B) and co-builds with India (Asia-Africa Growth Corridor) — competing on governance and lifetime cost, not headline size.', 'Everything it imports and exports transits the SCS/Malacca lanes it does not control — why sea-lane security IS Japanese economic policy.', 'JICA/JBIC financing quietly rivals Chinese banks in Southeast Asia — the underreported competition.'] },
  { id: 'germany', headline: 'The BRI’s European railhead — now de-risking.', items: ['Duisburg is the China–Europe Railway Express terminus; COSCO’s stake in a Hamburg terminal became the national de-risking argument in miniature.', 'Export model depends on open sea lanes and the Suez route the Red Sea crisis taxed.', 'EU Global Gateway member — Berlin’s dilemma: its carmakers’ China revenue vs its security policy.'] },
  { id: 'uk', headline: 'Finance and insurance are its route power.', items: ['Never joined the BRI (though a founding AIIB member) — its leverage is that London prices and insures world shipping: the oil price cap ran on UK marine insurance law.', 'Post-Brexit trade strategy (CPTPP accession) points at the Indo-Pacific lanes.', 'The City clears the sanctions economy alongside New York.'] },
  { id: 'france', headline: 'Mediterranean gatekeeper, EU screener.', items: ['Pushes EU-level screening of Chinese stakes in ports and grids; Marseille and Le Havre are its route assets.', 'Global Gateway advocate — the strategic-autonomy voice applied to infrastructure.', 'Its Africa network overlaps the BRI’s hardest-fought lending ground.'] },
  { id: 'india', headline: 'The refusenik building the alternative.', items: ['Refused the BRI from day one — CPEC crosses Kashmir-claimed territory — making India the only major economy formally outside it.', 'Builds the counters: IMEC westward, the INSTC via Iran’s Chabahar port (its own exception to sanctions politics), and Quad sea-lane patrols.', '"China+1" supply-chain migration is its once-a-generation chance to become the route, not just guard it.'] },
  { id: 'italy', headline: 'The G7 member that joined — and walked back out.', items: ['Signed the BRI MoU in 2019 (the only G7 member ever to join), exited December 2023 — the promised export boom never arrived; the episode is THE case study in courtship economics.', 'Trieste and Genoa were the courted ports; both now court Global Gateway money instead.', 'Still runs a quiet export surplus over the same Suez-dependent lanes as everyone else (tab 15).'] },
  { id: 'brazil', headline: 'Courted, unsigned, and China-dependent anyway.', items: ['Never formally joined — yet China is its largest trading partner, Chinese firms run big stakes in its grid (State Grid) and ports (Paranaguá), and the soy/iron routes to Shanghai are its economic spine.', 'The lesson: BRI membership is paperwork; route dependence is physics.', 'Weighs Chinese rail proposals (the transcontinental "bi-oceanic" line to a Peruvian Pacific port, Chancay) against US relations.'] },
  { id: 'canada', headline: 'The North American gateway with a screening habit.', items: ['Vancouver and Prince Rupert are North America’s fastest Asia gateways — its route asset inside USMCA.', 'Blocked Chinese takeovers in critical minerals on security grounds — the alignment screen applied to its own resource routes.', 'The Arctic (NSR’s western flank) is turning its geography strategic again.'] },
  { id: 'skorea', headline: 'A shipping superpower threading between the blocs.', items: ['Not a BRI member — but the world’s #2 shipbuilder and a top container carrier (HMM): Korea BUILDS the routes everyone argues about, and its order book is a geopolitics indicator.', 'Busan is the Pacific’s great transshipment hub; the chips corridor to US/allied fabs is its newest and most political trade route.', 'Every lane it depends on (SCS, Malacca, Suez) is someone else’s chokepoint — maximum route exposure to match its maximum alliance exposure (the military table).'] },
];

/** The US-side route program — what fills the routes step when the US is the lens. */
export const US_COUNTER_PROGRAM: string[] = [
  'The US never joined the Belt and Road — it runs the rival network: the G7’s PGII ($600B headline), the IMEC corridor with India and the Gulf, and the Lobito minerals railway — infrastructure lending with governance strings, mobilizing private capital and DFC loans instead of state-bank credit.',
  'Its sharper tool is the screen, not the shovel: pressure on Chinese-linked operators at the Panama Canal’s ports, security reviews of Chinese-made port cranes (which load most US containers), and alignment screening of allies’ port and grid stakes.',
  'The doctrine is "small yard, high fence": rather than outbuild China’s roads, control the chokepoint TECHNOLOGIES — leading-edge chips, dollar clearing, aircraft, cloud — and let the sanctions economy police the routes.',
  'The domestic leg is reshoring as route strategy: CHIPS-Act fabs (Ohio, Texas, New York, Arizona), IIJA port and grid upgrades (LA/Long Beach, Savannah), and "friend-shoring" trade toward Mexico, Canada, and allied Asia.',
  'The finance read: where China lends to build routes, the US prices access to them — tariffs, licenses, and clearing are toll booths on infrastructure someone else paid for. Both are capital-allocation strategies; tab 1’s hurdle logic applies to each.',
];

/** Which route "program" fills the routes step for a given country lens. */
export function routeProgramFor(id: string, name: string): { title: string; facts: string[] } {
  if (id === 'china') return { title: 'The Belt and Road Initiative — the builder’s program', facts: BRI_FACTS };
  if (id === 'us') return { title: 'The US counter-network — screening, rival corridors, and reshoring', facts: US_COUNTER_PROGRAM };
  const row = COUNTRY_ROUTES.find((r) => r.id === id) ?? EXTRA_COUNTRY_ROUTES.find((r) => r.id === id);
  return { title: `${name}’s route position — ${row?.headline ?? ''}`, facts: row?.items ?? [] };
}

/** Corridors with a direct stake for the selected country. */
export function corridorsFor(id: string): Corridor[] {
  return TRADE_CORRIDORS.filter((c) => c.involves.includes(id));
}

/** Chokepoints whose disruption hits the selected country hardest. */
export function chokepointsFor(id: string): Chokepoint[] {
  return CHOKEPOINTS.filter((c) => c.relevantTo.includes(id));
}

// ---------------------------------------------------------------------------
// State current events & ballot watch — SAME ids as the state lens
// ---------------------------------------------------------------------------

export const STATE_EVENTS_SOURCE =
  'Current-events and ballot watch compiled early 2026, extended consistently with the Lab’s snapshot world — ILLUSTRATIVE where it runs past verifiable history; verify measures, dates, and outcomes before citing.';

export const STATE_CURRENT_EVENTS: GeoExposure[] = [
  { id: 'ca', headline: 'An open governor’s race, a ballot-initiative machine, and an insurance crisis.', items: ['Nov 2026: open-seat governor’s race (the incumbent termed out) — a national-money magnet that resets tax and regulation debates for the world’s 5th-largest economy.', 'The initiative machine is loading: AI-regulation and tech-tax measures circulating for the 2026 ballot — the state that regulates tech IS tech policy for the country.', 'The wildfire-insurance crisis is the state economic story: the FAIR plan overloaded, insurers re-entering only under new catastrophe-model pricing — a property-market and muni-credit issue, not just a homeowner one.', 'High-speed-rail funding fights and film-credit expansion: the perennial capital-allocation debates, live.'] },
  { id: 'tx', headline: 'The grid meets the data-center boom; property-tax promises meet school math.', items: ['ERCOT interconnection is the bottleneck of the AI buildout — grid and gas-turbine politics are now industrial policy (the utilities lens, live in one state).', 'Property-tax "compression" promises collide with school-funding formulas — the recurring special-session fight.', 'Border-operations spending is a permanent budget line now; November odd-year constitutional-amendment elections keep moving real money.'] },
  { id: 'ny', headline: 'Congestion pricing, city politics, and the upstate chips bet.', items: ['Congestion-pricing revenue underwrites the MTA capital plan — the toll IS a bond covenant now; every legal challenge is a muni-credit event.', 'NYC mayoral politics drives national business-climate headlines — and the financial industry’s relocation threats price real estate at the margin.', 'Upstate: Micron’s mega-fab milestones are New York’s reshoring barometer (the CHIPS story in one project).'] },
  { id: 'fl', headline: 'The insurance market is the economy’s stress point.', items: ['Property insurance and reinsurance costs are the state’s macro story — carrier failures, Citizens (the state insurer) as backstop, and every hurricane season a fiscal event.', 'Post-Surfside condo-inspection law: special assessments are repricing the condo market, unit by unit.', 'Growth vs infrastructure strain: insurance, water, and roads decide whether the in-migration boom continues compounding.'] },
  { id: 'il', headline: 'The pension ramp squeezes everything else.', items: ['The statutory pension-funding ramp (the tab-15 warning live) crowds the budget every single year — the first fact of Illinois fiscal politics.', 'Chicago’s structural budget gap and credit-watch cycle is the state’s second balance sheet.', 'Periodic graduated-income-tax revival talk: the 2020 failure still frames what revenue answers are possible.'] },
  { id: 'pa', headline: 'Permanent swing state; energy is the industrial policy.', items: ['2026 governor and senate races make it a national-money magnet again — policy uncertainty as a recurring local industry.', 'Energy is the story: Marcellus gas, LNG-export politics, and power-plant restarts bid up by data-center demand.', 'Philadelphia and Pittsburgh transit funding cliffs — the recurring state-vs-city fiscal standoff.'] },
  { id: 'oh', headline: 'The reshoring barometer, in concrete.', items: ['Intel’s New Albany fab timeline is the country’s clearest reshoring test — every delay or milestone is industrial-policy news.', 'A property-tax revolt is brewing after reappraisal spikes — ballot-measure pressure building.', 'Redistricting-reform fallout keeps state politics unsettled between cycles.'] },
  { id: 'ga', headline: 'Port, batteries, and an open governor’s race.', items: ['Savannah’s expansion rides the regionalization of trade — the East Coast’s share keeps climbing.', 'The EV/battery corridor (Hyundai, SK) is ramping — Korean industrial investment as county-level economics.', '2026: open governor’s race, with elections administration under the national microscope again.'] },
  { id: 'nj', headline: 'A new administration meets the old math.', items: ['The governor elected in 2025 now owns the math: the pension hole, school funding, and the affordability politics that decided the race.', 'NJ Transit’s funding cliff and the corporate-transit-fee fight — the recurring test of who pays for the region’s rails.', 'Warehouse-and-logistics sprawl politics: the port economy’s land-use backlash.'] },
  { id: 'wa', headline: 'Tax-initiative cycles, Boeing’s recovery, and the cloud at home.', items: ['The capital-gains-tax expand-vs-repeal initiative cycle keeps the state’s tax structure permanently on the ballot.', 'Boeing’s order book and production recovery is the state income statement — every delivery pause is a local recession signal.', 'Data-center and AI siting decisions (power, water, tax) are now the growth debate east of the Cascades.'] },
];

// ---------------------------------------------------------------------------
// US bilateral arcs — the two-decade relationship per country lens
// ---------------------------------------------------------------------------

export interface BilateralArc {
  id: string;
  title: string;
  arc: SummitEntry[];
  today: string;
}

/** Selecting a country fills the two-decade step with its US relationship. */
export const US_BILATERAL: BilateralArc[] = [
  { id: 'china', title: 'US–China', today: 'The defining rivalry: engagement (2001–2016) flipped to managed competition and never flipped back — the main meetings ledger below IS largely this relationship’s history.', arc: [
    { when: '2001', what: 'WTO accession, US-backed', result: 'The engagement bet placed — supply chains move, imports explode.', read: 'The hinge everything below swings on.' },
    { when: '2018–20', what: 'Trade war → Phase One', result: 'Tariffs stay; purchase targets missed ~40%.', read: 'Engagement officially over; managed trade begins.' },
    { when: '2022', what: 'Chip export controls + CHIPS Act', result: 'Leading-edge compute cut off; fabs subsidized home.', read: 'Economic statecraft replaces trade policy.' },
    { when: '2023–26', what: 'Woodside hotlines → tariff-wave summits', result: 'Talk resumed, decoupling continued, carve-outs traded leader-to-leader.', read: 'The floor-setting equilibrium: prevent accidents, compete on everything.' },
  ] },
  { id: 'japan', title: 'US–Japan', today: 'The closest Pacific ally: chip-controls partner, defense budget doubling, host of the largest US forward force — while Nippon Steel and tariff rounds prove alliance does not exempt economics.', arc: [
    { when: '2015', what: 'Abe addresses Congress; defense guidelines rewritten', result: 'Collective self-defense reinterpreted — Japan can fight beside the US.', read: 'The postwar constraints start bending, by American request.' },
    { when: '2016', what: 'Obama at Hiroshima; Abe at Pearl Harbor', result: 'Reciprocal reconciliation visits, no apologies asked.', read: 'The alliance matures past its origin story.' },
    { when: '2019', what: 'US–Japan trade agreement', result: 'Agriculture and digital trade deal after the US left TPP.', read: 'Tokyo learns to deal bilaterally with a transactional Washington.' },
    { when: '2022–23', what: 'Defense-doubling pledge; Camp David US–Japan–Korea trilateral', result: 'Counter-strike missiles funded; the trilateral institutionalized.', read: 'The fiscal lever pulled for security — the military table’s biggest posture shift.' },
    { when: '2024–25', what: 'Nippon Steel / US Steel blocked-then-renegotiated; tariff rounds', result: 'An ally’s acquisition treated as a security question; carve-outs bargained.', read: 'Economic nationalism doesn’t exempt friends — price it into every cross-border deal.' },
  ] },
  { id: 'germany', title: 'US–Germany', today: 'Security-aligned since the Zeitenwende, economically tense: auto tariffs, China de-risking pressure, and the memory that Washington sanctioned its pipeline.', arc: [
    { when: '2003', what: 'Iraq war rift', result: 'Berlin refuses the coalition; relations chill.', read: 'The alliance survives open disagreement — a precedent both sides remember.' },
    { when: '2013', what: 'NSA revelations (the Chancellor’s phone)', result: 'Trust crisis inside the alliance.', read: 'Allies surveil allies; intelligence and friendship run on separate books.' },
    { when: '2019–21', what: 'Nord Stream 2 sanctions fight', result: 'US sanctions a German-backed pipeline; waived 2021, moot after 2022.', read: 'Energy routes were the fault line years before the war proved the US right.' },
    { when: '2022', what: 'Zeitenwende alignment', result: 'Rearmament, LNG terminals, weapons to Ukraine — the postwar model overturned.', read: 'Shock does in weeks what summits couldn’t in decades.' },
  ] },
  { id: 'uk', title: 'US–UK', today: 'The closest intelligence and security ally (Five Eyes, AUKUS, Trident) — still waiting on the comprehensive trade deal Brexit was supposed to unlock.', arc: [
    { when: '2003', what: 'Iraq — shoulder to shoulder', result: 'The special relationship at maximum commitment, at real political cost.', read: 'London pays premiums on the alliance others don’t.' },
    { when: '2016–20', what: 'Brexit + promised US trade deal', result: 'The deal never closed; sectoral mini-agreements instead.', read: 'Leaving one bloc did not buy entry terms to another.' },
    { when: '2020', what: 'Huawei 5G ban under US pressure', result: 'UK reverses course and rips out Chinese kit.', read: 'On chokepoint technologies, Washington’s preference binds allies.' },
    { when: '2021', what: 'AUKUS', result: 'Nuclear-submarine tech shared — the deepest capability transfer since WWII.', read: 'The Indo-Pacific pivot runs through London (and past Paris).' },
  ] },
  { id: 'france', title: 'US–France', today: 'The ally that insists on optionality: fully committed in NATO, loudly independent on strategy, industry, and China policy.', arc: [
    { when: '2003', what: 'Iraq rift ("freedom fries")', result: 'Paris leads the refusal; relations freeze.', read: 'France’s independence is a feature of the alliance, not a bug in it.' },
    { when: '2015', what: 'Paris climate accord partnership', result: 'The signature multilateral win, later US-withdrawn-then-rejoined.', read: 'French-brokered multilateralism is hostage to US electoral cycles.' },
    { when: '2021', what: 'AUKUS submarine snub', result: '$60B+ contract lost; ambassadors recalled — from an ally.', read: 'Strategic autonomy went from slogan to policy that week.' },
    { when: '2023', what: '"Not America’s followers" — the Taiwan comments', result: 'Macron argues Europe shouldn’t be dragged into every US–China crisis.', read: 'The swing voice INSIDE the Western bloc — watch it to gauge alliance cohesion.' },
  ] },
  { id: 'india', title: 'US–India', today: 'The fastest-warming major relationship — defense, chips, IMEC — bounded by India’s refusal to pick a side (Russian oil, BRICS seat).', arc: [
    { when: '2005–08', what: 'Civil nuclear deal', result: 'Sanctions-era estrangement ends; India recognized as a nuclear power in practice.', read: 'The hinge: Washington chose India as the China counterweight.' },
    { when: '2016–20', what: 'Major Defense Partner status; border clashes push the tilt', result: 'Interoperability agreements signed; Quad revived to leaders level.', read: 'China’s pressure did more for US–India ties than any summit.' },
    { when: '2023', what: 'Modi state visit', result: 'Jet-engine co-production, drones, chip investments announced.', read: 'Technology transfer is the new currency of alignment.' },
    { when: '2025–26', what: 'Tariff frictions inside the friendship', result: 'Trade fights coexist with defense deepening.', read: 'The swing state gets courted AND tariffed — non-alignment has a price and a payoff.' },
  ] },
  { id: 'italy', title: 'US–Italy', today: 'A reliable NATO southern-flank host whose BRI episode made it the test case for alliance economic discipline — resolved Washington’s way.', arc: [
    { when: '2019', what: 'Joins the BRI over US objections', result: 'The only G7 member to sign.', read: 'The alliance’s economic seams showing.' },
    { when: '2023', what: 'Exits the BRI', result: 'Quiet withdrawal; Global Gateway money courted instead.', read: 'The promised export boom never came — and Washington’s patience mattered.' },
    { when: '2024–26', what: 'Mediterranean migration and defense-spending pressure', result: 'Hosting duties rise; the 2% NATO target stays out of fiscal reach.', read: 'The debt table (tab 15) constrains the alliance table.' },
  ] },
  { id: 'brazil', title: 'US–Brazil', today: 'Transactional and swing: courted on minerals and trade, sanctioned-adjacent on politics, always keeping the BRICS door open.', arc: [
    { when: '2013', what: 'NSA spying revelations', result: 'President cancels a US state visit.', read: 'Surveillance costs real diplomatic capital in the Global South.' },
    { when: '2019–22', what: 'The Bolsonaro alignment', result: 'Warmest ties in decades — reversed by the next election.', read: 'Relationship beta to BOTH countries’ electoral cycles.' },
    { when: '2023–26', what: 'BRICS hosting + US tariff fights', result: 'Hosts the expansion summits while negotiating trade disputes with Washington.', read: 'Hedging as strategy: sell food to China, court capital from the US.' },
  ] },
  { id: 'canada', title: 'US–Canada', today: 'The closest economic integration on Earth — and the cleanest lesson that integration is exposure when the big partner turns protectionist.', arc: [
    { when: '2017–20', what: 'NAFTA renegotiated into USMCA under tariff threat', result: '"National security" steel/aluminum tariffs applied to an ally mid-negotiation.', read: 'Treaty ally, tariff target — simultaneously.' },
    { when: '2015–21', what: 'Keystone XL granted, revoked, re-revoked', result: 'The pipeline dies by US electoral cycle.', read: 'Canadian capital projects carry US political risk on their books.' },
    { when: '2025–26', what: 'The tariff wave hits the closest partner', result: 'Sovereignty rhetoric spikes; diversification talk becomes policy.', read: 'The one-customer problem (tab 15) made vivid — even best friends hedge now.' },
  ] },
  { id: 'skorea', title: 'US–South Korea', today: 'Deepest integration of the lattice — treaty, troops, chips, shipbuilding — with the IRA and cost-sharing fights as recurring reminders that economics is negotiated separately.', arc: [
    { when: '2007–18', what: 'KORUS FTA signed, then renegotiated', result: 'The trade pact reopened under tariff pressure.', read: 'Even codified deals reopen when Washington’s mood shifts.' },
    { when: '2018–19', what: 'Singapore/Hanoi summits negotiated over Seoul’s head; cost-sharing fights', result: 'Alliance anxiety spikes; troop-cost demands quintuple.', read: 'Front-line allies bear the volatility of US diplomacy they don’t control.' },
    { when: '2022', what: 'IRA EV-credit shock', result: 'Korean EVs excluded from US credits the year Korea invested most.', read: 'The Georgia plants (state lens) are the hedge that answer built.' },
    { when: '2023', what: 'Camp David trilateral with Japan', result: 'The US–Japan–Korea triangle institutionalized past historical grievances.', read: 'The lattice becomes architecture — and Korea’s chips corridor runs through it.' },
  ] },
];

export const EXTRA_GEO_EXPOSURE: GeoExposure[] = [
  { id: 'iran', headline: 'Every axis runs through it: sanctions, oil, proxies, the strait.', items: ['The Hormuz chokepoint and the discount barrel are the same file — the Iran flashpoint is its national strategy.', 'Arms-for-energy ties to Russia and oil sales to China put it inside the adversary axis without a treaty.', 'Its nuclear threshold status is the region’s standing escalation clock.'] },
  { id: 'russia', headline: 'The sanctioned pole of the system.', items: ['Author of the war that built the modern sanctions architecture — and of the workarounds every non-aligned state studied.', 'Energy rerouting east (discounted crude to India/China) redrew the tanker map; the NSR is its Arctic card.', 'North Korean shells and Iranian drones flow in; nuclear signaling is its escalation currency.'] },
  { id: 'taiwan', headline: 'The single point of failure in the world economy.', items: ['TSMC’s leading edge is the chokepoint technology every export control orbits.', 'The gray-zone pressure campaign (exercises, incursions) is the flashpoint table’s biggest unpriced tail.', 'Its election cycles move chip stocks the way Fed meetings move bonds.'] },
  { id: 'mexico', headline: 'The land border of every US debate.', items: ['#1 US goods-trade partner: nearshoring’s hub, USMCA’s renewable license, tariff threats’ first target.', 'Migration and fentanyl politics make it a permanent line in US elections — policy risk with a peso price.', 'Chinese investment routing through Mexican plants is the next screening fight.'] },
  { id: 'venezuela', headline: 'Sanctions lab of the hemisphere.', items: ['License swings (the flashpoint) are the live experiment in sanctions-as-price-dial.', 'The migration exodus reprices state budgets from Bogotá to New York.', 'US naval pressure in the southern Caribbean keeps military options visibly priced.'] },
  { id: 'saudi', headline: 'The swing vote of oil and of alignment.', items: ['Spare capacity makes it the inflation dial’s largest single hand.', 'BRICS member AND US security partner AND IMEC leg — the non-aligned hedge at sovereign-wealth scale.', 'Normalization diplomacy is the switch that turns IMEC from map to corridor.'] },
];

export const EXTRA_COUNTRY_ROUTES: GeoExposure[] = [
  { id: 'iran', headline: 'The chokepoint state building its own corridor.', items: ['Holds Hormuz — a fifth of world oil transits its coastline; closure is its ultimate (self-wounding) card.', 'The INSTC north–south corridor (with Russia and India, via Chabahar) is its sanctions-proof trade bet.', 'The shadow fleet is its route innovation: a parallel tanker system outside Western insurance.'] },
  { id: 'russia', headline: 'Rerouted east, betting on the Arctic.', items: ['Pipeline Europe is gone; discounted seaborne crude to India and China rebuilt the flow map in eighteen months.', 'The Northern Sea Route is its long game — Arctic transit under Russian control as the ice opens.', 'The China rail links and INSTC are its landward sanctions bypasses.'] },
  { id: 'taiwan', headline: 'An island that ships value, not volume.', items: ['Its exports are so value-dense (chips) that airfreight matters as much as sea lanes — but energy and food arrive by sea through the strait China patrols.', 'Blockade math is inventory math: months of chips stockpiled abroad vs weeks of LNG at home.', 'TSMC’s overseas fabs are routes in themselves — capacity physically relocated past the chokepoint.'] },
  { id: 'mexico', headline: 'The land bridge — rail and truck, not tankers.', items: ['USMCA’s road/rail corridors (Laredo is America’s busiest port of entry) carry more US trade than most oceans.', 'Pacific ports (Manzanillo, Lázaro Cárdenas) are the China-goods backdoor Washington now screens.', 'The Tehuantepec interoceanic rail is its Panama-alternative ambition.'] },
  { id: 'venezuela', headline: 'One export, one route, one buyer question.', items: ['Heavy crude to US Gulf refineries is THE route — everything else (China deliveries repaying loans) is workaround.', 'Caribbean adjacency puts it beside the Panama approaches and under the US naval eye.', 'Migration routes are its other flow — northbound, unpriced, fiscally real.'] },
  { id: 'saudi', headline: 'The origin node of the energy map.', items: ['Its crude exits via Hormuz — plus the east–west pipeline to the Red Sea as the strategic bypass.', 'IMEC’s middle leg would make it the land bridge between India and Europe — normalization is the missing rail.', 'Red Sea disruption (the Houthi campaign) taxes its own diversification coastline.'] },
];

export const EXTRA_MILITARY: MilitaryRow[] = [
  { id: 'iran', name: 'Iran', budgetB: 16, pctGdp: 2.6, alignment: 'adversary', nuclear: false, note: 'Threshold nuclear state; the proxy network and missile/drone arsenal are the real budget. Sanctions cap the conventional force; asymmetry is the doctrine.' },
  { id: 'russia', name: 'Russia', budgetB: 130, pctGdp: 6.5, alignment: 'adversary', nuclear: true, note: 'A war economy: ~6–7% of GDP on defense, artillery-scale production revived, the world’s largest nuclear arsenal as the backstop. The military IS the economy now.' },
  { id: 'taiwan', name: 'Taiwan', budgetB: 20, pctGdp: 2.5, alignment: 'ally', nuclear: false, note: 'No treaty, but US arms packages and the Taiwan Relations Act make it a de facto security partner; porcupine strategy (asymmetric denial) plus the silicon shield.' },
  { id: 'mexico', name: 'Mexico', budgetB: 12, pctGdp: 0.7, alignment: 'ally', nuclear: false, note: 'Constitutionally averse to foreign deployment; the military’s real missions are cartels and infrastructure. Security cooperation with the US is deep and permanently sensitive.' },
  { id: 'venezuela', name: 'Venezuela', budgetB: 4, pctGdp: 1.5, alignment: 'adversary', nuclear: false, note: 'Degraded conventional forces sustained by Russian/Cuban ties and internal-control priorities; the US naval presence offshore defines the military question.' },
  { id: 'saudi', name: 'Saudi Arabia', budgetB: 75, pctGdp: 7.1, alignment: 'swing', nuclear: false, note: 'Top-five world spender on US kit, yet hedging with Chinese missiles and BRICS seats; its wars (Yemen) showed money ≠ capability. The US security umbrella is the item always being renegotiated.' },
];

export const EXTRA_BILATERAL: BilateralArc[] = [
  { id: 'iran', title: 'US–Iran', today: 'No relations since 1979; the JCPOA’s collapse left maximum pressure vs threshold nuclear status — every escalation cycle prices straight into oil.', arc: [
    { when: '2015', what: 'JCPOA nuclear deal', result: 'Sanctions relief for enrichment limits — the engagement high-water mark.', read: 'Proof a deal was possible; benchmark for every attempt since.' },
    { when: '2018', what: 'US withdrawal; maximum pressure', result: 'Sanctions snap back; Iran resumes enrichment; oil exports go shadow.', read: 'The deal’s death taught Tehran that US signatures expire with administrations.' },
    { when: '2020', what: 'Soleimani strike', result: 'Direct state-on-state killing; retaliation stayed calibrated.', read: 'Both sides showed escalation control — the reason the tail hasn’t priced.' },
    { when: '2023–26', what: 'Proxy war era: Red Sea, direct exchanges, the Gulf shock', result: 'Houthi shipping campaign, first direct Iran–Israel strikes, the 2026 energy premium.', read: 'The conflict now runs through insurance rates and the energy CPI line (tab 3) — markets price Iran weekly.' },
  ] },
  { id: 'russia', title: 'US–Russia', today: 'Adversaries running the largest sanctions war ever — negotiation pressure comes and goes with US politics; the reserve freeze is the precedent every central bank remembers.', arc: [
    { when: '2009–13', what: 'The "reset" and its death', result: 'Cooperation attempts end in Snowden asylum and Syria.', read: 'The last try at partnership — its failure set the trajectory.' },
    { when: '2014', what: 'Crimea; sanctions round one', result: 'Sectoral sanctions, G8 expulsion — the modern toolkit’s first draft.', read: 'The 2022 architecture was rehearsed here, and Moscow adapted for eight years.' },
    { when: '2016–20', what: 'Election interference era', result: 'Sanctions, expulsions, permanent domestic-politics entanglement.', read: 'The relationship became a US internal issue — which makes policy swings wider.' },
    { when: '2022–26', what: 'Full invasion; the sanctions revolution; negotiation pressure', result: 'Reserve freeze, price caps, SWIFT cuts; the war grinds; talk cycles come and go.', read: 'The chapter that armed the dollar — and recruited for every alternative to it.' },
  ] },
  { id: 'taiwan', title: 'US–Taiwan', today: 'Unofficial but thickening: arms packages, chip co-dependence (TSMC Arizona), congressional visits — strategic ambiguity under growing strain.', arc: [
    { when: '2016', what: 'The Trump–Tsai call', result: 'First leader-level contact since 1979 — protocol broken deliberately.', read: 'Ambiguity’s boundaries started moving.' },
    { when: '2020–22', what: 'Arms packages accelerate; Pelosi visit; PLA exercise response', result: 'Blockade rehearsals become the new normal after the visit.', read: 'Each gesture buys reassurance and buys escalation — the flashpoint’s core trade-off.' },
    { when: '2022–25', what: 'CHIPS era: TSMC Arizona fabs', result: 'Leading-edge capacity physically planted on US soil.', read: 'De-risking the island by thinning its shield — the paradox US policy lives with.' },
    { when: '2024–26', what: 'Election cycles and gray-zone tempo', result: 'Continuity in Taipei; pressure campaigns intensify without a trigger event.', read: 'The status quo holds because all three capitals still prefer it to the alternatives — watch for when one stops.' },
  ] },
  { id: 'mexico', title: 'US–Mexico', today: 'The deepest economic integration after Canada — #1 goods partner — governed summit-to-summit through migration, fentanyl, and tariff leverage.', arc: [
    { when: '2017–20', what: 'NAFTA → USMCA under tariff threat', result: 'The treaty survives, rewritten; tariffs used as negotiation artillery.', read: 'Access became renewable-with-conditions — the review clause is the leash.' },
    { when: '2019', what: 'Tariff-for-migration ultimatum', result: 'Mexico deploys its national guard to the border to stop US tariffs.', read: 'Trade and migration formally fused into one negotiation.' },
    { when: '2021–24', what: 'The nearshoring boom', result: 'Mexico passes China as the #1 US goods partner; the super-peso prices it.', read: 'The China+1 dividend landed next door — geography beat ideology.' },
    { when: '2025–26', what: 'Tariff waves, cartel designations, USMCA review shadow', result: 'Carve-outs negotiated; security pressure escalates; review looms.', read: 'The boom’s terms are being repriced in real time — the peso is the tape.' },
  ] },
  { id: 'venezuela', title: 'US–Venezuela', today: 'Coercion with an oil valve: recognition fights, license swings, naval pressure — policy oscillates between isolation and barrels.', arc: [
    { when: '2019', what: 'Guaidó recognition; oil sanctions', result: 'Parallel government recognized; PDVSA cut off.', read: 'Maximum pressure’s limit case: the regime held, the economy didn’t.' },
    { when: '2022–23', what: 'License thaw (Chevron), Barbados agreement', result: 'Barrels for election promises.', read: 'Sanctions-as-dial demonstrated: the same crude toggled legal.' },
    { when: '2024', what: 'Disputed election; snapback', result: 'Promises broken, licenses tightened, opposition exiled.', read: 'The dial turned back — credibility of every future deal discounted.' },
    { when: '2025–26', what: 'Naval pressure era', result: 'US presence in the southern Caribbean; strikes on trafficking vessels; regime-change ambiguity.', read: 'Escalation optionality kept visibly priced — Gulf-refinery margins read the headlines.' },
  ] },
  { id: 'saudi', title: 'US–Saudi Arabia', today: 'The oldest transactional alliance — security for oil, renegotiated each cycle — now bidding on normalization, chips access, and a defense treaty.', arc: [
    { when: '2005–15', what: 'The petrodollar routine', result: 'Security umbrella, arms sales, coordinated oil politics.', read: 'The baseline both sides keep threatening to leave and never do.' },
    { when: '2018', what: 'Khashoggi murder', result: 'Relations crater; "pariah" rhetoric meets arms-sale reality.', read: 'Values and interests split publicly — interests won, trust didn’t recover.' },
    { when: '2022', what: 'OPEC+ cuts into a US election year', result: 'Production cut despite personal presidential lobbying.', read: 'Riyadh demonstrated the oil weapon points in every direction.' },
    { when: '2023–26', what: 'Normalization / defense-treaty / AI-chips bidding', result: 'A grand bargain (Israel ties, US treaty, chip access) perpetually near-closed, hostage to Gaza.', read: 'The IMEC switch and the alignment auction in one negotiation — the swing state naming its price.' },
  ] },
];

export function bilateralFor(id: string): BilateralArc | null {

  return US_BILATERAL.find((b) => b.id === id) ?? EXTRA_BILATERAL.find((b) => b.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Strategic-country extension — Iran, Russia, Taiwan, Mexico, Venezuela,
// Saudi Arabia join the country lens with the same treatment. They are not
// top-10 economies (so tab 15's debt/trade tables honestly exclude them);
// each gets a strategic profile, an FX story, military and route rows,
// exposure, and a US bilateral arc.
// ---------------------------------------------------------------------------

export const EXTRA_COUNTRIES = [
  { id: 'iran', name: 'Iran' },
  { id: 'russia', name: 'Russia' },
  { id: 'taiwan', name: 'Taiwan' },
  { id: 'mexico', name: 'Mexico' },
  { id: 'venezuela', name: 'Venezuela' },
  { id: 'saudi', name: 'Saudi Arabia' },
] as const;

export const EXTRA_PROFILE_SOURCE =
  'Strategic-country profiles compiled early 2026 — ILLUSTRATIVE where they run past verifiable history; verify before citing. These countries sit outside the top-10 GDP tables on tab 15, so their debt/trade rows are honestly absent here.';

export const EXTRA_COUNTRY_PROFILES: GeoExposure[] = [
  { id: 'iran', headline: 'The sanctioned oil power holding the world’s most important strait.', items: ['~90M people, huge gas/oil reserves, an economy running at a fraction of potential under layered sanctions since 1979 — the discount-barrel supplier and the Hormuz tail risk at once (the Iran flashpoint).', 'The proxy network (Hezbollah, Houthis, militias) is the delivery mechanism of its deterrence — the Red Sea shipping tax is its economics in action.', 'Domestic legitimacy strains (protests, succession questions) make its politics the region’s biggest binary.', 'Finance read: Iran prices into markets ONLY through oil and shipping — watch the barrel discount and tanker insurance, not its GDP.'] },
  { id: 'russia', headline: 'The sanctioned commodity empire that broke the dollar system’s innocence.', items: ['The 2022 invasion made it the most-sanctioned major economy ever — reserve freeze, SWIFT cutoffs, price caps — and the war economy still runs on commodity exports rerouted east at discounts.', 'The shadow fleet, yuan settlement, and gold are its workarounds — every one now standard equipment for any state fearing sanctions (the de-dollarization recruitment the sanctions flashpoint describes).', 'Military-industrial output is its growth engine now — a war-Keynesianism that hollows the civilian economy.', 'Finance read: Russia matters to your models through energy prices, the sanctions architecture, and European rearmament budgets — three channels, all on this tab.'] },
  { id: 'taiwan', headline: 'The indispensable island — the chip chokepoint wearing a flag.', items: ['~23M people producing ~90% of leading-edge logic chips (TSMC) — the highest economic-value-per-square-mile dependency in history, and the reason the Taiwan flashpoint is the market’s largest unpriced tail.', 'The "silicon shield" argument cuts both ways: indispensability deters attack AND guarantees everyone’s interest in the outcome.', 'Its overseas fabs (Arizona, Japan, Germany) thin the shield deliberately — geographic de-risking of the single point of failure.', 'Finance read: Taiwan risk trades as basis points in chip names and Korea/Japan FX — no index prices the scenario itself.'] },
  { id: 'mexico', headline: 'The nearshoring winner wired into one customer.', items: ['Now the US’s #1 goods-trade partner — the China+1 re-routing’s biggest single beneficiary, with border-state industrial parks full.', 'The USMCA review cycle and tariff threats make its access renewable, not guaranteed — Canada’s one-customer lesson applies doubly.', 'Cartel violence, judicial-reform fights, and water/energy constraints are the discount on the nearshoring premium.', 'Finance read: the peso is the market’s live vote on nearshoring vs tariff risk — strong on the boom, hit on every trade threat.'] },
  { id: 'venezuela', headline: 'The largest reserves, the smallest output — sanctions as the price dial.', items: ['World’s largest proven oil reserves producing under 1M bpd — collapsed by mismanagement first, sanctions second (the Venezuela flashpoint’s license story).', 'The migration exodus (~8M) is the hemisphere’s largest displacement — a fiscal line item for US states (FL/TX/NY on the state lens).', 'Disputed elections keep legitimacy — and therefore sanctions policy — permanently unsettled; US naval pressure keeps the coercion visible.', 'Finance read: Venezuela reaches markets through Gulf-refinery economics, diesel margins, and license headlines — the paperwork IS the price.'] },
  { id: 'saudi', headline: 'The swing producer buying its post-oil future.', items: ['OPEC+’s decisive voice: its spare capacity is the world’s oil-price shock absorber — and its production cuts are fiscal policy for everyone else’s inflation dial.', 'Vision 2030 (NEOM, tourism, sports, chips ambitions) is the biggest sovereign capital-allocation program after the BRI — funded by the barrel it is trying to outgrow.', 'It hedges everything: US security guarantees, Chinese oil demand and BRICS membership, IMEC’s middle leg — the non-aligned playbook at maximum wealth.', 'Finance read: watch its OPEC+ decisions (the inflation dial), its PIF deployments (the capital-flows story), and normalization diplomacy (the IMEC switch).'] },
];

export const EXTRA_CURRENCY_NOTES: Record<string, string> = {
  iran: 'The rial is the sanctions thermometer: collapsed from ~32k/$ (2015, JCPOA era) toward ~1M/$ on the parallel market — a ~97% loss that inflation-taxes the population while the state earns dollars from oil. Not charted on tab 15: it would flatten every other line.',
  russia: 'The ruble is managed theater: crashed on the 2022 invasion, force-stabilized by capital controls and surplus energy earnings, sliding as war spending outruns them. A price set by decree is a gauge of policy, not of markets.',
  taiwan: 'The NT dollar is a quiet strength story — chip-export surpluses hold it firm, and its dips track Taiwan-risk headlines more than economics: the closest thing to a live price on the flashpoint.',
  mexico: 'The peso is the nearshoring trade: the 2023–24 "super peso" priced the boom, then tariff threats repriced it — the cleanest currency read on US trade policy anywhere.',
  venezuela: 'The bolívar has been through hyperinflation and redenominations (14 zeros removed since 2008); the economy is informally dollarized — the end-state of the currency death spiral tab 15 teaches.',
  saudi: 'The riyal is pegged at 3.75/$ since 1986 — the peg IS the policy: it imports Fed rates wholesale, which is why Saudi fiscal policy (not monetary) does all the adjusting when oil moves.',
};


/** Combined lookups across the top-10(+Korea) rows and the strategic six. */
export const ALL_COUNTRY_EXPOSURE: GeoExposure[] = [...GEO_EXPOSURE_COUNTRIES, ...EXTRA_GEO_EXPOSURE];
export const ALL_COUNTRY_ROUTES: GeoExposure[] = [...COUNTRY_ROUTES, ...EXTRA_COUNTRY_ROUTES];
export const ALL_MILITARY: MilitaryRow[] = [...MILITARY_BALANCE, ...EXTRA_MILITARY];
export const ALL_BILATERAL: BilateralArc[] = [...US_BILATERAL, ...EXTRA_BILATERAL];
