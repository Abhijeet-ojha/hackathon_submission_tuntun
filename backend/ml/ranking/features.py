import numpy as np
from typing import List, Dict, Any, Tuple
from ...models import ResumeIntelligence, JDIntelligence, CandidateScoreOutput


RANKING_FEATURE_NAMES = [
    "semantic_similarity",
    "bm25_score",
    "explicit_skill_match",
    "required_coverage",
    "preferred_coverage",
    "evidence_strength",
    "experience_project_depth",
    "education_role_fit",
    "direct_skill_count",
    "transferable_skill_count",
    "missing_required_count",
    "tier_2_count",
    "tier_3_count",
    "strongest_evidence_score",
    "critical_requirement_coverage"
]

EXCLUDED_SENSITIVE_ATTRIBUTES = [
    {"attribute": "candidate_name", "reason": "Demographic & ethnic proxy; strictly excluded to prevent bias"},
    {"attribute": "gender", "reason": "Protected demographic class; strictly excluded"},
    {"attribute": "age", "reason": "Protected class & anti-ageism equity guard; graduation year excluded"},
    {"attribute": "photo", "reason": "Physical appearance & demographic proxy; strictly excluded"},
    {"attribute": "address", "reason": "Geographic location & socioeconomic proxy; strictly excluded"},
    {"attribute": "phone", "reason": "Geographic area code proxy; strictly excluded"},
    {"attribute": "email", "reason": "Personal demographic identifier; strictly excluded"},
    {"attribute": "college_prestige", "reason": "Socioeconomic pedigree bias; high project density prioritized instead"},
    {"attribute": "nationality", "reason": "Protected immigration & national origin status; strictly excluded"},
    {"attribute": "religion", "reason": "Protected demographic class; strictly excluded"}
]


class RankingFeatureExtractor:
    """
    Extracts 15 normalized, auditable features for Learning-to-Rank models from candidate evaluations.
    Excludes any demographic, pedigree, or protected attribute signals.
    """
    def __init__(self):
        self.feature_names = RANKING_FEATURE_NAMES

    def extract_features(
        self,
        candidate_output: CandidateScoreOutput,
        jd: JDIntelligence
    ) -> Dict[str, float]:
        """
        Builds a normalized dictionary of 15 ranking features from CandidateScoreOutput and JDIntelligence.
        All features are normalized into [0.0, 1.0].
        """
        comps = candidate_output.components
        uth = candidate_output.under_the_hood
        eg = candidate_output.evidence_graph

        total_must = len(jd.must_have_skills) if jd.must_have_skills else 1
        total_jd_skills = len(jd.technical_skills) if jd.technical_skills else 5

        # 1-8: Direct normalized component scores [0.0, 1.0]
        f_semantic = min(1.0, max(0.0, comps.semantic / 100.0))
        # BM25 is typically on a log scale (0-30), normalize using sigmoid-like scaling
        f_bm25 = min(1.0, max(0.0, uth.bm25_score / 25.0))
        f_keyword = min(1.0, max(0.0, comps.keyword / 100.0))
        f_req_cov = min(1.0, max(0.0, comps.required_coverage / 100.0))
        f_pref_cov = min(1.0, max(0.0, comps.preferred_coverage / 100.0))
        f_ev_strength = min(1.0, max(0.0, comps.evidence_strength / 100.0))
        f_exp_depth = min(1.0, max(0.0, comps.experience_relevance / 100.0))
        f_edu_fit = min(1.0, max(0.0, comps.education_fit / 100.0))

        # 9-10: Skill Counts
        direct_matches = [n for n in eg if n.match_type == "direct" and n.evidence_strength > 0]
        f_direct_count = min(1.0, len(direct_matches) / float(total_jd_skills))
        f_trans_count = min(1.0, len(uth.transferable_matches) / 5.0)

        # 11: Missing Required Count (normalized by total must-haves)
        f_missing_req = min(1.0, len(uth.must_have_missing) / float(total_must))

        # 12-13: Tier Counts
        tier_2_count = sum(1 for n in eg if n.evidence_strength == 2)
        tier_3_count = sum(1 for n in eg if n.evidence_strength == 3)
        f_t2_count = min(1.0, tier_2_count / 6.0)
        f_t3_count = min(1.0, tier_3_count / 4.0)

        # 14: Strongest Evidence Score
        max_tier = max([n.evidence_strength for n in eg], default=0)
        f_strongest_ev = max_tier / 3.0

        # 15: Critical Requirement Coverage (quadratic penalty on missing must-haves)
        must_met_ratio = len(uth.must_have_matches) / float(total_must)
        f_critical_cov = (must_met_ratio ** 1.5)

        features = {
            "semantic_similarity": round(f_semantic, 4),
            "bm25_score": round(f_bm25, 4),
            "explicit_skill_match": round(f_keyword, 4),
            "required_coverage": round(f_req_cov, 4),
            "preferred_coverage": round(f_pref_cov, 4),
            "evidence_strength": round(f_ev_strength, 4),
            "experience_project_depth": round(f_exp_depth, 4),
            "education_role_fit": round(f_edu_fit, 4),
            "direct_skill_count": round(f_direct_count, 4),
            "transferable_skill_count": round(f_trans_count, 4),
            "missing_required_count": round(f_missing_req, 4),
            "tier_2_count": round(f_t2_count, 4),
            "tier_3_count": round(f_t3_count, 4),
            "strongest_evidence_score": round(f_strongest_ev, 4),
            "critical_requirement_coverage": round(f_critical_cov, 4)
        }
        return features

    def to_vector(self, features_dict: Dict[str, float]) -> np.ndarray:
        return np.array([features_dict.get(k, 0.0) for k in self.feature_names], dtype=np.float32)

    def get_feature_names(self) -> List[str]:
        return list(self.feature_names)

    def get_excluded_attributes_audit(self) -> List[Dict[str, str]]:
        return list(EXCLUDED_SENSITIVE_ATTRIBUTES)
