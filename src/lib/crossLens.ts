// Cross-lens matrices — the model behind tab 19's intersection sections.
//
// The report's lenses combine: STATE × INDUSTRY (the tech industry IN
// California) and COUNTRY × INDUSTRY (autos IN Germany). Every cell carries
// a presence rating and a one-to-two-sentence read, so "California ×
// Technology" is real data, not just the two single-lens sections stapled
// together. Matrices are COMPLETE — every state and country has a cell for
// every one of the eight industries — and tests enforce it.
//
// APPROXIMATE TEACHING CHARACTERIZATIONS compiled early 2026 — presence
// ratings are judgment calls for teaching, not market-share data; verify
// specifics before citing. Education only.

export const CROSS_LENS_SOURCE =
  'APPROXIMATE TEACHING CHARACTERIZATIONS (early 2026): presence tiers are teaching judgment, not market-share data — anchor = the industry helps define the economy; significant = a real cluster; minor = present but not a driver. Verify specifics before citing.';

export type Presence = 'anchor' | 'significant' | 'minor';

export interface CrossCell {
  presence: Presence;
  note: string;
}

type IndustryRow = Record<string, CrossCell>;

const c = (presence: Presence, note: string): CrossCell => ({ presence, note });

// ---------------------------------------------------------------------------
// STATE × INDUSTRY — the ten states of the state lens × the eight industries
// ---------------------------------------------------------------------------

