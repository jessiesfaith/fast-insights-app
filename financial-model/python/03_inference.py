"""STEP 4 -- PRODUCTION: score the new companies with the approved model.

This is the whole PRODUCTION/USE side of the pipeline diagram:

    New data -> SQL (v_new_companies) -> Approved ML model -> INFERENCE
        -> Probability / Forecast -> PREDICTION TABLE -> Power BI / Excel

Governance first: the script reads outputs/model_card_v1.json and REFUSES to
run unless status == APPROVED. An unapproved model never touches production.

The output is the prediction table -- one row per new company with the
probability of each action and the recommended (highest-probability) action.
It is written two ways, because the diagram forks two ways:
    outputs/prediction_table.csv   -> what Excel / Power BI import
    table `predictions` in finmodel.db -> what a BI tool would query directly

Run it:  python python/03_inference.py   (after 02_train_model.py)
"""

from __future__ import annotations

import json
import pickle
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

KIT = Path(__file__).resolve().parents[1]
OUT = KIT / "outputs"


def main() -> None:
    # ---- governance gate: only an APPROVED model may score real data ------
    card = json.loads((OUT / "model_card_v1.json").read_text(encoding="utf-8"))
    if card["status"] != "APPROVED":
        raise SystemExit(f"Model v{card['model_version']} status is {card['status']} "
                         "-- refusing to run inference. Retrain and pass the gate first.")
    print(f"Model v{card['model_version']} is APPROVED "
          f"(test accuracy {card['metrics']['test_accuracy']:.1%}) -- proceeding.")

    with (OUT / "model_v1.pkl").open("rb") as fh:
        model = pickle.load(fh)
    features: list[str] = card["features"]

    # ---- New data -> SQL: the production view, same features as training --
    con = sqlite3.connect(KIT / "finmodel.db")
    try:
        new = pd.read_sql("SELECT * FROM v_new_companies", con)
        print(f"Scoring {len(new)} new companies from v_new_companies...")

        # ---- INFERENCE: probabilities, not just answers -------------------
        # predict_proba returns one probability per action per company,
        # summing to 1.0 across each row.
        proba = model.predict_proba(new[features])
        classes = list(model.classes_)

        table = new[["company_id", "company_name", "sector"] + features].copy()
        for i, cls in enumerate(classes):
            table[f"p_{cls.lower()}"] = proba[:, i].round(3)
        table["recommended_action"] = [classes[row.argmax()] for row in proba]
        table["confidence"] = proba.max(axis=1).round(3)
        table["model_version"] = card["model_version"]
        table["scored_at_utc"] = datetime.now(timezone.utc).isoformat(timespec="seconds")

        # ---- PREDICTION TABLE: CSV for Excel/Power BI, table for SQL ------
        csv_path = OUT / "prediction_table.csv"
        table.to_csv(csv_path, index=False)
        table.to_sql("predictions", con, if_exists="replace", index=False)
        print(f"Wrote {csv_path.relative_to(KIT)} and table `predictions` in finmodel.db\n")
    finally:
        con.close()

    show = table[["company_id", "company_name", "recommended_action", "confidence"]]
    print(show.to_string(index=False))
    print("\nDone. Open prediction_table.csv in Excel, or point Power BI at it.")


if __name__ == "__main__":
    main()
