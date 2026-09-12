import pytest
from backend.ml.ranking.features import RankingFeatureExtractor, RANKING_FEATURE_NAMES
from backend.sample_loader import generate_sample_dataset
from backend.ranking.hybrid_ranker import HybridCandidateRanker


def test_ranking_feature_schema_and_bounds():
    extractor = RankingFeatureExtractor()
    assert len(extractor.get_feature_names()) == 15

    jd, candidates = generate_sample_dataset()
    ranker = HybridCandidateRanker()
    outputs = ranker.rank_candidates(candidates[:3], jd)

    for cand_out in outputs:
        features = extractor.extract_features(cand_out, jd)
        assert len(features) == 15
        for fname, val in features.items():
            assert fname in RANKING_FEATURE_NAMES
            assert 0.0 <= val <= 1.0, f"Feature {fname} has value {val} outside [0.0, 1.0]"