export const STATE_INDUSTRY: Record<string, IndustryRow> = {
  ca: {
    tech: c('anchor', 'The industry’s world capital: Silicon Valley, the AI labs, chip design (the design half of the export-control fight). California tech policy IS national tech policy.'),
    financials: c('significant', 'The venture-capital industry lives on Sand Hill Road; LA runs major asset management. Equity finance, not banking, is the local flavor.'),
    energy: c('significant', 'Large refining base and the nation’s most aggressive transition mandates at once — the state that shows both energy futures fighting.'),
    staples: c('significant', 'The Central Valley is America’s produce aisle — fruit, nuts, dairy at national scale, all hostage to water politics (tab 15’s impact watch).'),
    discretionary: c('anchor', 'Hollywood, tourism, and the LA/Long Beach import funnel for apparel and goods — the consumer economy’s content AND cargo both route here.'),
    healthcare: c('significant', 'Bay Area and San Diego biotech clusters — the venture-funded end of tab 14’s biotech economics.'),
    utilities: c('significant', 'Wildfire liability rewrote utility risk pricing nationwide (the PG&E case) — plus the data-center and electrification load fight.'),
    industrials: c('significant', 'Southern California aerospace/defense heritage plus the ports-logistics complex — the freight half of every trade headline.'),
  },
  tx: {
    tech: c('significant', 'Austin’s scene, Samsung’s fabs, and a data-center boom — tech is the state’s fastest-compounding layer, powered by cheap energy.'),
    financials: c('significant', 'HQ migration magnet (Dallas finance corridor) on the no-income-tax pitch — the sunbelt rotation’s banking beneficiary.'),
    energy: c('anchor', 'The world capital: Permian crude, Houston refining and trading, Gulf LNG. Every energy flashpoint on tab 19 prices through Texas first.'),
    staples: c('significant', 'Cattle and cotton at the top of national rankings — the ag side of the drought/water watch.'),
    discretionary: c('significant', 'Population boom retail — the consumer economy compounding with in-migration.'),
    healthcare: c('significant', 'Houston’s medical center is the world’s largest — care delivery at industrial scale.'),
    utilities: c('anchor', 'ERCOT’s islanded grid is the national test case: winter storm failures, then the data-center/AI load surge — the utilities lens live in one state.'),
    industrials: c('anchor', 'Petrochemicals, SpaceX’s Starbase, defense manufacturing — heavy industry never left, and reshoring is adding to it.'),
  },
  ny: {
    tech: c('significant', 'NYC fintech/ad-tech plus Micron’s upstate mega-fab bet — finance-adjacent tech downstate, CHIPS-Act hardware upstate.'),
    financials: c('anchor', 'Wall Street IS the industry: dollar clearing, the exchanges, the banks — the sanctions economy and the IPO window both physically live here.'),
    energy: c('minor', 'No production; the story is transition mandates and grid buildout.'),
    staples: c('minor', 'Upstate dairy is real but not a driver of the state economy.'),
    discretionary: c('anchor', 'Flagship retail, media, and tourism — the consumer-facing economy’s showcase, priced off finance bonuses and visitors.'),
    healthcare: c('significant', 'Giant hospital systems and academic medicine — healthcare as the city’s largest employer after finance.'),
    utilities: c('significant', 'Congestion pricing, transition mandates, and offshore-wind fights — energy policy as city politics.'),
    industrials: c('minor', 'Legacy upstate manufacturing; the fab construction wave is the new industrial story.'),
  },
  fl: {
    tech: c('minor', 'The Miami tech/crypto migration is real but small against the hype — finance moved faster than engineering.'),
    financials: c('significant', 'Wealth and PE migration made Miami a real money-management node — the tax-migration trade in office form.'),
    energy: c('minor', 'No production; fuel logistics and hurricane resilience are the story.'),
    staples: c('significant', 'Citrus (under greening-disease pressure — tab 15’s watch) plus cattle and winter vegetables.'),
    discretionary: c('anchor', 'Tourism at world scale: Disney, cruises, beaches — plus the retiree consumption base. The discretionary lens with a coastline.'),
    healthcare: c('anchor', 'The retiree demographic makes Florida Medicare’s capital — care demand as the state’s structural growth industry.'),
    utilities: c('significant', 'Hurricane-hardening capex and insurance-adjacent risk pricing — the climate bill arrives through the utility and the premium.'),
    industrials: c('significant', 'The Space Coast launch complex — cadence rising with the space race (tab 19’s flashpoint).'),
  },
  il: {
    tech: c('significant', 'Chicago’s B2B/logistics-tech scene — quieter than the coasts, tied to the freight economy it sits on.'),
    financials: c('anchor', 'The CME complex prices the world’s rates, grain, and volatility — derivatives are Chicago’s Wall Street.'),
    energy: c('minor', 'Little production; the nuclear fleet story sits under utilities.'),
    staples: c('anchor', 'Corn, soy, and the processing giants (ADM) — the state IS the food-commodity chain, and the trade war’s retaliation target.'),
    discretionary: c('minor', 'Big-city retail without a distinctive engine.'),
    healthcare: c('significant', 'Med-device and pharma corridor plus academic medicine.'),
    utilities: c('significant', 'The largest US nuclear fleet — suddenly strategic again as data centers hunt firm power.'),
    industrials: c('anchor', 'Caterpillar/Deere heritage machinery plus the nation’s rail hub — a third of US freight rail touches Chicago.'),
  },
  pa: {
    tech: c('minor', 'Pittsburgh robotics/CMU is a real niche — autonomy research punching above the state’s tech weight.'),
    financials: c('significant', 'Vanguard’s index-fund empire runs from the Philadelphia suburbs — trillions administered off the turnpike.'),
    energy: c('anchor', 'The Marcellus made Pennsylvania a top-two gas state — LNG-era supply politics and data-center power deals both start here.'),
    staples: c('significant', 'Hershey, dairy, and food processing — consumer staples with a company town.'),
    discretionary: c('minor', 'No distinctive consumer engine beyond the metros.'),
    healthcare: c('anchor', 'UPMC and Penn medicine anchor entire regional economies — eds-and-meds as the post-industrial model.'),
    utilities: c('significant', 'Nuclear restarts and gas plants bid up by data-center demand — the power-hunger story in one grid.'),
    industrials: c('anchor', 'Steel’s heritage state, still a specialty-metals and shipbuilding node — every tariff round is local news.'),
  },
  oh: {
    tech: c('significant', 'Intel’s New Albany fabs are the state’s tech bet — the reshoring barometer in concrete (tab 19’s state events).'),
    financials: c('significant', 'Columbus insurance cluster and regional banking — steady mid-tier financial weight.'),
    energy: c('significant', 'Utica shale gas — the quieter sibling of the Marcellus.'),
    staples: c('significant', 'Food processing across the state — the middle of the supply chain.'),
    discretionary: c('minor', 'Retail follows the population; no distinctive engine.'),
    healthcare: c('significant', 'Cleveland Clinic — a global care brand anchoring the northeast of the state.'),
    utilities: c('minor', 'Grid politics follow the fab and data-center buildout rather than lead it.'),
    industrials: c('anchor', 'The auto-supply-chain state (the EV transition’s front line) plus GE Aerospace — manufacturing is the identity.'),
  },
  ga: {
    tech: c('significant', 'Atlanta is the payments-processing capital — a huge share of US card transactions clear through Georgia fintech.'),
    financials: c('significant', 'The payments cluster IS the financial industry here — plus regional banking scale.'),
    energy: c('minor', 'No production; the utility story carries the energy weight.'),
    staples: c('anchor', 'The #1 poultry state plus peanuts and pecans — protein at national scale, avian-flu exposure included (tab 15’s watch).'),
    discretionary: c('significant', 'Delta’s hub and the film-production boom — services and content as consumer industries.'),
    healthcare: c('significant', 'The CDC and Emory make Atlanta public-health’s capital.'),
    utilities: c('significant', 'Vogtle — the first new US reactors in a generation — made Georgia the nuclear-buildout test case.'),
    industrials: c('anchor', 'The EV/battery corridor (Hyundai, SK) plus Savannah’s port logistics — the reshoring and trade-routing story in one state.'),
  },
  nj: {
    tech: c('minor', 'The exchanges’ matching engines physically sit in New Jersey data centers — finance’s hardware, if not its headquarters.'),
    financials: c('anchor', 'The buy side across the river plus those exchange data centers — Wall Street’s operational half.'),
    energy: c('minor', 'Refining legacy on the turnpike; no growth story.'),
    staples: c('significant', 'Food processing and flavors/fragrances heritage — the quiet consumer-products cluster.'),
    discretionary: c('minor', 'Retail follows the density; no engine of its own.'),
    healthcare: c('anchor', 'THE pharma headquarters state — J&J, Merck, and peers make drug pricing and supply-chain policy local industrial policy.'),
    utilities: c('minor', 'Offshore-wind fights and grid costs — policy churn without industrial weight.'),
    industrials: c('significant', 'The NY/NJ port complex and the warehouse belt behind it — the import economy’s loading dock.'),
  },
  wa: {
    tech: c('anchor', 'Microsoft and Amazon make Washington the cloud’s home state — the AI buildout’s software half is headquartered here.'),
    financials: c('minor', 'No major cluster; the wealth is equity compensation, not banking.'),
    energy: c('significant', 'Columbia River hydro = structurally cheap, clean power — the original data-center magnet.'),
    staples: c('significant', 'Apples, wheat, and salmon — export agriculture pointed at Asia.'),
    discretionary: c('significant', 'Starbucks, Costco, REI — an outsized retail-HQ cluster for a mid-size state.'),
    healthcare: c('minor', 'Fred Hutch and UW research punch above weight; care delivery is ordinary scale.'),
    utilities: c('significant', 'Hydro surplus meets AI load growth — siting, water, and tax fights are the new politics (tab 19’s state events).'),
    industrials: c('anchor', 'Boeing is the state income statement — every delivery pause and tariff retaliation lands here first.'),
  },
};

