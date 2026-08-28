"""STEP 2 -- Explore the training data from Python.

What this teaches: the SQL -> Python handoff. pandas can run a SQL query and
hand you the result as a DataFrame (a table in memory):

    df = pd.read_sql("SELECT * FROM v_training_dataset", con)

Then pandas takes over for the things it does best: .describe(), .groupby(),
value_counts(). If the "average profile per best_action" table at the bottom
shows clearly different numbers per row, the dataset is learnable.

Run it:  python python/01_explore.py   (after 00_load_database.py)
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pandas as pd

KIT = Path(__file__).resolve().parents[1]
FEATURES = [
    "revenue_growth_pct", "operating_margin_pct", "debt_to_ebitda",
    "interest_rate_pct", "cash_pct_of_revenue", "market_growth_pct",
    "fragmentation_index",
]


def main() -> None:
    con = sqlite3.connect(KIT / "finmodel.db")
    try:
        df = pd.read_sql("SELECT * FROM v_training_dataset", con)
    finally:
        con.close()

    pd.set_option("display.width", 120)

    print(f"Training dataset: {len(df)} rows x {len(df.columns)} columns\n")

    print("Label balance (should be roughly even across the three actions):")
    print(df["best_action"].value_counts().to_string(), "\n")

    print("Feature ranges (.describe() = count/mean/std/min/quartiles/max):")
    print(df[FEATURES].describe().round(2).to_string(), "\n")

    print("Average profile per certified-best action -- the pattern the model")
    print("will learn. Read each row and ask: does this make business sense?")
    profile = df.groupby("best_action")[FEATURES].mean().round(2)
    print(profile.to_string())
    print("\nExpected story: PAY_DEBT rows carry the most leverage and the")
    print("highest rates; NEW_PRODUCT rows sit in the fastest markets with the")
    print("best margins; MA rows live in the most fragmented markets with cash.")
    print("\nNext step: python python/02_train_model.py")


if __name__ == "__main__":
    main()
