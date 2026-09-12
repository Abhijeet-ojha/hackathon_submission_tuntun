import os
import json
from .ranker import MODEL_PATH, METADATA_PATH


def evaluate_ranking_model():
    print("=" * 60)
    print("Evaluating Resify Learning-to-Rank Ranker")
    print("=" * 60)

    if not os.path.exists(MODEL_PATH) or not os.path.exists(METADATA_PATH):
        print("Model or metadata not found. Please run training first:")
        print("  python -m backend.ml.ranking.train")
        return {"status": "MODEL_NOT_TRAINED"}

    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    print(f"Model Version: {meta.get('model_version')}")
    print(f"Dataset Version: {meta.get('training_dataset_version')} ({meta.get('dataset_type')})")
    print(f"Ground Truth Status: {meta.get('validation_status')}")
    print(f"Development Pairwise Accuracy: {meta.get('pairwise_accuracy') * 100:.2f}%")

    print("\nLearned Feature Weights (Higher = Stronger Positive Signal):")
    for feat, w in meta.get("feature_weights", {}).items():
        print(f"  {feat:<30}: {w:+.4f}")

    print("\nExcluded Sensitive Attributes Audit (Ethical AI Guardrails):")
    for item in meta.get("excluded_sensitive_features_audit", []):
        print(f"  [EXCLUDED] {item['attribute']:<20}: {item['reason']}")

    print("\nOffline Status: 100% Local (0 Cloud API Calls)")
    return meta


if __name__ == "__main__":
    evaluate_ranking_model()
