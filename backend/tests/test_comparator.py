import pytest
from backend.sample_loader import generate_sample_dataset
from backend.ranking.hybrid_ranker import HybridCandidateRanker
from backend.explanations.comparator import CandidateComparator
from backend.models import ScoringWeights


def test_candidate_comparator_delta_and_exclusives():
    jd, candidates = generate_sample_dataset()
    ranker = HybridCandidateRanker()
    weights = ScoringWeights()
    ranked = ranker.rank_candidates(candidates, jd, weights)

    assert len(ranked) >= 2
    cand_a = ranked[0]
    cand_b = ranked[1]

    comparator = CandidateComparator()
    delta = comparator.compare_candidates(cand_a, cand_b)

    assert delta.superior_candidate_id == cand_a.candidate_id
    assert delta.score_delta >= 0.0
    assert len(delta.summary_bullets) > 0
    assert "semantic" in delta.component_deltas
    assert "required_coverage" in delta.component_deltas
