"""STEP 5 -- Drift check: does new data still look like training data?

A model is only as good as the resemblance between what it was trained on
and what it is scoring today. This script measures that resemblance with the
simplest defensible metric -- the mean shift of each feature, expressed in
training standard deviations:

    shift(f) = (mean_new(f) - mean_train(f)) / std_train(f)

Reading it:
    |shift| < 0.5        STABLE       normal wobble
    0.5 <= |shift| < 1.0 WATCH        note it in the run log; look next run
    |shift| >= 1.0       INVESTIGATE  stop trusting scores until a human
                                      decides: revalidate, retrain, or accept
                                      with documented rationale

(The grown-up versions of this idea are PSI -- population stability index --
and KS tests; the logic is identical: compare today's distribution to the
training distribution, and alarm on divergence. Also watch OUTPUT drift:
average confidence falling or the close-call rate rising means the model is
meeting inputs it can't separate.)

The 2022 rate spike is the canonical failure this catches: a model trained
on cheap-money years silently mis-scores an expensive-money world unless
something is watching the interest_rate distribution.

Run it:  python python/04_drift_check.py   (after 00_load_database.py)
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

KIT = Path(__file__).resolve().parents[1]
OUT = KIT / "outputs"

FEATURES = [
    "revenue_growth_pct", "operating_margin_pct", "debt_to_ebitda",
    "interest_rate_pct", "cash_pct_of_revenue", "market_growth_pct",
    "fragmentation_index",
]

WATCH_AT = 0.5
INVESTIGATE_AT = 1.0


def status_for(shift: float) -> str:
    a = abs(shift)
    return "INVESTIGATE" if a >= INVESTIGATE_AT else "WATCH" if a >= WATCH_AT else "STABLE"


def main() -> None:
    con = sqlite3.connect(KIT / "finmodel.db")
    try:
        train = pd.read_sql("SELECT * FROM v_training_dataset", con)
        new = pd.read_sql("SELECT * FROM v_new_companies", con)
    finally:
        con.close()

    rows = []
    for f in FEATURES:
        mean_train = float(train[f].mean())
        std_train = float(train[f].std())
        mean_new = float(new[f].mean())
        shift = (mean_new - mean_train) / std_train
        rows.append({
            "feature": f,
            "mean_train": round(mean_train, 3),
            "std_train": round(std_train, 3),
            "mean_new": round(mean_new, 3),
            "shift_std": round(shift, 3),
            "status": status_for(shift),
        })

    df = pd.DataFrame(rows)
    print(f"Drift check: {len(new)} new companies vs {len(train)} training rows")
    print(f"(shift in training std devs; |shift| >= {WATCH_AT} WATCH, >= {INVESTIGATE_AT} INVESTIGATE)\n")
    print(df.to_string(index=False))

    worst = max(rows, key=lambda r: abs(r["shift_std"]))
    flags = [r for r in rows if r["status"] != "STABLE"]
    print(f"\nWorst shift: {worst['feature']} at {worst['shift_std']:+.3f} std -> {worst['status']}")
    if not flags:
        print("Verdict: input distribution consistent with training -- scores remain reliable.")
    else:
        print(f"Verdict: {len(flags)} feature(s) flagged -- a human decides before the scores are used.")

    report = {
        "checked_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "method": "per-feature mean shift in training std devs",
        "thresholds": {"watch": WATCH_AT, "investigate": INVESTIGATE_AT},
        "n_train": len(train),
        "n_new": len(new),
        "features": rows,
        "flagged": [r["feature"] for r in flags],
    }
    OUT.mkdir(exist_ok=True)
    (OUT / "drift_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\nWrote outputs/drift_report.json")


if __name__ == "__main__":
    main()
