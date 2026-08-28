"""STEP 0 -- Generate the certified historical dataset (synthetic, seeded).

This script creates the raw CSV files the rest of the pipeline consumes:

    data/companies.csv           240 historical companies + 12 new companies
    data/financials.csv          one row per company: the fiscal year they faced
                                 the "where does the next $10M go?" decision
    data/market_conditions.csv   sector x year market backdrop
    data/certified_outcomes.csv  the LABELS: with 3 years of hindsight, a review
                                 panel certified which move was right (historical
                                 companies only -- new companies have no outcome yet)

Everything is synthetic and built for learning, but the economics are real:

    PAY_DEBT     tends to win when leverage (debt / EBITDA) and interest rates
                 are high -- the guaranteed "return" of retiring expensive debt
                 beats risky growth spending.
    NEW_PRODUCT  tends to win when the company's market is growing fast and its
                 margins are strong -- operating leverage on a rising tide.
    MA           (M&A) tends to win when the company itself is growing slowly but
                 has cash, and its market is FRAGMENTED (lots of small players to
                 buy) -- growth is cheaper to acquire than to build.

The random seed is fixed (42) so every run produces byte-identical CSVs.
Run it:  python data/generate_dataset.py
"""

from __future__ import annotations

import csv
import random
from pathlib import Path

HERE = Path(__file__).resolve().parent  # .../financial-model/data
SEED = 42

ACTIONS = ("NEW_PRODUCT", "MA", "PAY_DEBT")

# ---------------------------------------------------------------------------
# Sector profiles: average market growth (%/yr), fragmentation (0..1, higher =
# more small competitors available to acquire), and typical operating margin.
# ---------------------------------------------------------------------------
SECTORS = {
    "Software & SaaS":      {"growth": 8.0, "frag": 0.35, "margin": 18.0},
    "Healthcare Services":  {"growth": 5.0, "frag": 0.62, "margin": 12.0},
    "Business Services":    {"growth": 3.5, "frag": 0.66, "margin": 13.0},
    "Consumer Products":    {"growth": 2.5, "frag": 0.55, "margin": 10.0},
    "Industrial Equipment": {"growth": 2.0, "frag": 0.45, "margin": 11.0},
    "Specialty Retail":     {"growth": 1.5, "frag": 0.50, "margin": 6.0},
}

# Base borrowing rate by fiscal year (roughly tracks the real rate cycle:
# cheap money 2015-2021, expensive money 2022+, still-elevated 2025).
BASE_RATE = {2015: 3.2, 2016: 3.0, 2017: 3.3, 2018: 3.9, 2019: 3.7,
             2020: 3.0, 2021: 2.8, 2022: 5.6, 2025: 5.1}

HISTORICAL_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022]
NEW_YEAR = 2025          # the year our NEW companies face the decision
N_HISTORICAL = 240

# One-off market shocks by year (added to every sector's growth that year).
YEAR_SHOCK = {2020: -3.0, 2021: 2.0}

CERTIFIERS = ["M. Alvarez, CFA", "D. Chen, CPA", "R. Okafor, CFA"]

NAME_FIRST = ["Cascade", "Bluepine", "Harborline", "Summit", "Ironwood", "Redrock",
              "Lakeshore", "Granite", "Silverbirch", "Northgate", "Clearwater", "Oakfield",
              "Stonebridge", "Westwind", "Copperleaf", "Brightpath", "Fairhaven", "Longview",
              "Kingsport", "Maplecrest", "Riverbend", "Highland", "Seabrook", "Pinnacle",
              "Amberton", "Foxglove", "Greenfield", "Hartwell", "Juniper", "Kestrel"]
NAME_SECOND = {
    "Software & SaaS":      ["Systems", "Software", "Analytics", "Cloudworks", "Digital", "Platforms"],
    "Healthcare Services":  ["Health", "Care Group", "Medical", "Clinics", "Diagnostics", "Wellness"],
    "Business Services":    ["Partners", "Consulting", "Staffing", "Logistics", "Outsourcing", "Advisory"],
    "Consumer Products":    ["Foods", "Brands", "Beverage Co", "Home Goods", "Apparel", "Provisions"],
    "Industrial Equipment": ["Manufacturing", "Machinery", "Tooling", "Fabrication", "Controls", "Industrial"],
    "Specialty Retail":     ["Retail", "Outfitters", "Stores", "Trading Co", "Supply", "Mercantile"],
}


def round1(x: float) -> float:
    return round(x + 1e-9, 1)