// ---------------------------------------------------------------------------
// COUNTRY × INDUSTRY — all seventeen countries of the country lens
// ---------------------------------------------------------------------------

export const COUNTRY_INDUSTRY: Record<string, IndustryRow> = {
  us: {
    tech: c('anchor', 'The platform, chip-design, and AI-model leader — the export-control regime exists to defend this position.'),
    financials: c('anchor', 'The dollar system’s operator: deepest capital markets, reserve-currency privilege, the sanctions plumbing.'),
    energy: c('anchor', 'The world’s largest oil AND gas producer — the shale revolution made energy policy foreign policy.'),
    staples: c('significant', 'Export agriculture at scale (corn, soy, beef) — the trade war’s pawn and the food-CPI base.'),
    discretionary: c('anchor', 'The world’s consumer market — everyone else’s surplus is a bet on this line.'),
    healthcare: c('anchor', 'Largest pharma/biotech complex and largest healthcare spend on earth — innovation and cost disease together.'),
    utilities: c('significant', 'The data-center load surge turned a sleepy sector strategic — interconnection queues are industrial policy now.'),
    industrials: c('significant', 'Reshoring (CHIPS/IRA) is rebuilding what offshoring hollowed — defense and aerospace never left.'),
  },
  china: {
    tech: c('anchor', 'The manufacturing half of world tech and a state-funded sprint for the chip stack the US cut off.'),
    financials: c('significant', 'Huge but closed: state banks, capital controls, CIPS rails — finance as policy instrument, not market.'),
    energy: c('significant', 'The world’s largest energy IMPORTER — the Malacca dilemma’s origin — and its largest solar/EV builder.'),
    staples: c('significant', 'Food security is state doctrine: the biggest buyer of world grain and protein (Brazil’s best customer).'),
    discretionary: c('anchor', 'The other great consumer market — and the growth math in most global brands’ decks; decoupling caps it.'),
    healthcare: c('significant', 'API and generics workshop of the world — the supply-chain-security fight’s subject.'),
    utilities: c('anchor', 'Builds more grid and generation than the rest of the world combined — electricity as five-year-plan output.'),
    industrials: c('anchor', 'The world’s factory: shipbuilding (#1), machinery, EVs, rail — overcapacity is the tariff wave’s stated cause.'),
  },
  japan: {
    tech: c('anchor', 'The chip-materials and tooling chokepoint (with the Netherlands) — quiet, indispensable, inside the export-control wall.'),
    financials: c('significant', 'Huge savings pool and the world’s largest creditor position — the yen carry trade starts here.'),
    energy: c('minor', 'Imports nearly everything — the reason sea lanes are existential (tab 19’s routes).'),
    staples: c('minor', 'Protected domestic agriculture; food security via trade deals.'),
    discretionary: c('anchor', 'Autos are the national champion industry — Toyota’s supply chain is the economy’s spine.'),
    healthcare: c('significant', 'Aging society = structural healthcare demand plus a serious pharma sector.'),
    utilities: c('significant', 'Post-Fukushima nuclear restarts are the energy-security pivot — reactor by reactor.'),
    industrials: c('anchor', 'Machinery, robotics, and precision manufacturing — the deep industrial base the defense doubling now taps.'),
  },
  germany: {
    tech: c('significant', 'SAP and industrial software plus chip fabs (TSMC Dresden) — strong B2B, weak consumer-tech.'),
    financials: c('significant', 'Frankfurt hosts the ECB; banking is mid-weight for the economy’s size.'),
    energy: c('minor', 'The post-Russia rebuild: LNG terminals and renewables replacing the cheap-gas model that died in 2022.'),
    staples: c('significant', 'Discounter retail (Aldi, Lidl) exported worldwide — staples as a business model.'),
    discretionary: c('anchor', 'The auto industry IS Germany — and the EV/China transition is its existential test (the tariff wave’s core fight).'),
    healthcare: c('significant', 'Pharma heritage (Bayer, BioNTech) and med-tech strength.'),
    utilities: c('significant', 'The Energiewende: the world’s most-watched grid transition, now colliding with industrial power prices.'),
    industrials: c('anchor', 'Machinery and Mittelstand exports built the surplus (tab 15) — rearmament is the new order book.'),
  },
  uk: {
    tech: c('significant', 'DeepMind, fintech, and a strong startup scene — AI research weight beyond the market’s size.'),
    financials: c('anchor', 'The City: FX, insurance, and shipping law — the sanctions economy’s enforcement venue (the price cap ran on UK marine insurance).'),
    energy: c('significant', 'Declining North Sea plus offshore-wind leadership — producer past, transition present.'),
    staples: c('minor', 'Import-dependent food system — Brexit’s border friction made it pricier.'),
    discretionary: c('significant', 'Premium brands and London retail/tourism — sterling-sensitive.'),
    healthcare: c('anchor', 'AstraZeneca/GSK pharma strength AND the NHS — the state itself as the healthcare system (tab 15’s watch).'),
    utilities: c('significant', 'Privatized utilities under permanent regulatory fight — water especially.'),
    industrials: c('significant', 'Rolls-Royce aero engines, defense (AUKUS work) — focused excellence rather than breadth.'),
  },
  france: {
    tech: c('significant', 'A deliberate AI push (Mistral) under the strategic-autonomy banner — Europe’s champion-building instinct.'),
    financials: c('significant', 'Paris gained post-Brexit trading floors; big banks, big asset managers.'),
    energy: c('anchor', 'The nuclear fleet: ~70% of power — the energy-security model everyone else is now copying.'),
    staples: c('anchor', 'Agriculture is political identity — the EU’s farm policy is substantially French policy; wine/dairy exports at scale.'),
    discretionary: c('anchor', 'LVMH and the luxury complex — the world’s premium-consumption champion, China-demand sensitive.'),
    healthcare: c('significant', 'Sanofi pharma plus a strong public system.'),
    utilities: c('significant', 'EDF nationalized — the state owns the energy transition directly.'),
    industrials: c('anchor', 'Airbus, Dassault, the space industry — aerospace is the industrial crown, and the fiscal lever’s beneficiary.'),
  },
  india: {
    tech: c('anchor', 'The world’s IT-services back office ascending into chips (new fabs) and its own AI push — China+1’s biggest software winner.'),
    financials: c('significant', 'A deep domestic market digitizing fast (UPI) — finance as development infrastructure.'),
    energy: c('significant', 'Massive importer buying discounted sanctioned barrels — the swing customer of the sanctions economy.'),
    staples: c('anchor', 'Agriculture employs ~40% of the country — monsoons are macro (tab 15’s impact watch), food inflation is politics.'),
    discretionary: c('significant', 'The next great consumer market compounding — every global brand’s decade bet.'),
    healthcare: c('anchor', 'The world’s generics pharmacy — API supply-chain security debates are about India and China.'),
    utilities: c('significant', 'Electrification at civilizational scale: coal still king, solar compounding fastest.'),
    industrials: c('significant', 'Make-in-India defense and rail buildout — the manufacturing push behind the corridor diplomacy.'),
  },
  italy: {
    tech: c('minor', 'No major cluster — the gap behind the demographic and debt math.'),
    financials: c('significant', 'Large banks intertwined with sovereign debt — the doom-loop lesson of the euro crisis.'),
    energy: c('significant', 'Eni’s Mediterranean and African gas diplomacy — the southern energy corridor’s builder.'),
    staples: c('anchor', 'Food IS the brand: the agrifood export machine from parmesan to prosecco.'),
    discretionary: c('anchor', 'Luxury fashion (Milan) and tourism — premium consumption as national industry.'),
    healthcare: c('significant', 'Strong pharma manufacturing base for the size.'),
    utilities: c('significant', 'Enel is a global utility giant — bigger abroad than the home market suggests.'),
    industrials: c('anchor', 'The quiet machinery power: Italy is Europe’s #2 manufacturer — the surplus in tab 15 comes from these mid-size exporters.'),
  },
  brazil: {
    tech: c('significant', 'A big fintech scene (Nubank) built on a concentrated banking legacy.'),
    financials: c('significant', 'High-real-rate banking with fintech disruption — the EM finance pattern in one market.'),
    energy: c('anchor', 'Petrobras pre-salt offshore oil plus world-leading biofuels — an energy power on two fronts.'),
    staples: c('anchor', 'THE agricultural superpower: soy, beef, coffee, sugar — China’s food security is contracted in Brazil.'),
    discretionary: c('significant', 'A large consumer market that swings with the real and rates.'),
    healthcare: c('minor', 'Universal system (SUS) with thin domestic industry.'),
    utilities: c('significant', 'Hydro-dominant grid — drought years are macro events.'),
    industrials: c('significant', 'Embraer — the third aircraft maker — plus an auto sector serving the region.'),
  },
  canada: {
    tech: c('significant', 'Toronto/Montreal AI research heritage (the deep-learning founders) with a scale-up gap to the US.'),
    financials: c('significant', 'The stable Big Five banking oligopoly plus giant pension funds (CPPIB) investing globally.'),
    energy: c('anchor', 'Oil sands, gas, and hydro — the resource half of the US relationship, hostage to pipeline politics.'),
    staples: c('significant', 'Prairie wheat and canola plus potash (the fertilizer chokepoint Russia sanctions exposed).'),
    discretionary: c('minor', 'A consumer market priced off the US cycle next door.'),
    healthcare: c('minor', 'Public system; thin domestic pharma.'),
    utilities: c('significant', 'Hydro-Québec-scale clean power — an export asset as US data centers hunt supply.'),
    industrials: c('significant', 'Auto corridor integrated with Michigan/Ohio (USMCA content rules decide it) plus aerospace (Bombardier).'),
  },
  skorea: {
    tech: c('anchor', 'Samsung and SK Hynix: the memory-chip duopoly — inside the US export-control wall while China is the biggest customer.'),
    financials: c('significant', 'Deep markets discounted for governance (the "Korea discount", tab 15’s case study).'),
    energy: c('minor', 'Imports nearly everything — the sea-lane dependence behind its route exposure.'),
    staples: c('minor', 'Import-dependent; food security via trade.'),
    discretionary: c('anchor', 'Hyundai/Kia autos plus the culture export machine (K-content) — consumer industries as national strategy.'),
    healthcare: c('significant', 'Biosimilars at world scale (Samsung Biologics, Celltrion).'),
    utilities: c('significant', 'Nuclear at home and as an EXPORT product (the UAE plants) — reactors as trade policy.'),
    industrials: c('anchor', 'The world’s #2 shipbuilder plus a top-10 arms exporter — Korea builds the ships and shells the alliance system runs on.'),
  },
  iran: {
    tech: c('minor', 'Sanctions-isolated; a domestic internet under state control.'),
    financials: c('minor', 'Cut from SWIFT — finance IS the sanctions story; hawala and crypto fill gaps.'),
    energy: c('anchor', 'Top-tier oil and gas reserves sold at a discount through the shadow fleet — the entire economy compressed into one sanctioned sector.'),
    staples: c('significant', 'Domestic agriculture under water stress — bread prices are regime-stability variables.'),
    discretionary: c('minor', 'Import-starved consumer market; the rial’s collapse is the price tag.'),
    healthcare: c('minor', 'Sanctions carve-outs exist on paper; supply is chronically short.'),
    utilities: c('significant', 'Gas-rich but blackout-prone — underinvestment even in its abundance.'),
    industrials: c('significant', 'The drone/missile complex — its real export industry (Russia the customer), and the proxy war’s arsenal.'),
  },
  russia: {
    tech: c('minor', 'Talent exodus and import bans — a domestic-substitute stack under sanctions.'),
    financials: c('minor', 'Sanctioned, SWIFT-cut, capital-controlled — finance as a war-management tool.'),
    energy: c('anchor', 'The commodity empire: oil/gas/coal rerouted east at discounts — the war’s funding source and the price cap’s target.'),
    staples: c('anchor', 'The world’s #1 wheat exporter — grain as diplomacy across Africa and the Middle East.'),
    discretionary: c('minor', 'Western brands gone; parallel imports and Chinese substitutes fill shelves.'),
    healthcare: c('minor', 'Import-dependent for advanced care; sanctions bite unevenly.'),
    utilities: c('significant', 'Rosatom builds reactors worldwide — the nuclear-export lever sanctions have not touched.'),
    industrials: c('anchor', 'A war economy: artillery-scale defense production is the growth sector, crowding out everything civilian.'),
  },
  taiwan: {
    tech: c('anchor', 'TSMC: ~90% of leading-edge logic — the single most concentrated industrial dependency on earth, and the flashpoint’s core.'),
    financials: c('significant', 'A large insurance/savings pool famous for buying US bonds — Taiwan money moves Treasury markets.'),
    energy: c('minor', 'Imports ~97% of energy — the blockade-vulnerability number that matters most.'),
    staples: c('minor', 'Import-dependent; weeks of food inventory is a defense-planning metric.'),
    discretionary: c('minor', 'A prosperous but small consumer market.'),
    healthcare: c('significant', 'Single-payer system studied worldwide; strong med-tech niche.'),
    utilities: c('significant', 'The grid is the strategic weak point: nuclear phase-out debates vs the fabs’ bottomless power demand.'),
    industrials: c('significant', 'The electronics-assembly and precision-machinery ecosystem around the fabs.'),
  },
  mexico: {
    tech: c('minor', 'Guadalajara assembles electronics; software is nascent — the China+1 tech migration is hardware-first.'),
    financials: c('significant', 'Remittances (~$60B/yr) are a top FX earner — finance as family infrastructure.'),
    energy: c('significant', 'Pemex: state oil nationalism with heavy debt — the investment-climate bellwether.'),
    staples: c('significant', 'Avocados to beer: the US produce-and-beverage supplier (tariffs literally price guacamole).'),
    discretionary: c('significant', 'A big young consumer market riding the nearshoring wage boom.'),
    healthcare: c('minor', 'Thin domestic industry; medical-device assembly in the border zone.'),
    utilities: c('significant', 'Grid and water constraints are the binding limit on the nearshoring boom — the factories arrived before the power.'),
    industrials: c('anchor', 'The nearshoring anchor: autos and electronics for the US market — #1 trade partner status is built on these plants.'),
  },
  venezuela: {
    tech: c('minor', 'Collapsed infrastructure; talent left in the exodus.'),
    financials: c('minor', 'Hyperinflation dollarized the economy informally — the bolívar is the cautionary tale.'),
    energy: c('anchor', 'The largest reserves on earth producing a trickle — the license-swing flashpoint IS the economy.'),
    staples: c('minor', 'Import-dependent after farm collapse; food scarcity drove the exodus.'),
    discretionary: c('minor', 'A dollarized informal retail layer serves those with remittances.'),
    healthcare: c('minor', 'System collapse — a humanitarian metric, not an industry.'),
    utilities: c('minor', 'Chronic blackouts — the Guri dam’s failures halt the whole country.'),
    industrials: c('minor', 'Idle capacity; reactivation is a post-sanctions scenario, not a present industry.'),
  },
  saudi: {
    tech: c('significant', 'Buying its way in: PIF-funded AI/data-center ambitions and the bid for US chip access — compute as the next oil.'),
    financials: c('anchor', 'The PIF (~$900B+) is the market-moving sovereign investor — Saudi allocation decisions ripple through venture, sports, and equities.'),
    energy: c('anchor', 'Aramco and the spare capacity that makes it THE swing producer — OPEC+ decisions are its fiscal policy and everyone’s inflation input.'),
    staples: c('minor', 'Desert agriculture is a water decision; food security is bought abroad (farmland investments).'),
    discretionary: c('significant', 'Vision 2030 tourism/entertainment buildout (NEOM, sports) — consumption as diversification strategy.'),
    healthcare: c('minor', 'Importing systems and expertise as the population grows.'),
    utilities: c('significant', 'Building solar at giga-scale to burn less oil at home — every barrel saved is a barrel exported.'),
    industrials: c('significant', 'Localizing defense production (the offset demands) and petrochemicals downstream of the crude.'),
  },
};

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

