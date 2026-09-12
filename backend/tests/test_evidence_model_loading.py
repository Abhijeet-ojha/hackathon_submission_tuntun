import pytest
from backend.ml.evidence.classifier import EvidenceClassifier, MODEL_PATH, METADATA_PATH


def test_evidence_model_loads_successfully():
    classifier = EvidenceClassifier()
    assert classifier.is_available() is True
    assert classifier.pipeline is not None
    assert classifier.model_version == "evidence-v1"
    assert hasattr(classifier.pipeline, "predict_proba")
