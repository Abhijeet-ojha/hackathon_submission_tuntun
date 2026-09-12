import pytest
from backend.ml.ranking.ranker import InternLoomRanker
from backend.sample_loader import generate_sample_dataset
from backend.ranking.hybrid_ranker import HybridCandidateRanker


def test_learned_ranker_feature_contributions_and_explanation():
    ranker = HybridCandidateRanker()
    jd, candidates = generate_sample_dataset()

    outputs = ranker.rank_candidates(candidates[:3], jd, ranking_mode="hybrid", alpha=0.75)

    for cand_out in outputs:
        assert cand_out.feature_contributions is not None
        assert len(cand_out.feature_contributions) == 15
        assert isinstance(cand_out.model_explanation, str)
        assert len(cand_out.model_explanation) > 10
        assert isinstance(cand_out.primary_drivers, list)
        assert isinstance(cand_out.counter_signals, list)