const FALLBACK: CrossCell = { presence: 'minor', note: 'No cell authored — treat as not a driver.' };

export function stateIndustryCell(stateId: string, industryId: string): CrossCell {
  return STATE_INDUSTRY[stateId]?.[industryId] ?? FALLBACK;
}

export function countryIndustryCell(countryId: string, industryId: string): CrossCell {
  return COUNTRY_INDUSTRY[countryId]?.[industryId] ?? FALLBACK;
}

/** Presence of one industry across every state (for the comparison strip). */
export function industryAcrossStates(industryId: string): { id: string; presence: Presence }[] {
  return Object.entries(STATE_INDUSTRY).map(([id, row]) => ({ id, presence: row[industryId]?.presence ?? 'minor' }));
}

/** Presence of one industry across every country (for the comparison strip). */
export function industryAcrossCountries(industryId: string): { id: string; presence: Presence }[] {
  return Object.entries(COUNTRY_INDUSTRY).map(([id, row]) => ({ id, presence: row[industryId]?.presence ?? 'minor' }));
}

// ---------------------------------------------------------------------------
// STATE × COUNTRY — each state's strongest foreign-country relationships,
// authored; everything else gets an honest computed fallback. And the
// three-way TRIANGLE (state × country × industry) as a deterministic
// composition of the authored cells.
// ---------------------------------------------------------------------------

