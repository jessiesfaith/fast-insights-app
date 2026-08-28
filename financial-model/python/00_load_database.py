"""STEP 1 -- Load the CSVs into a SQLite database (finmodel.db).

What this teaches: how raw certified files become a QUERYABLE database.
    1. Run the DDL (sql/01_create_tables.sql) to create empty tables.
    2. Bulk-load each CSV into its table with pandas .to_sql().
    3. Run the view scripts (sql/03 + 04) so the feature views exist.

After this runs you can open finmodel.db in "DB Browser for SQLite" (free,
sqlitebrowser.org) and run every query in sql/02_explore.sql yourself.

Run it:  python python/00_load_database.py
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pandas as pd

KIT = Path(__file__).resolve().parents[1]     # .../financial-model
DB_PATH = KIT / "finmodel.db"

# table name -> CSV file that fills it
LOADS = {
    "companies": "companies.csv",
    "financials": "financials.csv",
    "market_conditions": "market_conditions.csv",
    "certified_outcomes": "certified_outcomes.csv",
}


def main() -> None:
    if DB_PATH.exists():
        DB_PATH.unlink()                       # rebuild from scratch each run
        print(f"Removed old {DB_PATH.name} (rebuilding fresh).")

    con = sqlite3.connect(DB_PATH)
    try:
        # 1. Tables from the DDL script.
        con.executescript((KIT / "sql" / "01_create_tables.sql").read_text(encoding="utf-8"))
        print("Created tables from sql/01_create_tables.sql")

        # 2. CSV -> table. pandas matches columns by name.
        for table, csv_name in LOADS.items():
            df = pd.read_csv(KIT / "data" / csv_name)
            df.to_sql(table, con, if_exists="append", index=False)
            print(f"  loaded {csv_name:24s} -> {table:20s} {len(df):4d} rows")

        # 3. Feature views (training + inference).
        con.executescript((KIT / "sql" / "03_training_dataset.sql").read_text(encoding="utf-8"))
        con.executescript((KIT / "sql" / "04_inference_dataset.sql").read_text(encoding="utf-8"))
        print("Created views v_training_dataset and v_new_companies")

        # Sanity check the row counts the rest of the pipeline expects.
        n_train = con.execute("SELECT COUNT(*) FROM v_training_dataset").fetchone()[0]
        n_new = con.execute("SELECT COUNT(*) FROM v_new_companies").fetchone()[0]
        print(f"Check: v_training_dataset={n_train} rows (expect 240), "
              f"v_new_companies={n_new} rows (expect 12)")
    finally:
        con.close()

    print(f"Done. Database at {DB_PATH}")
    print("Next step: python python/01_explore.py")


if __name__ == "__main__":
    main()
