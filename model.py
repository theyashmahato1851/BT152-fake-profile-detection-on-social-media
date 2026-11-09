"""
Fake Twitter/X Profile Detection — Model Training Script
=========================================================
Trains a Random Forest classifier on labelled Twitter account metadata.

Usage:
    python model.py

Outputs saved to artifacts/:
    fake_profile_model.joblib  — trained sklearn pipeline
    metrics.json               — accuracy, precision, recall, F1, confusion matrix
    feature_importance.json    — per-feature importance scores
"""

from pathlib import Path
import json

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE = Path(__file__).resolve().parent
ARTIFACTS = BASE / "artifacts"

# The 5 numeric columns extracted directly from the CSV
NUMERIC_FIELDS = [
    "statuses_count",
    "followers_count",
    "friends_count",
    "favourites_count",
    "listed_count",
]

# 2 binary features engineered from text columns
BINARY_FIELDS = ["has_url", "has_time_zone"]

# All features fed to the model
FEATURES = NUMERIC_FIELDS + BINARY_FIELDS


# ---------------------------------------------------------------------------
# Feature engineering
# ---------------------------------------------------------------------------
def _is_present(series: pd.Series) -> pd.Series:
    """Return 1 where a string column has a real value, 0 otherwise."""
    normalized = series.fillna("").astype(str).str.strip().str.lower()
    return (~normalized.isin(["", "nan", "none", "null"])).astype(int)


def prepare_dataset(csv_path: Path, label: int) -> pd.DataFrame:
    """
    Read a raw CSV and return a DataFrame with the 7 model features + label.

    Parameters
    ----------
    csv_path : Path
        Path to ``real_twitter_accounts.csv`` or ``fake_twitter_accounts.csv``.
    label : int
        0 for real accounts, 1 for fake accounts.
    """
    raw = pd.read_csv(csv_path)

    # Keep the 5 numeric columns, coercing bad values to NaN
    data = raw[NUMERIC_FIELDS].apply(pd.to_numeric, errors="coerce")

    # Engineer binary features
    data["has_url"] = _is_present(raw["url"])
    data["has_time_zone"] = _is_present(raw["time_zone"])

    data["label"] = label
    return data


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------
def train() -> None:
    """Train the model and save artefacts."""

    # 1. Load and merge datasets  ── labels: 0 = real, 1 = fake
    real = prepare_dataset(BASE / "real_twitter_accounts.csv", label=0)
    fake = prepare_dataset(BASE / "fake_twitter_accounts.csv", label=1)
    data = pd.concat([real, fake], ignore_index=True)

    X = data[FEATURES]
    y = data["label"]

    # 2. Stratified 75/25 split  (random_state for reproducibility)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    # 3. Build a scikit-learn Pipeline
    #    Step 1 — SimpleImputer fills NaN with column median
    #    Step 2 — Random Forest (300 trees, balanced class weights)
    pipeline = Pipeline(
        [
            (
                "preprocessor",
                ColumnTransformer(
                    [("numeric", SimpleImputer(strategy="median"), FEATURES)]
                ),
            ),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=300,
                    min_samples_leaf=2,
                    class_weight="balanced",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    pipeline.fit(X_train, y_train)

    # 4. Evaluate on the held-out test set
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])

    # 5. Feature importance from the Random Forest
    rf = pipeline.named_steps["classifier"]
    importances = dict(zip(FEATURES, [round(float(v), 4) for v in rf.feature_importances_]))

    # 6. Save everything
    ARTIFACTS.mkdir(exist_ok=True)

    joblib.dump(pipeline, ARTIFACTS / "fake_profile_model.joblib")

    metrics = {
        "dataset_size": len(data),
        "real_profiles": int((y == 0).sum()),
        "fake_profiles": int((y == 1).sum()),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc), 4),
        "confusion_matrix": cm.tolist(),
        "labels": {"0": "real", "1": "fake"},
        "features": FEATURES,
        "random_state": 42,
    }
    (ARTIFACTS / "metrics.json").write_text(json.dumps(metrics, indent=2))
    (ARTIFACTS / "feature_importance.json").write_text(json.dumps(importances, indent=2))

    # 7. Print summary
    print("=" * 55)
    print("  Fake Profile Detection — Training Complete")
    print("=" * 55)
    print(f"  Dataset     : {metrics['dataset_size']:,} profiles "
          f"({metrics['real_profiles']:,} real / {metrics['fake_profiles']:,} fake)")
    print(f"  Train / Test: {metrics['train_size']:,} / {metrics['test_size']:,}")
    print(f"  Accuracy    : {acc:.2%}")
    print(f"  Precision   : {prec:.2%}")
    print(f"  Recall      : {rec:.2%}")
    print(f"  F1 Score    : {f1:.2%}")
    print(f"  ROC-AUC     : {roc:.4f}")
    print()
    print("  Confusion Matrix (rows=actual, cols=predicted):")
    print(f"                Pred Real  Pred Fake")
    print(f"  Actual Real   {cm[0][0]:>9}  {cm[0][1]:>9}")
    print(f"  Actual Fake   {cm[1][0]:>9}  {cm[1][1]:>9}")
    print()
    print("  Feature Importance:")
    for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
        print(f"    {feat:<20s} {imp:.4f}")
    print()
    print(f"  Saved -> {ARTIFACTS / 'fake_profile_model.joblib'}")
    print(f"  Saved -> {ARTIFACTS / 'metrics.json'}")
    print(f"  Saved -> {ARTIFACTS / 'feature_importance.json'}")
    print("=" * 55)


if __name__ == "__main__":
    train()
