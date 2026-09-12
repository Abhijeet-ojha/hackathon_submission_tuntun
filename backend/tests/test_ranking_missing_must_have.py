import pytest
from backend.ml.ranking.ranker import InternLoomRanker
from backend.sample_loader import generate_sample_dataset
from backend.ranking.hybrid_ranker import HybridCandidateRanker


def test_learned_ranker_penalizes_missing_must_haves():
    ranker = HybridCandidateRanker()
    jd, candidates = generate_sample_dataset()

    outputs = ranker.rank_candidates(candidates, jd, ranking_mode="learned")

    # Candidate 1 (Alex Rivera) has 100% must-have coverage
    # Candidate 6 (Jordan Lee) is keyword stuffer
    # Candidate 13 is negative bleed
    alex = next(c for c in outputs if c.candidate_id == "cand_01")
    jordan = next(c for c in outputs if c.candidate_id == "cand_06")

    assert alex.rank < jordan.rank
    assert alex.learned_score > jordan.learned_score
