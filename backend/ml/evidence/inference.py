from typing import List, Dict, Any, Optional
from .classifier import EvidenceClassifier, EvidencePrediction


_global_classifier: Optional[EvidenceClassifier] = None


def get_evidence_classifier() -> EvidenceClassifier:
    """Returns singleton instance of EvidenceClassifier."""
    global _global_classifier
    if _global_classifier is None:
        _global_classifier = EvidenceClassifier()
    return _global_classifier


def predict_evidence_tier(evidence_text: str, requirement: str = "") -> EvidencePrediction:
    """Predicts evidence tier (0-3) with calibrated probabilities and safety validation."""
    classifier = get_evidence_classifier()
    return classifier.predict(evidence_text, requirement)
