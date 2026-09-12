import pytest
from backend.ml.evidence.classifier import EvidenceClassifier, EvidencePrediction


def test_evidence_prediction_schema():
    classifier = EvidenceClassifier()
    pred = classifier.predict(
        evidence_text="Optimized PostgreSQL queries reducing latency by 45%",
        requirement="PostgreSQL"
    )

    assert isinstance(pred, EvidencePrediction)
    assert pred.tier in [0, 1, 2, 3]
    assert pred.label in ["absent", "mentioned", "demonstrated", "measurable_impact"]
    assert 0.0 <= pred.confidence <= 1.0
    assert isinstance(pred.probabilities, dict)
    assert len(pred.probabilities) == 4
    prob_sum = sum(pred.probabilities.values())
    assert 0.98 <= prob_sum <= 1.02
    assert len(pred.reason) > 5
    assert pred.is_rule_validated is True
    assert pred.status == "MODEL_AVAILABLE"
