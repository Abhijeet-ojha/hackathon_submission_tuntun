from typing import Optional, List, Tuple, Dict, Any
from .ranker import InternLoomRanker, LearnedRankResult
from .features import RankingFeatureExtractor


_global_ranker: Optional[InternLoomRanker] = None


def get_learned_ranker() -> InternLoomRanker:
    """Returns singleton instance of InternLoomRanker."""
    global _global_ranker
    if _global_ranker is None:
        _global_ranker = InternLoomRanker()
    return _global_ranker


def rescore_with_learned_ranker(
    candidates_with_features: List[Tuple[Any, Dict[str, float]]],
    mode: str = "hybrid",
    alpha: float = 0.75
) -> List[LearnedRankResult]:
    """Ranks candidates using the learned ranker with hybrid blending."""
    ranker = get_learned_ranker()
    return ranker.rank_candidates(candidates_with_features, mode=mode, alpha=alpha)
