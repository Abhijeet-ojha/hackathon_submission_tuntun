import pytest
from backend.sample_loader import generate_sample_dataset
from backend.ranking.hybrid_ranker import HybridCandidateRanker
from backend.explanations.query_engine import RecruiterQueryEngine
from backend.models import ScoringWeights, AnalysisResponse


def test_recruiter_query_engine_why_rank_1():
    jd, candidates = generate_sample_dataset()
    ranker = HybridCandidateRanker()
    weights = ScoringWeights()
    ranked = ranker.rank_candidates(candidates, jd, weights)
    
    analysis = AnalysisResponse(
        jd=jd,
        candidates=ranked,
        weights=weights,
        total_candidates=len(ranked),
        passed_must_haves_count=len(ranked),
        average_score=80.0
    )

    engine = RecruiterQueryEngine()
    
    # Query why #1 is top
    top_cand = ranked[0]
    res = engine.process_query(f"Why is {top_cand.candidate_name} ranked first?", analysis)
    assert res["intent"] == "why_ranked"
    assert top_cand.candidate_name in res["answer"]
    assert str(top_cand.rank) in res["answer"]
    assert "Score" in res["answer"] or "score" in res["answer"]


def test_recruiter_query_engine_why_a_above_b():
    jd, candidates = generate_sample_dataset()
    ranker = HybridCandidateRanker()
    weights = ScoringWeights()
    ranked = ranker.rank_candidates(candidates, jd, weights)
    
    analysis = AnalysisResponse(
        jd=jd,
        candidates=ranked,
        weights=weights,
        total_candidates=len(ranked),
        passed_must_haves_count=len(ranked),
        average_score=80.0
    )

    engine = RecruiterQueryEngine()
    
    cand_1 = ranked[0]
    cand_2 = ranked[1]
    res = engine.process_query(f"Why is {cand_1.candidate_name} above {cand_2.candidate_name}?", analysis)
    assert res["intent"] == "why_a_above_b"
    assert cand_1.candidate_name in res["answer"]
    assert cand_2.candidate_name in res["answer"]
    assert "+" in res["answer"] or "points" in res["answer"]


def test_recruiter_query_engine_skill_search():
    jd, candidates = generate_sample_dataset()
    ranker = HybridCandidateRanker()
    weights = ScoringWeights()
    ranked = ranker.rank_candidates(candidates, jd, weights)
    
    analysis = AnalysisResponse(
        jd=jd,
        candidates=ranked,
        weights=weights,
        total_candidates=len(ranked),
        passed_must_haves_count=len(ranked),
        average_score=80.0
    )

    engine = RecruiterQueryEngine()
    
    # Search for React or Node
    res = engine.process_query("Which candidates have React?", analysis)
    assert res["intent"] == "skill_search"
    assert "react" in res["answer"].lower()
    assert len(res["candidate_refs"]) > 0


def test_recruiter_query_engine_fallback_on_unresolved():
    jd, candidates = generate_sample_dataset()
    ranker = HybridCandidateRanker()
    weights = ScoringWeights()
    ranked = ranker.rank_candidates(candidates, jd, weights)
    
    analysis = AnalysisResponse(
        jd=jd,
        candidates=ranked,
        weights=weights,
        total_candidates=len(ranked),
        passed_must_haves_count=len(ranked),
        average_score=80.0
    )

    engine = RecruiterQueryEngine()
    
    res = engine.process_query("What is the stock price of Apple today in Tokyo?", analysis)
    assert "Insufficient evidence in the current analysis." in res["answer"]
    assert res["intent"] == "unresolved"
