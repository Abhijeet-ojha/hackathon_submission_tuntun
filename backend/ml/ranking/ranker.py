import os
import json
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import joblib
from pydantic import BaseModel, Field

from .features import RankingFeatureExtractor, RANKING_FEATURE_NAMES


MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, "model.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "metadata.json")

FEATURE_DISPLAY_NAMES = {
    "semantic_similarity": "Semantic NLP Fit",
    "bm25_score": "BM25 Lexical Keyword Match",
    "explicit_skill_match": "Ontology Skill Coverage",
    "required_coverage": "Must-Have Requirement Coverage",
    "preferred_coverage": "Nice-to-Have Skill Fit",
    "evidence_strength": "Contextual Evidence Strength (0-3)",
    "experience_project_depth": "Project & Experience Depth",
    "education_role_fit": "Education & Degree Alignment",
    "direct_skill_count": "Direct Technical Skill Count",
    "transferable_skill_count": "Transferable Skill Bridges",
    "missing_required_count": "Unmet Must-Have Gaps",
    "tier_2_count": "Demonstrated Project Count",
    "tier_3_count": "Quantified Impact Metrics Count",
    "strongest_evidence_score": "Highest Tier Evidence Quality",
    "critical_requirement_coverage": "Critical Requirement Guardrail Score"
}


class FeatureContribution(BaseModel):
    feature_name: str
    feature_label: str
    feature_value: float
    contribution_pts: float
    direction: str = "positive"  # "positive" | "negative" | "neutral"


class LearnedRankResult(BaseModel):
    candidate_id: str
    candidate_name: str
    deterministic_score: float
    deterministic_rank: int
    learned_score: float
    learned_rank: int
    final_score: float
    final_rank: int
    rank_delta: int = 0  # e.g., +2 (moved up 2 spots), -1 (moved down 1 spot)
    primary_drivers: List[str] = Field(default_factory=list)
    counter_signals: List[str] = Field(default_factory=list)
    feature_contributions: List[FeatureContribution] = Field(default_factory=list)
    model_explanation: str = ""
    model_version: str = "ranker-v1"
    mode: str = "hybrid"  # "deterministic" | "learned" | "hybrid"
    alpha: float = 0.75