import { ALL_COUNTRY_EXPOSURE, GEO_EXPOSURE_STATES } from './geoPolitics';

/** Authored pairs: each state's three most meaningful country relationships. */
export const STATE_COUNTRY: Record<string, Record<string, string>> = {
  ca: {
    china: 'The front line of the trade relationship: LA/Long Beach is China’s main US gateway, so every tariff round reprices California port volumes, warehouse jobs, and retail costs first — while Bay Area tech and Chinese talent/capital ties face the screening regime.',
    mexico: 'A border economy in its own right: produce, autos, and cross-border manufacturing through Calexico/Otay — plus shared water politics (the Colorado) that farm both economies.',
    japan: 'Deep tech-and-auto investment ties (Toyota’s US research, gaming/entertainment capital) and the trans-Pacific shipping lane both economies depend on.',
  },
  tx: {
    mexico: 'THE bilateral state-country pair in America: Laredo is the #1 US port of entry, and the Texas–Mexico border economy (autos, electronics, energy) is what "nearshoring" physically looks like.',
    china: 'Electronics imports through Texas ports and the data-center supply chain — plus Chinese demand setting the price of the crude Texas exports.',
    saudi: 'Motiva in Port Arthur — the largest US refinery — is Saudi-owned: Gulf crude runs through Texas steel. OPEC+ decisions are Permian P&L.',
  },
  ny: {
    uk: 'The London–New York axis IS global finance: the two clearing hubs, the sanctions-enforcement twins, the listing-venue rivals — one industry, two time zones.',
    china: 'Chinese listings, delisting fights, and capital-markets access are negotiated in New York — the financial front of the decoupling.',
    india: 'The IT-services and diaspora corridor to Wall Street — India’s services surplus lands substantially in New York’s back and middle offices.',
  },
  fl: {
    brazil: 'Miami is Latin America’s financial capital — Brazilian wealth, trade finance, and real-estate capital flow through Florida; when the real slides, Miami feels it.',
    venezuela: 'The exile capital: Venezuelan migration, remittances, and politics are Florida domestic issues — the sanctions flashpoint with a local ballot impact.',
    canada: 'The snowbird economy: Canadian tourism and property ownership are a seasonal GDP line — priced in Canadian dollars (tab 15’s CAD slide is a Florida demand story).',
  },
  il: {
    china: 'The retaliation target: Illinois soy was the trade war’s designated victim in 2018 and stays first in line every round — the CME prices the damage in real time.',
    mexico: 'Chicago is the USMCA rail hub — the corridor’s freight interchanges here, making Mexican nearshoring an Illinois rail story.',
    canada: 'Rail and energy integration: Canadian crude and grain move through Chicago’s interchange — the quiet northern half of its freight economy.',
  },
  pa: {
    germany: 'Industrial kinship and competition: specialty steel and machinery on both sides — German mills are the benchmark Pennsylvania’s fight to modernize is measured against.',
    canada: 'Energy integration: Marcellus gas and the northeastern grid interconnect with Ontario/Québec — one power market in practice.',
    china: 'Steel is the story: every Section-232 tariff round and every overcapacity fight lands on Pennsylvania mills first.',
  },
  oh: {
    japan: 'Honda’s Ohio anchor (since 1982) made the state the proof that foreign investment rebuilds industrial economies — the model the Intel bet now repeats with chips.',
    china: 'The supply-chain rewiring state: Intel’s fabs exist BECAUSE of the China chip fight — Ohio is where de-risking gets built.',
    germany: 'Auto-supplier crossholdings: the German Tier-1s (Bosch, ZF) thread through Ohio’s auto corridor — the EV transition strains both ends.',
  },
  ga: {
    skorea: 'THE state-country pair of the reshoring era: Hyundai’s Metaplant and SK’s battery plants made Georgia the physical home of Korea’s "China+1" hedge — Korean industrial policy with Georgia zip codes.',
    germany: 'Porsche’s North American HQ and a German manufacturing cluster — the quieter European half of Georgia’s investment story.',
    china: 'Savannah’s boom is partly trade rerouting — East Coast share gains as importers diversify from West Coast/China exposure.',
  },
  nj: {
    india: 'The pharma-and-diaspora corridor: Indian generics firms’ US operations and one of the largest Indian-American communities — the API supply-chain debate is a New Jersey employment question.',
    germany: 'Pharma and chemicals kinship — the German giants’ US arms sit in the NJ corridor.',
    china: 'The import gateway: NY/NJ port volumes and the warehouse belt price the tariff rounds into East Coast logistics.',
  },
  wa: {
    china: 'Boeing’s historically biggest customer and its designated retaliation target — every trade round puts Washington aerospace jobs on the table; cloud/AI export rules hit the other flagship.',
    japan: 'Aerospace supply partnership: Japanese heavy industry builds Boeing wings — the alliance in industrial form.',
    canada: 'The Cascadia corridor: softwood-lumber disputes, cross-border energy, and Vancouver–Seattle tech commuting — friction and integration at once.',
  },
};