def make_market_conditions(rng: random.Random) -> dict[tuple[str, int], dict]:
    """One row per (sector, year), for historical years AND the new-data year."""
    out: dict[tuple[str, int], dict] = {}
    for sector, prof in SECTORS.items():
        for fy in HISTORICAL_YEARS + [NEW_YEAR]:
            growth = prof["growth"] + YEAR_SHOCK.get(fy, 0.0) + rng.gauss(0, 1.2)
            frag = min(0.90, max(0.15, rng.gauss(prof["frag"], 0.07)))
            out[(sector, fy)] = {
                "sector": sector,
                "fy": fy,
                "market_growth_pct": round1(growth),
                "fragmentation_index": round(frag, 2),
            }
    return out


def label_scores(f: dict, mkt: dict, rng: random.Random) -> dict[str, float]:
    """The 'hidden truth' the ML model will try to learn.

    Each action gets an attractiveness score from the company's numbers, plus
    noise so the pattern is strong but not perfect (like real life).
    """
    d2e = min(f["debt_m"] / f["ebitda_m"], 8.0)          # debt-to-EBITDA, capped
    cash_pct = 100.0 * f["cash_m"] / f["revenue_m"]       # cash as % of revenue

    # Each term is centered on the dataset-wide average of that metric, so a
    # perfectly average company scores ~0 on all three actions and the label
    # is decided by what makes the company UNUSUAL.
    s_debt = (0.75 * (d2e - 3.75)
              + 0.50 * (f["interest_rate_pct"] - 6.3)
              - 0.05 * (cash_pct - 15)
              + rng.gauss(0, 0.9))
    s_prod = (0.50 * (mkt["market_growth_pct"] - 3.8)
              + 0.15 * (f["operating_margin_pct"] - 12.4)
              + 0.10 * (f["revenue_growth_pct"] - 3.8)
              - 0.35 * (d2e - 3.75)
              + rng.gauss(0, 0.9))
    s_ma = (9.0 * (mkt["fragmentation_index"] - 0.50)
            + 0.10 * (cash_pct - 15)
            - 0.12 * (f["revenue_growth_pct"] - 3.8)
            - 0.30 * (d2e - 3.75)
            + 0.15 * (mkt["market_growth_pct"] - 3.8)
            + rng.gauss(0, 0.9))
    return {"NEW_PRODUCT": s_prod, "MA": s_ma, "PAY_DEBT": s_debt}


def make_financials(company_id: str, sector: str, fy: int, rng: random.Random) -> dict:
    prof = SECTORS[sector]
    revenue = min(900.0, max(15.0, rng.lognormvariate(4.8, 0.7)))
    margin = min(35.0, max(2.0, rng.gauss(prof["margin"], 5.0)))
    ebitda = max(1.0, revenue * (margin + 4.5) / 100.0)   # EBITDA adds back ~4.5pts of D&A
    debt = revenue * rng.uniform(0.05, 1.10)
    cash = revenue * rng.uniform(0.02, 0.28)
    lev_premium = 0.6 * max(0.0, debt / ebitda - 3.0)     # lenders charge more at high leverage
    rate = min(12.0, max(2.5, BASE_RATE[fy] + rng.uniform(0.5, 3.0) + lev_premium))
    growth = rng.gauss(0, 4.0)                            # idiosyncratic part, market added later
    return {
        "company_id": company_id,
        "fy": fy,
        "revenue_m": round1(revenue),
        "revenue_growth_pct": growth,                     # finalized after market join
        "operating_margin_pct": round1(margin),
        "ebitda_m": round1(ebitda),
        "debt_m": round1(debt),
        "cash_m": round1(cash),
        "interest_rate_pct": round(rate, 2),
    }


