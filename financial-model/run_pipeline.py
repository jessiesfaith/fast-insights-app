"""Run the whole pipeline end-to-end, in order. This is the script a
scheduler (Windows Task Scheduler / cron) would call on a schedule.

    STEP 0  data/generate_dataset.py    make the certified CSVs (seeded)
    STEP 1  python/00_load_database.py  CSVs -> finmodel.db + feature views
    STEP 2  python/01_explore.py        sanity-check the training data
    STEP 3  python/02_train_model.py    train -> test -> validate -> approve
    STEP 4  python/03_inference.py      score new companies -> prediction table
    STEP 5  python/04_drift_check.py    do new inputs still look like training?

Each step is the same file you run by hand while learning -- the orchestrator
just chains them and stops on the first failure (a failed step exits non-zero,
so a scheduler shows the run as failed instead of silently continuing).

Run it:  python run_pipeline.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

KIT = Path(__file__).resolve().parent

STEPS = [
    "data/generate_dataset.py",
    "python/00_load_database.py",
    "python/01_explore.py",
    "python/02_train_model.py",
    "python/03_inference.py",
    "python/04_drift_check.py",
]


def main() -> None:
    for step in STEPS:
        print(f"\n{'=' * 66}\nRUNNING {step}\n{'=' * 66}")
        result = subprocess.run([sys.executable, str(KIT / step)], cwd=KIT)
        if result.returncode != 0:
            print(f"\nPIPELINE STOPPED: {step} exited with code {result.returncode}")
            sys.exit(result.returncode)
    print(f"\n{'=' * 66}\nPIPELINE COMPLETE -- see outputs/prediction_table.csv\n{'=' * 66}")


if __name__ == "__main__":
    main()