class InternLoomRanker:
    """
    Learning-to-Rank Ranker trained to optimize candidate ranking alongside the deterministic scoring engine.
    Supports Deterministic, Learned, and Hybrid blending modes.
    """
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or MODEL_PATH
        self.model = None
        self.metadata = {}
        self.extractor = RankingFeatureExtractor()
        self.feature_weights = np.array([
            0.18,  # semantic_similarity
            0.15,  # bm25_score
            0.15,  # explicit_skill_match
            0.20,  # required_coverage
            0.08,  # preferred_coverage
            0.12,  # evidence_strength
            0.05,  # experience_project_depth
            0.05,  # education_role_fit
            0.08,  # direct_skill_count
            0.06,  # transferable_skill_count
            -0.22, # missing_required_count (penalty)
            0.10,  # tier_2_count
            0.15,  # tier_3_count
            0.08,  # strongest_evidence_score
            0.20   # critical_requirement_coverage
        ], dtype=np.float32)
        self.model_version = "ranker-v1"
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                if hasattr(self.model, "coef_"):
                    self.feature_weights = np.array(self.model.coef_[0], dtype=np.float32)
                if os.path.exists(METADATA_PATH):
                    with open(METADATA_PATH, "r", encoding="utf-8") as f:
                        self.metadata = json.load(f)
                        self.model_version = self.metadata.get("model_version", "ranker-v1")
            except Exception as e:
                print(f"[InternLoomRanker] Warning: Could not load model from {self.model_path}: {e}")
                self.model = None

    def is_available(self) -> bool:
        return self.model is not None

    def predict_score(self, features_dict: Dict[str, float]) -> float:
        """
        Computes the learned candidate score [0.0, 100.0] from normalized features.
        """
        vec = self.extractor.to_vector(features_dict)
        # Dot product with learned weights
        raw_dot = float(np.dot(vec, self.feature_weights))
        # Base scale to 100: positive max sum is approx 1.6
        pos_weight_sum = float(np.sum(np.maximum(0, self.feature_weights)))
        if pos_weight_sum <= 0:
            pos_weight_sum = 1.0

        # Scale to [0, 100]
        score = (raw_dot / pos_weight_sum) * 100.0
        return round(float(np.clip(score, 0.0, 100.0)), 2)

    def compute_feature_contributions(self, features_dict: Dict[str, float]) -> List[FeatureContribution]:
        """
        Calculates the feature contribution points (+XX.X or -XX.X pts) for each feature.
        """
        contributions = []
        vec = self.extractor.to_vector(features_dict)
        pos_weight_sum = float(np.sum(np.maximum(0, self.feature_weights)))
        if pos_weight_sum <= 0:
            pos_weight_sum = 1.0

        for i, fname in enumerate(RANKING_FEATURE_NAMES):
            val = float(vec[i])
            w = float(self.feature_weights[i])
            pts = round((val * w / pos_weight_sum) * 100.0, 1)

            if pts > 0.5:
                direction = "positive"
            elif pts < -0.5:
                direction = "negative"
            else:
                direction = "neutral"

            contributions.append(FeatureContribution(
                feature_name=fname,
                feature_label=FEATURE_DISPLAY_NAMES.get(fname, fname),
                feature_value=round(val, 2),
                contribution_pts=pts,
                direction=direction
            ))

        # Sort by absolute impact
        contributions.sort(key=lambda c: abs(c.contribution_pts), reverse=True)
        return contributions

    def generate_model_explanation(
        self,
        features_dict: Dict[str, float],
        rank_delta: int
    ) -> Tuple[str, List[str], List[str]]:
        """
        Generates a transparent, model-aware explanation from real features without hallucinations.
        """
        drivers = []
        counters = []

        req_cov = features_dict.get("required_coverage", 0.0)
        sem = features_dict.get("semantic_similarity", 0.0)
        t3 = features_dict.get("tier_3_count", 0.0)
        t2 = features_dict.get("tier_2_count", 0.0)
        missing = features_dict.get("missing_required_count", 0.0)
        trans = features_dict.get("transferable_skill_count", 0.0)

        if req_cov >= 0.8:
            drivers.append(f"{int(req_cov * 100)}% must-have coverage")
        if sem >= 0.7:
            drivers.append("Strong semantic alignment with JD responsibilities")
        if t3 > 0.1:
            drivers.append("Verified Tier-3 production metrics")
        if t2 >= 0.3:
            drivers.append("Multiple demonstrated project implementations")
        if trans > 0.1:
            drivers.append("Transferable skill bridges (e.g. Express → Node.js)")

        if missing > 0.1:
            counters.append(f"{int(missing * 100)}% must-have requirements missing")
        if sem < 0.4:
            counters.append("Lower semantic text overlap with role duties")
        if t3 == 0.0:
            counters.append("No quantified Tier-3 outcome metrics found")

        # Dynamic sentence synthesis
        pos_str = ", ".join(drivers) if drivers else "Baseline skill alignment"
        neg_str = f" Countered by: {', '.join(counters)}." if counters else ""

        if rank_delta > 0:
            narrative = f"Model elevated candidate (+{rank_delta} ranks) driven by {pos_str}.{neg_str}"
        elif rank_delta < 0:
            narrative = f"Model lowered candidate ({rank_delta} ranks) due to {', '.join(counters) if counters else 'comparative evidence gaps'}."
        else:
            narrative = f"Model ranking aligns with deterministic score driven by {pos_str}.{neg_str}"

        return narrative, drivers[:3], counters[:2]

    def rank_candidates(
        self,
        candidates_with_features: List[Tuple[Any, Dict[str, float]]],
        mode: str = "hybrid",
        alpha: float = 0.75
    ) -> List[LearnedRankResult]:
        """
        Ranks a batch of candidates using the specified mode ('deterministic', 'learned', 'hybrid')
        and blending factor alpha in [0.0, 1.0].
        """
        if not candidates_with_features:
            return []

        # Sort candidates by deterministic score first to establish deterministic ranks
        sorted_by_det = sorted(
            candidates_with_features,
            key=lambda x: x[0].final_score,
            reverse=True
        )
        det_rank_map = {item[0].candidate_id: idx + 1 for idx, item in enumerate(sorted_by_det)}

        results_temp = []
        for cand_out, feats in candidates_with_features:
            det_score = round(cand_out.final_score, 2)
            det_rank = det_rank_map.get(cand_out.candidate_id, 1)
            learned_score = self.predict_score(feats)

            if mode == "deterministic":
                final_score = det_score
            elif mode == "learned":
                final_score = learned_score
            else:  # hybrid
                final_score = round((alpha * det_score) + ((1.0 - alpha) * learned_score), 2)

            results_temp.append({
                "cand_out": cand_out,
                "feats": feats,
                "det_score": det_score,
                "det_rank": det_rank,
                "learned_score": learned_score,
                "final_score": final_score
            })

        # Determine learned ranks
        sorted_by_learned = sorted(results_temp, key=lambda x: x["learned_score"], reverse=True)
        learned_rank_map = {item["cand_out"].candidate_id: idx + 1 for idx, item in enumerate(sorted_by_learned)}

        # Determine final ranks
        sorted_by_final = sorted(results_temp, key=lambda x: x["final_score"], reverse=True)

        final_ranked_results: List[LearnedRankResult] = []
        for final_rank_idx, item in enumerate(sorted_by_final):
            final_rank = final_rank_idx + 1
            cand_id = item["cand_out"].candidate_id
            det_rank = item["det_rank"]
            learned_rank = learned_rank_map.get(cand_id, final_rank)
            rank_delta = det_rank - final_rank  # positive means moved up in rank

            contributions = self.compute_feature_contributions(item["feats"])
            explanation, drivers, counters = self.generate_model_explanation(item["feats"], rank_delta)

            res = LearnedRankResult(
                candidate_id=cand_id,
                candidate_name=item["cand_out"].candidate_name,
                deterministic_score=item["det_score"],
                deterministic_rank=det_rank,
                learned_score=item["learned_score"],
                learned_rank=learned_rank,
                final_score=item["final_score"],
                final_rank=final_rank,
                rank_delta=rank_delta,
                primary_drivers=drivers,
                counter_signals=counters,
                feature_contributions=contributions,
                model_explanation=explanation,
                model_version=self.model_version,
                mode=mode,
                alpha=alpha
            )
            final_ranked_results.append(res)

        return final_ranked_results
