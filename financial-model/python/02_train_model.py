"""STEP 3 -- Train, test, validate, and (maybe) approve the model.

This is the whole DEVELOPMENT/TRAINING side of the pipeline diagram:

    Training dataset -> PYTHON CODE -> ML ALGORITHM -> TRAIN
        -> TRAINED MODEL v1.0 -> TEST -> VALIDATE -> APPROVE

The algorithm is multinomial LOGISTIC REGRESSION -- the simplest serious
classifier. It learns one weight per (feature, action). Positive weight =
that feature pushes the model TOWARD that action. Because the features are
standardized first (StandardScaler), the weights are comparable to each other,
so you can read the model like a table.

Governance (the part your audit brain will like):
    * The TEST set (25% of rows) is held out and never seen during training --
      test accuracy is the honest estimate of real-world performance.
    * A written VALIDATION GATE decides approval: test accuracy >= 80% AND
      every class's recall >= 70%. Pass -> the model card says APPROVED and
      inference is allowed to run. Fail -> REJECTED, and 03_inference.py
      will refuse to score anything.
    * Everything about the run is written to outputs/model_card_v1.json --
      the model's audit trail.

Run it:  python python/02_train_model.py   (after 00_load_database.py)
"""

from __future__ import annotations

import json
import pickle
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

KIT = Path(__file__).resolve().parents[1]
OUT = KIT / "outputs"

MODEL_VERSION = "1.0"
RANDOM_STATE = 42          # fixed seed -> the same split & model every run
TEST_SIZE = 0.25           # hold out 25% of rows for honest testing

# The validation gate. Written down BEFORE looking at results -- that's the point.
GATE_MIN_TEST_ACCURACY = 0.80
GATE_MIN_CLASS_RECALL = 0.70

FEATURES = [
    "revenue_growth_pct", "operating_margin_pct", "debt_to_ebitda",
    "interest_rate_pct", "cash_pct_of_revenue", "market_growth_pct",
    "fragmentation_index",
]
LABEL = "best_action"


def main() -> None:
    # ---- load the training dataset straight from the SQL view -------------
    con = sqlite3.connect(KIT / "finmodel.db")
    try:
        df = pd.read_sql("SELECT * FROM v_training_dataset", con)
    finally:
        con.close()
    X, y = df[FEATURES], df[LABEL]
    print(f"Loaded v_training_dataset: {len(df)} rows, {len(FEATURES)} features")

    # ---- split: TRAIN (learn) vs TEST (grade honestly) --------------------
    # stratify=y keeps the three actions in the same proportion in both halves.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y)
    print(f"Split: {len(X_train)} training rows / {len(X_test)} held-out test rows")

    # ---- TRAIN ------------------------------------------------------------
    # Pipeline = StandardScaler (put every feature on the same scale) then
    # LogisticRegression (learn one weight per feature per action).
    model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000))
    model.fit(X_train, y_train)

    # ---- TEST -------------------------------------------------------------
    train_acc = accuracy_score(y_train, model.predict(X_train))
    test_pred = model.predict(X_test)
    test_acc = accuracy_score(y_test, test_pred)
    report = classification_report(y_test, test_pred, output_dict=True)
    classes = list(model.classes_)
    cm = confusion_matrix(y_test, test_pred, labels=classes).tolist()

    print(f"\nTRAIN accuracy: {train_acc:.1%}   TEST accuracy: {test_acc:.1%}")
    print("(similar numbers = not overfitting; a big drop on TEST = memorized noise)\n")
    print(classification_report(y_test, test_pred))

    # ---- read the model like a table --------------------------------------
    # Weights are on the standardized scale: "+1.2 on debt_to_ebitda for
    # PAY_DEBT" means high leverage pushes strongly toward paying debt.
    lr: LogisticRegression = model.named_steps["logisticregression"]
    coefficients = {
        cls: {feat: round(float(w), 3) for feat, w in zip(FEATURES, lr.coef_[i])}
        for i, cls in enumerate(classes)
    }
    print("Learned weights (per action, standardized scale):")
    print(pd.DataFrame(coefficients).round(2).to_string())

    # ---- VALIDATE against the written gate --------------------------------
    recalls = {cls: report[cls]["recall"] for cls in classes}
    passed = test_acc >= GATE_MIN_TEST_ACCURACY and min(recalls.values()) >= GATE_MIN_CLASS_RECALL
    status = "APPROVED" if passed else "REJECTED"
    print(f"\nVALIDATION GATE: test accuracy >= {GATE_MIN_TEST_ACCURACY:.0%} "
          f"and every recall >= {GATE_MIN_CLASS_RECALL:.0%}  ->  {status}")

    # ---- write the audit trail: model card + the model itself -------------
    OUT.mkdir(exist_ok=True)
    card = {
        "model_version": MODEL_VERSION,
        "status": status,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "algorithm": "StandardScaler + multinomial LogisticRegression (scikit-learn)",
        "training_view": "v_training_dataset",
        "features": FEATURES,
        "label": LABEL,
        "rows": {"train": len(X_train), "test": len(X_test)},
        "random_state": RANDOM_STATE,
        "metrics": {
            "train_accuracy": round(train_acc, 4),
            "test_accuracy": round(test_acc, 4),
            "per_class": {
                cls: {k: round(report[cls][k], 4) for k in ("precision", "recall", "f1-score")}
                for cls in classes
            },
            "confusion_matrix": {"labels": classes, "rows_true_cols_pred": cm},
        },
        "validation_gate": {
            "min_test_accuracy": GATE_MIN_TEST_ACCURACY,
            "min_class_recall": GATE_MIN_CLASS_RECALL,
            "passed": passed,
        },
        "coefficients_standardized": coefficients,
        "note": ("Synthetic teaching dataset. In a real ICFR-style process a "
                 "named human owner reviews this card and signs the approval."),
    }
    card_path = OUT / "model_card_v1.json"
    card_path.write_text(json.dumps(card, indent=2), encoding="utf-8")
    with (OUT / "model_v1.pkl").open("wb") as fh:
        pickle.dump(model, fh)

    print(f"Wrote {card_path.relative_to(KIT)} and outputs/model_v1.pkl")
    if passed:
        print("Next step: python python/03_inference.py")
    else:
        print("Model REJECTED -- fix data/features and retrain before inference.")


if __name__ == "__main__":
    main()