export interface StateCountryRead {
  authored: boolean;
  text: string;
}

export function stateCountryRead(stateId: string, countryId: string, stateName: string, countryName: string): StateCountryRead {
  const authored = STATE_COUNTRY[stateId]?.[countryId];
  if (authored) return { authored: true, text: authored };
  const st = GEO_EXPOSURE_STATES.find((x) => x.id === stateId);
  const co = ALL_COUNTRY_EXPOSURE.find((x) => x.id === countryId);
  return {
    authored: false,
    text: `No authored pair cell for ${stateName} × ${countryName} yet — the link runs through the national channels (tariffs, rates, the flashpoints) rather than a distinctive bilateral cluster. Frame it from the two sides: ${stateName} — ${st?.headline ?? ''} ${countryName} — ${co?.headline ?? ''}`,
  };
}

/** The three-way read: deterministic composition of the two industry cells + the pair. */
export interface TriangleRead {
  stateCell: CrossCell;
  countryCell: CrossCell;
  verdict: string;
}

export function triangleRead(stateId: string, countryId: string, industryId: string, stateName: string, countryName: string, industryName: string): TriangleRead {
  const sc = stateIndustryCell(stateId, industryId);
  const cc = countryIndustryCell(countryId, industryId);
  const rank: Record<Presence, number> = { anchor: 2, significant: 1, minor: 0 };
  const a = rank[sc.presence];
  const b = rank[cc.presence];
  let verdict: string;
  if (a === 2 && b === 2) {
    verdict = `${industryName} is an ANCHOR on both sides — ${stateName} × ${countryName} is one of this industry’s strongest real-economy links: supply chains, investment, and tariff exposure all run through this triangle.`;
  } else if (a + b >= 3) {
    const strong = a > b ? stateName : countryName;
    verdict = `A strong link with a heavier side: ${strong} carries the anchor weight in ${industryName}, the other side a real cluster — the flows in this triangle mostly run toward ${strong}’s hub.`;
  } else if (a + b === 2) {
    verdict = `A working link, not a defining one: ${industryName} is present on both sides of ${stateName} × ${countryName}, but the relationship’s center of gravity is in other industries — check the pair read above for where.`;
  } else if (a + b === 1) {
    verdict = `A thin link: ${industryName} barely registers on one side of this triangle — macro channels (the dials, tariffs, rates) will matter more here than any direct industry tie.`;
  } else {
    verdict = `${industryName} is minor on BOTH sides of ${stateName} × ${countryName} — this triangle moves through national channels only. An honest empty cell is itself information: not every combination has a story.`;
  }
  return { stateCell: sc, countryCell: cc, verdict };
}