# ---------------------------------------------------------------------------
# The 12 NEW companies (fiscal 2025) are hand-written, not random, so the
# production-side walkthrough in the app tells a stable story. N001 is "your"
# company. No certified outcome exists for these -- that is the whole point:
# the trained model scores them.
#   fields: name, sector, revenue, growth, margin, ebitda, debt, cash, rate
# ---------------------------------------------------------------------------
NEW_COMPANIES = [
    ("N001", "NorthPine Holdings",      "Consumer Products",    180.0,  2.1, 11.5, 28.8, 121.0, 14.5, 7.10),
    ("N002", "Veldt Software",          "Software & SaaS",      95.0, 14.8, 21.0, 24.2,  12.0, 22.0, 5.90),
    ("N003", "Quarry Industrial",       "Industrial Equipment", 310.0,  1.2, 10.0, 45.0, 265.0, 18.0, 8.40),
    ("N004", "Bristlecone Health",      "Healthcare Services",  140.0,  4.0, 12.5, 23.8,  35.0, 33.0, 5.60),
    ("N005", "Copperline Staffing",     "Business Services",     75.0,  2.5, 13.0, 13.1,  15.0, 19.0, 5.70),
    ("N006", "Aster & Vine Retail",     "Specialty Retail",     220.0,  0.8,  5.5, 22.0, 190.0,  9.0, 8.90),
    ("N007", "Helix Diagnostics",       "Healthcare Services",   60.0,  9.5, 15.0, 11.7,  10.0,  8.0, 5.80),
    ("N008", "Foundry Cloudworks",      "Software & SaaS",      130.0, 11.0, 17.5, 28.6,  95.0, 11.0, 7.60),
    ("N009", "Meridian Provisions",     "Consumer Products",     88.0,  1.5,  9.0, 11.9,  20.0, 21.0, 5.50),
    ("N010", "Atlas Advisory Group",    "Business Services",    150.0,  3.0, 14.0, 27.8,  40.0, 36.0, 5.60),
    ("N011", "Ridgeway Fabrication",    "Industrial Equipment",  55.0,  2.0, 12.0,  9.1,  30.0,  4.0, 7.20),
    ("N012", "Lumen Home Goods",        "Consumer Products",    240.0,  5.5, 13.5, 43.2,  70.0, 30.0, 6.10),
]


def write_csv(path: Path, header: list[str], rows: list[list]) -> None:
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        w.writerows(rows)
    print(f"  wrote {path.name}  ({len(rows)} rows)")


def main() -> None:
    rng = random.Random(SEED)
    market = make_market_conditions(rng)

    companies: list[list] = []
    financials: list[list] = []
    outcomes: list[list] = []

    used_names: set[str] = set()
    for i in range(N_HISTORICAL):
        cid = f"C{i + 1:03d}"
        sector = rng.choice(list(SECTORS))
        fy = rng.choice(HISTORICAL_YEARS)

        # Distinct, plausible name.
        while True:
            name = f"{rng.choice(NAME_FIRST)} {rng.choice(NAME_SECOND[sector])}"
            if name not in used_names:
                used_names.add(name)
                break

        fin = make_financials(cid, sector, fy, rng)
        mkt = market[(sector, fy)]
        # Company growth = market growth + idiosyncratic component.
        fin["revenue_growth_pct"] = round1(mkt["market_growth_pct"] + fin["revenue_growth_pct"])

        scores = label_scores(fin, mkt, rng)
        best = max(scores, key=lambda a: scores[a])

        # Managers picked the best move ~75% of the time; when they did, the
        # 3-year ROI was clearly better. That gap is what makes the label real.
        if rng.random() < 0.75:
            taken = best
            roi = rng.gauss(18.0, 5.0)
        else:
            taken = rng.choice([a for a in ACTIONS if a != best])
            roi = rng.gauss(6.0, 5.0)

        companies.append([cid, name, sector])
        financials.append([fin["company_id"], fin["fy"], fin["revenue_m"], fin["revenue_growth_pct"],
                           fin["operating_margin_pct"], fin["ebitda_m"], fin["debt_m"], fin["cash_m"],
                           fin["interest_rate_pct"]])
        outcomes.append([cid, taken, round1(roi), best,
                         CERTIFIERS[i % len(CERTIFIERS)], f"{fy + 3}-12-15"])

    # New companies: same tables, fiscal 2025, no outcome row.
    for (cid, name, sector, rev, growth, margin, ebitda, debt, cash, rate) in NEW_COMPANIES:
        companies.append([cid, name, sector])
        financials.append([cid, NEW_YEAR, rev, growth, margin, ebitda, debt, cash, rate])

    market_rows = [[m["sector"], m["fy"], m["market_growth_pct"], m["fragmentation_index"]]
                   for m in market.values()]

    print("Generating synthetic certified dataset (seed=42)...")
    write_csv(HERE / "companies.csv",
              ["company_id", "company_name", "sector"], companies)
    write_csv(HERE / "financials.csv",
              ["company_id", "fy", "revenue_m", "revenue_growth_pct", "operating_margin_pct",
               "ebitda_m", "debt_m", "cash_m", "interest_rate_pct"], financials)
    write_csv(HERE / "market_conditions.csv",
              ["sector", "fy", "market_growth_pct", "fragmentation_index"], market_rows)
    write_csv(HERE / "certified_outcomes.csv",
              ["company_id", "action_taken", "roi_3yr_pct", "best_action",
               "certified_by", "certified_date"], outcomes)

    counts = {a: sum(1 for o in outcomes if o[3] == a) for a in ACTIONS}
    print(f"  label balance: {counts}")
    print("Done. Next step: python python/00_load_database.py")


if __name__ == "__main__":
    main()
