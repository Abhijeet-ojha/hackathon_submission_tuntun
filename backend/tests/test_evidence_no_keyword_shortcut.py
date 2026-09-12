import pytest
from backend.ml.evidence.classifier import EvidenceClassifier


def test_evidence_no_keyword_shortcut_on_bare_lists():
    classifier = EvidenceClassifier()

    # Even with multiple high-profile tech keywords, a bare list must NOT jump to Tier 2 or Tier 3
    p = classifier.predict("Technical Skills: Python, React, Docker, Kubernetes, AWS, PostgreSQL", "Python")
    assert p.tier == 1
    assert p.label == "mentioned"

    p2 = classifier.predict("Languages: Java, C++, TypeScript, Go, Rust", "Java")
    assert p2.tier == 1
