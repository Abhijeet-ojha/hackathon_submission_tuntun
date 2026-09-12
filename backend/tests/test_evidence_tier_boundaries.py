import pytest
from backend.ml.evidence.classifier import EvidenceClassifier


def test_evidence_tier_boundaries():
    classifier = EvidenceClassifier()

    # Tier 0: Completely unrelated / empty
    p0 = classifier.predict("Hobby: playing basketball on weekends", "Python")
    assert p0.tier == 0

    # Tier 1: Mentioned keyword
    p1 = classifier.predict("Skills: Python, React, PostgreSQL, Docker", "Python")
    assert p1.tier == 1

    # Tier 2: Demonstrated project without quantified metrics
    p2 = classifier.predict("Developed a full-stack web application using FastAPI and React", "FastAPI")
    assert p2.tier == 2

    # Tier 3: Quantified impact metrics
    p3 = classifier.predict("Optimized PostgreSQL queries, reducing p99 API latency by 65% for 100,000 active users", "PostgreSQL")
    assert p3.tier == 3
