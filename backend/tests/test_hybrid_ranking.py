import pytest
from backend.sample_loader import generate_sample_dataset
from backend.ranking.hybrid_ranker import HybridCandidateRanker


def test_hybrid_ranking_modes_and_alpha():
    ranker = HybridCandidateRanker()
    jd, candidates = generate_sample_dataset()

    res_det = ranker.rank_candidates(candidates[:5], jd, ranking_mode="deterministic")
    res_learned = ranker.rank_candidates(candidates[:5], jd, ranking_mode="learned")
    res_hybrid = ranker.rank_candidates(candidates[:5], jd, ranking_mode="hybrid", alpha=0.50)

    assert len(res_det) == len(res_learned) == len(res_hybrid) == 5

    for c in res_hybrid:
        assert c.deterministic_score is not None
        assert c.learned_score is not None
        # Check hybrid math: 0.50 * det + 0.50 * learned
        expected = round((0.50 * c.deterministic_score) + (0.50 * c.learned_score), 2)
        assert abs(c.final_score - expected) <= 0.05
