import os
import csv
import json
import datetime
import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold, cross_val_predict
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support, confusion_matrix

from .features import build_evidence_feature_union, EvidenceFeatureExtractor


CURRENT_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(CURRENT_DIR, "data", "evidence_seed.csv")
MODEL_PATH = os.path.join(CURRENT_DIR, "model.joblib")
METADATA_PATH = os.path.join(CURRENT_DIR, "metadata.json")


def load_dataset(path: str = DATA_PATH):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Evidence dataset not found at {path}")
    df = pd.read_csv(path)
    return df


def train_evidence_model():
    print("=" * 60)
    print("Training Resify Evidence Classifier (Local ML)")
    print("=" * 60)

    df = load_dataset()
    print(f"Loaded {len(df)} training examples from {DATA_PATH}")

    X = [{"text": row["text"], "requirement": row["requirement"]} for _, row in df.iterrows()]
    y = df["tier"].values.astype(int)
    groups = df["group_id"].values

    # Check minimum dataset size requirement
    if len(df) < 20:
        print("[Warning] Development dataset too small for reliable generalization estimates.")
        data_status = "INSUFFICIENT_DATA"
    else:
        data_status = "MODEL_AVAILABLE"

    # Build Pipeline
    pipeline = Pipeline([
        ("features", build_evidence_feature_union()),
        ("clf", LogisticRegression(
            C=3.0,
            class_weight="balanced",
            max_iter=1000,
            random_state=42,
            solver="lbfgs"
        ))
    ])

    # Group-aware Cross-Validation to evaluate generalization
    n_splits = min(4, len(np.unique(groups)))
    gkf = GroupKFold(n_splits=n_splits)

    print(f"Running {n_splits}-fold GroupKFold cross-validation...")
    y_pred_cv = cross_val_predict(pipeline, X, y, cv=gkf, groups=groups)

    cv_accuracy = float(accuracy_score(y, y_pred_cv))
    cv_macro_f1 = float(f1_score(y, y_pred_cv, average="macro"))

    p, r, f1, s = precision_recall_fscore_support(y, y_pred_cv, labels=[0, 1, 2, 3], zero_division=0)
    cm = confusion_matrix(y, y_pred_cv, labels=[0, 1, 2, 3])

    print(f"CV Accuracy: {cv_accuracy * 100:.2f}%")
    print(f"CV Macro F1: {cv_macro_f1:.4f}")
    print("Per-class F1 scores:")
    for tier, f in enumerate(f1):
        print(f"  Tier {tier}: F1 = {f:.4f} (Support = {s[tier]})")

    # Fit final model on all data
    pipeline.fit(X, y)

    # Save model binary
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

    # Build and save metadata
    metadata = {
        "model_type": "LogisticRegression (TF-IDF + Char N-Grams + Dense NLP Features)",
        "model_version": "evidence-v1",
        "training_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "training_dataset_version": "evidence_seed_v1_development",
        "dataset_type": "DEVELOPMENT_SEED_NOT_REAL_BENCHMARK",
        "sample_count": len(df),
        "class_distribution": {str(t): int(c) for t, c in zip(*np.unique(y, return_counts=True))},
        "cv_folds": n_splits,
        "cv_accuracy": round(cv_accuracy, 4),
        "cv_macro_f1": round(cv_macro_f1, 4),
        "per_class_metrics": {
            str(tier): {
                "precision": round(float(p[tier]), 4),
                "recall": round(float(r[tier]), 4),
                "f1": round(float(f1[tier]), 4),
                "support": int(s[tier])
            } for tier in range(4)
        },
        "confusion_matrix": cm.tolist(),
        "status": data_status,
        "offline_guarantee": "100% Local Inference (0 Network Calls)"
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to {METADATA_PATH}")

    return metadata


if __name__ == "__main__":
    train_evidence_model()
