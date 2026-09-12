import pytest
from backend.sample_loader import generate_sample_dataset
from backend.ranking.hybrid_ranker import HybridCandidateRanker


def test_ablation_proves_both_signals_are_load_bearing():
    ranker = HybridCandidateRanker()
    jd, candidates = generate_sample_dataset()

    # Filter out corrupted/empty candidates for clean ablation check
    valid_candidates = [c for c in candidates if c.parsing_status == "success"]

    ablation_result = ranker.compute_ablation(valid_candidates, jd)

    # 1. Proves divergence
    assert ablation_result["is_divergent"] is True

    kw_order = [c["candidate_id"] for c in ablation_result["keyword_only"]]
    sem_order = [c["candidate_id"] for c in ablation_result["semantic_only"]]
    hybrid_order = [c["candidate_id"] for c in ablation_result["hybrid"]]

    # 2. At least one pair of orderings must differ
    assert (kw_order != sem_order) or (kw_order != hybrid_order) or (sem_order != hybrid_order)
