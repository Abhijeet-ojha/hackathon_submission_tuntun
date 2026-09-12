import os
import csv
import json
import datetime
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

from ...sample_loader import generate_sample_dataset
from ...ranking.hybrid_ranker import HybridCandidateRanker
from .features import RankingFeatureExtractor, RANKING_FEATURE_NAMES, EXCLUDED_SENSITIVE_ATTRIBUTES
from .pairwise import create_pairwise_dataset


CURRENT_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(CURRENT_DIR, "data", "ranking_seed.csv")
MODEL_PATH = os.path.join(CURRENT_DIR, "model.joblib")
METADATA_PATH = os.path.join(CURRENT_DIR, "metadata.json")


def train_ranking_model():
    print("=" * 60)
    print("Training InternLoom Learning-to-Rank Ranker (Local ML)")
    print("=" * 60)

    # 1. Generate sample candidates and rank them with deterministic engine to compute features
    jd, candidates = generate_sample_dataset()
    ranker = HybridCandidateRanker()
    scored_outputs = ranker.rank_candidates(candidates, jd)

    extractor = RankingFeatureExtractor()
    features_map = {}
    for score_out in scored_outputs:
        feat_dict = extractor.extract_features(score_out, jd)
        features_map[score_out.candidate_id] = extractor.to_vector(feat_dict)

    # 2. Load pairwise preference seed dataset
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Ranking seed data not found at {DATA_PATH}")

    df_seed = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df_seed)} pairwise preference pairs from {DATA_PATH}")

    pairs = [
        (row["candidate_a_id"], row["candidate_b_id"], int(row["preference"]))
        for _, row in df_seed.iterrows()
    ]

    # 3. Create pairwise difference vectors
    X_pair, y_pair = create_pairwise_dataset(features_map, pairs)
    print(f"Constructed {len(X_pair)} symmetrized training pairs with {X_pair.shape[1]} features.")

    # 4. Train Linear Pairwise Ranker
    # Logistic regression without intercept: P(A > B) = sigmoid(w^T (x_A - x_B))
    model = LogisticRegression(
        fit_intercept=False,
        C=2.0,
        max_iter=1000,
        random_state=42,
        solver="lbfgs"
    )
    model.fit(X_pair, y_pair)

    # Evaluate pairwise accuracy on development set
    y_pred = model.predict(X_pair)
    pairwise_acc = float(accuracy_score(y_pair, y_pred))
    print(f"Pairwise Preference Accuracy on Development Set: {pairwise_acc * 100:.2f}%")

    weights = model.coef_[0]
    print("\nLearned Feature Weights:")
    for fname, w in zip(RANKING_FEATURE_NAMES, weights):
        print(f"  {fname:<30}: {w:+.4f}")

    # 5. Save Model and Metadata
    joblib.dump(model, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")

    metadata = {
        "model_type": "Pairwise Logistic Regression (Learning-to-Rank Linear Ranker)",
        "model_version": "ranker-v1",
        "training_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "training_dataset_version": "ranking_seed_v1_development",
        "dataset_type": "DEVELOPMENT_SEED_NOT_REAL_BENCHMARK",
        "ground_truth_exists": False,
        "validation_status": "DEVELOPMENT_MODE_NO_EXTERNAL_BENCHMARK_CLAIMED",
        "sample_pairs_count": len(df_seed),
        "symmetrized_pairs_count": len(X_pair),
        "pairwise_accuracy": round(pairwise_acc, 4),
        "features_used": RANKING_FEATURE_NAMES,
        "feature_weights": {fname: round(float(w), 4) for fname, w in zip(RANKING_FEATURE_NAMES, weights)},
        "excluded_sensitive_features_audit": EXCLUDED_SENSITIVE_ATTRIBUTES,
        "offline_guarantee": "100% Local Inference (0 Network Calls)"
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to {METADATA_PATH}")

    return metadata


if __name__ == "__main__":
    train_ranking_model()
