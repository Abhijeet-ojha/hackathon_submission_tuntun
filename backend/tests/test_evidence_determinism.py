import pytest
from backend.ml.evidence.classifier import EvidenceClassifier


def test_evidence_classifier_is_100_percent_deterministic():
    classifier = EvidenceClassifier()
    text = "Engineered automated microservices processing 100,000+ uploads per minute in Python"
    req = "Python"

    pred1 = classifier.predict(text, req)
    pred2 = classifier.predict(text, req)
    pred3 = classifier.predict(text, req)

    assert pred1.tier == pred2.tier == pred3.tier
    assert pred1.confidence == pred2.confidence == pred3.confidence
    assert pred1.probabilities == pred2.probabilities == pred3.probabilities
