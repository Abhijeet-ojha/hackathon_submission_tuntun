import pytest
from backend.ml.evidence.classifier import EvidenceClassifier
from backend.ml.ranking.ranker import InternLoomRanker


def test_offline_inference_requires_zero_network_calls(monkeypatch):
    # Simulate disabled internet connection
    def fail_socket(*args, **kwargs):
        raise ConnectionError("Simulated offline environment: Network is strictly disabled.")

    import socket
    monkeypatch.setattr(socket, "create_connection", fail_socket)

    # 1. Evidence classifier inference
    clf = EvidenceClassifier()
    pred = clf.predict("Built RESTful APIs with Node.js and Express", "Node.js")
    assert pred.tier in [1, 2, 3]

    # 2. Ranking inference
    ranker = InternLoomRanker()
    score = ranker.predict_score({
        "semantic_similarity": 0.85,
        "required_coverage": 0.90,
        "evidence_strength": 0.80
    })
    assert 0.0 <= score <= 100.0
