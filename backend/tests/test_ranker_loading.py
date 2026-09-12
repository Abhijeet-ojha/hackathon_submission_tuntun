import pytest
from backend.ml.ranking.ranker import InternLoomRanker


def test_learned_ranker_loads_successfully():
    ranker = InternLoomRanker()
    assert ranker.is_available() is True
    assert ranker.model is not None
    assert ranker.model_version == "ranker-v1"
    assert len(ranker.feature_weights) == 15
