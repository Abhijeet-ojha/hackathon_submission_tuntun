import re
from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion


ACTION_VERBS = [
    r"\b(?:built|developed|engineered|implemented|architected|created|designed|integrated|deployed|refactored|optimized|automated|maintained|configured|trained|evaluated|tested|spearheaded|authored|orchestrated|fine-tuned|benchmarked|migrated|scaled|delivered|mentored|collaborated)\b"
]

METRIC_PATTERNS = [
    r"\b\d+(?:\.\d+)?%",                                # 40%, 99.9%
    r"\b\d+\s*(?:ms|seconds|minutes|hours|days)\b",      # 200ms, 2 seconds
    r"\b(?:reduced|improved|increased|boosted|cut|saved|accelerated|scaled|handled|processed|optimized|decreased|outperforming)\s+(?:by\s+)?(?:\d+|\$|latency|throughput|performance|accuracy|f1|speedup)",
    r"\b\d+[\d,]*\+?\s*(?:users|requests|req/s|rps|queries|records|qps|events|downloads|stars|views|students|clients|million|billion|k\b|gb\b|mb\b|connections)",
    r"\b(?:1st|2nd|3rd|winner|finalist|top\s+\d+%)\b",
    r"\b\$\s*\d+[\d,]*",                                # $10,000
    r"\b\d+(?:\.\d+)?x\s*(?:speedup|faster|throughput|increase|reduction|scaling)\b"
]

NUMERIC_FALSE_POSITIVES = [
    r"\b(?:team\s+of\s+\d+|\d+\s+group\s+projects|\d+\s+semesters|\d+\s+coursework|java\s+\d+|python\s+\d+|v\d+|version\s+\d+)\b"
]


class DenseNLPFeatureExtractor(BaseEstimator, TransformerMixin):
    """
    Extracts structured, interpretative numerical NLP features from (text, requirement) pairs.
    """
    def __init__(self):
        self.action_regex = re.compile("|".join(ACTION_VERBS), re.IGNORECASE)
        self.metric_regexes = [re.compile(p, re.IGNORECASE) for p in METRIC_PATTERNS]
        self.fp_regex = re.compile("|".join(NUMERIC_FALSE_POSITIVES), re.IGNORECASE)

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        """
        X can be a list of strings "text" or list of dicts/tuples {"text": ..., "requirement": ...}
        """
        features = []
        for item in X:
            if isinstance(item, dict):
                text = item.get("text", "")
                req = item.get("requirement", "")
            elif isinstance(item, (list, tuple)) and len(item) >= 2:
                text = item[0]
                req = item[1]
            else:
                text = str(item)
                req = ""

            f_vec = self._extract_single_features(text, req)
            features.append(f_vec)

        return np.array(features, dtype=np.float32)

    def _extract_single_features(self, text: str, req: str) -> List[float]:
        text_lower = text.lower()
        req_lower = req.lower()

        # 1. Action verb count
        action_matches = len(self.action_regex.findall(text_lower))
        has_action = 1.0 if action_matches > 0 else 0.0

        # 2. Metric pattern count & has_quantified_outcome
        metric_matches = sum(len(rgx.findall(text_lower)) for rgx in self.metric_regexes)
        has_metric = 1.0 if metric_matches > 0 else 0.0

        # 3. Quantified outcome composite: action + metric
        has_quantified_outcome = 1.0 if (has_action and has_metric) else 0.0

        # 4. Text lengths
        words = text.split()
        word_count = float(len(words))
        char_length = float(len(text))

        # 5. Requirement overlap ratio
        if req_lower:
            req_tokens = set(re.findall(r"\w+", req_lower))
            text_tokens = set(re.findall(r"\w+", text_lower))
            if req_tokens:
                overlap = len(req_tokens.intersection(text_tokens)) / len(req_tokens)
            else:
                overlap = 0.0
        else:
            overlap = 0.5  # default if no req provided

        # 6. Is bare skill list (mostly commas/colons, few words, no action verbs)
        comma_count = text.count(",") + text.count("•") + text.count("|")
        is_bare_skill_list = 1.0 if (comma_count >= 2 and action_matches == 0) or ("skills:" in text_lower or "technologies:" in text_lower or "languages:" in text_lower) else 0.0

        # 7. Numeric false positive flag (e.g. "team of 5", "version 1.0")
        has_fp = 1.0 if bool(self.fp_regex.search(text_lower)) else 0.0

        # 8. Raw number count
        num_tokens = len(re.findall(r"\b\d+(?:\.\d+)?\b", text_lower))

        return [
            float(action_matches),
            has_action,
            float(metric_matches),
            has_metric,
            has_quantified_outcome,
            min(word_count / 50.0, 1.0),
            min(char_length / 300.0, 1.0),
            overlap,
            is_bare_skill_list,
            has_fp,
            min(float(num_tokens) / 5.0, 1.0)
        ]


class TextItemSelector(BaseEstimator, TransformerMixin):
    """Pulls the primary text string from input records for vectorization."""
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        texts = []
        for item in X:
            if isinstance(item, dict):
                texts.append(item.get("text", ""))
            elif isinstance(item, (list, tuple)) and len(item) >= 1:
                texts.append(str(item[0]))
            else:
                texts.append(str(item))
        return texts


def build_evidence_feature_union() -> FeatureUnion:
    """Constructs a composite scikit-learn FeatureUnion combining word/char TF-IDF and dense NLP features."""
    from sklearn.pipeline import Pipeline
    return FeatureUnion(
        transformer_list=[
            ("word_tfidf", Pipeline([
                ("selector", TextItemSelector()),
                ("vectorizer", TfidfVectorizer(ngram_range=(1, 2), max_features=300, lowercase=True, token_pattern=r"(?u)\b\w+\b"))
            ])),
            ("char_tfidf", Pipeline([
                ("selector", TextItemSelector()),
                ("vectorizer", TfidfVectorizer(ngram_range=(3, 5), analyzer="char", max_features=400, lowercase=True))
            ])),
            ("dense_nlp", DenseNLPFeatureExtractor())
        ]
    )


class EvidenceFeatureExtractor:
    """Wrapper class providing feature inspection and transformation."""
    def __init__(self):
        self.dense_extractor = DenseNLPFeatureExtractor()

    def get_dense_feature_names(self) -> List[str]:
        return [
            "action_verb_count",
            "has_action_verb",
            "metric_pattern_count",
            "has_metric_token",
            "has_quantified_outcome",
            "normalized_word_count",
            "normalized_char_length",
            "requirement_overlap_ratio",
            "is_bare_skill_list",
            "numeric_false_positive_flag",
            "normalized_numeric_tokens"
        ]

    def extract_dense_features(self, text: str, req: str = "") -> Dict[str, float]:
        vec = self.dense_extractor._extract_single_features(text, req)
        names = self.get_dense_feature_names()
        return {name: float(val) for name, val in zip(names, vec)}
