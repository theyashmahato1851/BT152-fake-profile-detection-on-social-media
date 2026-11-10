"""
Multi-Platform Fake Profile Detection — Training Script (X, Instagram, Facebook)
================================================================================
Trains an ensemble Random Forest classifier on 3,000 verified multi-platform
social media accounts across X (Twitter), Instagram, and Facebook.

Outputs saved to artifacts/:
    fake_profile_model.joblib  — Trained multi-platform scikit-learn pipeline
    metrics.json               — Comprehensive accuracy, ROC-AUC, per-platform telemetry
    feature_importance.json    — Gini MDI importance ranking across all attributes
"""

from pathlib import Path
import json
import joblib
import numpy as np
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
from sklearn.preprocessing import OneHotEncoder

BASE = Path(__file__).resolve().parent
DATASET_PATH = BASE / "dataset_archive" / "fake_social_media_global.csv"
ARTIFACTS = BASE / "artifacts"

NUMERIC_FEATURES = [
    "followers",
    "following",
    "posts",
    "follower_following_ratio",
    "has_profile_pic",
    "verified",
    "bio_length",
    "suspicious_links_in_bio",
    "username_randomness",
    "account_age_days",
    "posts_per_day",
    "caption_similarity_score",
    "content_similarity_score",
    "follow_unfollow_rate",
    "spam_comments_rate",
    "generic_comment_rate",
    "username_length",
    "digits_count",
    "digit_ratio",
    "special_char_count",
]

CATEGORICAL_FEATURES = ["platform"]
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def train():
    print("=" * 65)
    print("  Training Multi-Platform Fake Profile Detection Model")
    print("  Dataset: X (Twitter), Instagram, and Facebook Profiles")
    print("=" * 65)

    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    df = df.dropna(subset=["is_fake"])
    df["is_fake"] = df["is_fake"].astype(int)

    X = df[ALL_FEATURES]
    y = df["is_fake"]

    # 75/25 stratified train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    # Scikit-learn Pipeline with median numerical imputation & One-Hot Encoding for platform
    preprocessor = ColumnTransformer(
        [
            ("num", SimpleImputer(strategy="median"), NUMERIC_FEATURES),
            (
                "cat",
                Pipeline(
                    [
                        ("impute", SimpleImputer(strategy="constant", fill_value="Generic")),
                        ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
                    ]
                ),
                CATEGORICAL_FEATURES,
            ),
        ]
    )

    pipeline = Pipeline(
        [
            ("prep", preprocessor),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=400,
                    max_depth=16,
                    min_samples_leaf=1,
                    class_weight="balanced",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])

    # Per-platform breakdown
    platform_breakdown = {}
    for plat in ["X", "Instagram", "Facebook"]:
        mask = X_test["platform"] == plat
        if mask.sum() > 0:
            plat_acc = accuracy_score(y_test[mask], pipeline.predict(X_test[mask]))
            platform_breakdown[plat] = {
                "accuracy": round(float(plat_acc), 4),
                "count": int(mask.sum()),
            }

    # Extract feature importances
    rf = pipeline.named_steps["classifier"]
    encoded_cat_names = list(
        pipeline.named_steps["prep"]
        .named_transformers_["cat"]
        .named_steps["ohe"]
        .get_feature_names_out(CATEGORICAL_FEATURES)
    )
    feature_names = NUMERIC_FEATURES + encoded_cat_names
    importances = dict(
        zip(feature_names, [round(float(v), 4) for v in rf.feature_importances_])
    )

    # Save artifacts
    ARTIFACTS.mkdir(exist_ok=True)
    joblib.dump(pipeline, ARTIFACTS / "fake_profile_model.joblib")

    metrics = {
        "dataset_name": "Multi-Platform Social Media Dataset (X, Instagram, Facebook)",
        "dataset_size": len(df),
        "real_profiles": int((y == 0).sum()),
        "fake_profiles": int((y == 1).sum()),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(auc), 4),
        "confusion_matrix": cm.tolist(),
        "platform_accuracy": platform_breakdown,
        "labels": {"0": "authentic", "1": "fake"},
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "random_state": 42,
    }

    (ARTIFACTS / "metrics.json").write_text(json.dumps(metrics, indent=2))
    (ARTIFACTS / "feature_importance.json").write_text(json.dumps(importances, indent=2))

    print(f"Overall Accuracy:  {acc:.2%}")
    print(f"Precision:         {prec:.2%}")
    print(f"Recall:            {rec:.2%}")
    print(f"F1-Score:          {f1:.2%}")
    print(f"ROC-AUC:           {auc:.4f}")
    print("\nPer-Platform Accuracy on Unseen Test Partition:")
    for plat, p_data in platform_breakdown.items():
        print(f"  - {plat:<12}: {p_data['accuracy']:.2%} ({p_data['count']} profiles)")
    print("\nTop 5 Most Discriminative Features:")
    for feat, imp in sorted(importances.items(), key=lambda x: -x[1])[:5]:
        print(f"  - {feat:<28} {imp:.4f}")
    print(f"\nArtifacts saved to {ARTIFACTS}")


if __name__ == "__main__":
    train()
