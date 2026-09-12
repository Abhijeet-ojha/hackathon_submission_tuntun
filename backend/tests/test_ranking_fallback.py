import pytest
from backend.ml.ranking.ranker import InternLoomRanker


def test_ranking_fallback_when_model_missing():
    # Instantiate with non-existent path
    ranker = InternLoomRanker(model_path="non_existent_model_path.joblib")
    assert ranker.is_available() is False

    # Should still compute reasonable score using default heuristic weights
    score = ranker.predict_score({
        "required_coverage": 1.0,
        "semantic_similarity": 0.8,
        "evidence_strength": 0.9
    })
    assert 0.0 <= score <= 100.0
