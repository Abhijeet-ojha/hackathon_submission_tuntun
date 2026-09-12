import pytest
from backend.ml.evidence.classifier import EvidenceClassifier


def test_evidence_numeric_false_positives():
    classifier = EvidenceClassifier()

    # "team of 5" has a number, but is NOT a measurable performance outcome -> must NOT be Tier 3
    p = classifier.predict("Collaborated on a team of 5 software engineers to build features", "Agile")
    assert p.tier < 3

    # "3 group projects" has a number, but no performance outcome -> must NOT be Tier 3
    p2 = classifier.predict("Completed 3 group projects during sophomore year using Python", "Python")
    assert p2.tier < 3

