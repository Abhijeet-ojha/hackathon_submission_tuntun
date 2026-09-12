import pytest
import re
from backend.ml.ranking.features import RankingFeatureExtractor, EXCLUDED_SENSITIVE_ATTRIBUTES


def test_ranking_strictly_excludes_sensitive_features():
    extractor = RankingFeatureExtractor()
    feature_names = extractor.get_feature_names()

    # Sensitive demographic attributes that must NEVER be in feature names
    forbidden_regex = re.compile(r"\b(?:name|gender|age|photo|address|phone|email|college|university|prestige|nationality|religion)\b", re.IGNORECASE)

    for feat in feature_names:
        # Split feature name by underscores
        tokens = feat.split("_")
        for token in tokens:
            assert not forbidden_regex.search(token), f"Forbidden demographic token '{token}' found in feature '{feat}'"

    audit_list = extractor.get_excluded_attributes_audit()
    assert len(audit_list) >= 8
