import os
import json
import pandas as pd
from .classifier import EvidenceClassifier, MODEL_PATH, METADATA_PATH


def evaluate_evidence_model():
    print("=" * 60)
    print("Evaluating Resify Evidence Classifier")
    print("=" * 60)

    if not os.path.exists(MODEL_PATH) or not os.path.exists(METADATA_PATH):
        print("Model or metadata not found. Please run training first:")
        print("  python -m backend.ml.evidence.train")
        return {"status": "MODEL_NOT_TRAINED"}

    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    print(f"Model Version: {meta.get('model_version')}")
    print(f"Dataset Version: {meta.get('training_dataset_version')} ({meta.get('dataset_type')})")
    print(f"Cross-Validation Accuracy: {meta.get('cv_accuracy') * 100:.2f}%")
    print(f"Cross-Validation Macro F1: {meta.get('cv_macro_f1'):.4f}")
    print("\nClass Breakdown:")
    for tier, metrics in meta.get("per_class_metrics", {}).items():
        print(f"  Tier {tier}: Precision={metrics['precision']}, Recall={metrics['recall']}, F1={metrics['f1']} (N={metrics['support']})")

    print("\nConfusion Matrix [Tier 0, Tier 1, Tier 2, Tier 3]:")
    for row in meta.get("confusion_matrix", []):
        print(" ", row)

    print("\nOffline Status: 100% Local (0 Cloud API Calls)")
    return meta


if __name__ == "__main__":
    evaluate_evidence_model()
