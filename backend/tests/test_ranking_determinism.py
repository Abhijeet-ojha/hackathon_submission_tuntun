import pytest
from backend.sample_loader import generate_sample_dataset
from backend.ranking.hybrid_ranker import HybridCandidateRanker
from backend.models import ScoringWeights


def test_ranking_is_100_percent_deterministic():
    jd, candidates = generate_sample_dataset()
    ranker = HybridCandidateRanker()
    weights = ScoringWeights()

    run_1 = ranker.rank_candidates(candidates, jd, weights)
    run_2 = ranker.rank_candidates(candidates, jd, weights)

    assert len(run_1) == len(run_2)
    for c1, c2 in zip(run_1, run_2):
        assert c1.candidate_id == c2.candidate_id
        assert c1.rank == c2.rank
        assert c1.final_score == c2.final_score
        assert c1.components.semantic == c2.components.semantic
        assert c1.components.keyword == c2.components.keyword
        assert c1.components.required_coverage == c2.components.required_coverage
        assert c1.components.evidence_strength == c2.components.evidence_strength


def test_score_components_are_strictly_bounded_0_to_100():
    jd, candidates = generate_sample_dataset()
    ranker = HybridCandidateRanker()
    weights = ScoringWeights()

    ranked = ranker.rank_candidates(candidates, jd, weights)

    for c in ranked:
        assert 0.0 <= c.final_score <= 100.0, f"Score out of bounds for {c.candidate_name}: {c.final_score}"
        assert 0.0 <= c.components.semantic <= 100.0
        assert 0.0 <= c.components.keyword <= 100.0
        assert 0.0 <= c.components.required_coverage <= 100.0
        assert 0.0 <= c.components.preferred_coverage <= 100.0
        assert 0.0 <= c.components.evidence_strength <= 100.0
        assert 0.0 <= c.components.experience_relevance <= 100.0
        assert 0.0 <= c.components.education_fit <= 100.0
